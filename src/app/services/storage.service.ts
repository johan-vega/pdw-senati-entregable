import { Injectable } from '@angular/core';
import { LocalDatabase } from './database';
import { EntregaLocal } from '../models/models';
@Injectable({ providedIn: 'root' })
// Adaptador de entregas a IndexedDB: base senatiTaskDB, almacén entregas_pendientes.
export class StorageService extends LocalDatabase {
  constructor() { super('senatiTaskDB', ['entregas_pendientes']); }
  // Valida referencia y comentario, asigna fecha/estado local y devuelve el id solo tras completar la transacción.
  async guardarEntregaLocal(entrega: EntregaLocal): Promise<EntregaLocal> {
    if (!Number.isSafeInteger(entrega.tareaId) || entrega.tareaId <= 0) throw new Error('Selecciona una tarea válida.');
    if (!entrega.comentario.trim()) throw new Error('Escribe un comentario para tu entrega.');
    const record: EntregaLocal = {
      tareaId: entrega.tareaId, curso: entrega.curso, tituloTarea: entrega.tituloTarea,
      comentario: entrega.comentario.trim(), fechaRegistro: new Date().toISOString(),
      estadoSincronizacion: 'PENDIENTE', intentosSincronizacion: 0
    };
    const key = await this.execute<IDBValidKey>('entregas_pendientes', 'readwrite', store => store.add(record));
    return { ...record, id: Number(key) };
  }
  // Recupera los registros guardados y presenta primero los ids más recientes.
  async listarEntregas(): Promise<EntregaLocal[]> {
    const records = await this.execute<EntregaLocal[]>('entregas_pendientes', 'readonly', store => store.getAll());
    return records.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }
  // Busca una entrega por clave local; no consulta la fuente JSON de tareas ni una API.
  obtenerEntrega(id: number): Promise<EntregaLocal | undefined> {
    return this.execute('entregas_pendientes', 'readonly', store => store.get(id));
  }
  // Elimina exclusivamente el registro del almacén del navegador.
  async eliminarEntrega(id: number): Promise<void> {
    await this.execute('entregas_pendientes', 'readwrite', store => store.delete(id));
  }
  // Cuenta los estados PENDIENTE desde IndexedDB; la UI normalmente deriva el mismo dato de su lista en memoria.
  async contarPendientes(): Promise<number> {
    return (await this.listarEntregas()).filter(e => e.estadoSincronizacion === 'PENDIENTE').length;
  }
}
