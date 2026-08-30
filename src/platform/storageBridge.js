const PREFIX = 'noether:';

function keyFor(key) { return PREFIX + key; }

export function installStorageBridge() {
  if (typeof window === 'undefined' || window.storage) return;

  window.storage = {
    async get(key) {
      const value = window.localStorage.getItem(keyFor(key));
      return value === null ? null : { value };
    },
    async set(key, value) {
      window.localStorage.setItem(keyFor(key), String(value));
      return { key };
    },
    async delete(key) {
      window.localStorage.removeItem(keyFor(key));
      return { key };
    },
    async list(prefix = '') {
      const keys = [];
      const wanted = keyFor(prefix);
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const fullKey = window.localStorage.key(i);
        if (fullKey && fullKey.startsWith(wanted)) keys.push(fullKey.slice(PREFIX.length));
      }
      return { keys };
    },
  };
}
