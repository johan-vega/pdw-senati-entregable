import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
// Expone navigator.onLine como señales Angular; el evento no confirma que el Campus Virtual/API responda.
export class ConnectivityService implements OnDestroy {
  private zone = inject(NgZone);
  readonly online = signal(navigator.onLine);
  readonly recovered = signal(false);
  private connected = () => this.zone.run(() => { this.online.set(true); this.recovered.set(true); });
  private disconnected = () => this.zone.run(() => { this.online.set(false); this.recovered.set(false); });
  // Conecta los eventos del navegador con las señales y los retira al destruir el servicio.
  constructor() { window.addEventListener('online', this.connected); window.addEventListener('offline', this.disconnected); }
  ngOnDestroy(): void { window.removeEventListener('online', this.connected); window.removeEventListener('offline', this.disconnected); }
}
