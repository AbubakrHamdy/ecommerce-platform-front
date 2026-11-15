import { CartItem } from './cart.service';
import { cartIssue } from './cart-issues';

describe('cartIssue', () => {
  const item = (quantity: number, stock: number, active = true): CartItem => ({
    id: 1,
    quantity,
    subtotal: quantity * 10,
    product: {
      id: 7,
      name: 'Mouse',
      price: 10,
      stock,
      active,
      thumbnailUrl: null,
      categoryName: 'Accessories',
    },
  });

  it('accepts a line the shop can still sell', () => {
    expect(cartIssue(item(2, 5))).toBeNull();
    expect(cartIssue(item(5, 5))).toBeNull();
  });

  it('flags archived products first, whatever the stock', () => {
    expect(cartIssue(item(1, 10, false))?.kind).toBe('unavailable');
  });

  it('flags sold-out products', () => {
    expect(cartIssue(item(1, 0))?.kind).toBe('out-of-stock');
  });

  it('offers to lower the quantity to what is left', () => {
    const issue = cartIssue(item(4, 3));
    expect(issue).toEqual({ kind: 'too-many', message: 'Only 3 left.', fixQuantity: 3 });
  });
});
