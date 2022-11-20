export class TypedEventTarget<
  EventMap extends Record<string, Event>
> extends EventTarget {
  dispatchEvent<K extends keyof EventMap>(event: EventMap[K]): boolean {
    return super.dispatchEvent(event);
  }

  addEventListener<K extends keyof EventMap>(
    type: K,
    listener:
      | { handleEvent: (event: EventMap[K]) => void }
      | { (event: EventMap[K]): void }
      | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(
      type.toString(),
      listener as unknown as EventListener,
      options
    );
  }

  removeEventListener<K extends keyof EventMap>(
    type: K,
    listener:
      | { handleEvent: (event: EventMap[K]) => void }
      | { (event: EventMap[K]): void }
      | null,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(
      type.toString(),
      listener as unknown as EventListener,
      options
    );
  }
}
