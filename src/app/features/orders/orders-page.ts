import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api/api';
import { Icon } from '../../shared/icon';
import { MoneyPipe } from '../../shared/money.pipe';
import { Pagination } from '../../shared/pagination';
import { OrderStatusBadge } from './order-status-badge';
import { OrderService } from './order.service';

@Component({
  selector: 'app-orders-page',
  imports: [RouterLink, DatePipe, Icon, MoneyPipe, Pagination, OrderStatusBadge],
  template: `
    <div class="page max-w-4xl">
      <h1 class="page-title">My orders</h1>

      @if (errorMessage(); as message) {
        <div class="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <app-icon name="alert" size="size-8" class="text-red-500" />
          <p>{{ message }}</p>
          <button type="button" class="btn btn-secondary" (click)="orders.reload()">
            Try again
          </button>
        </div>
      } @else if (orders.value(); as result) {
        @if (result.content.length === 0) {
          <div class="card mt-6 flex flex-col items-center px-6 py-16 text-center">
            <span
              class="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-700"
            >
              <app-icon name="receipt" size="size-8" />
            </span>
            <h2 class="mt-5 text-lg font-semibold">No orders yet</h2>
            <p class="mt-1 text-muted">When you place an order, it shows up here.</p>
            <a routerLink="/products" class="btn btn-primary mt-6">Start shopping</a>
          </div>
        } @else {
          <ul class="card mt-6 divide-y divide-line" [class.opacity-60]="orders.isLoading()">
            @for (order of result.content; track order.id) {
              <li>
                <a
                  [routerLink]="['/orders', order.id]"
                  class="flex items-center gap-4 p-4 hover:bg-surface sm:p-5"
                >
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold text-ink">Order #{{ order.id }}</p>
                    <p class="text-sm text-muted">
                      {{ order.createdAt | date: 'mediumDate' }} · {{ order.itemCount }}
                      {{ order.itemCount === 1 ? 'item' : 'items' }}
                    </p>
                  </div>
                  <!-- Stacked on phones; side by side, status first, from the sm breakpoint. -->
                  <div
                    class="flex flex-col items-end gap-1.5 sm:flex-row-reverse sm:items-center sm:gap-6"
                  >
                    <p class="font-semibold whitespace-nowrap sm:w-28 sm:text-right">
                      {{ order.totalAmount | money: order.currency }}
                    </p>
                    <app-order-status-badge [status]="order.status" />
                  </div>
                  <app-icon
                    name="chevron-right"
                    size="size-4"
                    class="hidden text-muted sm:inline-flex"
                  />
                </a>
              </li>
            }
          </ul>
          <div class="mt-6">
            <app-pagination
              [page]="currentPage()"
              [totalPages]="result.totalPages"
              (pageChange)="goToPage($event)"
            />
          </div>
        }
      } @else {
        <div class="card mt-6 animate-pulse divide-y divide-line">
          @for (i of [1, 2, 3]; track i) {
            <div class="h-20"></div>
          }
        </div>
      }
    </div>
  `,
})
export class OrdersPage {
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  // ?page= in the URL, zero-based like the API and the catalog.
  readonly page = input<string>();
  protected readonly currentPage = computed(() =>
    Math.max(0, Math.floor(Number(this.page())) || 0),
  );

  protected readonly orders = rxResource({
    params: () => this.currentPage(),
    stream: ({ params }) => this.orderService.list(params),
  });
  protected readonly errorMessage = computed(() =>
    this.orders.error() ? apiErrorMessage(this.orders.error()) : null,
  );

  protected goToPage(page: number): void {
    this.router.navigate([], { queryParams: { page: page || null } });
    window.scrollTo({ top: 0 });
  }
}
