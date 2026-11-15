import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api/api';
import { REDIRECT } from '../../core/browser/redirect';
import { PaymentProvider, StoreSettingsService } from '../../core/store/store-settings.service';
import { Icon } from '../../shared/icon';
import { MoneyPipe } from '../../shared/money.pipe';
import { ToastService } from '../../shared/toast';
import { AddressForm } from '../account/address-form';
import { Address, addressLines, AddressService } from '../account/address.service';
import { cartIssue } from '../cart/cart-issues';
import { CartService } from '../cart/cart.service';
import { Order } from '../orders/order.models';
import { OrderService } from '../orders/order.service';
import { PaymentMethodPicker } from '../orders/payment-method-picker';

@Component({
  selector: 'app-checkout-page',
  imports: [RouterLink, Icon, MoneyPipe, AddressForm, PaymentMethodPicker],
  templateUrl: './checkout-page.html',
})
export class CheckoutPage {
  private readonly cartService = inject(CartService);
  private readonly addressService = inject(AddressService);
  private readonly orders = inject(OrderService);
  private readonly store = inject(StoreSettingsService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly redirect = inject(REDIRECT);

  protected readonly cart = this.cartService.cart;
  protected readonly cartLoading = signal(true);
  protected readonly addresses = rxResource({ stream: () => this.addressService.list() });
  // value() throws while the resource is in an error state, so the page reads this instead.
  protected readonly addressList = computed(() =>
    this.addresses.hasValue() ? this.addresses.value() : undefined,
  );

  // The address just added is preselected, otherwise the default one.
  private readonly justAdded = signal<number | null>(null);
  protected readonly selectedAddressId = linkedSignal<number | null>(() => {
    const list = this.addressList() ?? [];
    const preferred =
      list.find((a) => a.id === this.justAdded()) ?? list.find((a) => a.isDefault) ?? list[0];
    return preferred?.id ?? null;
  });
  protected readonly addingAddress = linkedSignal(() => this.addressList()?.length === 0);

  protected readonly providers = this.store.paymentProviders;
  protected readonly provider = linkedSignal<PaymentProvider | null>(
    () => this.providers()[0] ?? null,
  );

  protected readonly placing = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly items = computed(() => this.cart()?.items ?? []);
  protected readonly cartHasIssues = computed(() => this.items().some((item) => cartIssue(item)));
  protected readonly canPlaceOrder = computed(
    () =>
      !this.placing() &&
      this.items().length > 0 &&
      !this.cartHasIssues() &&
      this.selectedAddressId() !== null &&
      !this.addingAddress() &&
      this.provider() !== null,
  );
  protected readonly addressLines = addressLines;

  constructor() {
    // Fresh prices and stock: the order is priced from the server's cart, so the summary must match it.
    this.cartService.load().subscribe({
      next: () => this.cartLoading.set(false),
      error: (error) => {
        this.cartLoading.set(false);
        this.error.set(apiErrorMessage(error));
      },
    });
  }

  protected addressAdded(address: Address): void {
    this.justAdded.set(address.id);
    this.addingAddress.set(false);
    this.addresses.reload();
  }

  protected placeOrder(): void {
    const addressId = this.selectedAddressId();
    const provider = this.provider();
    if (!this.canPlaceOrder() || addressId === null || provider === null) {
      return;
    }
    this.placing.set(true);
    this.error.set(null);
    this.orders.checkout(addressId).subscribe({
      next: (order) => {
        this.cartService.markEmpty();
        this.openPaymentPage(order, provider);
      },
      error: (error) => this.checkoutFailed(error),
    });
  }

  private openPaymentPage(order: Order, provider: PaymentProvider): void {
    this.orders.startPayment(order.id, provider).subscribe({
      // `placing` stays true: the page is about to leave for the provider.
      next: (session) => this.redirect(session.checkoutUrl),
      error: () => {
        // The order exists and holds the stock; the customer can pay from its page.
        this.toasts.error(
          `Order #${order.id} is saved, but the payment page didn't open. You can pay from your order.`,
        );
        this.router.navigate(['/orders', order.id]);
      },
    });
  }

  private checkoutFailed(error: unknown): void {
    this.placing.set(false);
    if (error instanceof HttpErrorResponse && error.status === 409) {
      // Stock ran out or a product was archived since the cart was loaded: show it on the cart page.
      this.toasts.error(apiErrorMessage(error));
      this.router.navigate(['/cart']);
    } else if (error instanceof HttpErrorResponse && error.status === 404) {
      this.error.set('That address no longer exists. Please choose another one.');
      this.addresses.reload();
    } else {
      this.error.set(apiErrorMessage(error));
    }
  }
}
