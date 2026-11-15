import { formatMoney } from './money.pipe';
import { apiErrorMessage } from '../core/api/api';
import { HttpErrorResponse } from '@angular/common/http';

describe('formatMoney', () => {
  it('uses the currency code and its own decimals', () => {
    expect(formatMoney(1249.5, 'EGP')).toBe('EGP 1,249.50');
    expect(formatMoney('19.99', 'USD')).toBe('USD 19.99');
    expect(formatMoney(500, 'JPY')).toBe('JPY 500');
    expect(formatMoney(1.5, 'KWD')).toBe('KWD 1.500');
  });
});

describe('apiErrorMessage', () => {
  it('shows the message the API sent', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { status: 409, message: 'Only pending orders can be cancelled' },
    });
    expect(apiErrorMessage(error)).toBe('Only pending orders can be cancelled');
  });

  it('explains a network failure', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain(
      "Can't reach the server",
    );
  });

  it('falls back to a generic message', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 502, error: '<html>' }))).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
