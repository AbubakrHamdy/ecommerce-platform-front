import { Component, computed, input, output } from '@angular/core';
import { Icon } from './icon';

// Zero-based pages, like the API. Shows the first, last and the pages around the current one.
@Component({
  selector: 'app-pagination',
  imports: [Icon],
  template: `
    @if (totalPages() > 1) {
      <nav class="flex items-center justify-center gap-1" aria-label="Pagination">
        <button
          type="button"
          class="btn btn-secondary px-2.5"
          [disabled]="page() === 0"
          (click)="pageChange.emit(page() - 1)"
          aria-label="Previous page"
        >
          <app-icon name="chevron-left" size="size-4" />
        </button>
        @for (item of items(); track $index) {
          @if (item === null) {
            <span class="px-2 text-muted">…</span>
          } @else {
            <button
              type="button"
              class="btn min-w-10 px-3"
              [class.btn-primary]="item === page()"
              [class.btn-secondary]="item !== page()"
              [attr.aria-current]="item === page() ? 'page' : null"
              (click)="pageChange.emit(item)"
            >
              {{ item + 1 }}
            </button>
          }
        }
        <button
          type="button"
          class="btn btn-secondary px-2.5"
          [disabled]="page() >= totalPages() - 1"
          (click)="pageChange.emit(page() + 1)"
          aria-label="Next page"
        >
          <app-icon name="chevron-right" size="size-4" />
        </button>
      </nav>
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly items = computed(() => pageItems(this.page(), this.totalPages()));
}

export function pageItems(page: number, totalPages: number): (number | null)[] {
  const shown = new Set(
    [0, totalPages - 1, page - 1, page, page + 1].filter((p) => p >= 0 && p < totalPages),
  );
  const sorted = [...shown].sort((a, b) => a - b);
  const items: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push(null);
    items.push(p);
  });
  return items;
}
