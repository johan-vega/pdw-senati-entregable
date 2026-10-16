import { Component, OnInit, inject } from '@angular/core';
import { ShellComponent } from './components/shell.component';
import { TasksComponent } from './components/tasks.component';
import { DeliveryFormComponent } from './components/delivery-form.component';
import { InboxComponent } from './components/inbox.component';
import { ConnectivityService } from './services/connectivity.service';
import { NoticeService } from './services/notice.service';
import { TareaService } from './services/tarea.service';
import { StorageService } from './services/storage.service';
import { EntregaLocal, Tarea } from './models/models';
// Componente raíz: coordina tareas JSON, formulario, navegación y registros de IndexedDB.
@Component({
  selector: 'app-root', standalone: true,
  imports: [ShellComponent, TasksComponent, DeliveryFormComponent, InboxComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  // Señales globales compartidas por el aviso, el shell y la acción de reintento.
  readonly network = inject(ConnectivityService);
  readonly notice = inject(NoticeService);
  private taskService = inject(TareaService);
  private storage = inject(StorageService);
  active = 'tareas';
  tasks: Tarea[] = [];
  deliveries: EntregaLocal[] = [];
  selected: number | null = null;
  comment = '';
  taskError = '';
  commentError = '';
  notification = '';
  error = false;
  busy = false;
  loading = true;
  loadError = '';
  storageError = '';
  // Contadores presentados en las pestañas: académico viene de tareas.json; pendientes de entregas locales.
  get pending(): number { return this.deliveries.filter(e => e.estadoSincronizacion === 'PENDIENTE').length; }
  get academicPending(): number { return this.tasks.filter(t => t.estado === 'Pendiente').length; }
  get tabs() { return [{ id: 'tareas', label: 'Mis tareas', icon: '▦', count: this.tasks.length }, { id: 'entregas', label: 'Mis entregas locales', icon: '▤', count: this.pending }]; }
  // La vista inicial carga tareas por HTTP/Service Worker y recupera entregas desde IndexedDB en paralelo.
  ngOnInit(): void { this.loadTasks(); void this.loadLocal(); }
  // Cambia de sección sin cambiar de ruta y limpia el aviso temporal actual.
  navigate(tab: string): void { this.active = tab; this.notification = ''; }
  // TareaService consulta public/assets/data/tareas.json; el Service Worker puede responder desde caché offline.
  loadTasks(): void {
    this.loading = true; this.loadError = '';
    this.taskService.obtenerTareas().subscribe({
      next: tasks => { this.tasks = tasks; this.loading = false; },
      error: () => { this.loading = false; this.loadError = 'No se pudieron cargar las tareas. Ábrelas una vez con conexión para guardarlas en caché.'; }
    });
  }
  // StorageService consulta el almacén entregas_pendientes de senatiTaskDB.
  async loadLocal(): Promise<void> {
    this.storageError = '';
    try { this.deliveries = await this.storage.listarEntregas(); }
    catch { this.storageError = 'No se pudo leer IndexedDB. Permite el almacenamiento local y reintenta.'; }
  }
  // Conserva el id elegido y limpia su error de validación al cambiar de tarea.
  selectTask(id: number | null): void { this.selected = id; this.taskError = ''; }
  // Guarda el comentario en estado raíz y retira el error mientras el usuario corrige el campo.
  updateComment(comment: string): void { this.comment = comment; this.commentError = ''; }
  // Valida tarea/comentario, persiste una entrega local y actualiza memoria tras confirmar la transacción.
  async saveDelivery(): Promise<void> {
    if (this.busy) return;
    const task = this.tasks.find(t => t.id === this.selected);
    this.taskError = task ? '' : 'Selecciona una tarea antes de guardar.';
    this.commentError = this.comment.trim() ? '' : 'Escribe un comentario de entrega; no puede estar vacío.';
    if (!task || this.commentError) return;
    this.busy = true; this.notification = '';
    try {
      const delivery = await this.storage.guardarEntregaLocal({ tareaId: task.id, curso: task.curso, tituloTarea: task.titulo, comentario: this.comment, fechaRegistro: '', estadoSincronizacion: 'PENDIENTE', intentosSincronizacion: 0 });
      this.deliveries = [delivery, ...this.deliveries]; this.comment = '';
      this.notify(`Entrega local #${delivery.id} guardada en este dispositivo. Estado: PENDIENTE. No se ha enviado al Campus Virtual.`, false);
    } catch { this.notify('No se pudo guardar la entrega en IndexedDB. Conservamos tu tarea y comentario para reintentar.', true); }
    finally { this.busy = false; }
  }
  // Elimina de IndexedDB primero y solo entonces quita la fila del estado visible.
  async deleteDelivery(id: number): Promise<void> {
    if (this.busy) return;
    this.busy = true; this.notification = '';
    try {
      await this.storage.eliminarEntrega(id);
      this.deliveries = this.deliveries.filter(e => e.id !== id);
      this.notify(`Entrega local #${id} eliminada de este dispositivo.`, false);
    } catch { this.notify('No se pudo eliminar la entrega en IndexedDB. El registro sigue en tu bandeja; reintenta.', true); }
    finally { this.busy = false; }
  }
  // Informa el estado real del prototipo: no hay endpoint, así que no muta estado ni contador de intentos.
  retry(): void {
    this.notify(this.network.online()
      ? 'Con conexión: listo para intentar sincronizar. No hay una API configurada; las entregas conservan PENDIENTE y no se registra un intento remoto.'
      : 'Sin conexión: las entregas siguen guardadas localmente con estado PENDIENTE. Reintenta cuando recuperes la red.', false);
  }
  // Centraliza los mensajes de éxito/error que se muestran como status o alert.
  notify(message: string, error: boolean): void { this.notification = message; this.error = error; }
}
