import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon';
import { MoneyPipe } from '../../shared/money.pipe';
import { ProductSummary } from './catalog.models';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, Icon, MoneyPipe],
  template: `
    <a
      [routerLink]="['/products', product().id]"
      class="group card flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70"
    >
      <div class="relative aspect-square overflow-hidden bg-surface">
        @if (product().thumbnailUrl && !imageFailed()) {
          <img
            [src]="product().thumbnailUrl"
            [alt]="product().name"
            width="600"
            height="600"
            loading="lazy"
            (error)="imageFailed.set(true)"
            class="size-full object-cover transition duration-300 group-hover:scale-105"
          />
        } @else {
          <div class="flex size-full items-center justify-center text-muted/50">
            <app-icon name="image" size="size-12" />
          </div>
        }
        @if (product().stock === 0) {
          <span
            class="absolute top-3 left-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-white"
            >Out of stock</span
          >
        } @else if (product().stock <= 5) {
          <span
            class="absolute top-3 left-3 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
            >Only {{ product().stock }} left</span
          >
        }
      </div>
      <div class="flex flex-1 flex-col gap-1 p-4">
        <p class="text-xs font-medium tracking-wide text-muted uppercase">
          {{ product().categoryName }}
        </p>
        <h3 class="line-clamp-2 font-medium text-ink group-hover:text-brand-700">
          {{ product().name }}
        </h3>
        <p class="mt-auto pt-2 text-lg font-semibold text-ink">{{ product().price | money }}</p>
      </div>
    </a>
  `,
})
export class ProductCard {
  readonly product = input.required<ProductSummary>();
  // A broken image host shows the placeholder instead of an empty box.
  protected readonly imageFailed = signal(false);
}
