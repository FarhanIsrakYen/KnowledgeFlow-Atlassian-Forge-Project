import { invoke } from '@forge/bridge';

// Keeping bridge calls in one module makes the page components independent from
// Forge transport details and provides a single place for future API changes.
export const invokeResolver = (name, payload) => invoke(name, payload);
export const statusLabels = {
  open: 'Open',
  answered: 'Answered',
  faq_published: 'FAQ published',
};
