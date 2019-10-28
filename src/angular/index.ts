import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import 'reflect-metadata'
import 'zone.js'

import { AppModule } from './app.module'

if (process.env.NODE_ENV === 'production') {
  enableProdMode()
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(console.error)
