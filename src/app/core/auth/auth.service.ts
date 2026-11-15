import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  firstValueFrom,
  from,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { API_URL } from '../api/api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from './auth.models';

export const REFRESH_TOKEN_KEY = 'ecommerce.refreshToken';
const REFRESH_LOCK = 'ecommerce.refresh';

// The access token lives only in memory; the refresh token is kept in localStorage so a reload keeps the session.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly accessToken = signal<string | null>(null);
  private readonly currentUser = signal<User | null>(null);
  private refreshInFlight: Observable<string> | null = null;

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  token(): string | null {
    return this.accessToken();
  }

  hasRefreshToken(): boolean {
    return readRefreshToken() !== null;
  }

  login(request: LoginRequest): Observable<User> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, request)
      .pipe(switchMap((tokens) => this.startSession(tokens)));
  }

  register(request: RegisterRequest): Observable<User> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, request)
      .pipe(switchMap((tokens) => this.startSession(tokens)));
  }

  logout(): void {
    const refreshToken = readRefreshToken();
    if (refreshToken) {
      this.http.post(`${API_URL}/auth/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    this.clearSession();
    this.router.navigateByUrl('/');
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/reset-password`, { token, newPassword });
  }

  // Concurrent callers share one refresh call: refresh tokens are single-use, and the server signs out
  // every session when it sees one used twice.
  refresh(): Observable<string> {
    this.refreshInFlight ??= from(withLock(() => firstValueFrom(this.callRefresh()))).pipe(
      finalize(() => (this.refreshInFlight = null)),
      shareReplay(1),
    );
    return this.refreshInFlight;
  }

  // Runs at startup: turns a stored refresh token back into a signed-in user.
  restoreSession(): Promise<void> {
    if (!this.hasRefreshToken()) {
      return Promise.resolve();
    }
    return firstValueFrom(
      this.refresh().pipe(
        switchMap(() => this.loadUser()),
        map(() => undefined),
        catchError(() => {
          this.clearSession();
          return of(undefined);
        }),
      ),
    );
  }

  // Called when the session can't be renewed: back to the login page, then to where the user was.
  sessionExpired(): void {
    const returnUrl = this.router.url;
    this.clearSession();
    this.router.navigate(['/login'], { queryParams: { returnUrl, expired: true } });
  }

  private callRefresh(): Observable<string> {
    // Read inside the lock: another tab may have rotated the token while this one waited.
    const refreshToken = readRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }
    return this.http.post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken }).pipe(
      tap((tokens) => this.storeTokens(tokens)),
      map((tokens) => tokens.accessToken),
    );
  }

  private startSession(tokens: AuthResponse): Observable<User> {
    this.storeTokens(tokens);
    return this.loadUser();
  }

  private loadUser(): Observable<User> {
    return this.http
      .get<User>(`${API_URL}/users/me`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  private storeTokens(tokens: AuthResponse): void {
    this.accessToken.set(tokens.accessToken);
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } catch {
      // Storage blocked (private mode): the session still works until the page is reloaded.
    }
  }

  private clearSession(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Nothing stored.
    }
  }
}

function readRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

// Two tabs refreshing at the same moment would replay the same token; a Web Lock makes them take turns.
function withLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  return locks ? locks.request(REFRESH_LOCK, task) : task();
}
