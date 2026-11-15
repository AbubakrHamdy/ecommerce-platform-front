import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_URL } from '../api/api';
import { AuthService } from './auth.service';

// These endpoints take credentials in the body; a 401 from them means wrong credentials, not an expired session.
const AUTH_ENDPOINTS = [
  'login',
  'register',
  'refresh',
  'logout',
  'forgot-password',
  'reset-password',
].map((path) => `${API_URL}/auth/${path}`);

// Adds the access token to API calls. On 401 it renews the token once and retries; if renewal fails,
// the user is sent to the login page.
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(API_URL) || AUTH_ENDPOINTS.includes(request.url)) {
    return next(request);
  }
  const auth = inject(AuthService);

  return next(withToken(request, auth.token())).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !auth.hasRefreshToken()
      ) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        catchError(() => {
          auth.sessionExpired();
          return throwError(() => error);
        }),
        switchMap((token) => next(withToken(request, token))),
      );
    }),
  );
};

function withToken(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
}
