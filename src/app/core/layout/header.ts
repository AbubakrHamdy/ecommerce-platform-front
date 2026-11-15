import { Component, ElementRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { STORE_NAME } from '../store/store-settings.service';
import { Icon } from '../../shared/icon';
import { CartService } from '../../features/cart/cart.service';

@Component({
  selector: 'app-header',
  imports: [FormsModule, RouterLink, RouterLinkActive, Icon],
  templateUrl: './header.html',
  host: { '(document:click)': 'closeMenuOnOutsideClick($event)' },
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly element = inject(ElementRef<HTMLElement>);

  protected readonly storeName = STORE_NAME;
  protected readonly searchTerm = signal('');
  protected readonly accountMenuOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.accountMenuOpen.set(false);
        this.mobileMenuOpen.set(false);
      });
  }

  protected search(): void {
    const search = this.searchTerm().trim();
    this.router.navigate(['/products'], { queryParams: search ? { search } : {} });
  }

  protected logout(): void {
    this.auth.logout();
  }

  protected closeMenuOnOutsideClick(event: MouseEvent): void {
    if (this.accountMenuOpen() && !this.element.nativeElement.contains(event.target as Node)) {
      this.accountMenuOpen.set(false);
    }
  }
}
