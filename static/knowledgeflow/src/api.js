import { invoke } from '@forge/bridge';
export const invokeResolver = (name, payload) => invoke(name, payload);
export const statusLabels = {
  open: 'Open',
  answered: 'Answered',
  faq_published: 'FAQ published',
};
