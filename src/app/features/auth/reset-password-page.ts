import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api/api';
import { AuthService } from '../../core/auth/auth.service';
import { FieldErrorMessage, matchesControl } from '../../shared/forms';
import { Alert, AuthCard } from './auth-card';

// Opened from the email link: /reset-password?token=...
@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink, AuthCard, Alert, FieldErrorMessage],
  template: `
    @if (!token() || linkInvalid()) {
      <app-auth-card heading="This link doesn't work">
        <p class="text-sm text-muted">
          Reset links work once and expire after 30 minutes. Ask for a new one and use the latest
          email.
        </p>
        <a routerLink="/forgot-password" class="btn btn-primary mt-6 w-full">Send a new link</a>
      </app-auth-card>
    } @else {
      <app-auth-card
        heading="Choose a new password"
        subheading="You'll use it the next time you log in."
      >
        @if (error()) {
          <app-alert class="mb-4 block">{{ error() }}</app-alert>
        }
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
          <div>
            <label class="field-label" for="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              class="field-input"
              formControlName="newPassword"
              autocomplete="new-password"
              [attr.aria-invalid]="
                form.controls.newPassword.invalid && form.controls.newPassword.touched
              "
            />
            <app-field-error [control]="form.controls.newPassword" label="Password" />
          </div>
          <div>
            <label class="field-label" for="confirm">Repeat the new password</label>
            <input
              id="confirm"
              type="password"
              class="field-input"
              formControlName="confirm"
              autocomplete="new-password"
              [attr.aria-invalid]="form.controls.confirm.invalid && form.controls.confirm.touched"
            />
            <app-field-error [control]="form.controls.confirm" label="Password" />
          </div>
          <button type="submit" class="btn btn-primary w-full py-3" [disabled]="submitting()">
            {{ submitting() ? 'Saving…' : 'Save new password' }}
          </button>
        </form>
      </app-auth-card>
    }
  `,
})
export class ResetPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly token = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    confirm: ['', [Validators.required, matchesControl('newPassword')]],
  });
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly linkInvalid = signal(false);

  constructor() {
    // Re-check "passwords match" when the first field changes after the second was typed.
    this.form.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirm.updateValueAndValidity());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.auth.resetPassword(this.token()!, this.form.getRawValue().newPassword).subscribe({
      next: () => this.router.navigate(['/login'], { queryParams: { reset: true } }),
      error: (error) => {
        this.submitting.set(false);
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.linkInvalid.set(true);
        } else {
          this.error.set(apiErrorMessage(error));
        }
      },
    });
  }
}
