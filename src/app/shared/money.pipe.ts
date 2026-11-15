import { inject, Pipe, PipeTransform } from '@angular/core';
import { StoreSettingsService } from '../core/store/store-settings.service';

const formatters = new Map<string, Intl.NumberFormat>();

// "EGP 1,249.50", the same format as the emails. Orders pass their own currency, which may differ
// from the store's current one.
export function formatMoney(amount: number | string, currency: string): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(Number(amount)).replace(/ /g, ' ');
}

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  private readonly store = inject(StoreSettingsService);

  transform(amount: number | string | null | undefined, currency?: string): string {
    if (amount === null || amount === undefined || amount === '') {
      return '';
    }
    return formatMoney(amount, currency ?? this.store.currency());
  }
}
