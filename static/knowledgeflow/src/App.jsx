import React, { useEffect, useRef, useState } from 'react';
import { realtime, showFlag, view } from '@forge/bridge';
import { invokeResolver } from './api.js';
import { PageLayout } from './components/PageLayout.jsx';
import AdminPage from './pages/AdminPage.jsx';
import BoardPage from './pages/BoardPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import QuestionDetailPage from './pages/QuestionDetailPage.jsx';

export default function App() {
  const [questionId, setQuestionId] = useState(null);
  const [context, setContext] = useState(null);
  const shownNotificationIds = useRef(new Set());

  useEffect(() => {
    view.getContext().then(setContext);
  }, []);

  useEffect(() => {
    let subscription;
    let cancelled = false;

    async function subscribeToExpertNotifications() {
      try {
        const { channel, token, accountId } = await invokeResolver('getNotificationToken');
        subscription = await realtime.subscribeGlobal(
          channel,
          (payload) => {
            if (cancelled) return;
            let notification;
            try {
              notification = typeof payload === 'string' ? JSON.parse(payload) : payload;
            } catch (error) {
              console.error('KnowledgeFlow received an invalid notification payload:', error);
              return;
            }
            if (notification.expertAccountId !== accountId) return;
            if (shownNotificationIds.current.has(notification.questionId)) return;
            shownNotificationIds.current.add(notification.questionId);
            showFlag({
              id: `knowledgeflow-question-${notification.questionId}`,
              title: 'New question assigned to you',
              description: `${notification.authorDisplayName} asked: ${notification.title}`,
              type: 'info',
              isAutoDismiss: false,
            });
          },
          { token },
        );
      } catch (error) {
        // Notification setup is optional and must not prevent the page from loading.
        console.error('KnowledgeFlow notification subscription failed:', error);
      }
    }

    subscribeToExpertNotifications();
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  if (!context) return <PageLayout title="Loading">Loading KnowledgeFlow…</PageLayout>;
  if (questionId)
    return <QuestionDetailPage questionId={questionId} onBack={() => setQuestionId(null)} />;

  const moduleKey = context.moduleKey || '';
  if (moduleKey.includes('dashboard')) return <DashboardPage />;
  if (moduleKey.includes('admin')) return <AdminPage />;
  return <BoardPage onOpenQuestion={setQuestionId} />;
}
