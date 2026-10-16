import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
// Punto de entrada: inicia la pantalla raíz con los proveedores globales de la PWA.
bootstrapApplication(AppComponent, appConfig).catch(error => console.error(error));
