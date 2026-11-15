import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api/api';
import { REDIRECT } from '../../core/browser/redirect';
import {
  PaymentProvider,
  STORE_NAME,
  StoreSettingsService,
} from '../../core/store/store-settings.service';
import { Icon } from '../../shared/icon';
import { MoneyPipe } from '../../shared/money.pipe';
import { ToastService } from '../../shared/toast';
import { addressLines } from '../account/address.service';
import {
  isAwaitingPayment,
  Order,
  ORDER_STEPS,
  PaymentStatus,
  progressIndex,
} from './order.models';
import { OrderService } from './order.service';
import { OrderStatusBadge } from './order-status-badge';
import { PaymentMethodPicker } from './payment-method-picker';

// After the provider sends the customer back, the order turns PAID only when the provider's webhook
// arrives, usually within seconds. The page checks again a few times instead of trusting the redirect.
export const CONFIRM_INTERVAL_MS = 3000;
export const CONFIRM_ATTEMPTS = 10;

const STEP_LABELS = ['Placed', 'Paid', 'Preparing', 'Shipped', 'Delivered'];

@Component({
  selector: 'app-order-page',
  imports: [RouterLink, DatePipe, Icon, MoneyPipe, OrderStatusBadge, PaymentMethodPicker],
  templateUrl: './order-page.html',
})
export class OrderPage {
  private readonly orderService = inject(OrderService);
  private readonly store = inject(StoreSettingsService);
  private readonly toasts = inject(ToastService);
  private readonly redirect = inject(REDIRECT);
  private readonly title = inject(Title);

  readonly id = input.required<string>();
  // ?payment=success|cancelled, set by the provider's return URL.
  readonly payment = input<string>();

  protected readonly order = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.orderService.get(params),
  });
  // value() throws while the resource is in an error state (a 404), so everything reads this instead.
  protected readonly current = computed(() =>
    this.order.hasValue() ? this.order.value() : undefined,
  );
  // Reloaded only when the order's status changes (e.g. once the payment is confirmed), not on every check.
  private readonly paymentsKey = computed(() => {
    const order = this.current();
    return order ? `${order.id}:${order.status}` : undefined;
  });
  protected readonly payments = rxResource({
    params: () => this.paymentsKey(),
    stream: ({ params }) => this.orderService.payments(params.split(':')[0]),
  });

  protected readonly notFound = computed(() => {
    const error = this.order.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly errorMessage = computed(() =>
    this.order.error() ? apiErrorMessage(this.order.error()) : null,
  );

  private readonly checks = signal(0);
  protected readonly confirming = computed(
    () =>
      this.payment() === 'success' &&
      this.current()?.status === 'PENDING' &&
      this.checks() < CONFIRM_ATTEMPTS,
  );

  protected readonly providers = this.store.paymentProviders;
  protected readonly provider = linkedSignal<PaymentProvider | null>(
    () => this.providers()[0] ?? null,
  );
  protected readonly paying = signal(false);
  protected readonly confirmingCancel = signal(false);
  protected readonly cancelling = signal(false);

  protected readonly steps = STEP_LABELS.map((label, index) => ({
    label,
    status: ORDER_STEPS[index],
  }));
  protected readonly progress = computed(() => {
    const order = this.current();
    return order ? progressIndex(order.status) : 0;
  });
  protected readonly paymentLabels: Record<PaymentStatus, string> = {
    PENDING: 'Open',
    SUCCEEDED: 'Paid',
    FAILED: 'Failed',
    EXPIRED: 'Expired',
  };
  protected readonly addressLines = addressLines;
  protected readonly isAwaitingPayment = isAwaitingPayment;
  protected readonly failedImages = signal<ReadonlySet<number>>(new Set());

  constructor() {
    effect((onCleanup) => {
      if (!this.confirming() || this.order.isLoading()) {
        return;
      }
      const timer = setTimeout(() => {
        this.checks.update((n) => n + 1);
        this.order.reload();
      }, CONFIRM_INTERVAL_MS);
      onCleanup(() => clearTimeout(timer));
    });

    effect(() => {
      const order = this.current();
      this.title.setTitle(order ? `Order #${order.id} · ${STORE_NAME}` : `Order · ${STORE_NAME}`);
    });
  }

  protected refresh(): void {
    this.checks.set(0);
    this.order.reload();
  }

  protected pay(order: Order): void {
    const provider = this.provider();
    if (!provider) {
      return;
    }
    this.paying.set(true);
    this.orderService.startPayment(order.id, provider).subscribe({
      next: (session) => this.redirect(session.checkoutUrl),
      error: (error) => {
        this.paying.set(false);
        this.toasts.error(apiErrorMessage(error));
        // The order may have changed meanwhile (paid in another tab, or expired).
        this.order.reload();
      },
    });
  }

  protected cancel(order: Order): void {
    this.cancelling.set(true);
    this.orderService.cancel(order.id).subscribe({
      next: (updated) => {
        this.cancelling.set(false);
        this.confirmingCancel.set(false);
        this.order.set(updated);
        this.toasts.success(`Order #${order.id} was cancelled`);
      },
      error: (error) => {
        this.cancelling.set(false);
        this.confirmingCancel.set(false);
        this.toasts.error(apiErrorMessage(error));
        this.order.reload();
      },
    });
  }

  protected imageFailed(itemId: number): void {
    this.failedImages.update((set) => new Set(set).add(itemId));
  }
}
