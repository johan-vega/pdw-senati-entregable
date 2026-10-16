// Registro académico leído de public/assets/data/tareas.json; no proviene del Campus Virtual.
export interface Tarea {
  id: number;
  curso: string;
  titulo: string;
  instructor: string;
  fechaEntrega: string;
  estado: 'Pendiente' | 'Completado';
  descripcion: string;
}
// Estado de la cola local. En esta práctica las nuevas entregas se mantienen en PENDIENTE.
export type EstadoSincronizacion = 'PENDIENTE' | 'SINCRONIZADO' | 'ERROR';
// Copia contextual de una entrega en IndexedDB; el id local lo asigna el almacén.
export interface EntregaLocal {
  id?: number;
  tareaId: number;
  curso: string;
  tituloTarea: string;
  comentario: string;
  fechaRegistro: string;
  estadoSincronizacion: EstadoSincronizacion;
  intentosSincronizacion: number;
  ultimoError?: string;
}
