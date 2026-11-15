import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { addressLines } from './address.service';
import { AddressesPage } from './addresses-page';

describe('addressLines', () => {
  it('puts the optional state between city and postal code, like the emails', () => {
    const base = { street: '1 A St', city: 'Cairo', postalCode: '11511', country: 'Egypt' };
    expect(addressLines({ ...base, state: 'Cairo Governorate' })).toEqual([
      '1 A St',
      'Cairo, Cairo Governorate 11511',
      'Egypt',
    ]);
    expect(addressLines({ ...base, state: null })).toEqual(['1 A St', 'Cairo 11511', 'Egypt']);
  });
});

describe('AddressesPage', () => {
  let backend: HttpTestingController;
  const url = '/api/v1/users/me/addresses';
  const home = {
    id: 1,
    street: '1 A St',
    city: 'Cairo',
    state: null,
    postalCode: '1',
    country: 'Egypt',
    isDefault: true,
  };
  const work = { ...home, id: 2, street: '2 B St', isDefault: false };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  async function render(): Promise<ComponentFixture<AddressesPage>> {
    const fixture = TestBed.createComponent(AddressesPage);
    TestBed.tick();
    backend.expectOne(url).flush([home, work]);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  // Lets Angular publish a response and start the follow-up reload, without waiting on that reload.
  async function settle() {
    for (let i = 0; i < 3; i++) {
      await Promise.resolve();
      TestBed.tick();
    }
  }

  function button(fixture: ComponentFixture<AddressesPage>, label: string): HTMLButtonElement {
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === label || b.getAttribute('aria-label') === label,
    ) as HTMLButtonElement;
  }

  it('makes another address the default by saving it with isDefault', async () => {
    const fixture = await render();
    button(fixture, 'Set as default').click();

    const update = backend.expectOne(`${url}/2`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({
      street: '2 B St',
      city: 'Cairo',
      state: null,
      postalCode: '1',
      country: 'Egypt',
      isDefault: true,
    });
    update.flush({ ...work, isDefault: true });
    await settle();
    backend.expectOne(url).flush([
      { ...home, isDefault: false },
      { ...work, isDefault: true },
    ]);
  });

  it('asks before deleting, then reloads to show which address is now the default', async () => {
    const fixture = await render();
    button(fixture, 'Delete 1 A St').click();
    fixture.detectChanges();
    backend.expectNone(`${url}/1`);

    button(fixture, 'Delete').click();
    const remove = backend.expectOne(`${url}/1`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
    await settle();
    backend.expectOne(url).flush([{ ...work, isDefault: true }]);
  });
});
