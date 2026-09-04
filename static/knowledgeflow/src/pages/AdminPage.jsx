import React, { useCallback, useEffect, useState } from 'react';
import { invokeResolver } from '../api.js';
import { ErrorMessage, PageLayout } from '../components/PageLayout.jsx';

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [topic, setTopic] = useState('');
  const [spaceKey, setSpaceKey] = useState('');
  const [expert, setExpert] = useState({ topicId: '', accountId: '', displayName: '' });
  const load = useCallback(
    () =>
      invokeResolver('getAdminData')
        .then((result) => {
          setData(result);
          setSpaceKey(result.faqSpaceKey);
        })
        .catch((reason) => setError(reason.message)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function save(name, payload) {
    try {
      setError('');
      await invokeResolver(name, payload);
      setNotice('Saved successfully.');
      load();
      return true;
    } catch (reason) {
      setNotice('');
      setError(reason.message);
      return false;
    }
  }
  if (!data)
    return (
      <PageLayout title="Administration">
        Loading…
        <ErrorMessage message={error} />
      </PageLayout>
    );
  return (
    <PageLayout title="Administration">
      <ErrorMessage message={error} />
      {notice && <p className="notice">{notice}</p>}
      <section className="card">
        <h2>FAQ destination</h2>
        <p>Enter the space key from the URL, for example FAQ or TEAM.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save('saveConfig', { faqSpaceKey: spaceKey });
          }}
        >
          <input
            placeholder="Confluence space key"
            value={spaceKey}
            onChange={(event) => setSpaceKey(event.target.value)}
          />
          <button>Save</button>
        </form>
      </section>
      <section className="card">
        <h2>Topics</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save('saveTopic', { name: topic });
            setTopic('');
          }}
        >
          <input
            required
            placeholder="Topic name"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
          <button>Add</button>
        </form>
        {data.topics.map((item) => (
          <p key={item.id}>
            {item.name}{' '}
            <button
              onClick={() => {
                const name = window.prompt('Rename topic', item.name);
                if (name) save('saveTopic', { id: item.id, name, description: item.description });
              }}
            >
              Rename
            </button>{' '}
            <button onClick={() => save('deleteTopic', { id: item.id })}>Delete</button>
          </p>
        ))}
      </section>
      <section className="card">
        <h2>Assign expert</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save('assignExpert', expert).then((saved) => {
              if (saved) setExpert({ topicId: '', accountId: '', displayName: '' });
            });
          }}
        >
          <select
            required
            value={expert.topicId}
            onChange={(event) => setExpert({ ...expert, topicId: event.target.value })}
          >
            <option value="">Topic</option>
            {data.topics.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Atlassian account ID"
            value={expert.accountId}
            onChange={(event) => setExpert({ ...expert, accountId: event.target.value })}
          />
          <input
            required
            placeholder="Display name"
            value={expert.displayName}
            onChange={(event) => setExpert({ ...expert, displayName: event.target.value })}
          />
          <button>Assign</button>
        </form>
        {data.experts.map((item) => (
          <p key={item.id}>
            {item.display_name} — {item.topic_name}{' '}
            <button onClick={() => save('removeExpert', { id: item.id })}>Remove</button>
          </p>
        ))}
      </section>
    </PageLayout>
  );
}
