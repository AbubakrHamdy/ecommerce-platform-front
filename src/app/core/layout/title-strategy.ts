import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { STORE_NAME } from '../store/store-settings.service';

// "Cart · E-Commerce Platform" in the browser tab; pages without a title show the store name alone.
@Injectable({ providedIn: 'root' })
export class StoreTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} · ${STORE_NAME}` : STORE_NAME);
  }
}
