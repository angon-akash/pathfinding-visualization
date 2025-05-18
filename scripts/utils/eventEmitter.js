export class EventEmitter {
  constructor() {
    this._listeners = {};
  }
  on(event, fn) {
    (this._listeners[event] = this._listeners[event] || []).push(fn);
  }
  emit(event, payload) {
    (this._listeners[event] || []).forEach(fn => fn(payload));
  }
}
