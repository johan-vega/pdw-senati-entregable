import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tarea } from '../models/models';
@Component({
  selector: 'app-delivery-form', standalone: true, imports: [FormsModule], template: `
<!-- Formulario controlado por AppComponent: emite selección, comentario y solicitud de guardado. -->
<section class="panel panel-pad" aria-labelledby="delivery-title"><div class="section-heading"><div><h2 id="delivery-title">Prepara tu entrega</h2><p>Tu avance queda guardado contigo.</p></div></div>
<form (ngSubmit)="save.emit()" novalidate><label class="field-label" for="task-select">Tarea seleccionada</label><select id="task-select" name="task" [ngModel]="selected" (ngModelChange)="selectedChange.emit($event)" [disabled]="busy" [attr.aria-invalid]="!!taskError" aria-describedby="task-error"><option [ngValue]="null">Selecciona una tarea</option>@for (task of tasks; track task.id) {<option [ngValue]="task.id">{{ task.titulo }}</option>}</select>
@if (taskError) {<p class="error-text" id="task-error" role="alert">{{ taskError }}</p>}
@if (selectedTask) {<div class="selection-note"><strong>{{ selectedTask.curso }}</strong><p>{{ selectedTask.titulo }}</p><small>Estado académico: {{ selectedTask.estado }}</small></div>}
<div class="form-comment"><label class="field-label" for="comment">Comentario de entrega</label><textarea id="comment" name="comment" [ngModel]="comment" (ngModelChange)="commentChange.emit($event)" [disabled]="busy" placeholder="Describe tu avance, resultado u observación…" [attr.aria-invalid]="!!commentError" aria-describedby="comment-error comment-help"></textarea>@if (commentError) {<p class="error-text" id="comment-error" role="alert">{{ commentError }}</p>}<p class="help" id="comment-help">Escribe un comentario. No se adjuntan archivos en esta práctica.</p></div>
<button class="button full" [disabled]="busy">{{ busy ? 'Guardando…' : 'Guardar entrega local' }} <span aria-hidden="true">→</span></button><p class="help">Estado inicial: PENDIENTE. Guardar localmente conserva tu trabajo; la entrega académica requiere una API futura.</p></form></section>`,
  styles: `/* Resume la tarea elegida y separa visualmente el campo de comentario. */ .form-comment{margin:22px 0}.selection-note{margin-top:14px;padding:13px;background:#f3f6fc;border-radius:7px;font-size:11px;line-height:1.6}.selection-note strong{color:var(--blue);font-size:10px}.selection-note p{margin:6px 0}.selection-note small{color:var(--muted);font-size:9px}`
})
// Inputs/Outputs mantienen el formulario sincronizado con AppComponent; selectedTask busca en tareas.json ya cargado.
export class DeliveryFormComponent {
  @Input() tasks: Tarea[] = [];
  @Input() selected: number | null = null;
  @Input() comment = '';
  @Input() busy = false;
  @Input() taskError = '';
  @Input() commentError = '';
  @Output() selectedChange = new EventEmitter<number | null>();
  @Output() commentChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<void>();
  // Deriva el resumen desde la selección actual sin duplicar el objeto de tarea.
  get selectedTask(): Tarea | undefined { return this.tasks.find(t => t.id === this.selected); }
}
