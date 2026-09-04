import { initialiseDatabase, rows } from './database.js';
export function registerDashboardResolvers(define) {
  define('getDashboard', async () => {
    await initialiseDatabase();
    return {
      counts: await rows('SELECT status,COUNT(*) count FROM questions GROUP BY status'),
      recent: await rows(
        `SELECT q.*,GROUP_CONCAT(t.name SEPARATOR ', ') topic_names FROM questions q LEFT JOIN question_topics qt ON qt.question_id=q.id LEFT JOIN topics t ON t.id=qt.topic_id GROUP BY q.id ORDER BY q.created_at DESC LIMIT 10`,
      ),
      experts: await rows(
        'SELECT author_display_name,author_account_id,COUNT(*) answer_count FROM answers GROUP BY author_account_id,author_display_name ORDER BY answer_count DESC LIMIT 5',
      ),
    };
  });
}
