import { CartItem } from './cart.service';

export type CartIssue =
  | { kind: 'unavailable'; message: string }
  | { kind: 'out-of-stock'; message: string }
  | { kind: 'too-many'; message: string; fixQuantity: number };

// The cart keeps lines the shop may no longer be able to sell: a product archived or sold out
// since it was added. Checkout would fail on them, so the cart page points them out first.
export function cartIssue(item: CartItem): CartIssue | null {
  const { product, quantity } = item;
  if (!product.active) {
    return { kind: 'unavailable', message: 'No longer available. Remove it to check out.' };
  }
  if (product.stock === 0) {
    return { kind: 'out-of-stock', message: 'Out of stock. Remove it to check out.' };
  }
  if (quantity > product.stock) {
    return {
      kind: 'too-many',
      message: `Only ${product.stock} left.`,
      fixQuantity: product.stock,
    };
  }
  return null;
}
