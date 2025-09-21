import {
  CELL_SIZE,
  CELL_STATE,
  DENSITIES,
  TOOLS,
  ALGORITHM_THEMES,
  BASE_COLORS,
} from './config.js';
import { GridModel } from './grid.js';
import { GridRenderer } from './renderer.js';
import { ALGORITHMS, getAlgorithmMeta } from './algorithms/registry.js';

class PathfindingApp {
  constructor(doc) {
    this.doc = doc;
    this.canvas = doc.getElementById('grid');
    this.renderer = new GridRenderer(this.canvas);

    const defaultDensity = DENSITIES.medium;
    this.grid = new GridModel({ width: defaultDensity.cols, height: defaultDensity.rows });

    this.algorithmSelect = doc.getElementById('algorithmSelect');
    this.densitySelect = doc.getElementById('densitySelect');
    this.mazeTypeSelect = doc.getElementById('mazeTypeSelect');
    this.mazeButton = doc.getElementById('mazeButton');
    this.toolButtonsWrap = doc.getElementById('toolBtns');
    this.speedSlider = doc.getElementById('speedSlider');
    this.speedValue = doc.getElementById('speedValue');
    this.startButton = doc.getElementById('startButton');
    this.resetButton = doc.getElementById('resetButton');
    this.elapsedTimeLabel = doc.getElementById('elapsedTime');
    this.nodesLabel = doc.getElementById('nodesExplored');
    this.pathLabel = doc.getElementById('pathLength');
    this.algorithmDesc = doc.getElementById('algorithmDesc');
    this.legendSwatches = {
      start: doc.querySelector('[data-swatch="start"]'),
      end: doc.querySelector('[data-swatch="end"]'),
      wall: doc.querySelector('[data-swatch="wall"]'),
      visited: doc.querySelector('[data-swatch="visited"]'),
      frontier: doc.querySelector('[data-swatch="frontier"]'),
      path: doc.querySelector('[data-swatch="path"]'),
    };

    this.currentTool = TOOLS[0].id;
    this.isRunning = false;
    this.intervalId = null;
    this.currentAlgorithm = null;
    this.pointerActive = false;

    this.nodesExplored = 0;
    this.pathLength = 0;
    this.elapsedStart = null;
    this.elapsedTimer = null;
  }

  init() {
    this.populateAlgorithmSelect();
    this.populateDensitySelect();
    this.renderToolButtons();
    this.bindEvents();
    const meta = this.getCurrentAlgorithmMeta();
    this.applyThemeForAlgorithm(meta);
    this.renderer.resize(this.grid);
    this.updateAlgorithmDescription(meta);
    this.updateSpeedLabel();
    this.updateStatsDisplay();
  }

  populateAlgorithmSelect() {
    this.algorithmSelect.innerHTML = '';
    ALGORITHMS.forEach((algo, index) => {
      const option = this.doc.createElement('option');
      option.value = algo.id;
      option.textContent = algo.name;
      if (index === 0) option.selected = true;
      this.algorithmSelect.appendChild(option);
    });
  }

  populateDensitySelect() {
    this.densitySelect.innerHTML = '';
    Object.entries(DENSITIES).forEach(([key, { cols, rows }]) => {
      const option = this.doc.createElement('option');
      option.value = key;
      option.textContent = `${cols} × ${rows}`;
      if (key === 'medium') option.selected = true;
      this.densitySelect.appendChild(option);
    });
  }

