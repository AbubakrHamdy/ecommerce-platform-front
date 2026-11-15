import { PaymentProvider } from '../../core/store/store-settings.service';

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  priceAtPurchase: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  customerEmail: string;
  createdAt: string;
}

export interface OrderSummary {
  id: number;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  itemCount: number;
  customerEmail: string;
  createdAt: string;
}

export interface PaymentSession {
  paymentId: number;
  provider: PaymentProvider;
  checkoutUrl: string;
  expiresAt: string;
}

export interface Payment {
  id: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionId: string | null;
  amount: number;
  currency: string;
  createdAt: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Awaiting payment',
  PAID: 'Paid',
  PROCESSING: 'Preparing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

// Tailwind classes for the status badge.
export const STATUS_BADGES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  PAID: 'bg-brand-50 text-brand-800 ring-brand-200',
  PROCESSING: 'bg-sky-50 text-sky-800 ring-sky-200',
  SHIPPED: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-700 ring-slate-200',
};

// The happy path, in order, for the progress tracker on the order page.
export const ORDER_STEPS: readonly OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

// How far along the happy path an order is: 0 = placed, 4 = delivered, -1 = cancelled.
export function progressIndex(status: OrderStatus): number {
  return ORDER_STEPS.indexOf(status);
}

// Mirrors the API: only a pending order can be paid or cancelled by the customer.
export function isAwaitingPayment(order: Pick<Order, 'status'>): boolean {
  return order.status === 'PENDING';
}
