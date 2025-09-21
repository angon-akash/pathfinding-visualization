export const CELL_SIZE = 28;

export const CELL_STATE = Object.freeze({
  EMPTY: 0,
  WALL: 1,
  START: 2,
  END: 3,
  VISITED: 4,
  FRONTIER: 5,
  PATH: 6,
});

export const BASE_COLORS = Object.freeze({
  empty   : '#181c24',
  wall    : '#475569',
  start   : '#22c55e',
  end     : '#e74c3c',
  visited : '#a78bfa',
  frontier: '#38bdf8',
  path    : '#fbbf24',
  gridLine: '#232a36',
});

export const DENSITIES = Object.freeze({
  tiny:    { cols: 12, rows: 8 },
  small:   { cols: 18, rows: 12 },
  medium:  { cols: 32, rows: 20 },
  large:   { cols: 44, rows: 28 },
  xlarge:  { cols: 60, rows: 38 },
  extreme: { cols: 80, rows: 50 },
  insane:  { cols: 120, rows: 80 },
});

export const TOOLS = Object.freeze([
  {
    id: 'wall',
    label: 'Wall',
    svg: `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="#475569"/></svg>`,
  },
  {
    id: 'start',
    label: 'Start',
    svg: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#22c55e"/><polygon points="10,8 16,12 10,16" fill="#ffffff"/></svg>`,
  },
  {
    id: 'end',
    label: 'End',
    svg: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#e74c3c"/><rect x="10" y="8" width="4" height="8" fill="#ffffff"/></svg>`,
  },
  {
    id: 'erase',
    label: 'Erase',
    svg: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#232a36"/><line x1="8" y1="8" x2="16" y2="16" stroke="#7b8794" stroke-width="2"/><line x1="16" y1="8" x2="8" y2="16" stroke="#7b8794" stroke-width="2"/></svg>`,
  },
]);

export const ALGORITHM_THEMES = Object.freeze({
  astar: {
    frontier: '#38bdf8',
    visited: '#818cf8',
    path: '#fbbf24',
  },
  greedy: {
    frontier: '#fb7185',
    visited: '#f472b6',
    path: '#f9a8d4',
  },
  dijkstra: {
    frontier: '#f97316',
    visited: '#fb923c',
    path: '#facc15',
  },
  bfs: {
    frontier: '#34d399',
    visited: '#22d3ee',
    path: '#a7f3d0',
  },
  bidirectionalbfs: {
    frontier: '#c084fc',
    visited: '#93c5fd',
    path: '#fde68a',
  },
  dfs: {
    frontier: '#f472b6',
    visited: '#fb7185',
    path: '#fbbf24',
  },
  random: {
    frontier: '#f97316',
    visited: '#fda4af',
    path: '#d9f99d',
  },
});
