import { Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from '../../core/api/api';
import { applyServerErrors, FieldErrorMessage } from '../../shared/forms';
import { Address, AddressInput, AddressService } from './address.service';

// Adds a new address, or edits one when [address] is given. Used by checkout and the address book.
@Component({
  selector: 'app-address-form',
  imports: [ReactiveFormsModule, FieldErrorMessage],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
      @if (error()) {
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {{ error() }}
        </p>
      }
      <div>
        <label class="field-label" [for]="id('street')">Street address</label>
        <input
          [id]="id('street')"
          class="field-input"
          formControlName="street"
          autocomplete="street-address"
          placeholder="12 Tahrir St, Apt 4"
          [attr.aria-invalid]="form.controls.street.invalid && form.controls.street.touched"
        />
        <app-field-error [control]="form.controls.street" label="Street address" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field-label" [for]="id('city')">City</label>
          <input
            [id]="id('city')"
            class="field-input"
            formControlName="city"
            autocomplete="address-level2"
            [attr.aria-invalid]="form.controls.city.invalid && form.controls.city.touched"
          />
          <app-field-error [control]="form.controls.city" label="City" />
        </div>
        <div>
          <label class="field-label" [for]="id('state')"
            >State / governorate <span class="font-normal text-muted">(optional)</span></label
          >
          <input
            [id]="id('state')"
            class="field-input"
            formControlName="state"
            autocomplete="address-level1"
            [attr.aria-invalid]="form.controls.state.invalid && form.controls.state.touched"
          />
          <app-field-error [control]="form.controls.state" label="State" />
        </div>
        <div>
          <label class="field-label" [for]="id('postalCode')">Postal code</label>
          <input
            [id]="id('postalCode')"
            class="field-input"
            formControlName="postalCode"
            autocomplete="postal-code"
            [attr.aria-invalid]="
              form.controls.postalCode.invalid && form.controls.postalCode.touched
            "
          />
          <app-field-error [control]="form.controls.postalCode" label="Postal code" />
        </div>
        <div>
          <label class="field-label" [for]="id('country')">Country</label>
          <input
            [id]="id('country')"
            class="field-input"
            formControlName="country"
            autocomplete="country-name"
            [attr.aria-invalid]="form.controls.country.invalid && form.controls.country.touched"
          />
          <app-field-error [control]="form.controls.country" label="Country" />
        </div>
      </div>
      @if (!address()?.isDefault) {
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" formControlName="isDefault" class="size-4 accent-brand-700" />
          Use as my default address
        </label>
      }
      <div class="flex flex-wrap gap-3 pt-1">
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Saving…' : submitLabel() }}
        </button>
        @if (cancellable()) {
          <button type="button" class="btn btn-secondary" (click)="cancelled.emit()">Cancel</button>
        }
      </div>
    </form>
  `,
})
export class AddressForm {
  private readonly addresses = inject(AddressService);
  private static nextId = 0;
  private readonly uid = `address-${++AddressForm.nextId}`;

  readonly address = input<Address | null>(null);
  readonly submitLabel = input('Save address');
  readonly cancellable = input(true);
  readonly saved = output<Address>();
  readonly cancelled = output<void>();

  // Same limits as the API's AddressRequest.
  protected readonly form = inject(NonNullableFormBuilder).group({
    street: ['', [Validators.required, Validators.maxLength(150)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    state: ['', [Validators.maxLength(100)]],
    postalCode: ['', [Validators.required, Validators.maxLength(20)]],
    country: ['', [Validators.required, Validators.maxLength(100)]],
    isDefault: [false],
  });
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const address = this.address();
      if (address) {
        this.form.setValue({
          street: address.street,
          city: address.city,
          state: address.state ?? '',
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
        });
      }
    });
  }

  protected id(field: string): string {
    return `${this.uid}-${field}`;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const body: AddressInput = {
      street: value.street.trim(),
      city: value.city.trim(),
      state: value.state.trim() || null,
      postalCode: value.postalCode.trim(),
      country: value.country.trim(),
      isDefault: value.isDefault,
    };
    const existing = this.address();
    const request = existing
      ? this.addresses.update(existing.id, body)
      : this.addresses.create(body);

    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: (address) => {
        this.saving.set(false);
        this.saved.emit(address);
      },
      error: (error) => {
        this.saving.set(false);
        if (!applyServerErrors(this.form, error)) {
          this.error.set(apiErrorMessage(error));
        }
      },
    });
  }
}
