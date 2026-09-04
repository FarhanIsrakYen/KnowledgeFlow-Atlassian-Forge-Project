import api, { route } from '@forge/api';
import { migrationRunner, sql } from '@forge/sql';
import { randomUUID } from 'crypto';

const migrations = [
  [
    '001_topics',
    'CREATE TABLE IF NOT EXISTS topics (id VARCHAR(36) PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE, description TEXT, created_at VARCHAR(40) NOT NULL)',
  ],
  [
    '002_experts',
    'CREATE TABLE IF NOT EXISTS experts (id VARCHAR(36) PRIMARY KEY, topic_id VARCHAR(36) NOT NULL, account_id VARCHAR(128) NOT NULL, display_name VARCHAR(255) NOT NULL, created_at VARCHAR(40) NOT NULL, UNIQUE KEY expert_topic_user (topic_id, account_id))',
  ],
  [
    '003_questions',
    'CREATE TABLE IF NOT EXISTS questions (id VARCHAR(36) PRIMARY KEY, space_key VARCHAR(128) NOT NULL, title VARCHAR(200) NOT NULL, body TEXT, author_account_id VARCHAR(128) NOT NULL, author_display_name VARCHAR(255) NOT NULL, status VARCHAR(24) NOT NULL, assigned_expert_id VARCHAR(36), created_at VARCHAR(40) NOT NULL, updated_at VARCHAR(40) NOT NULL, KEY question_space_date (space_key, created_at))',
  ],
  [
    '004_question_topics',
    'CREATE TABLE IF NOT EXISTS question_topics (question_id VARCHAR(36) NOT NULL, topic_id VARCHAR(36) NOT NULL, PRIMARY KEY (question_id, topic_id))',
  ],
  [
    '005_answers',
    'CREATE TABLE IF NOT EXISTS answers (id VARCHAR(36) PRIMARY KEY, question_id VARCHAR(36) NOT NULL, body TEXT NOT NULL, author_account_id VARCHAR(128) NOT NULL, author_display_name VARCHAR(255) NOT NULL, is_accepted INTEGER NOT NULL DEFAULT 0, created_at VARCHAR(40) NOT NULL)',
  ],
  [
    '006_faq_pages',
    'CREATE TABLE IF NOT EXISTS faq_pages (id VARCHAR(36) PRIMARY KEY, question_id VARCHAR(36) NOT NULL UNIQUE, answer_id VARCHAR(36) NOT NULL, confluence_page_id VARCHAR(128) NOT NULL, confluence_page_url TEXT, space_key VARCHAR(128) NOT NULL, title VARCHAR(200) NOT NULL, created_at VARCHAR(40) NOT NULL)',
  ],
  [
    '007_config',
    'CREATE TABLE IF NOT EXISTS config (`key` VARCHAR(128) PRIMARY KEY, value TEXT NOT NULL, updated_at VARCHAR(40) NOT NULL)',
  ],
];
export async function initialiseDatabase() {
  migrations.forEach(([name, statement]) => migrationRunner.enqueue(name, statement));
  await migrationRunner.run();
}
export const id = () => randomUUID();
export const now = () => new Date().toISOString();
export const rows = async (statement, ...params) =>
  (
    await sql
      .prepare(statement)
      .bindParams(...params)
      .execute()
  ).rows;
export const execute = (statement, ...params) =>
  sql
    .prepare(statement)
    .bindParams(...params)
    .execute();
export const confluence = () => api.asUser();
export { route };
