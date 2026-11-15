import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService, REFRESH_TOKEN_KEY } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  const tokens = (n: number) => ({
    accessToken: `access-${n}`,
    refreshToken: `refresh-${n}`,
    tokenType: 'Bearer',
    expiresIn: 900,
  });
  const customer = {
    id: 2,
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'CUSTOMER',
  };

  it('keeps the access token in memory and the refresh token in storage after login', () => {
    auth.login({ email: 'jane@example.com', password: 'secret' }).subscribe();
    backend.expectOne('/api/v1/auth/login').flush(tokens(1));
    backend.expectOne('/api/v1/users/me').flush(customer);

    expect(auth.token()).toBe('access-1');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-1');
    expect(auth.user()?.email).toBe('jane@example.com');
    expect(auth.isAdmin()).toBe(false);
  });

  it('restores the session from a stored refresh token', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-1');

    const restored = auth.restoreSession();
    await vi.waitFor(() => backend.expectOne('/api/v1/auth/refresh').flush(tokens(2)));
    backend.expectOne('/api/v1/users/me').flush(customer);
    await restored;

    expect(auth.isLoggedIn()).toBe(true);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-2');
  });

  it('starts signed out when the stored refresh token is no longer valid', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'stale');

    const restored = auth.restoreSession();
    await vi.waitFor(() =>
      backend
        .expectOne('/api/v1/auth/refresh')
        .flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' }),
    );
    await restored;

    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('does nothing at startup without a stored session', async () => {
    await auth.restoreSession();

    expect(auth.isLoggedIn()).toBe(false);
  });

  it('logs out on the server and forgets the tokens', () => {
    auth.login({ email: 'jane@example.com', password: 'secret' }).subscribe();
    backend.expectOne('/api/v1/auth/login').flush(tokens(1));
    backend.expectOne('/api/v1/users/me').flush(customer);

    auth.logout();

    expect(backend.expectOne('/api/v1/auth/logout').request.body).toEqual({
      refreshToken: 'refresh-1',
    });
    expect(auth.token()).toBeNull();
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});
