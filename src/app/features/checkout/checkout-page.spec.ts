import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { REDIRECT } from '../../core/browser/redirect';
import { StoreSettingsService } from '../../core/store/store-settings.service';
import { CheckoutPage } from './checkout-page';

describe('CheckoutPage', () => {
  let backend: HttpTestingController;
  let redirect: ReturnType<typeof vi.fn>;
  let router: Router;

  const cart = {
    id: 1,
    totalPrice: 39.98,
    items: [
      {
        id: 5,
        quantity: 2,
        subtotal: 39.98,
        product: {
          id: 3,
          name: 'Wireless Mouse',
          price: 19.99,
          stock: 10,
          active: true,
          thumbnailUrl: null,
          categoryName: 'Electronics',
        },
      },
    ],
  };
  const addresses = [
    {
      id: 7,
      street: '1 A St',
      city: 'Cairo',
      state: null,
      postalCode: '1',
      country: 'Egypt',
      isDefault: false,
    },
    {
      id: 8,
      street: '2 B St',
      city: 'Giza',
      state: null,
      postalCode: '2',
      country: 'Egypt',
      isDefault: true,
    },
  ];

  async function render() {
    redirect = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: REDIRECT, useValue: redirect },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const store = TestBed.inject(StoreSettingsService);
    const settingsLoaded = store.load();
    backend
      .expectOne('/api/v1/store')
      .flush({
        country: 'EG',
        currency: 'EGP',
        timeZone: 'Africa/Cairo',
        paymentProviders: ['STRIPE', 'PAYMOB'],
      });
    await settingsLoaded;

    const fixture = TestBed.createComponent(CheckoutPage);
    TestBed.tick(); // runs the effects that start the cart and address requests
    backend.expectOne('/api/v1/cart').flush(cart);
    backend.expectOne('/api/v1/users/me/addresses').flush(addresses);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => backend.verify());

  function placeOrderButton(element: HTMLElement): HTMLButtonElement {
    return [...element.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Place order'),
    ) as HTMLButtonElement;
  }

  it('orders with the default address and opens the chosen provider’s payment page', async () => {
    const fixture = await render();
    placeOrderButton(fixture.nativeElement).click();

    const checkout = backend.expectOne('/api/v1/orders');
    expect(checkout.request.body).toEqual({ addressId: 8 });
    checkout.flush({ id: 41, status: 'PENDING' });

    const payment = backend.expectOne('/api/v1/orders/41/payments');
    expect(payment.request.body).toEqual({ provider: 'STRIPE' });
    payment.flush({
      paymentId: 1,
      provider: 'STRIPE',
      checkoutUrl: 'https://pay.example/cs_1',
      expiresAt: '',
    });

    expect(redirect).toHaveBeenCalledWith('https://pay.example/cs_1');
  });

  it('keeps the order and goes to its page when the payment page cannot be opened', async () => {
    const fixture = await render();
    placeOrderButton(fixture.nativeElement).click();

    backend.expectOne('/api/v1/orders').flush({ id: 41, status: 'PENDING' });
    backend
      .expectOne('/api/v1/orders/41/payments')
      .flush({ status: 502, message: 'Provider down' }, { status: 502, statusText: 'Bad Gateway' });

    expect(redirect).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/orders', 41]);
  });

  it('sends the customer back to the cart when stock ran out', async () => {
    const fixture = await render();
    placeOrderButton(fixture.nativeElement).click();

    backend
      .expectOne('/api/v1/orders')
      .flush(
        { status: 409, message: "Not enough stock for 'Wireless Mouse'" },
        { status: 409, statusText: 'Conflict' },
      );

    expect(router.navigate).toHaveBeenCalledWith(['/cart']);
    expect(redirect).not.toHaveBeenCalled();
  });
});
