import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api/api';
import { Icon } from '../../shared/icon';
import { MoneyPipe } from '../../shared/money.pipe';
import { ToastService } from '../../shared/toast';
import { cartIssue } from './cart-issues';
import { CartItem, CartService } from './cart.service';

const MAX_PER_LINE = 99;

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, Icon, MoneyPipe],
  templateUrl: './cart-page.html',
})
export class CartPage {
  private readonly cartService = inject(CartService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly cart = this.cartService.cart;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  // Lines with a request in flight are disabled, so fast clicks can't send conflicting quantities.
  protected readonly busyLines = signal<ReadonlySet<number>>(new Set());
  protected readonly clearing = signal(false);
  protected readonly failedImages = signal<ReadonlySet<number>>(new Set());

  protected readonly lines = computed(() =>
    (this.cart()?.items ?? []).map((item) => ({ item, issue: cartIssue(item) })),
  );
  protected readonly hasIssues = computed(() => this.lines().some((line) => line.issue));
  protected readonly itemCount = this.cartService.itemCount;

  constructor() {
    this.reload();
  }

  // Always fetch on open: prices and stock may have changed since the header last loaded the cart.
  protected reload(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.cartService.load().subscribe({
      next: () => this.loading.set(false),
      error: (error) => {
        this.loading.set(false);
        this.loadError.set(apiErrorMessage(error));
      },
    });
  }

  protected maxQuantity(item: CartItem): number {
    return Math.max(Math.min(item.product.stock, MAX_PER_LINE), 1);
  }

  protected setQuantity(item: CartItem, quantity: number): void {
    if (quantity < 1 || quantity === item.quantity) {
      return;
    }
    this.run(item, this.cartService.updateQuantity(item.id, quantity));
  }

  protected remove(item: CartItem): void {
    this.run(item, this.cartService.remove(item.id), `${item.product.name} was removed`);
  }

  protected clear(): void {
    this.clearing.set(true);
    this.cartService.clear().subscribe({
      next: () => this.clearing.set(false),
      error: (error) => {
        this.clearing.set(false);
        this.toasts.error(apiErrorMessage(error));
      },
    });
  }

  protected checkout(): void {
    this.router.navigate(['/checkout']);
  }

  protected isBusy(item: CartItem): boolean {
    return this.busyLines().has(item.id);
  }

  protected imageFailed(item: CartItem): void {
    this.failedImages.update((set) => new Set(set).add(item.id));
  }

  private run(
    item: CartItem,
    request: ReturnType<CartService['remove']>,
    successMessage?: string,
  ): void {
    this.busyLines.update((set) => new Set(set).add(item.id));
    const done = () =>
      this.busyLines.update((set) => {
        const next = new Set(set);
        next.delete(item.id);
        return next;
      });
    request.subscribe({
      next: () => {
        done();
        if (successMessage) {
          this.toasts.success(successMessage);
        }
      },
      error: (error) => {
        done();
        this.toasts.error(apiErrorMessage(error));
        // The server may know something we don't (stock changed, line gone): show its version.
        this.cartService.load().subscribe({ error: () => {} });
      },
    });
  }
}
