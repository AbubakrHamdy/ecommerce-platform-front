import { Component, computed, input } from '@angular/core';
import { OrderStatus, STATUS_BADGES, STATUS_LABELS } from './order.models';

@Component({
  selector: 'app-order-status-badge',
  template: `<span
    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1"
    [class]="classes()"
    >{{ label() }}</span
  >`,
})
export class OrderStatusBadge {
  readonly status = input.required<OrderStatus>();
  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
  protected readonly classes = computed(() => STATUS_BADGES[this.status()]);
}
