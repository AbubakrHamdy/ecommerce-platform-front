import { Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api/api';
import { AuthService } from '../../core/auth/auth.service';
import { safeReturnUrl } from '../../core/auth/return-url';
import { FieldErrorMessage } from '../../shared/forms';
import { Alert, AuthCard } from './auth-card';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, AuthCard, Alert, FieldErrorMessage],
  template: `
    <app-auth-card heading="Welcome back" subheading="Log in to see your cart and orders.">
      @if (expired()) {
        <app-alert kind="info" class="mb-4 block"
          >Your session has ended. Please log in again.</app-alert
        >
      }
      @if (reset()) {
        <app-alert kind="success" class="mb-4 block"
          >Your password was changed. Log in with the new one.</app-alert
        >
      }
      @if (error()) {
        <app-alert class="mb-4 block">{{ error() }}</app-alert>
      }
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
        <div>
          <label class="field-label" for="email">Email</label>
          <input
            id="email"
            type="email"
            class="field-input"
            formControlName="email"
            autocomplete="email"
            [attr.aria-invalid]="form.controls.email.invalid && form.controls.email.touched"
          />
          <app-field-error [control]="form.controls.email" label="Email" />
        </div>
        <div>
          <div class="flex items-center justify-between">
            <label class="field-label" for="password">Password</label>
            <a routerLink="/forgot-password" class="mb-1.5 text-sm btn-link">Forgot password?</a>
          </div>
          <input
            id="password"
            type="password"
            class="field-input"
            formControlName="password"
            autocomplete="current-password"
            [attr.aria-invalid]="form.controls.password.invalid && form.controls.password.touched"
          />
          <app-field-error [control]="form.controls.password" label="Password" />
        </div>
        <button type="submit" class="btn btn-primary w-full py-3" [disabled]="submitting()">
          {{ submitting() ? 'Logging in…' : 'Log in' }}
        </button>
      </form>
      <p footer class="mt-6 text-center text-sm text-muted">
        New here?
        <a
          routerLink="/register"
          [queryParams]="{ returnUrl: returnUrl() ?? null }"
          class="btn-link"
          >Create an account</a
        >
      </p>
    </app-auth-card>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly returnUrl = input<string>();
  readonly expired = input<string>();
  readonly reset = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly destination = computed(() => safeReturnUrl(this.returnUrl()));

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.destination()),
      error: (error) => {
        this.submitting.set(false);
        this.error.set(apiErrorMessage(error));
      },
    });
  }
}
