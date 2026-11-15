import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <div class="page flex flex-col items-center py-24 text-center">
      <p class="text-sm font-semibold text-brand-700">404</p>
      <h1 class="page-title mt-2">Page not found</h1>
      <p class="mt-3 text-muted">The page you're looking for doesn't exist or was moved.</p>
      <div class="mt-8 flex gap-3">
        <a routerLink="/" class="btn btn-primary">Go home</a>
        <a routerLink="/products" class="btn btn-secondary">Browse products</a>
      </div>
    </div>
  `,
})
export class NotFoundPage {}
