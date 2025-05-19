import { neighbors, key, paint, reconstructPath, resetGridState } from './utils.js';

export class RandomWalkAlgorithm {
  constructor(grid, startPos, endPos, cellSize, gridWidth, gridHeight) {
    Object.assign(this, { grid, startPos, endPos, cellSize, gridWidth, gridHeight });
    this.EMPTY = 0; this.WALL = 1; this.START = 2; this.END = 3;
    this.VISITED = 4; this.FRONTIER = 5; this.PATH = 6;
  }

  init() {
    resetGridState(this.grid, this.gridWidth, this.gridHeight,
                   [this.VISITED, this.FRONTIER, this.PATH], this.EMPTY);

    this.current = this.startPos;
    this.came = {};
    this.vis = new Set([key(this.startPos)]);
  }

  step() {
    if (this.current.x === this.endPos.x && this.current.y === this.endPos.y) {
      reconstructPath(this.came, this.current, this.grid, this.START, this.PATH);
      return { status: 'found' };
    }

    paint(this.grid, this.current, this.VISITED, this.START, this.END);
    let nodesVisited = 1;

    const neighborsList = neighbors(this.current, this);
    if (!neighborsList.length) return { status: 'no-path' };

    const next = neighborsList[Math.floor(Math.random() * neighborsList.length)];
    const nk = key(next);

    if (!this.vis.has(nk)) {
      this.vis.add(nk);
      this.came[nk] = this.current;
      paint(this.grid, next, this.FRONTIER, this.START, this.END);
    }

    this.current = next;
    return { status: 'running', nodesVisited };
  }
}