import { neighbors, key, paint, reconstructPath, resetGridState } from './utils.js';
import PriorityQueue from './priorityQueue.js';

export class AStarAlgorithm {
  constructor(grid, startPos, endPos, cellSize, gridWidth, gridHeight) {
    Object.assign(this, { grid, startPos, endPos, cellSize, gridWidth, gridHeight });
    this.EMPTY = 0; this.WALL = 1; this.START = 2; this.END = 3;
    this.VISITED = 4; this.FRONTIER = 5; this.PATH = 6;
    this.allowDiagonal = false; // hook for future feature
  }

  init() {
    resetGridState(this.grid, this.gridWidth, this.gridHeight,
                   [this.VISITED, this.FRONTIER, this.PATH], this.EMPTY);

    this.openSet = new PriorityQueue();
    this.closed  = new Set();
    this.came    = {};
    this.gScore  = { [key(this.startPos)]: 0 };
    this.fScore  = { [key(this.startPos)]: heuristic(this.startPos, this.endPos) };
    this.openSet.push(this.startPos, this.fScore[key(this.startPos)]);
  }

  step() {
    // pull next unexplored node
    let current;
    do {
      if (this.openSet.isEmpty()) return { status: 'no-path' };
      current = this.openSet.pop();
    } while (this.closed.has(key(current)));

    if (current.x === this.endPos.x && current.y === this.endPos.y) {
      reconstructPath(this.came, current, this.grid, this.START, this.PATH);
      return { status: 'found' };
    }

    this.closed.add(key(current));
    paint(this.grid, current, this.VISITED, this.START, this.END);
    let nodesVisited = 1; 

    for (const n of neighbors(current, this, this.allowDiagonal)) {
      const nk = key(n);
      if (this.closed.has(nk)) continue;

      const tentativeGScore = (this.gScore[key(current)] ?? Infinity) + 1;
      if (tentativeGScore < (this.gScore[nk] ?? Infinity)) {
        this.came[nk] = current;
        this.gScore[nk] = tentativeGScore;
        this.fScore[nk] = tentativeGScore + heuristic(n, this.endPos);
        this.openSet.push(n, this.fScore[nk]);   // lazy duplicates OK
        paint(this.grid, n, this.FRONTIER, this.START, this.END);
      }
    }
    return { status: 'running', nodesVisited };
  }
}

const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);