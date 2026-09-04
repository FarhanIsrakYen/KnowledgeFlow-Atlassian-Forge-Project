import React, { useEffect, useState } from 'react';
import { router } from '@forge/bridge';
import { invokeResolver } from '../api.js';
import { ErrorMessage, PageLayout } from '../components/PageLayout.jsx';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    invokeResolver('getDashboard')
      .then(setData)
      .catch((reason) => setError(reason.message));
  }, []);
  if (!data)
    return (
      <PageLayout title="Dashboard">
        Loading…
        <ErrorMessage message={error} />
      </PageLayout>
    );
  const count = (status) => data.counts.find((item) => item.status === status)?.count || 0;
  // FAQ-published questions are also answered questions; publishing is the next
  // workflow stage rather than a loss of the accepted-answer state.
  const answeredCount = Number(count('answered')) + Number(count('faq_published'));

  async function openSpaceBoard(spaceKey) {
    try {
      await router.navigate({
        target: 'module',
        moduleKey: 'knowledgeflow-board',
        spaceKey,
      });
    } catch (reason) {
      setError(`Unable to open the space Q&A board: ${reason.message}`);
    }
  }
  return (
    <PageLayout title="Dashboard">
      <ErrorMessage message={error} />
      <section className="metrics">
        <div className="card">
          <b>{data.counts.reduce((total, item) => total + Number(item.count), 0)}</b>Total
        </div>
        <div className="card">
          <b>{count('open')}</b>Open
        </div>
        <div className="card">
          <b>{answeredCount}</b>Answered
        </div>
      </section>
      <h2>Recent questions</h2>
      {data.recent.map((question) => (
        <button
          type="button"
          className="card question"
          key={question.id}
          onClick={() => openSpaceBoard(question.space_key)}
        >
          {question.title} <small>{question.space_key}</small>
        </button>
      ))}
      <h2>Top experts</h2>
      {data.experts.map((expert) => (
        <div className="card" key={expert.author_account_id}>
          {expert.author_display_name}: {expert.answer_count} answers
        </div>
      ))}
    </PageLayout>
  );
}
