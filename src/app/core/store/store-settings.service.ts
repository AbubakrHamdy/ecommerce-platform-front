import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';
import { API_URL } from '../api/api';

// Shown in the header and page titles. Keep it equal to the backend's STORE_NAME so the site matches the emails.
export const STORE_NAME = 'E-Commerce Platform';

export type PaymentProvider = 'STRIPE' | 'PAYMOB';

export interface StoreSettings {
  country: string;
  currency: string;
  timeZone: string;
  paymentProviders: PaymentProvider[];
}

// Loaded once at startup: every price on the site is shown in the store's currency.
@Injectable({ providedIn: 'root' })
export class StoreSettingsService {
  private readonly http = inject(HttpClient);
  private readonly settings = signal<StoreSettings | null>(null);

  readonly currency = computed(() => this.settings()?.currency ?? 'USD');
  readonly paymentProviders = computed(() => this.settings()?.paymentProviders ?? []);
  readonly canTakePayments = computed(() => this.paymentProviders().length > 0);

  async load(): Promise<void> {
    const settings = await firstValueFrom(
      this.http.get<StoreSettings>(`${API_URL}/store`).pipe(catchError(() => of(null))),
    );
    this.settings.set(settings);
  }
}
