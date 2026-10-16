import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tarea } from '../models/models';
@Component({
  selector: 'app-tasks', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html', styleUrl: './tasks.component.scss'
})
// Lista presentacional: tasks llega del padre; la búsqueda/filtro vive aquí y selectTask devuelve el id elegido.
export class TasksComponent {
  @Input() tasks: Tarea[] = [];
  @Input() selected: number | null = null;
  @Input() busy = false;
  @Output() selectTask = new EventEmitter<number>();
  search = '';
  course = '';
  // Opciones únicas derivadas de los cursos que trae tareas.json.
  get courses(): string[] { return [...new Set(this.tasks.map(t => t.curso))]; }
  // Combina texto del título y curso sin distinguir mayúsculas en español.
  get filtered(): Tarea[] {
    return this.tasks.filter(t => t.titulo.toLocaleLowerCase('es').includes(this.search.trim().toLocaleLowerCase('es')) && (!this.course || t.curso === this.course));
  }
  // Restablece solo filtros locales; no vuelve a solicitar el archivo JSON.
  clear(): void { this.search = ''; this.course = ''; }
}
