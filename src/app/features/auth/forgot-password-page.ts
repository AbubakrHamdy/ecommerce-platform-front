import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api/api';
import { AuthService } from '../../core/auth/auth.service';
import { FieldErrorMessage } from '../../shared/forms';
import { Icon } from '../../shared/icon';
import { Alert, AuthCard } from './auth-card';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, AuthCard, Alert, FieldErrorMessage, Icon],
  template: `
    @if (sentTo(); as email) {
      <app-auth-card heading="Check your email">
        <div class="flex flex-col items-center text-center">
          <span
            class="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700"
          >
            <app-icon name="mail" size="size-7" />
          </span>
          <!-- Same answer whether or not the account exists, like the API, so emails can't be probed. -->
          <p class="mt-4 text-sm text-muted">
            If an account exists for <span class="font-medium text-ink">{{ email }}</span>, we sent
            a link to reset the password. It works once and expires in 30 minutes.
          </p>
          <a routerLink="/login" class="btn btn-secondary mt-6 w-full">Back to log in</a>
        </div>
      </app-auth-card>
    } @else {
      <app-auth-card
        heading="Forgot your password?"
        subheading="Enter your email and we'll send you a reset link."
      >
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
          <button type="submit" class="btn btn-primary w-full py-3" [disabled]="submitting()">
            {{ submitting() ? 'Sending…' : 'Send reset link' }}
          </button>
        </form>
        <p footer class="mt-6 text-center text-sm text-muted">
          Remembered it? <a routerLink="/login" class="btn-link">Log in</a>
        </p>
      </app-auth-card>
    }
  `,
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sentTo = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.auth.forgotPassword(email).subscribe({
      next: () => this.sentTo.set(email),
      error: (error) => {
        this.submitting.set(false);
        this.error.set(apiErrorMessage(error));
      },
    });
  }
}
