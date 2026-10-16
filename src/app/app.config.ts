import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
// HTTP sirve para cargar los JSON; el router vacío refleja que la navegación es por pestañas locales.
// En producción registra Angular Service Worker para cachear shell y recursos configurados en ngsw-config.json.
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(), provideRouter([]),
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' })
  ]
};
