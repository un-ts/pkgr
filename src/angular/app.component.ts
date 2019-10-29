import { Component, OnDestroy } from '@angular/core'
import { Subject, interval } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  selector: '#app',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
  destroy$ = new Subject<void>()

  counter$ = interval(1000).pipe(takeUntil(this.destroy$))

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
