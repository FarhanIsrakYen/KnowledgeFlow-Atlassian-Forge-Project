import { makeResolver } from '@forge/resolver';
import { registerAdminResolvers } from './admin.js';
import { registerDashboardResolvers } from './dashboard.js';
import { registerQuestionResolvers } from './questions.js';

const handlers = {};
const define = (name, handler) => {
  handlers[name] = handler;
};
registerQuestionResolvers(define);
registerAdminResolvers(define);
registerDashboardResolvers(define);
export const handler = makeResolver(handlers);
