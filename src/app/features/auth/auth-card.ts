import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { STORE_NAME } from '../../core/store/store-settings.service';
import { Icon } from '../../shared/icon';

// The centered card shared by the login, register and password pages.
@Component({
  selector: 'app-auth-card',
  imports: [RouterLink, Icon],
  template: `
    <div class="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <a routerLink="/" class="mx-auto flex w-fit items-center gap-2 font-bold text-ink">
          <span class="flex size-9 items-center justify-center rounded-lg bg-brand-700 text-white">
            <app-icon name="package" />
          </span>
          {{ storeName }}
        </a>
        <div class="card mt-8 p-8 shadow-sm">
          <h1 class="text-2xl font-bold tracking-tight text-ink">{{ heading() }}</h1>
          @if (subheading()) {
            <p class="mt-2 text-sm text-muted">{{ subheading() }}</p>
          }
          <div class="mt-6">
            <ng-content />
          </div>
        </div>
        <ng-content select="[footer]" />
      </div>
    </div>
  `,
})
export class AuthCard {
  readonly heading = input.required<string>();
  readonly subheading = input<string>();
  protected readonly storeName = STORE_NAME;
}

@Component({
  selector: 'app-alert',
  imports: [Icon],
  template: `
    <div
      class="flex items-start gap-3 rounded-lg border p-3 text-sm"
      [class.border-red-200]="kind() === 'error'"
      [class.bg-red-50]="kind() === 'error'"
      [class.text-red-800]="kind() === 'error'"
      [class.border-brand-200]="kind() === 'success'"
      [class.bg-brand-50]="kind() === 'success'"
      [class.text-brand-900]="kind() === 'success'"
      [class.border-amber-200]="kind() === 'info'"
      [class.bg-amber-50]="kind() === 'info'"
      [class.text-amber-900]="kind() === 'info'"
      [attr.role]="kind() === 'error' ? 'alert' : 'status'"
    >
      <app-icon
        [name]="kind() === 'error' ? 'alert' : kind() === 'success' ? 'check' : 'info'"
        size="size-4"
        class="mt-0.5"
      />
      <div class="flex-1"><ng-content /></div>
    </div>
  `,
})
export class Alert {
  readonly kind = input<'error' | 'success' | 'info'>('error');
}
