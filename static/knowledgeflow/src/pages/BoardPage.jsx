import React, { useCallback, useEffect, useState } from 'react';
import { invokeResolver, statusLabels } from '../api.js';
import { ErrorMessage, PageLayout } from '../components/PageLayout.jsx';

export default function BoardPage({ onOpenQuestion }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', topicIds: [] });
  const load = useCallback(
    () =>
      invokeResolver('getBoard')
        .then(setData)
        .catch((reason) => setError(reason.message)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function submitQuestion(event) {
    event.preventDefault();
    try {
      await invokeResolver('createQuestion', form);
      setForm({ title: '', body: '', topicIds: [] });
      setShowForm(false);
      load();
    } catch (reason) {
      setError(reason.message);
    }
  }
  function toggleTopic(topicId, checked) {
    setForm((current) => ({
      ...current,
      topicIds: checked
        ? [...current.topicIds, topicId]
        : current.topicIds.filter((id) => id !== topicId),
    }));
  }

  function cancelQuestion() {
    setForm({ title: '', body: '', topicIds: [] });
    setError('');
    setShowForm(false);
  }
  if (!data)
    return (
      <PageLayout title="Space Q&A Board">
        Loading…
        <ErrorMessage message={error} />
      </PageLayout>
    );
  const questions = data.questions.filter((question) => !status || question.status === status);
  return (
    <PageLayout title="Space Q&A Board">
      <div className="toolbar">
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </select>
        <button onClick={() => setShowForm((visible) => !visible)}>Ask a Question</button>
      </div>
      <ErrorMessage message={error} />
      {showForm && (
        <form className="card" onSubmit={submitQuestion}>
          <h2>Ask a question</h2>
          <input
            required
            maxLength="200"
            placeholder="Question title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <textarea
            placeholder="Context (optional)"
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
          />
          <p>
            {data.topics.map((topic) => (
              <label key={topic.id}>
                <input
                  type="checkbox"
                  checked={form.topicIds.includes(topic.id)}
                  onChange={(event) => toggleTopic(topic.id, event.target.checked)}
                />
                {topic.name}
              </label>
            ))}
          </p>
          <div className="form-actions">
            <button>Post question</button>
            <button type="button" onClick={cancelQuestion}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <section className="question-grid" aria-label="Questions">
        {questions.map((question) => (
          <button
            type="button"
            className="card question"
            onClick={() => onOpenQuestion(question.id)}
            key={question.id}
          >
            <div>
              <h2>{question.title}</h2>
              <p>{new Date(question.created_at).toLocaleDateString()}</p>
              <p>{question.topic_names || 'Unassigned'}</p>
              {question.assigned_expert_name && (
                <p>{`Assigned to: ${question.assigned_expert_name}`}</p>
              )}
            </div>
            <div>
              <b className={`status status-${question.status}`}>{statusLabels[question.status]}</b>
              <small>{question.answer_count} answers</small>
            </div>
          </button>
        ))}
      </section>
    </PageLayout>
  );
}
