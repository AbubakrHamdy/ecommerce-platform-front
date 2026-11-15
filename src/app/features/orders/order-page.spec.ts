import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { REDIRECT } from '../../core/browser/redirect';
import { CONFIRM_ATTEMPTS, CONFIRM_INTERVAL_MS, OrderPage } from './order-page';
import { OrderStatus } from './order.models';

describe('OrderPage', () => {
  let backend: HttpTestingController;

  const order = (status: OrderStatus) => ({
    id: 12,
    status,
    totalAmount: 39.98,
    currency: 'EGP',
    customerEmail: 'jane@example.com',
    createdAt: '2026-11-15T10:00:00Z',
    shippingAddress: {
      street: '1 A St',
      city: 'Cairo',
      state: null,
      postalCode: '1',
      country: 'Egypt',
    },
    items: [],
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: REDIRECT, useValue: vi.fn() },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    vi.useRealTimers();
  });

  function render(payment?: string): ComponentFixture<OrderPage> {
    const fixture = TestBed.createComponent(OrderPage);
    fixture.componentRef.setInput('id', '12');
    if (payment) {
      fixture.componentRef.setInput('payment', payment);
    }
    TestBed.tick();
    return fixture;
  }

  // Answers the order request, and the payments request that follows every new order status.
  async function respond(fixture: ComponentFixture<OrderPage>, status: OrderStatus) {
    backend.expectOne('/api/v1/orders/12').flush(order(status));
    // The resource publishes the response on a microtask; the payment list request may follow.
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
      TestBed.tick();
      backend.match('/api/v1/orders/12/payments').forEach((r) => r.flush([]));
    }
    fixture.detectChanges();
  }

  // Moves the fake clock on and lets Angular run what the timers started.
  async function later(ms: number) {
    vi.advanceTimersByTime(ms);
    TestBed.tick();
    await Promise.resolve();
    TestBed.tick();
  }

  const text = (fixture: ComponentFixture<OrderPage>) =>
    fixture.nativeElement.textContent as string;

  it('shows "Order not found" for an order that is missing or not yours', async () => {
    const fixture = render();
    backend
      .expectOne('/api/v1/orders/12')
      .flush({ status: 404, message: 'Order not found' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture)).toContain('Order not found');
  });

  it('back from a successful payment, checks again until the webhook marks the order paid', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const fixture = render('success');
    await respond(fixture, 'PENDING');
    expect(text(fixture)).toContain('Confirming your payment');

    await later(CONFIRM_INTERVAL_MS);
    await respond(fixture, 'PENDING');
    expect(text(fixture)).toContain('Confirming your payment');

    await later(CONFIRM_INTERVAL_MS);
    await respond(fixture, 'PAID');
    expect(text(fixture)).toContain('Payment received');

    await later(CONFIRM_INTERVAL_MS * 3);
    backend.expectNone('/api/v1/orders/12'); // stops checking once paid
  });

  it('stops checking after a while and says the confirmation has not arrived yet', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const fixture = render('success');
    await respond(fixture, 'PENDING');
    for (let i = 0; i < CONFIRM_ATTEMPTS; i++) {
      await later(CONFIRM_INTERVAL_MS);
      await respond(fixture, 'PENDING');
    }

    expect(text(fixture)).toContain("haven't received the payment confirmation");
    await later(CONFIRM_INTERVAL_MS * 3);
    backend.expectNone('/api/v1/orders/12');
  });

  it('offers payment and cancellation only while the order is awaiting payment', async () => {
    const pending = render();
    await respond(pending, 'PENDING');
    expect(text(pending)).toContain('Complete your payment');
    expect(text(pending)).toContain('Cancel order');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    backend = TestBed.inject(HttpTestingController);
    const shipped = render();
    await respond(shipped, 'SHIPPED');
    expect(text(shipped)).not.toContain('Complete your payment');
    expect(text(shipped)).not.toContain('Cancel order');
  });
});
