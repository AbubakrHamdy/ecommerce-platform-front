import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

// Leaves the app for another site (the payment provider's page). A token so tests can replace it.
export const REDIRECT = new InjectionToken<(url: string) => void>('REDIRECT', {
  providedIn: 'root',
  factory: () => {
    const document = inject(DOCUMENT);
    return (url: string) => document.location.assign(url);
  },
});
