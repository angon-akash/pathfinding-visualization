import { CELL_STATE } from './config.js';

const { EMPTY, WALL, START, END } = CELL_STATE;

export class GridModel {
  constructor({ width, height }) {
    this.width = width;
    this.height = height;
    this.setDefaultPositions();
    this.reset();
  }

  setDefaultPositions() {
    this.start = { x: 1, y: Math.floor(this.height / 2) };
    this.end = { x: this.width - 2, y: Math.floor(this.height / 2) };
  }

  setSize({ cols, rows, width = cols, height = rows }) {
    if (!width || !height) {
      throw new Error('GridModel.setSize requires width/height or cols/rows');
    }
    this.width = width;
    this.height = height;
    this.setDefaultPositions();
    this.reset();
  }

  reset() {
    this.cells = Array.from({ length: this.height }, (_, y) => (
      Array.from({ length: this.width }, (_, x) => {
        if (x === this.start.x && y === this.start.y) return START;
        if (x === this.end.x && y === this.end.y) return END;
        return EMPTY;
      })
    ));
  }

  inBounds({ x, y }) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  isReserved({ x, y }) {
    return (x === this.start.x && y === this.start.y) || (x === this.end.x && y === this.end.y);
  }

  getCell({ x, y }) {
    return this.cells[y][x];
  }

  setCell({ x, y }, state) {
    this.cells[y][x] = state;
  }

  placeWall(position) {
    if (this.isReserved(position)) return;
    this.setCell(position, WALL);
  }

  erase(position) {
    if (this.isReserved(position)) return;
    this.setCell(position, EMPTY);
  }

  moveStart(position) {
    if (!this.inBounds(position)) return;
    if (this.getCell(position) === WALL || (position.x === this.end.x && position.y === this.end.y)) {
      return;
    }
    this.setCell(this.start, EMPTY);
    this.start = { ...position };
    this.setCell(this.start, START);
  }

  moveEnd(position) {
    if (!this.inBounds(position)) return;
    if (this.getCell(position) === WALL || (position.x === this.start.x && position.y === this.start.y)) {
      return;
    }
    this.setCell(this.end, EMPTY);
    this.end = { ...position };
    this.setCell(this.end, END);
  }

  clearWalkStates(states = [CELL_STATE.VISITED, CELL_STATE.FRONTIER, CELL_STATE.PATH]) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (states.includes(this.cells[y][x])) this.cells[y][x] = EMPTY;
      }
    }
    this.setCell(this.start, START);
    this.setCell(this.end, END);
  }

  generateSimpleMaze() {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (!this.isReserved({ x, y })) this.cells[y][x] = EMPTY;
      }
    }

    const wallCount = Math.floor((this.width * this.height) / 7);
    let placed = 0;
    let tries = 0;
    while (placed < wallCount && tries < wallCount * 4) {
      tries += 1;
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      const pos = { x, y };
      if (this.isReserved(pos) || this.getCell(pos) === WALL) continue;
      this.placeWall(pos);
      placed += 1;
    }
  }

  generateComplexMaze() {
    this.fillWithWalls();
    this.carveMaze(1, 1);
    this.addExtraOpenings();
    this.restoreMarkers();
    if (!this.isReachable(this.start, this.end)) {
      this.relaxEndUntilReachable();
    }
  }

  fillWithWalls() {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.cells[y][x] = WALL;
      }
    }
  }

  carveMaze(x, y) {
    this.cells[y][x] = EMPTY;
    const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
    for (let i = dirs.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    dirs.forEach(({ dx, dy }) => {
      const nx = x + dx * 2;
      const ny = y + dy * 2;
      if (
        nx > 0 && nx < this.width - 1 &&
        ny > 0 && ny < this.height - 1 &&
        this.cells[ny][nx] === WALL
      ) {
        this.cells[y + dy][x + dx] = EMPTY;
        this.carveMaze(nx, ny);
      }
    });
  }

  addExtraOpenings() {
    const desiredOpenings = Math.floor((this.width * this.height) / 18);
    let opened = 0;
    let attempts = 0;
    while (opened < desiredOpenings && attempts < desiredOpenings * 10) {
      attempts += 1;
      const x = Math.floor(Math.random() * (this.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - 2)) + 1;
      if (this.cells[y][x] !== WALL) continue;

      const emptyNeighbours = this.countEmptyNeighbours(x, y);
      if (emptyNeighbours >= 2) {
        this.cells[y][x] = EMPTY;
        opened += 1;
      }
    }
  }

  countEmptyNeighbours(x, y) {
    let count = 0;
    const offsets = [
      [0, 1], [1, 0], [-1, 0], [0, -1],
    ];
    offsets.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      if (this.inBounds({ x: nx, y: ny }) && this.cells[ny][nx] === EMPTY) {
        count += 1;
      }
    });
    return count;
  }

  restoreMarkers() {
    this.setCell(this.start, START);
    this.setCell(this.end, END);
  }

  isReachable(source, target) {
    const visited = Array.from({ length: this.height }, () => Array(this.width).fill(false));
    const queue = [source];
    visited[source.y][source.x] = true;

    const offsets = [
      [0, 1], [1, 0], [-1, 0], [0, -1],
    ];

    while (queue.length) {
      const { x, y } = queue.shift();
      if (x === target.x && y === target.y) return true;
      offsets.forEach(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 && nx < this.width &&
          ny >= 0 && ny < this.height &&
          !visited[ny][nx] && this.cells[ny][nx] !== WALL
        ) {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
        }
      });
    }
    return false;
  }

  relaxEndUntilReachable() {
    const maxRadius = Math.max(this.width, this.height);
    for (let radius = 1; radius < maxRadius; radius += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = this.end.x + dx;
          const ny = this.end.y + dy;
          if (!this.inBounds({ x: nx, y: ny })) continue;
          if (this.cells[ny][nx] !== EMPTY) continue;
          const candidate = { x: nx, y: ny };
          if (this.isReachable(this.start, candidate)) {
            this.setCell(this.end, EMPTY);
            this.end = candidate;
            this.setCell(this.end, END);
            return;
          }
        }
      }
    }
  }
}
