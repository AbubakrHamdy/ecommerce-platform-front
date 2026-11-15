import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from './cart.service';

describe('CartService', () => {
  let cart: CartService;
  let auth: AuthService;
  let backend: HttpTestingController;

  const line = (id: number, quantity: number) => ({
    id,
    quantity,
    subtotal: quantity * 10,
    product: {
      id: id * 10,
      name: `P${id}`,
      price: 10,
      stock: 50,
      active: true,
      thumbnailUrl: null,
      categoryName: 'C',
    },
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    cart = TestBed.inject(CartService);
    auth = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  function signIn() {
    auth.login({ email: 'jane@example.com', password: 'secret' }).subscribe();
    backend
      .expectOne('/api/v1/auth/login')
      .flush({ accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', expiresIn: 900 });
    backend
      .expectOne('/api/v1/users/me')
      .flush({ id: 1, email: 'jane@example.com', role: 'CUSTOMER' });
    TestBed.tick();
  }

  it('loads the cart after sign-in and counts units, not lines', () => {
    signIn();

    backend
      .expectOne('/api/v1/cart')
      .flush({ id: 1, items: [line(1, 2), line(2, 3)], totalPrice: 50 });

    expect(cart.itemCount()).toBe(5);
  });

  it('replaces its copy with the cart the server returns after a change', () => {
    signIn();
    backend.expectOne('/api/v1/cart').flush({ id: 1, items: [], totalPrice: 0 });

    cart.add(10, 2).subscribe();
    const request = backend.expectOne('/api/v1/cart/items');
    expect(request.request.body).toEqual({ productId: 10, quantity: 2 });
    request.flush({ id: 1, items: [line(1, 2)], totalPrice: 20 });

    expect(cart.itemCount()).toBe(2);
  });

  it('forgets the cart on sign-out', () => {
    signIn();
    backend.expectOne('/api/v1/cart').flush({ id: 1, items: [line(1, 4)], totalPrice: 40 });

    auth.logout();
    backend.expectOne('/api/v1/auth/logout').flush(null);
    TestBed.tick();

    expect(cart.itemCount()).toBe(0);
  });
});
