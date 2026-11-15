import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('follows paths on this site', () => {
    expect(safeReturnUrl('/orders/7?payment=success')).toBe('/orders/7?payment=success');
  });

  it('ignores other sites and missing values', () => {
    expect(safeReturnUrl('https://evil.example')).toBe('/');
    expect(safeReturnUrl('//evil.example')).toBe('/');
    expect(safeReturnUrl('/\evil.example')).toBe('/');
    expect(safeReturnUrl(undefined)).toBe('/');
  });
});