  bindEvents() {
    this.startButton.addEventListener('click', () => {
      if (this.isRunning) {
        this.stopRun();
      } else {
        this.startRun();
      }
    });

    this.resetButton.addEventListener('click', () => {
      this.resetGrid();
    });

    this.speedSlider.addEventListener('input', () => {
      this.updateSpeedLabel();
      if (this.isRunning) this.restartLoop();
    });

    this.algorithmSelect.addEventListener('change', () => {
      this.onAlgorithmChange();
    });

    this.densitySelect.addEventListener('change', () => {
      this.onDensityChange();
    });

    this.mazeButton.addEventListener('click', () => {
      this.generateMaze();
    });

    this.canvas.addEventListener('pointerdown', (event) => {
      if (this.isRunning) return;
      event.preventDefault();
      if (this.canvas.setPointerCapture) {
        try { this.canvas.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
      }
      this.pointerActive = true;
      this.handlePointer(event);
    });

    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.pointerActive || this.isRunning) return;
      event.preventDefault();
      this.handlePointer(event);
    });

    window.addEventListener('pointerup', (event) => {
      this.pointerActive = false;
      if (this.canvas.releasePointerCapture && typeof event.pointerId === 'number') {
        try {
          if (this.canvas.hasPointerCapture?.(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
          }
        } catch (err) { /* ignore */ }
      }
    });

    this.canvas.addEventListener('pointerleave', (event) => {
      this.pointerActive = false;
      if (this.canvas.releasePointerCapture && typeof event.pointerId === 'number') {
        try {
          if (this.canvas.hasPointerCapture?.(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
          }
        } catch (err) { /* ignore */ }
      }
    });

    window.addEventListener('resize', () => {
      this.renderer.resize(this.grid);
    });
  }

  handlePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const x = Math.floor((offsetX / rect.width) * this.grid.width);
    const y = Math.floor((offsetY / rect.height) * this.grid.height);
    const target = { x, y };
    if (!this.grid.inBounds(target)) return;
    this.applyTool(target);
    this.renderer.draw(this.grid);
  }

  applyTool(target) {
    switch (this.currentTool) {
      case 'wall':
        this.grid.placeWall(target);
        break;
      case 'erase':
        this.grid.erase(target);
        break;
      case 'start':
        this.grid.moveStart(target);
        break;
      case 'end':
        this.grid.moveEnd(target);
        break;
      default:
        break;
    }
  }

  renderToolButtons() {
    this.toolButtonsWrap.innerHTML = '';
    TOOLS.forEach((tool) => {
      const button = this.doc.createElement('button');
      button.type = 'button';
      button.className = `tool-btn${tool.id === this.currentTool ? ' selected' : ''}`;
      button.dataset.tool = tool.id;
      button.title = tool.label;
      button.setAttribute('aria-label', tool.label);
      button.innerHTML = tool.svg;
      button.addEventListener('click', () => {
        this.currentTool = tool.id;
        this.renderToolButtons();
        this.updateToolCursor();
      });
      this.toolButtonsWrap.appendChild(button);
    });
    this.updateToolCursor();
  }

  updateToolCursor() {
    const cursor = {
      wall: 'crosshair',
      erase: 'not-allowed',
      start: 'cell',
      end: 'cell',
    }[this.currentTool] || 'pointer';
    this.canvas.style.cursor = cursor;
  }

  startRun() {
    const meta = this.getCurrentAlgorithmMeta();
    if (!meta) return;

    this.grid.clearWalkStates();
    this.applyThemeForAlgorithm(meta);
    this.renderer.draw(this.grid);

    this.currentAlgorithm = new meta.class(
      this.grid.cells,
      this.grid.start,
      this.grid.end,
      CELL_SIZE,
      this.grid.width,
      this.grid.height,
    );
    this.currentAlgorithm.init();
    this.isRunning = true;
    this.startButton.textContent = '❚❚';
    this.resetStats(true);
    this.resetTimer();
    this.startTimer();
    this.runLoop();
  }

  stopRun() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.currentAlgorithm = null;
    this.startButton.textContent = '▶';
    this.stopTimer();
  }

  runLoop() {
    const interval = this.intervalFromSlider();
    if (interval === 0) {
      while (this.isRunning && this.step({ deferDraw: true })) {
        // loop until completion
      }
      this.renderer.draw(this.grid);
      return;
    }

    this.intervalId = setInterval(() => {
      if (!this.step()) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }, interval);
  }

  restartLoop() {
    if (!this.isRunning) return;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.runLoop();
  }

  step({ deferDraw = false } = {}) {
    if (!this.currentAlgorithm) return false;
    const result = this.currentAlgorithm.step();
    const nodesVisited = result?.nodesVisited ?? 0;
    this.nodesExplored += nodesVisited;

    const status = result?.status;
    if (status === 'found' || status === 'no-path') {
      if (status === 'found') this.pathLength = this.countPathCells();
      this.finishRun();
      if (!deferDraw) this.renderer.draw(this.grid);
      return false;
    }

    if (!deferDraw) this.renderer.draw(this.grid);
    this.updateStatsDisplay();
    return true;
  }

  finishRun() {
    this.stopRun();
    this.updateStatsDisplay();
  }

  countPathCells() {
    let count = 0;
    for (let y = 0; y < this.grid.height; y += 1) {
      for (let x = 0; x < this.grid.width; x += 1) {
        if (this.grid.cells[y][x] === CELL_STATE.PATH) count += 1;
      }
    }
    return count;
  }

  resetGrid() {
    this.stopRun();
    this.grid.setSize(this.currentDensity());
    this.renderer.resize(this.grid);
    this.resetStats(true);
    this.resetTimer();
  }

  generateMaze() {
    this.stopRun();
    if (this.mazeTypeSelect.value === 'simple') {
      this.grid.generateSimpleMaze();
    } else {
      this.grid.generateComplexMaze();
    }
    this.renderer.draw(this.grid);
    this.resetStats(true);
    this.resetTimer();
  }

  onAlgorithmChange() {
    this.stopRun();
    this.grid.clearWalkStates();
    const meta = this.getCurrentAlgorithmMeta();
    this.applyThemeForAlgorithm(meta);
    this.renderer.draw(this.grid);
    this.updateAlgorithmDescription(meta);
    this.resetStats(true);
    this.resetTimer();
  }

  onDensityChange() {
    this.resetGrid();
  }

  currentDensity() {
    const key = this.densitySelect.value;
    return DENSITIES[key] ?? DENSITIES.medium;
  }

  getCurrentAlgorithmMeta() {
    return getAlgorithmMeta(this.algorithmSelect.value);
  }

  updateAlgorithmDescription(meta = this.getCurrentAlgorithmMeta()) {
    if (!meta) {
      this.algorithmDesc.textContent = '';
      return;
    }
    this.algorithmDesc.innerHTML = `
      <span class="algorithm-desc__title">${meta.name}</span>
      <span class="algorithm-desc__body">${meta.description}</span>
    `;
  }

  updateSpeedLabel() {
    const interval = this.intervalFromSlider();
    this.speedValue.textContent = interval === 0 ? 'Instant' : `${interval}ms`;
  }

  intervalFromSlider() {
    const slider = this.speedSlider;
    const rawValue = Number(slider.value);
    const min = Number(slider.min);
    const max = Number(slider.max);
    if (rawValue >= max) return 0;

    const maxDelay = 700;
    const minDelay = 10;
    const upperBound = max - 1; // reserve final step for instant mode
    const clamped = Math.max(min, Math.min(rawValue, upperBound));
    const span = Math.max(1, upperBound - min);
    const t = (clamped - min) / span;
    const eased = 1 - Math.pow(1 - t, 2.2); // ease-out curve for finer fast control
    const delay = maxDelay - (maxDelay - minDelay) * eased;
    return Math.max(minDelay, Math.round(delay));
  }

  resetStats(shouldUpdateLabels = false) {
    this.nodesExplored = 0;
    this.pathLength = 0;
    if (shouldUpdateLabels) this.updateStatsDisplay();
  }

  updateStatsDisplay() {
    this.nodesLabel.textContent = `Nodes explored: ${this.nodesExplored}`;
    this.pathLabel.textContent = `Path length: ${this.pathLength}`;
  }

  resetTimer() {
    this.elapsedStart = null;
    this.elapsedTimeLabel.textContent = '0.00s';
    if (this.elapsedTimer) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
  }

  applyThemeForAlgorithm(meta = this.getCurrentAlgorithmMeta()) {
    const theme = meta ? ALGORITHM_THEMES[meta.id] : undefined;
    this.renderer.applyTheme(theme);
    this.updateLegendSwatches(theme);
  }

  updateLegendSwatches(theme = {}) {
    const palette = { ...BASE_COLORS, ...(theme || {}) };
    if (this.legendSwatches.start) {
      this.legendSwatches.start.style.background = palette.start;
      this.legendSwatches.start.style.boxShadow = 'none';
    }
    if (this.legendSwatches.end) {
      this.legendSwatches.end.style.background = palette.end;
      this.legendSwatches.end.style.boxShadow = 'none';
    }
    if (this.legendSwatches.wall) {
      this.legendSwatches.wall.style.background = palette.wall;
      this.legendSwatches.wall.style.boxShadow = 'none';
    }
    if (this.legendSwatches.visited) this.legendSwatches.visited.style.background = palette.visited;
    if (this.legendSwatches.frontier) {
      this.legendSwatches.frontier.style.background = palette.frontier;
      this.legendSwatches.frontier.style.boxShadow = `0 0 4px ${palette.frontier}`;
    }
    if (this.legendSwatches.path) {
      this.legendSwatches.path.style.background = palette.path;
      this.legendSwatches.path.style.boxShadow = `0 0 6px ${palette.path}`;
    }
  }
  startTimer() {
    this.elapsedStart = performance.now();
    this.elapsedTimer = setInterval(() => {
      if (!this.elapsedStart) return;
      const elapsed = (performance.now() - this.elapsedStart) / 1000;
      this.elapsedTimeLabel.textContent = `${elapsed.toFixed(2)}s`;
    }, 50);
  }

  stopTimer() {
    if (this.elapsedTimer) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new PathfindingApp(document);
  app.init();
  console.info('%cPathfinding visualizer ready', 'color:#4f8cff');
});
