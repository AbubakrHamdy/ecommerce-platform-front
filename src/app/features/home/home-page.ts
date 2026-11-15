import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { STORE_NAME } from '../../core/store/store-settings.service';
import { Icon, IconName } from '../../shared/icon';
import { CatalogService } from '../catalog/catalog.service';
import { ProductCard } from '../catalog/product-card';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, Icon, ProductCard],
  templateUrl: './home-page.html',
})
export class HomePage {
  private readonly catalog = inject(CatalogService);

  protected readonly storeName = STORE_NAME;
  protected readonly newArrivals = rxResource({
    stream: () => this.catalog.products({ sort: 'createdAt,desc', size: 8 }),
  });
  private readonly categories = toSignal(this.catalog.categories$, { initialValue: [] });
  protected readonly topCategories = computed(() =>
    this.categories()
      .filter((c) => c.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  protected readonly highlights: { icon: IconName; title: string; text: string }[] = [
    {
      icon: 'shield',
      title: 'Secure checkout',
      text: 'Pay on Stripe or Paymob. Card details never touch our servers.',
    },
    {
      icon: 'globe',
      title: 'Your local currency',
      text: 'Prices and payments in the currency of your country.',
    },
    {
      icon: 'mail',
      title: 'Order updates by email',
      text: 'A receipt when you pay, and a note when your order ships and arrives.',
    },
  ];
}
