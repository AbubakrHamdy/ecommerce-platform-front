import { Component, inject, Injectable, signal } from '@angular/core';
import { Icon } from './icon';

export interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(kind: Toast['kind'], message: string): void {
    const toast = { id: ++this.nextId, kind, message };
    this.toasts.update((list) => [...list.slice(-2), toast]);
    setTimeout(() => this.dismiss(toast.id), kind === 'error' ? 6000 : 3500);
  }
}

@Component({
  selector: 'app-toaster',
  imports: [Icon],
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
      aria-live="polite"
    >
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-lg shadow-slate-300/40"
          [class.border-red-200]="toast.kind === 'error'"
          [class.border-line]="toast.kind === 'success'"
          role="status"
        >
          <app-icon
            [name]="toast.kind === 'error' ? 'alert' : 'check'"
            [class.text-red-600]="toast.kind === 'error'"
            [class.text-brand-700]="toast.kind === 'success'"
          />
          <p class="flex-1 text-sm text-ink">{{ toast.message }}</p>
          <button
            type="button"
            class="text-muted hover:text-ink"
            (click)="toasts.dismiss(toast.id)"
            aria-label="Dismiss"
          >
            <app-icon name="x" size="size-4" />
          </button>
        </div>
      }
    </div>
  `,
})
export class Toaster {
  protected readonly toasts = inject(ToastService);
}
