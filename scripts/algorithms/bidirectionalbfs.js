import { neighbors, key, paint, resetGridState, SimpleQueue, reconstructPath } from './utils.js';

export class BidirectionalBFSAlgorithm {
  constructor(grid, startPos, endPos, cellSize, gridWidth, gridHeight) {
    Object.assign(this, { grid, startPos, endPos, cellSize, gridWidth, gridHeight });
    this.EMPTY = 0; this.WALL = 1; this.START = 2; this.END = 3;
    this.VISITED = 4; this.FRONTIER = 5; this.PATH = 6;
  }

  init() {
    resetGridState(this.grid, this.gridWidth, this.gridHeight,
                   [this.VISITED, this.FRONTIER, this.PATH], this.EMPTY);

    this.queueA = new SimpleQueue();
    this.queueB = new SimpleQueue();
    this.queueA.enqueue(this.startPos);
    this.queueB.enqueue(this.endPos);
    this.cameA = {};
    this.cameB = {};
    this.visA = new Set([key(this.startPos)]);
    this.visB = new Set([key(this.endPos)]);
  }

  step() {
    if (this.queueA.isEmpty() || this.queueB.isEmpty()) return { status: 'no-path' };

    const expand = (queue, came, vis, otherVis, isStart) => {
      const current = queue.dequeue();

      paint(this.grid, current, this.VISITED, this.START, this.END);
      let nodesVisited = 1;

      for (const n of neighbors(current, this)) {
        const nk = key(n);
        if (otherVis.has(nk)) {
          reconstructPath(came, current, this.grid, this.START, this.PATH);
          reconstructPath(isStart ? this.cameB : this.cameA, n, this.grid, this.END, this.PATH);
          if (this.grid[current.y][current.x] !== this.START) this.grid[current.y][current.x] = this.PATH;
          if (this.grid[n.y][n.x] !== this.END) this.grid[n.y][n.x] = this.PATH;
          return { status: 'found', nodesVisited };
        }
        if (vis.has(nk)) continue;
        vis.add(nk);
        came[nk] = current;
        queue.enqueue(n);
        paint(this.grid, n, this.FRONTIER, this.START, this.END);
      }
      return { status: 'running', nodesVisited };
    };

    const statusA = expand(this.queueA, this.cameA, this.visA, this.visB, true);
    if (statusA.status === 'found') return statusA;

    const statusB = expand(this.queueB, this.cameB, this.visB, this.visA, false);
    return {
      status: statusB.status,
      nodesVisited: (statusA.nodesVisited || 0) + (statusB.nodesVisited || 0)
    };
  }
}