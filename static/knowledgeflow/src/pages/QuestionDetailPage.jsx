import React, { useCallback, useEffect, useState } from 'react';
import { invokeResolver, statusLabels } from '../api.js';
import { ErrorMessage, PageLayout } from '../components/PageLayout.jsx';

export default function QuestionDetailPage({ questionId, onBack }) {
  const [data, setData] = useState(null);
  const [answerBody, setAnswerBody] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(
    () =>
      invokeResolver('getQuestion', { id: questionId })
        .then(setData)
        .catch((reason) => setError(reason.message)),
    [questionId],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function action(name, payload) {
    try {
      await invokeResolver(name, payload);
      load();
    } catch (reason) {
      setError(reason.message);
    }
  }
  if (!data)
    return (
      <PageLayout title="Question">
        Loading…
        <ErrorMessage message={error} />
      </PageLayout>
    );
  const acceptedAnswer = data.answers.find((answer) => answer.is_accepted);
  const isAuthor = data.question.author_account_id === data.user.accountId;
  return (
    <PageLayout title="Question">
      <button type="button" onClick={onBack}>
        ← Board
      </button>
      <article className="card">
        <b className={`status status-${data.question.status}`}>
          {statusLabels[data.question.status]}
        </b>
        <h2>{data.question.title}</h2>
        <p>{data.question.body || 'No additional context.'}</p>
        {data.topics.length > 0 && (
          <p>
            {data.assignedExpertName ? `Assigned to: ${data.assignedExpertName}` : 'Unassigned'}
          </p>
        )}
        <p>
          {data.topics.map((topic) => (
            <em key={topic.id}>{topic.name} </em>
          ))}
        </p>
      </article>
      <ErrorMessage message={error} />
      <h2>Answers</h2>
      {data.answers.map((answer) => (
        <article className="card" key={answer.id}>
          <p>{answer.body}</p>
          <small>{answer.author_display_name}</small>
          {answer.is_accepted ? (
            <strong> Accepted</strong>
          ) : (
            isAuthor && (
              <button onClick={() => action('acceptAnswer', { questionId, answerId: answer.id })}>
                Accept
              </button>
            )
          )}
        </article>
      ))}
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          action('addAnswer', { questionId, body: answerBody });
          setAnswerBody('');
        }}
      >
        <textarea
          required
          placeholder="Write an answer"
          value={answerBody}
          onChange={(event) => setAnswerBody(event.target.value)}
        />
        <button>Submit answer</button>
      </form>
      {acceptedAnswer && isAuthor && !data.faq && (
        <button onClick={() => action('publishFaq', { questionId, answerId: acceptedAnswer.id })}>
          Publish as FAQ
        </button>
      )}
      {data.faq && <p>FAQ published.</p>}
    </PageLayout>
  );
}
