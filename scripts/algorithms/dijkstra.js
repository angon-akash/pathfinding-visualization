// scripts/algorithms/dijkstra.js
import { neighbors, key, paint, reconstructPath, resetGridState } from './utils.js';
import PriorityQueue from './priorityQueue.js';

export class DijkstraAlgorithm {
  constructor(grid, startPos, endPos, cellSize, gridWidth, gridHeight) {
    Object.assign(this, { grid, startPos, endPos, cellSize, gridWidth, gridHeight });
    this.EMPTY = 0; this.WALL = 1; this.START = 2; this.END = 3;
    this.VISITED = 4; this.FRONTIER = 5; this.PATH = 6;
  }

  init() {
    resetGridState(this.grid, this.gridWidth, this.gridHeight,
                   [this.VISITED, this.FRONTIER, this.PATH], this.EMPTY);

    this.queue  = new PriorityQueue();
    this.closed = new Set();
    this.came   = {};
    this.dist   = { [key(this.startPos)]: 0 };
    this.queue.push(this.startPos, 0);
  }

  step() {
    // find next unexplored node
    let current;
    do {
      if (this.queue.isEmpty()) return { status:'no-path' };
      current = this.queue.pop();
    } while (this.closed.has(key(current)));

    if (current.x === this.endPos.x && current.y === this.endPos.y) {
      reconstructPath(this.came, current, this.grid, this.START, this.PATH);
      return { status: 'found' };
    }

    this.closed.add(key(current));
    paint(this.grid, current, this.VISITED, this.START, this.END);
    let nodesVisited = 1;

    for (const n of neighbors(current, this)) {
      const nk = key(n);
      if (this.closed.has(nk)) continue;

      const alt = (this.dist[key(current)] ?? Infinity) + 1;
      if (alt < (this.dist[nk] ?? Infinity)) {
        this.came[nk] = current;
        this.dist[nk] = alt;
        // always push – duplicates fine
        this.queue.push(n, alt);
        paint(this.grid, n, this.FRONTIER, this.START, this.END);
      }
    }
    return { status: 'running', nodesVisited };
  }
}