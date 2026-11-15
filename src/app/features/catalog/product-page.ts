import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { apiErrorMessage } from '../../core/api/api';
import { AuthService } from '../../core/auth/auth.service';
import { STORE_NAME } from '../../core/store/store-settings.service';
import { Icon } from '../../shared/icon';
import { MoneyPipe } from '../../shared/money.pipe';
import { ToastService } from '../../shared/toast';
import { CartService } from '../cart/cart.service';
import { CatalogService } from './catalog.service';
import { ProductCard } from './product-card';

const MAX_PER_LINE = 99;

@Component({
  selector: 'app-product-page',
  imports: [RouterLink, Icon, MoneyPipe, ProductCard],
  templateUrl: './product-page.html',
})
export class ProductPage {
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  readonly id = input.required<string>();

  protected readonly product = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.catalog.product(params),
  });

  // value() throws while the resource is in an error state (a 404), so everything reads this instead.
  protected readonly current = computed(() =>
    this.product.hasValue() ? this.product.value() : undefined,
  );

  protected readonly notFound = computed(() => {
    const error = this.product.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly errorMessage = computed(() =>
    this.product.error() ? apiErrorMessage(this.product.error()) : null,
  );

  // Primary image first, then in the admin's order.
  protected readonly images = computed(() =>
    [...(this.current()?.images ?? [])].sort(
      (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.displayOrder - b.displayOrder,
    ),
  );
  protected readonly selectedImage = linkedSignal(() => this.images()[0]?.url ?? null);
  protected readonly failedImages = signal<ReadonlySet<string>>(new Set());

  protected readonly maxQuantity = computed(() =>
    Math.min(this.current()?.stock ?? 0, MAX_PER_LINE),
  );
  protected readonly quantity = linkedSignal<number>(() => (this.maxQuantity() > 0 ? 1 : 0));
  protected readonly adding = signal(false);

  protected readonly related = rxResource({
    params: () => this.current(),
    stream: ({ params }) =>
      this.catalog
        .products({ categoryId: params.category.id, size: 5 })
        .pipe(map((page) => page.content.filter((p) => p.id !== params.id).slice(0, 4))),
  });

  constructor() {
    effect(() => {
      const product = this.current();
      this.title.setTitle(product ? `${product.name} · ${STORE_NAME}` : STORE_NAME);
    });
  }

  protected changeQuantity(delta: number): void {
    this.quantity.update((q) => Math.min(Math.max(q + delta, 1), this.maxQuantity()));
  }

  protected imageFailed(url: string): void {
    this.failedImages.update((set) => new Set(set).add(url));
  }

  protected addToCart(): void {
    const product = this.current();
    if (!product) {
      return;
    }
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.adding.set(true);
    this.cart.add(product.id, this.quantity()).subscribe({
      next: () => {
        this.adding.set(false);
        this.toasts.success(`${product.name} was added to your cart`);
      },
      error: (error) => {
        this.adding.set(false);
        this.toasts.error(apiErrorMessage(error));
      },
    });
  }
}
