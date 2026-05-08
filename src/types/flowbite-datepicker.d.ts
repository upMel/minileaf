declare module "flowbite-datepicker" {
  export class Datepicker {
    constructor(element: Element, options?: unknown);
    destroy?(): void;
  }

  export class DateRangePicker {
    constructor(element: Element, options?: unknown);
    setDates?(rangeStart: unknown, rangeEnd: unknown): void;
    destroy?(): void;
  }
}

declare module "flowbite-datepicker/DateRangePicker" {
  export default class DateRangePicker {
    constructor(element: Element, options?: unknown);
    setDates?(rangeStart: unknown, rangeEnd: unknown): void;
    destroy?(): void;
  }
}
