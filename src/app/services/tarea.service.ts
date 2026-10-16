import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Tarea } from '../models/models';
@Injectable({ providedIn: 'root' })
// Fuente de tareas: GET /assets/data/tareas.json, servido desde public/assets/data y cacheado por el Service Worker.
export class TareaService {
  private http = inject(HttpClient);
  obtenerTareas() { return this.http.get<Tarea[]>('/assets/data/tareas.json'); }
}
