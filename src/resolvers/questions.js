import { confluence, execute, id, initialiseDatabase, now, route, rows } from './database.js';
import { publishGlobal, signRealtimeToken } from '@forge/realtime';
import { getCurrentUser, getSpaceKey, requiredText, storageHtml } from './shared.js';

export function registerQuestionResolvers(define) {
  define('getBoard', async (request) => {
    await initialiseDatabase();
    const spaceKey = getSpaceKey(request);
    if (!spaceKey) throw new Error('Open the board from a Confluence space.');
    return {
      topics: await rows('SELECT * FROM topics ORDER BY name'),
      questions: await rows(
        `SELECT q.*,MAX(assigned_expert.display_name) assigned_expert_name,COUNT(a.id) answer_count,GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ') topic_names FROM questions q LEFT JOIN experts assigned_expert ON assigned_expert.id=q.assigned_expert_id LEFT JOIN answers a ON a.question_id=q.id LEFT JOIN question_topics qt ON qt.question_id=q.id LEFT JOIN topics t ON t.id=qt.topic_id WHERE q.space_key=? GROUP BY q.id ORDER BY q.created_at DESC`,
        spaceKey,
      ),
    };
  });
  define('createQuestion', async (request) => {
    await initialiseDatabase();
    const payload = request.payload || {};
    const spaceKey = getSpaceKey(request);
    const title = requiredText(payload.title, 'Question title', 200, true);
    if (!spaceKey) throw new Error('A Confluence space is required.');
    const user = await getCurrentUser();
    const topicIds = [...new Set(payload.topicIds || [])];
    const experts = topicIds.length
      ? await rows(
          `SELECT * FROM experts WHERE topic_id IN (${topicIds.map(() => '?').join(',')})`,
          ...topicIds,
        )
      : null;
    const uniqueExperts = [
      ...new Map((experts || []).map((expert) => [expert.account_id, expert])).values(),
    ];
    const assignedExpert = uniqueExperts[0] || null;
    const questionId = id();
    await execute(
      'INSERT INTO questions VALUES (?,?,?,?,?,?,?,?,?,?)',
      questionId,
      spaceKey,
      title,
      requiredText(payload.body, 'Question body') || null,
      user.accountId,
      user.displayName,
      'open',
      assignedExpert?.id || null,
      now(),
      now(),
    );
    for (const topicId of topicIds)
      await execute('INSERT INTO question_topics VALUES (?,?)', questionId, topicId);
    for (const expert of uniqueExperts) {
      try {
        const channel = `knowledgeflow-expert-${expert.account_id}`;
        const { token } = await signRealtimeToken(channel, { allowedUsers: [expert.account_id] }, [
          'publish',
        ]);
        if (token) {
          await publishGlobal(
            channel,
            {
              questionId,
              title,
              authorDisplayName: user.displayName,
              expertAccountId: expert.account_id,
              spaceKey,
            },
            { token },
          );
        }
      } catch (error) {
        console.error(`Could not notify assigned expert ${expert.account_id}:`, error);
      }
    }
    return { id: questionId, unassigned: !assignedExpert };
  });
  define('getNotificationToken', async () => {
    await initialiseDatabase();
    const user = await getCurrentUser();
    const channel = `knowledgeflow-expert-${user.accountId}`;
    const { token, expiresAt } = await signRealtimeToken(
      channel,
      { allowedUsers: [user.accountId] },
      ['subscribe'],
    );
    if (!token) throw new Error('Unable to create a notification subscription.');
    return { channel, token, expiresAt, accountId: user.accountId };
  });
  define('getQuestion', async (request) => {
    await initialiseDatabase();
    const question = (await rows('SELECT * FROM questions WHERE id=?', request.payload?.id))[0];
    if (!question) throw new Error('Question not found.');
    const assignedExpert = question.assigned_expert_id
      ? (await rows('SELECT display_name FROM experts WHERE id=?', question.assigned_expert_id))[0]
      : null;
    return {
      question,
      assignedExpertName: assignedExpert?.display_name || null,
      user: await getCurrentUser(),
      topics: await rows(
        'SELECT t.* FROM topics t JOIN question_topics qt ON qt.topic_id=t.id WHERE qt.question_id=?',
        question.id,
      ),
      answers: await rows(
        'SELECT * FROM answers WHERE question_id=? ORDER BY is_accepted DESC,created_at',
        question.id,
      ),
      faq: (await rows('SELECT * FROM faq_pages WHERE question_id=?', question.id))[0] || null,
    };
  });
  define('addAnswer', async (request) => {
    await initialiseDatabase();
    const payload = request.payload || {};
    const user = await getCurrentUser();
    await execute(
      'INSERT INTO answers VALUES (?,?,?,?,?,?,?)',
      id(),
      payload.questionId,
      requiredText(payload.body, 'Answer', 10000, true),
      user.accountId,
      user.displayName,
      0,
      now(),
    );
    return {
      ok: true,
    };
  });
  define('acceptAnswer', async (request) => {
    await initialiseDatabase();
    const payload = request.payload || {};
    const user = await getCurrentUser();
    const question = (await rows('SELECT * FROM questions WHERE id=?', payload.questionId))[0];
    if (!question || question.author_account_id !== user.accountId) {
      throw new Error('Only the question author can accept an answer.');
    }
    await execute('UPDATE answers SET is_accepted=0 WHERE question_id=?', question.id);
    await execute(
      'UPDATE answers SET is_accepted=1 WHERE id=? AND question_id=?',
      payload.answerId,
      question.id,
    );
    await execute(
      'UPDATE questions SET status=?,updated_at=? WHERE id=?',
      'answered',
      now(),
      question.id,
    );
    return {
      ok: true,
    };
  });
  define('publishFaq', async (request) => {
    await initialiseDatabase();
    const payload = request.payload || {};
    const user = await getCurrentUser();
    const question = (await rows('SELECT * FROM questions WHERE id=?', payload.questionId))[0];
    const answer = (
      await rows(
        'SELECT * FROM answers WHERE id=? AND question_id=? AND is_accepted=1',
        payload.answerId,
        payload.questionId,
      )
    )[0];
    const config = (await rows('SELECT value FROM config WHERE `key`=?', 'faq_space_key'))[0];
    if (!question || !answer || question.author_account_id !== user.accountId)
      throw new Error('Only the question author can publish an accepted answer.');
    if (!config?.value) throw new Error('Set the FAQ space key in administration first.');
    const spaceResponse = await confluence().requestConfluence(
      route`/wiki/api/v2/spaces?keys=${config.value}`,
    );
    if (!spaceResponse.ok) throw new Error('Unable to look up the configured FAQ space.');
    const faqSpace = (await spaceResponse.json()).results?.[0];
    if (!faqSpace?.id) throw new Error(`No Confluence space was found with key "${config.value}".`);
    const pageResponse = await confluence().requestConfluence(route`/wiki/api/v2/pages`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spaceId: faqSpace.id,
        status: 'current',
        title: question.title,
        body: {
          representation: 'storage',
          value: `<p>${storageHtml(question.body)}</p><hr/><p>${storageHtml(answer.body)}</p>`,
        },
      }),
    });
    if (!pageResponse.ok)
      throw new Error(`Confluence could not create the FAQ page (${pageResponse.status}).`);
    const page = await pageResponse.json();
    await execute(
      'INSERT INTO faq_pages VALUES (?,?,?,?,?,?,?,?)',
      id(),
      question.id,
      answer.id,
      String(page.id),
      page?._links?.webui || null,
      config.value,
      question.title,
      now(),
    );
    await execute(
      'UPDATE questions SET status=?,updated_at=? WHERE id=?',
      'faq_published',
      now(),
      question.id,
    );
    return { url: page?._links?.webui || null };
  });
}
