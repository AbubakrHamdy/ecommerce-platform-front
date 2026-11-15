import { Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { apiError } from '../core/api/api';

// Puts the API's per-field validation messages (400 fieldErrors) on the matching controls.
// Returns true when at least one field got a message, so the caller can skip a generic banner.
export function applyServerErrors(form: FormGroup, error: unknown): boolean {
  const fieldErrors = apiError(error)?.fieldErrors ?? [];
  let applied = false;
  for (const { field, message } of fieldErrors) {
    const control = form.get(field);
    if (control) {
      control.setErrors({ ...control.errors, server: message });
      control.markAsTouched();
      applied = true;
    }
  }
  return applied;
}

export const matchesControl =
  (otherControl: string): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const other = control.parent?.get(otherControl);
    return other && control.value !== other.value ? { mismatch: true } : null;
  };

export function describe(errors: ValidationErrors, label: string): string {
  if (errors['server']) return errors['server'];
  if (errors['required']) return `${label} is required`;
  if (errors['email']) return 'Enter a valid email address';
  if (errors['minlength'])
    return `${label} must be at least ${errors['minlength'].requiredLength} characters`;
  if (errors['maxlength'])
    return `${label} must be at most ${errors['maxlength'].requiredLength} characters`;
  if (errors['mismatch']) return 'Passwords do not match';
  return `${label} is not valid`;
}

// Shows the first problem of a control once the user has touched it or tried to submit.
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <p class="field-error" [id]="id()">{{ text }}</p>
    }
  `,
})
export class FieldErrorMessage {
  readonly control = input.required<AbstractControl>();
  readonly label = input('This field');
  readonly id = input<string>();

  // Reactive forms aren't signals: re-read the control whenever it reports a change.
  private readonly version = signal(0);

  protected readonly message = computed(() => {
    this.version();
    const control = this.control();
    if (!control.errors || !control.touched) {
      return null;
    }
    return describe(control.errors, this.label());
  });

  constructor() {
    effect((onCleanup) => {
      const subscription = this.control().events.subscribe(() => this.version.update((v) => v + 1));
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
