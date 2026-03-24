export function tid(name: string, extra?: Record<string, any>) {
  return { "data-testid": name, ...(extra || {}) };
}
