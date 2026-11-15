import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api/api';

export interface Address {
  id: number;
  street: string;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean };

// Street, "City, State Postal code", country: the same layout as the order emails.
export function addressLines(address: Omit<Address, 'id' | 'isDefault'>): string[] {
  const region = [address.city, address.state].filter(Boolean).join(', ');
  return [address.street, `${region} ${address.postalCode}`.trim(), address.country];
}

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/users/me/addresses`;

  list(): Observable<Address[]> {
    return this.http.get<Address[]>(this.url);
  }

  create(input: AddressInput): Observable<Address> {
    return this.http.post<Address>(this.url, input);
  }

  update(id: number, input: AddressInput): Observable<Address> {
    return this.http.put<Address>(`${this.url}/${id}`, input);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
