/**
 * CRM Service Stub — заглушка для production без sqlite3
 * Логирует вызовы, но не сохраняет в SQLite
 */
const noop = async () => ({});

export default {
  init: noop,
  createOrUpdateLead: noop,
  convertLeadToClient: noop,
  logInteraction: noop,
  addToTotalSpent: noop,
  updateVIPTier: noop,
  getClientInteractions: async () => [],
  getClientInterests: async () => [],
  getClientConsultations: async () => [],
  getStats: async () => ({ leads: 0, clients: 0, interactions: 0 }),
  db: {
    get: async () => null,
    all: async () => [],
    run: noop,
  },
};
