import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import 'reflect-metadata'
import { noop } from 'rxjs'
import 'zone.js'

import { AppModule } from './app.module'

if (process.env.NODE_ENV === 'production') {
  enableProdMode()
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(console.error)

declare global {
  interface Window {
    ng?: {
      probe?: () => void
    }
  }
}

if (process.env.NODE_ENV === 'development' && window.ng && !window.ng.probe) {
  window.ng.probe = noop
}
