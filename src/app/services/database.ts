/** Operaciones resueltas al completar la transacción, nunca solo al emitir onsuccess. */
export abstract class LocalDatabase {
  protected constructor(private readonly name: string, private readonly stores: string[]) { }

  abrirDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) { reject(new Error('IndexedDB no está disponible en este navegador.')); return; }
      const request = indexedDB.open(this.name, 1);
      let finished = false;
      const fail = (error: unknown) => { finished = true; clearTimeout(timer); reject(error); };
      const timer = setTimeout(() => fail(new Error('No se pudo abrir la base local. Cierra otras pestañas y reintenta.')), 8000);
      // La versión 1 crea solo los almacenes que aún no existen en este origen/perfil del navegador.
      request.onupgradeneeded = () => {
        for (const name of this.stores) {
          if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
        }
      };
      // Una pestaña antigua puede bloquear la actualización; el timeout y estos eventos devuelven un error legible.
      request.onblocked = () => fail(new Error('La base local está bloqueada por otra pestaña. Ciérrala y reintenta.'));
      request.onerror = () => fail(request.error ?? new Error('No se pudo abrir la base local.'));
      request.onsuccess = () => {
        clearTimeout(timer);
        if (finished) { request.result.close(); return; }
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
    });
  }

  // Abstrae get/add/delete: la promesa solo resuelve en transaction.oncomplete, no en request.onsuccess.
  protected async execute<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.abrirDB();
    return new Promise<T>((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, mode);
        const request = action(transaction.objectStore(storeName));
        transaction.oncomplete = () => { db.close(); resolve(request.result); };
        const fail = () => { db.close(); reject(transaction.error ?? request.error ?? new Error('La operación local fue cancelada.')); };
        transaction.onerror = fail;
        transaction.onabort = fail;
      } catch (error) { db.close(); reject(error); }
    });
  }
}
