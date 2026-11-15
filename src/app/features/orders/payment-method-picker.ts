import { Component, input, model } from '@angular/core';
import { PaymentProvider } from '../../core/store/store-settings.service';
import { Icon } from '../../shared/icon';

const PROVIDERS: Record<PaymentProvider, { name: string; description: string }> = {
  STRIPE: { name: 'Stripe', description: 'Visa, Mastercard and other cards' },
  PAYMOB: { name: 'Paymob', description: 'Cards and mobile wallets' },
};

// The providers the store offers (GET /store); the customer pays on the chosen provider's own page.
@Component({
  selector: 'app-payment-method-picker',
  imports: [Icon],
  template: `
    <fieldset class="space-y-3">
      <legend class="sr-only">Payment method</legend>
      @for (provider of providers(); track provider) {
        <label
          class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition"
          [class.border-brand-600]="selected() === provider"
          [class.bg-brand-50]="selected() === provider"
          [class.border-line]="selected() !== provider"
        >
          <input
            type="radio"
            [name]="name()"
            class="size-4 accent-brand-700"
            [checked]="selected() === provider"
            (change)="selected.set(provider)"
          />
          <app-icon name="credit-card" class="text-brand-700" />
          <span class="flex-1">
            <span class="block text-sm font-semibold">{{ info(provider).name }}</span>
            <span class="block text-xs text-muted">{{ info(provider).description }}</span>
          </span>
        </label>
      }
    </fieldset>
  `,
})
export class PaymentMethodPicker {
  readonly providers = input.required<readonly PaymentProvider[]>();
  readonly selected = model<PaymentProvider | null>(null);
  readonly name = input('payment-provider');

  protected info(provider: PaymentProvider) {
    return PROVIDERS[provider];
  }
}
