import { execute, id, initialiseDatabase, now, rows } from './database.js';
import { requiredText } from './shared.js';
export function registerAdminResolvers(define) {
  define('getAdminData', async () => {
    await initialiseDatabase();
    return {
      topics: await rows('SELECT * FROM topics ORDER BY name'),
      experts: await rows(
        'SELECT e.*,t.name topic_name FROM experts e JOIN topics t ON t.id=e.topic_id ORDER BY t.name,e.display_name',
      ),
      faqSpaceKey:
        ((await rows('SELECT value FROM config WHERE `key`=?', 'faq_space_key'))[0] || {}).value ||
        '',
    };
  });
  define('saveTopic', async (request) => {
    await initialiseDatabase();
    const payload = request.payload || {};
    const name = requiredText(payload.name, 'Topic name', 120, true);
    if (payload.id) {
      await execute(
        'UPDATE topics SET name=?,description=? WHERE id=?',
        name,
        requiredText(payload.description, 'Description') || null,
        payload.id,
      );
    } else {
      await execute(
        'INSERT INTO topics VALUES (?,?,?,?)',
        id(),
        name,
        requiredText(payload.description, 'Description') || null,
        now(),
      );
    }
    return {
      ok: true,
    };
  });
  define('deleteTopic', async (request) => {
    await initialiseDatabase();
    const topicId = request.payload?.id;
    await execute('DELETE FROM experts WHERE topic_id=?', topicId);
    await execute('DELETE FROM question_topics WHERE topic_id=?', topicId);
    await execute('DELETE FROM topics WHERE id=?', topicId);
    return {
      ok: true,
    };
  });
  define('assignExpert', async (request) => {
    await initialiseDatabase();
    const payload = request.payload || {};
    const accountId = requiredText(payload.accountId, 'Account ID', 128, true);
    const displayName = requiredText(payload.displayName, 'Display name', 255, true);
    const assignment = (
      await rows(
        'SELECT id FROM experts WHERE topic_id=? AND account_id=?',
        payload.topicId,
        accountId,
      )
    )[0];
    if (assignment) {
      const topic = (await rows('SELECT name FROM topics WHERE id=?', payload.topicId))[0];
      throw new Error(`${displayName} is already assigned to ${topic?.name || 'this topic'}.`);
    }
    await execute(
      'INSERT INTO experts VALUES (?,?,?,?,?)',
      id(),
      payload.topicId,
      accountId,
      displayName,
      now(),
    );
    return {
      ok: true,
    };
  });
  define('removeExpert', async (request) => {
    await initialiseDatabase();
    await execute('DELETE FROM experts WHERE id=?', request.payload?.id);
    return {
      ok: true,
    };
  });
  define('saveConfig', async (request) => {
    await initialiseDatabase();
    const key = requiredText(request.payload?.faqSpaceKey, 'FAQ space key', 128);
    await execute(
      'INSERT INTO config (`key`,value,updated_at) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value=VALUES(value),updated_at=VALUES(updated_at)',
      'faq_space_key',
      key,
      now(),
    );
    return {
      ok: true,
    };
  });
}
