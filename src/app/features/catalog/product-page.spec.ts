import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductPage } from './product-page';

describe('ProductPage', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('shows "Product not found" for an unknown product instead of failing', async () => {
    const fixture = TestBed.createComponent(ProductPage);
    fixture.componentRef.setInput('id', '99999');
    TestBed.tick();
    backend
      .expectOne('/api/v1/products/99999')
      .flush(
        { status: 404, message: 'Product not found' },
        { status: 404, statusText: 'Not Found' },
      );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Product not found');
  });
});
