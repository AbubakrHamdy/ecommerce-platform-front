import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { STORE_NAME } from '../store/store-settings.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="mt-16 border-t border-line bg-white">
      <div
        class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"
      >
        <p>© {{ year }} {{ storeName }}</p>
        <nav class="flex gap-6">
          <a routerLink="/products" class="hover:text-ink">Shop</a>
          <a routerLink="/orders" class="hover:text-ink">My orders</a>
          <a routerLink="/account" class="hover:text-ink">Account</a>
        </nav>
      </div>
    </footer>
  `,
})
export class Footer {
  protected readonly storeName = STORE_NAME;
  protected readonly year = new Date().getFullYear();
}
