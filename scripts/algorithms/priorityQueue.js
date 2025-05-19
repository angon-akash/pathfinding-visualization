export default class PriorityQueue {
  constructor() { this.heap = []; }

  isEmpty() { return this.heap.length === 0; }

  push(item, priority) {
    const node = { item, priority };
    this.heap.push(node);
    this.#bubbleUp(this.heap.length - 1);
  }

  pop() {                      // returns the item with min priority
    if (this.isEmpty()) return undefined;
    const min = this.heap[0].item;
    const end = this.heap.pop();
    if (this.heap.length) {
      this.heap[0] = end;
      this.#bubbleDown(0);
    }
    return min;
  }

  /* ---------- private helpers ---------- */
  #bubbleUp(i) {
    const h = this.heap;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (h[i].priority >= h[p].priority) break;
      [h[i], h[p]] = [h[p], h[i]];
      i = p;
    }
  }
  #bubbleDown(i) {
    const h = this.heap, n = h.length;
    while (true) {
      const l = (i << 1) + 1, r = l + 1;
      let smallest = i;
      if (l < n && h[l].priority < h[smallest].priority) smallest = l;
      if (r < n && h[r].priority < h[smallest].priority) smallest = r;
      if (smallest === i) break;
      [h[i], h[smallest]] = [h[smallest], h[i]];
      i = smallest;
    }
  }
}