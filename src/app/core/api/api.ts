import { HttpErrorResponse } from '@angular/common/http';

export const API_URL = '/api/v1';

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface FieldError {
  field: string;
  message: string;
}

// The body of every error the API returns.
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: FieldError[] | null;
}

export function apiError(error: unknown): ApiError | null {
  if (
    error instanceof HttpErrorResponse &&
    error.error &&
    typeof error.error.message === 'string'
  ) {
    return error.error as ApiError;
  }
  return null;
}

export function apiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return apiError(error)?.message ?? fallback;
}
