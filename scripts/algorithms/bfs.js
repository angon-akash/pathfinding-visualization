// scripts/algorithms/bfs.js
import { neighbors, key, paint, reconstructPath, resetGridState, SimpleQueue } from './utils.js';

export class BFSAlgorithm {
  constructor(grid, startPos, endPos, cellSize, gridWidth, gridHeight) {
    Object.assign(this, { grid, startPos, endPos, cellSize, gridWidth, gridHeight });
    this.EMPTY = 0; this.WALL = 1; this.START = 2; this.END = 3;
    this.VISITED = 4; this.FRONTIER = 5; this.PATH = 6;
  }

  init() {
    resetGridState(this.grid, this.gridWidth, this.gridHeight,
                   [this.VISITED, this.FRONTIER, this.PATH], this.EMPTY);

    this.queue = new SimpleQueue();
    this.queue.enqueue(this.startPos);
    this.came = {};
    this.vis = new Set([key(this.startPos)]);
  }

  step() {
    if (this.queue.isEmpty()) return { status: 'no-path' };
    const current = this.queue.dequeue();

    if (current.x === this.endPos.x && current.y === this.endPos.y) {
      reconstructPath(this.came, current, this.grid, this.START, this.PATH);
      return { status: 'found' };
    }

    paint(this.grid, current, this.VISITED, this.START, this.END);
    let nodesVisited = 1;

    for (const n of neighbors(current, this)) {
      const nk = key(n);
      if (this.vis.has(nk)) continue;
      this.vis.add(nk);
      this.came[nk] = current;
      this.queue.enqueue(n);
      paint(this.grid, n, this.FRONTIER, this.START, this.END);
    }
    return { status: 'running', nodesVisited };
  }
}