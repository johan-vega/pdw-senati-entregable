import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
// Lee /data/avisos.json, recurso cacheable freshness; si falla, la señal mantiene el aviso local predeterminado.
export class NoticeService {
  readonly message = signal('Datos de práctica. Guardado local; sin API de sincronización.');
  private http = inject(HttpClient);
  constructor() {
    this.http.get<{ titulo: string; mensaje: string }>('/data/avisos.json').subscribe({
      next: aviso => this.message.set(aviso.mensaje),
      error: () => { /* El aviso predeterminado permanece visible sin red ni caché. */ }
    });
  }
}
