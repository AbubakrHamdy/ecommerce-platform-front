import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService, REFRESH_TOKEN_KEY } from './auth.service';

// The refresh resolves through a promise (it may wait for a Web Lock), so the retry happens a tick later.
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => backend.verify());

  function signIn(accessToken = 'access-1', refreshToken = 'refresh-1') {
    auth.login({ email: 'a@b.c', password: 'secret' }).subscribe();
    backend
      .expectOne('/api/v1/auth/login')
      .flush({ accessToken, refreshToken, tokenType: 'Bearer', expiresIn: 900 });
    backend.expectOne('/api/v1/users/me').flush({ id: 1, email: 'a@b.c', role: 'CUSTOMER' });
  }

  it('adds the access token to API calls', () => {
    signIn();

    http.get('/api/v1/cart').subscribe();

    expect(backend.expectOne('/api/v1/cart').request.headers.get('Authorization')).toBe(
      'Bearer access-1',
    );
  });

  it('leaves other hosts and the auth endpoints alone', () => {
    signIn();

    http.get('https://picsum.photos/1').subscribe();
    http.post('/api/v1/auth/refresh', {}).subscribe();

    expect(backend.expectOne('https://picsum.photos/1').request.headers.has('Authorization')).toBe(
      false,
    );
    expect(backend.expectOne('/api/v1/auth/refresh').request.headers.has('Authorization')).toBe(
      false,
    );
  });

  it('renews an expired token once and retries the request', async () => {
    signIn();
    let body: unknown;

    http.get('/api/v1/cart').subscribe((response) => (body = response));
    backend.expectOne('/api/v1/cart').flush(null, { status: 401, statusText: 'Unauthorized' });
    const refresh = backend.expectOne('/api/v1/auth/refresh');
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
    refresh.flush({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      tokenType: 'Bearer',
      expiresIn: 900,
    });

    await settle();
    const retry = backend.expectOne('/api/v1/cart');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer access-2');
    retry.flush({ items: [] });
    expect(body).toEqual({ items: [] });
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-2');
  });

  it('shares one refresh between requests that fail at the same time', async () => {
    signIn();

    http.get('/api/v1/cart').subscribe();
    http.get('/api/v1/orders').subscribe();
    backend.expectOne('/api/v1/cart').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/v1/orders').flush(null, { status: 401, statusText: 'Unauthorized' });

    backend
      .expectOne('/api/v1/auth/refresh')
      .flush({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
        tokenType: 'Bearer',
        expiresIn: 900,
      });
    await settle();
    backend.expectOne('/api/v1/cart').flush({});
    backend.expectOne('/api/v1/orders').flush({});
  });

  it('signs out and goes to the login page when the session cannot be renewed', async () => {
    signIn();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    let status = 0;

    http.get('/api/v1/cart').subscribe({ error: (error) => (status = error.status) });
    backend.expectOne('/api/v1/cart').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne('/api/v1/auth/refresh')
      .flush(
        { message: 'Refresh token was already used' },
        { status: 401, statusText: 'Unauthorized' },
      );

    await settle();
    expect(status).toBe(401);
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(
      ['/login'],
      expect.objectContaining({ queryParams: expect.objectContaining({ expired: true }) }),
    );
  });

  it('passes other errors through untouched', () => {
    signIn();
    let status = 0;

    http.get('/api/v1/orders/9').subscribe({ error: (error) => (status = error.status) });
    backend
      .expectOne('/api/v1/orders/9')
      .flush({ message: 'Order not found' }, { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });
});
