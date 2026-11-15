import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api/api';
import { Icon } from '../../shared/icon';
import { ToastService } from '../../shared/toast';
import { AddressForm } from './address-form';
import { Address, addressLines, AddressService } from './address.service';

// Same limit as the API's AddressService.
export const MAX_ADDRESSES = 10;

@Component({
  selector: 'app-addresses-page',
  imports: [RouterLink, Icon, AddressForm],
  template: `
    <div class="page max-w-4xl">
      <a routerLink="/account" class="btn-link inline-flex items-center gap-1.5 text-sm">
        <app-icon name="arrow-left" size="size-4" /> My account
      </a>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 class="page-title">Addresses</h1>
        @if (list() && !adding() && list()!.length < maxAddresses) {
          <button type="button" class="btn btn-primary" (click)="startAdding()">
            <app-icon name="plus" size="size-4" /> Add address
          </button>
        }
      </div>

      @if (addresses.error()) {
        <div class="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <app-icon name="alert" size="size-8" class="text-red-500" />
          <p>{{ errorMessage() }}</p>
          <button type="button" class="btn btn-secondary" (click)="addresses.reload()">
            Try again
          </button>
        </div>
      } @else if (list(); as items) {
        @if (adding()) {
          <section class="card mt-6 p-6" aria-labelledby="new-address-heading">
            <h2 id="new-address-heading" class="mb-4 font-semibold">New address</h2>
            <app-address-form
              submitLabel="Add address"
              (saved)="saved('Address added')"
              (cancelled)="adding.set(false)"
            />
          </section>
        }

        @if (items.length === 0 && !adding()) {
          <div class="card mt-6 flex flex-col items-center px-6 py-16 text-center">
            <span
              class="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-700"
            >
              <app-icon name="map-pin" size="size-8" />
            </span>
            <h2 class="mt-5 text-lg font-semibold">No saved addresses</h2>
            <p class="mt-1 text-muted">Add one now, or at checkout.</p>
            <button type="button" class="btn btn-primary mt-6" (click)="startAdding()">
              Add address
            </button>
          </div>
        } @else {
          <ul class="mt-6 grid gap-4 sm:grid-cols-2">
            @for (address of items; track address.id) {
              <li class="card flex flex-col gap-4 p-5" [class.border-brand-200]="address.isDefault">
                @if (editingId() === address.id) {
                  <h2 class="font-semibold">Edit address</h2>
                  <app-address-form
                    [address]="address"
                    (saved)="saved('Address updated')"
                    (cancelled)="editingId.set(null)"
                  />
                } @else {
                  <div class="flex items-start justify-between gap-3">
                    <address class="text-sm not-italic">
                      @for (line of addressLines(address); track $index) {
                        <span class="block" [class.font-medium]="$first">{{ line }}</span>
                      }
                    </address>
                    @if (address.isDefault) {
                      <span
                        class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-200"
                        >Default</span
                      >
                    }
                  </div>

                  @if (deletingId() === address.id) {
                    <div class="border-t border-line pt-4">
                      <p class="text-sm font-medium">Delete this address?</p>
                      <p class="text-xs text-muted">Past orders keep their own copy.</p>
                      <div class="mt-3 flex gap-2">
                        <button
                          type="button"
                          class="btn btn-danger py-1.5"
                          [disabled]="busyId() === address.id"
                          (click)="remove(address)"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          class="btn btn-secondary py-1.5"
                          (click)="deletingId.set(null)"
                        >
                          Keep
                        </button>
                      </div>
                    </div>
                  } @else {
                    <div
                      class="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-4 text-sm"
                    >
                      <button type="button" class="btn-link" (click)="startEditing(address)">
                        Edit
                      </button>
                      @if (!address.isDefault) {
                        <button
                          type="button"
                          class="btn-link"
                          [disabled]="busyId() === address.id"
                          (click)="makeDefault(address)"
                        >
                          Set as default
                        </button>
                      }
                      <button
                        type="button"
                        class="ml-auto font-medium text-muted hover:text-red-700"
                        (click)="deletingId.set(address.id)"
                        [attr.aria-label]="'Delete ' + address.street"
                      >
                        Delete
                      </button>
                    </div>
                  }
                }
              </li>
            }
          </ul>
          @if (items.length >= maxAddresses) {
            <p class="mt-4 text-sm text-muted">
              You've saved the maximum of {{ maxAddresses }} addresses. Delete one to add another.
            </p>
          }
        }
      } @else {
        <div class="mt-6 grid animate-pulse gap-4 sm:grid-cols-2">
          <div class="card h-40 bg-slate-100"></div>
          <div class="card h-40 bg-slate-100"></div>
        </div>
      }
    </div>
  `,
})
export class AddressesPage {
  private readonly addressService = inject(AddressService);
  private readonly toasts = inject(ToastService);

  protected readonly addresses = rxResource({ stream: () => this.addressService.list() });
  // value() throws while the resource is in an error state, so the page reads this instead.
  protected readonly list = computed(() =>
    this.addresses.hasValue() ? this.addresses.value() : undefined,
  );
  protected readonly errorMessage = computed(() => apiErrorMessage(this.addresses.error()));

  protected readonly adding = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly busyId = signal<number | null>(null);
  protected readonly maxAddresses = MAX_ADDRESSES;
  protected readonly addressLines = addressLines;

  protected startAdding(): void {
    this.editingId.set(null);
    this.adding.set(true);
  }

  protected startEditing(address: Address): void {
    this.adding.set(false);
    this.deletingId.set(null);
    this.editingId.set(address.id);
  }

  protected saved(message: string): void {
    this.adding.set(false);
    this.editingId.set(null);
    this.toasts.success(message);
    this.addresses.reload();
  }

  protected makeDefault(address: Address): void {
    const { id, isDefault, ...fields } = address;
    this.busyId.set(id);
    this.addressService.update(id, { ...fields, isDefault: true }).subscribe({
      next: () => this.done('Default address updated'),
      error: (error) => this.failed(error),
    });
  }

  protected remove(address: Address): void {
    this.busyId.set(address.id);
    this.addressService.remove(address.id).subscribe({
      next: () => this.done('Address deleted'),
      error: (error) => this.failed(error),
    });
  }

  private done(message: string): void {
    this.busyId.set(null);
    this.deletingId.set(null);
    this.toasts.success(message);
    // The server may have moved the default (deleting the default promotes another address).
    this.addresses.reload();
  }

  private failed(error: unknown): void {
    this.busyId.set(null);
    this.deletingId.set(null);
    this.toasts.error(apiErrorMessage(error));
    this.addresses.reload();
  }
}
