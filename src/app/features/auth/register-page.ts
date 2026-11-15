import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api/api';
import { AuthService } from '../../core/auth/auth.service';
import { safeReturnUrl } from '../../core/auth/return-url';
import { applyServerErrors, FieldErrorMessage } from '../../shared/forms';
import { ToastService } from '../../shared/toast';
import { Alert, AuthCard } from './auth-card';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, AuthCard, Alert, FieldErrorMessage],
  template: `
    <app-auth-card heading="Create your account" subheading="It takes less than a minute.">
      @if (error()) {
        <app-alert class="mb-4 block">{{ error() }}</app-alert>
      }
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="field-label" for="firstName">First name</label>
            <input
              id="firstName"
              class="field-input"
              formControlName="firstName"
              autocomplete="given-name"
              [attr.aria-invalid]="
                form.controls.firstName.invalid && form.controls.firstName.touched
              "
            />
            <app-field-error [control]="form.controls.firstName" label="First name" />
          </div>
          <div>
            <label class="field-label" for="lastName">Last name</label>
            <input
              id="lastName"
              class="field-input"
              formControlName="lastName"
              autocomplete="family-name"
              [attr.aria-invalid]="form.controls.lastName.invalid && form.controls.lastName.touched"
            />
            <app-field-error [control]="form.controls.lastName" label="Last name" />
          </div>
        </div>
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
          <label class="field-label" for="password">Password</label>
          <input
            id="password"
            type="password"
            class="field-input"
            formControlName="password"
            autocomplete="new-password"
            aria-describedby="password-hint"
            [attr.aria-invalid]="form.controls.password.invalid && form.controls.password.touched"
          />
          <app-field-error [control]="form.controls.password" label="Password" />
          @if (!(form.controls.password.invalid && form.controls.password.touched)) {
            <p id="password-hint" class="mt-1.5 text-xs text-muted">At least 8 characters.</p>
          }
        </div>
        <button type="submit" class="btn btn-primary w-full py-3" [disabled]="submitting()">
          {{ submitting() ? 'Creating account…' : 'Create account' }}
        </button>
      </form>
      <p footer class="mt-6 text-center text-sm text-muted">
        Already have an account?
        <a routerLink="/login" [queryParams]="{ returnUrl: returnUrl() ?? null }" class="btn-link"
          >Log in</a
        >
      </p>
    </app-auth-card>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  readonly returnUrl = input<string>();

  // Same limits as the API's RegisterRequest.
  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
  });
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.toasts.success(`Welcome, ${user.firstName}! Your account is ready.`);
        this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
      },
      error: (error) => {
        this.submitting.set(false);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.form.controls.email.setErrors({ server: apiErrorMessage(error) });
          this.form.controls.email.markAsTouched();
        } else if (!applyServerErrors(this.form, error)) {
          this.error.set(apiErrorMessage(error));
        }
      },
    });
  }
}
