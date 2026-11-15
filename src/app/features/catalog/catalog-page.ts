import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { apiErrorMessage } from '../../core/api/api';
import { Icon } from '../../shared/icon';
import { Pagination } from '../../shared/pagination';
import { buildCategoryTree, CategoryNode, ProductQuery } from './catalog.models';
import { CatalogService } from './catalog.service';
import { ProductCard } from './product-card';

const PAGE_SIZE = 12;

// All filters live in the URL (?search=&categoryId=&minPrice=&maxPrice=&sort=&page=), so a filtered
// page can be bookmarked, shared and restored with the back button.
@Component({
  selector: 'app-catalog-page',
  imports: [FormsModule, Icon, Pagination, ProductCard],
  templateUrl: './catalog-page.html',
})
export class CatalogPage {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);

  readonly search = input<string>();
  readonly categoryId = input<string>();
  readonly minPrice = input<string>();
  readonly maxPrice = input<string>();
  readonly sort = input<string>();
  readonly page = input<string>();

  protected readonly sortOptions = [
    { value: 'createdAt,desc', label: 'Newest' },
    { value: 'price,asc', label: 'Price: low to high' },
    { value: 'price,desc', label: 'Price: high to low' },
    { value: 'name,asc', label: 'Name: A to Z' },
  ];

  protected readonly currentSort = computed(() => this.sort() ?? 'createdAt,desc');
  protected readonly currentPage = computed(() =>
    Math.max(0, Math.floor(Number(this.page())) || 0),
  );

  protected readonly minDraft = linkedSignal(() => this.minPrice() ?? '');
  protected readonly maxDraft = linkedSignal(() => this.maxPrice() ?? '');

  private readonly categories = toSignal(this.catalog.categories$, { initialValue: [] });
  protected readonly categoryTree = computed(() => buildCategoryTree(this.categories()));
  protected readonly selectedCategory = computed(() =>
    this.categories().find((c) => String(c.id) === this.categoryId()),
  );

  protected readonly products = rxResource({
    params: (): ProductQuery => ({
      search: this.search(),
      categoryId: this.categoryId(),
      minPrice: this.minPrice(),
      maxPrice: this.maxPrice(),
      sort: this.currentSort(),
      page: this.currentPage(),
      size: PAGE_SIZE,
    }),
    stream: ({ params }) => this.catalog.products(params),
  });

  protected readonly errorMessage = computed(() =>
    this.products.error() ? apiErrorMessage(this.products.error()) : null,
  );
  protected readonly hasFilters = computed(
    () => !!(this.search() || this.categoryId() || this.minPrice() || this.maxPrice()),
  );
  protected readonly skeletons = Array.from({ length: 8 });

  protected selectCategory(category: CategoryNode | null): void {
    this.update({ categoryId: category?.id ?? null });
  }

  protected changeSort(sort: string): void {
    this.update({ sort });
  }

  protected applyPrice(): void {
    this.update({ minPrice: this.minDraft() || null, maxPrice: this.maxDraft() || null });
  }

  protected goToPage(page: number): void {
    this.router.navigate([], { queryParams: { page: page || null }, queryParamsHandling: 'merge' });
  }

  protected clearFilters(): void {
    this.router.navigate([], { queryParams: { sort: this.sort() ?? null } });
  }

  // Any filter change starts again from the first page.
  private update(changes: Record<string, string | number | null>): void {
    this.router.navigate([], {
      queryParams: { ...changes, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
