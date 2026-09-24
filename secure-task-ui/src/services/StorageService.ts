class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  private static instance: MemoryStorage | null = null;
  private readonly store = new Map<string, string>();

  static getInstance(): MemoryStorage {
    if (!MemoryStorage.instance) {
      MemoryStorage.instance = new MemoryStorage();
    }
    return MemoryStorage.instance;
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

export class StorageService {
  private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;

  constructor() {
    const globalScope = typeof globalThis !== 'undefined' ? globalThis : undefined;
    const browserStorage = globalScope && 'localStorage' in globalScope ? (globalScope as { localStorage?: Storage }).localStorage : undefined;
    this.storage = browserStorage ?? MemoryStorage.getInstance();
  }

  load<T>(key: string, fallback: T): T {
    if (!this.storage) return fallback;

    try {
      const raw = this.storage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  save<T>(key: string, value: T): void {
    if (!this.storage) return;

    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch {
      // no-op to keep the UI resilient in restricted browsing modes
    }
  }

  clear(): void {
    if (!this.storage) return;

    try {
      if ('removeItem' in this.storage) {
        this.storage.removeItem('sessionToken');
        this.storage.removeItem('sessionUserId');
        this.storage.removeItem('tasks');
        this.storage.removeItem('documents');
        this.storage.removeItem('notifications');
        this.storage.removeItem('users');
        this.storage.removeItem('auditLogs');
        this.storage.removeItem('workspaceSettings');
        this.storage.removeItem('passwordCredentials');
        this.storage.removeItem('twoFactorCredentials');
      }
    } catch {
      // no-op to keep the UI resilient in restricted browsing modes
    }
  }
}
