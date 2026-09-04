import { confluence, route } from './database.js';
export async function getCurrentUser() {
  const response = await confluence().requestConfluence(route`/wiki/rest/api/user/current`);
  if (!response.ok) throw new Error('Unable to identify the current user.');
  const user = await response.json();
  return { accountId: user.accountId, displayName: user.displayName || 'Confluence user' };
}
export const getSpaceKey = (request) =>
  request.context?.extension?.space?.key || request.payload?.spaceKey || '';
export function requiredText(input, name, max = 10000, required = false) {
  const clean = String(input || '').trim();
  if (required && !clean) throw new Error(`${name} is required.`);
  if (clean.length > max) throw new Error(`${name} must be ${max} characters or fewer.`);
  return clean;
}
export const storageHtml = (text) =>
  String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
