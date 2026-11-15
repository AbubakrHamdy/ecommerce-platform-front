import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, Page } from '../../core/api/api';
import { PaymentProvider } from '../../core/store/store-settings.service';
import { Order, OrderSummary, Payment, PaymentSession } from './order.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/orders`;

  // Turns the cart into a PENDING order: stock is reserved and the cart is emptied on the server.
  checkout(addressId: number): Observable<Order> {
    return this.http.post<Order>(this.url, { addressId });
  }

  list(page: number, size = 10): Observable<Page<OrderSummary>> {
    return this.http.get<Page<OrderSummary>>(this.url, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  }

  get(id: number | string): Observable<Order> {
    return this.http.get<Order>(`${this.url}/${id}`);
  }

  cancel(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.url}/${id}/cancel`, null);
  }

  // Returns the provider's hosted payment page. Asking again reuses a page that is still open.
  startPayment(orderId: number, provider: PaymentProvider): Observable<PaymentSession> {
    return this.http.post<PaymentSession>(`${this.url}/${orderId}/payments`, { provider });
  }

  payments(orderId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.url}/${orderId}/payments`);
  }
}
