import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../../shared/icon';

// The API has no profile editing yet, so this page shows the profile and links to what can be managed.
@Component({
  selector: 'app-account-page',
  imports: [RouterLink, DatePipe, Icon],
  template: `
    <div class="page max-w-3xl">
      <h1 class="page-title">My account</h1>

      @if (auth.user(); as user) {
        <section class="card mt-6 flex flex-wrap items-center gap-5 p-6">
          <span
            class="flex size-14 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-800"
            >{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</span
          >
          <div class="min-w-0 flex-1">
            <p class="text-lg font-semibold">{{ user.firstName }} {{ user.lastName }}</p>
            <p class="truncate text-sm text-muted">{{ user.email }}</p>
            <p class="mt-1 text-xs text-muted">
              Member since {{ user.createdAt | date: 'longDate' }}
            </p>
          </div>
        </section>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <a
            routerLink="/orders"
            class="card group flex items-start gap-4 p-5 hover:border-brand-200"
          >
            <span class="rounded-xl bg-brand-50 p-2.5 text-brand-700">
              <app-icon name="receipt" />
            </span>
            <span>
              <span class="block font-semibold group-hover:text-brand-700">My orders</span>
              <span class="block text-sm text-muted">Track, pay or cancel your orders</span>
            </span>
          </a>
          <a
            routerLink="/account/addresses"
            class="card group flex items-start gap-4 p-5 hover:border-brand-200"
          >
            <span class="rounded-xl bg-brand-50 p-2.5 text-brand-700">
              <app-icon name="map-pin" />
            </span>
            <span>
              <span class="block font-semibold group-hover:text-brand-700">Addresses</span>
              <span class="block text-sm text-muted">Manage where your orders are shipped</span>
            </span>
          </a>
          <a
            routerLink="/forgot-password"
            class="card group flex items-start gap-4 p-5 hover:border-brand-200"
          >
            <span class="rounded-xl bg-brand-50 p-2.5 text-brand-700">
              <app-icon name="shield" />
            </span>
            <span>
              <span class="block font-semibold group-hover:text-brand-700">Change password</span>
              <span class="block text-sm text-muted">We'll email you a secure link</span>
            </span>
          </a>
          <button
            type="button"
            class="card group flex items-start gap-4 p-5 text-left hover:border-red-200"
            (click)="auth.logout()"
          >
            <span class="rounded-xl bg-red-50 p-2.5 text-red-700">
              <app-icon name="logout" />
            </span>
            <span>
              <span class="block font-semibold group-hover:text-red-700">Log out</span>
              <span class="block text-sm text-muted">Sign out on this device</span>
            </span>
          </button>
        </div>
      }
    </div>
  `,
})
export class AccountPage {
  protected readonly auth = inject(AuthService);
}
