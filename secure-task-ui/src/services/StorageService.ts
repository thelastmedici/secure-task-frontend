export class StorageService {
  private readonly storage: Storage | null;

  constructor() {
    this.storage = typeof window !== 'undefined' ? window.localStorage : null;
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
}
