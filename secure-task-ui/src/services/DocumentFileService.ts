const DATABASE_NAME = 'secureflow-document-files';
const STORE_NAME = 'files';

/** Keeps binary uploads out of localStorage so the full 25 MB policy limit works. */
export class DocumentFileService {
  private memory = new Map<string, Blob>();

  async save(key: string, file: Blob): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      this.memory.set(key, file);
      return;
    }
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(file, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
  }

  async get(key: string): Promise<Blob | null> {
    if (typeof indexedDB === 'undefined') return this.memory.get(key) ?? null;
    const db = await this.open();
    const value = await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value;
  }

  async delete(key: string): Promise<void> {
    this.memory.delete(key);
    if (typeof indexedDB === 'undefined') return;
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
