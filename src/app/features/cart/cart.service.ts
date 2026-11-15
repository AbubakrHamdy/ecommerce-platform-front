import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../../core/api/api';
import { AuthService } from '../../core/auth/auth.service';
import { ProductSummary } from '../catalog/catalog.models';

export interface CartItem {
  id: number;
  product: ProductSummary;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  totalPrice: number;
}

// The cart lives on the server (one per customer); this keeps the latest copy so the header count
// and the cart page always agree. Every change returns the whole cart, which replaces the copy.
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly current = signal<Cart | null>(null);
  readonly cart = this.current.asReadonly();
  readonly itemCount = computed(
    () => this.current()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
  );

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.load().subscribe({ error: () => {} });
      } else {
        this.current.set(null);
      }
    });
  }

  load(): Observable<Cart> {
    return this.http.get<Cart>(`${API_URL}/cart`).pipe(tap((cart) => this.current.set(cart)));
  }

  add(productId: number, quantity: number): Observable<Cart> {
    return this.http
      .post<Cart>(`${API_URL}/cart/items`, { productId, quantity })
      .pipe(tap((cart) => this.current.set(cart)));
  }

  updateQuantity(itemId: number, quantity: number): Observable<Cart> {
    return this.http
      .put<Cart>(`${API_URL}/cart/items/${itemId}`, { quantity })
      .pipe(tap((cart) => this.current.set(cart)));
  }

  remove(itemId: number): Observable<Cart> {
    return this.http
      .delete<Cart>(`${API_URL}/cart/items/${itemId}`)
      .pipe(tap((cart) => this.current.set(cart)));
  }

  clear(): Observable<void> {
    return this.http.delete<void>(`${API_URL}/cart`).pipe(tap(() => this.markEmpty()));
  }

  // Checkout empties the cart on the server; this mirrors it without another request.
  markEmpty(): void {
    this.current.update((cart) => (cart ? { ...cart, items: [], totalPrice: 0 } : cart));
  }
}
