/* ---------- coordinate helpers ---------- */
export const key = ({ x, y }) => `${x},${y}`;

/* 4-dir and 8-dir vectors (change allowDiagonal flag to switch) */
export const DIRS_4 = Object.freeze([
  { x: 0, y: 1 },  { x: 1, y: 0 },
  { x: 0, y: -1 }, { x: -1, y: 0 },
]);
export const DIRS_8 = Object.freeze([
  ...DIRS_4,
  { x: 1, y: 1 },  { x: -1, y: 1 },
  { x: 1, y: -1 }, { x: -1, y: -1 },
]);

/**
 * Return neighbour coordinates, respecting walls & grid bounds.
 * @param {Object} node {x,y}
 * @param {Object} ctx  algorithm instance (`gridWidth`, `gridHeight`, `grid`, `WALL`)
 * @param {Boolean} allowDiagonal
 */
export function neighbors(node, ctx, allowDiagonal = false) {
  const dirs = allowDiagonal ? DIRS_8 : DIRS_4;
  const { x, y } = node;
  const { gridWidth: W, gridHeight: H, grid, WALL } = ctx;
  const res = [];

  for (const d of dirs) {
    const nx = x + d.x, ny = y + d.y;
    if (
      nx >= 0 && nx < W &&
      ny >= 0 && ny < H &&
      grid[ny][nx] !== WALL
    ) {
      res.push({ x: nx, y: ny });
    }
  }
  return res;
}

/* ---------- grid-painting helpers ---------- */
export function paint(grid, { x, y }, state, startState, endState) {
  if (grid[y][x] !== startState && grid[y][x] !== endState) {
    grid[y][x] = state;
  }
}

/* Remove VISITED / FRONTIER / PATH artefacts in one sweep */
export function resetGridState(
  grid,
  W,
  H,
  statesToClear = [4, 5, 6], // VISITED, FRONTIER, PATH
  EMPTY = 0
) {
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      if (statesToClear.includes(grid[yy][xx])) grid[yy][xx] = EMPTY;
    }
  }
}

/* Walk back through cameFrom & mark PATH cells */
export function reconstructPath(cameFrom, current, grid, START, PATH) {
  const k = key;
  while (cameFrom[k(current)]) {
    current = cameFrom[k(current)];
    if (grid[current.y][current.x] !== START) grid[current.y][current.x] = PATH;
  }
}

/* ---------- O(1) FIFO queue ---------- */
export class SimpleQueue {
  constructor() { this._a = []; this._h = 0; }        // array & head index
  isEmpty()       { return this._h >= this._a.length; }
  enqueue(item)   { this._a.push(item); }
  dequeue() {
    if (this.isEmpty()) return undefined;
    const item = this._a[this._h++];
    /* tilt clean-up to stop unbounded growth */
    if (this._h > 32 && this._h * 2 > this._a.length) {
      this._a = this._a.slice(this._h);               // compact
      this._h = 0;
    }
    return item;
  }
}