import { BASE_COLORS, CELL_SIZE, CELL_STATE } from './config.js';

const hexToRgba = (hex, alpha = 1) => {
  const value = hex.replace('#', '');
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const stateColor = (state, colors) => {
  switch (state) {
    case CELL_STATE.WALL: return colors.wall;
    case CELL_STATE.START: return colors.start;
    case CELL_STATE.END: return colors.end;
    case CELL_STATE.VISITED: return colors.visited;
    case CELL_STATE.FRONTIER: return colors.frontier;
    case CELL_STATE.PATH: return colors.path;
    default: return colors.empty;
  }
};

export class GridRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.colors = { ...BASE_COLORS };
  }

  applyTheme(partialTheme = {}) {
    this.colors = { ...BASE_COLORS, ...partialTheme };
  }

  resize(grid) {
    const wrapWidth = this.canvas.parentElement.clientWidth;
    const desiredWidth = grid.width * CELL_SIZE;
    const scale = Math.min(1, wrapWidth / desiredWidth);
    this.canvas.width = desiredWidth * scale;
    this.canvas.height = grid.height * CELL_SIZE * scale;
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.draw(grid);
  }

  draw(grid) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const state = grid.cells[y][x];
        const colors = this.colors;
        ctx.globalAlpha = state === CELL_STATE.FRONTIER ? 0.6 : 1;

        let fillStyle = stateColor(state, colors);
        if (state === CELL_STATE.FRONTIER || state === CELL_STATE.PATH) {
          const cx = x * CELL_SIZE + CELL_SIZE / 2;
          const cy = y * CELL_SIZE + CELL_SIZE / 2;
          const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, CELL_SIZE * 0.7);
          if (state === CELL_STATE.PATH) {
            gradient.addColorStop(0, 'rgba(255,255,255,0.85)');
            gradient.addColorStop(0.35, hexToRgba(colors.path, 0.9));
            gradient.addColorStop(1, hexToRgba(colors.path, 1));
          } else {
            gradient.addColorStop(0, hexToRgba(colors.frontier, 0.25));
            gradient.addColorStop(0.5, hexToRgba(colors.frontier, 0.6));
            gradient.addColorStop(1, hexToRgba(colors.frontier, 1));
          }
          fillStyle = gradient;
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.globalAlpha = 1;

        if (state === CELL_STATE.FRONTIER || state === CELL_STATE.PATH) {
          ctx.save();
          ctx.shadowColor = state === CELL_STATE.FRONTIER ? colors.frontier : colors.path;
          ctx.shadowBlur = 12;
          ctx.strokeStyle = ctx.shadowColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          ctx.restore();
        }

        if (state === CELL_STATE.VISITED) {
          ctx.save();
          ctx.strokeStyle = hexToRgba(colors.visited, 0.4);
          ctx.lineWidth = 1;
          ctx.setLineDash([CELL_SIZE / 2.5, CELL_SIZE / 3]);
          ctx.beginPath();
          ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE);
          ctx.lineTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE);
          ctx.stroke();
          ctx.restore();
        }

        if (state === CELL_STATE.START || state === CELL_STATE.END) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE * 0.35,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = state === CELL_STATE.START ? colors.start : colors.end;
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        }

        ctx.strokeStyle = colors.gridLine;
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}
