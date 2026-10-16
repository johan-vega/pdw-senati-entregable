import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntregaLocal } from '../models/models';
@Component({
  selector: 'app-inbox', standalone: true, imports: [CommonModule], template: `
<!-- La bandeja recibe EntregaLocal de IndexedDB y expone borrar solo tras confirmación explícita. -->
<section class="panel panel-pad" aria-labelledby="inbox-title"><div class="section-heading"><div><h2 id="inbox-title">Mis entregas locales</h2><p>Comentarios y tareas guardados en este dispositivo.</p></div><span class="count">{{ deliveries.length }} entregas</span></div>
@for (delivery of deliveries; track delivery.id) {<article class="record" [attr.data-delivery-id]="delivery.id"><div class="record-heading"><div><p class="meta">{{ delivery.curso }} · Local #{{ delivery.id }}</p><h3>{{ delivery.tituloTarea }}</h3></div><span class="tag">{{ delivery.estadoSincronizacion }}</span></div><p class="meta">Registrada el {{ delivery.fechaRegistro | date:'dd/MM/yyyy, HH:mm' }}</p><details class="details"><summary>Ver detalle de la entrega #{{ delivery.id }}</summary><div class="details-body"><p class="comment">{{ delivery.comentario }}</p><p class="meta">Tarea #{{ delivery.tareaId }} · Intentos remotos: {{ delivery.intentosSincronizacion }}</p>@if (delivery.ultimoError) {<p class="error-text">{{ delivery.ultimoError }}</p>}<p class="help">Sin API: pendiente de sincronización. No se ha enviado al Campus Virtual.</p></div></details><div class="record-bottom"><span class="meta">Guardada en IndexedDB</span><button class="text-button danger" [disabled]="busy" (click)="askDelete(delivery)" [attr.aria-label]="'Eliminar entrega #' + delivery.id">Eliminar entrega</button></div></article>}
@empty {<div class="empty"><span class="empty-symbol">▤</span><strong>Tu bandeja está lista</strong>Guarda una entrega desde Mis tareas para verla aquí.</div>}
</section>
<dialog #confirmation class="confirm-dialog" aria-labelledby="delete-title" aria-describedby="delete-description" (cancel)="cancel()"><h2 id="delete-title">¿Eliminar esta entrega local?</h2><p id="delete-description">La entrega #{{ deleting?.id }} se eliminará de este dispositivo. Esta acción no se puede deshacer.</p><div class="modal-actions"><button class="button ghost" (click)="cancel()" autofocus>Cancelar</button><button class="button danger" (click)="confirmDelete()">Sí, eliminar</button></div></dialog>`,
  styles: `/* Diálogo nativo modal para pedir confirmación antes de borrar IndexedDB. */ .confirm-dialog{border:0;border-radius:13px;padding:28px;max-width:430px;width:calc(100% - 36px);box-shadow:0 20px 70px #0b17354d;color:#182339}.confirm-dialog::backdrop{background:#09172a99}.confirm-dialog p{font-size:13px;line-height:1.7;color:var(--muted)}`
})
// Retiene el registro mientras el diálogo está abierto; el padre realiza la escritura/eliminación real.
export class InboxComponent {
  @Input() deliveries: EntregaLocal[] = [];
  @Input() busy = false;
  @Output() deleteDelivery = new EventEmitter<number>();
  @ViewChild('confirmation') confirmation!: ElementRef<HTMLDialogElement>;
  deleting: EntregaLocal | null = null;
  // Abre el diálogo y conserva el registro que se eliminaría si se confirma.
  askDelete(delivery: EntregaLocal): void { this.deleting = delivery; this.confirmation.nativeElement.showModal(); }
  // Escape o Cancelar cierra el diálogo sin emitir una acción de borrado.
  cancel(): void { this.confirmation.nativeElement.close(); this.deleting = null; }
  // Cierra primero y después solicita al padre eliminar el id en IndexedDB.
  confirmDelete(): void { const id = this.deleting?.id; this.cancel(); if (id !== undefined) this.deleteDelivery.emit(id); }
}
