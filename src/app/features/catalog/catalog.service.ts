import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { API_URL, Page } from '../../core/api/api';
import { Category, Product, ProductQuery, ProductSummary } from './catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  // Categories rarely change: fetched once per visit and shared by every page.
  readonly categories$: Observable<Category[]> = this.http
    .get<Category[]>(`${API_URL}/categories`)
    .pipe(shareReplay(1));

  products(query: ProductQuery): Observable<Page<ProductSummary>> {
    return this.http.get<Page<ProductSummary>>(`${API_URL}/products`, {
      params: toParams(query),
    });
  }

  product(id: number | string): Observable<Product> {
    return this.http.get<Product>(`${API_URL}/products/${id}`);
  }
}

export function toParams(query: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
