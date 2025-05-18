import { AStarAlgorithm }   from './algorithms/astar.js';
import { DijkstraAlgorithm }from './algorithms/dijkstra.js';
import { BFSAlgorithm }     from './algorithms/bfs.js';

/* ============================================================
   Config & State
============================================================ */
const cellSize = 28;
const DENSITIES = {
  low:    { cols: 22, rows: 14 },
  medium: { cols: 32, rows: 20 },
  high:   { cols: 44, rows: 28 }
};

let gridWidth  = DENSITIES.medium.cols;
let gridHeight = DENSITIES.medium.rows;
let grid = [];
let startPos, endPos;

const colors = {
  empty   : '#181c24',
  wall    : '#475569',
  start   : '#22c55e',
  end     : '#e74c3c',
  visited : '#a78bfa',
  frontier: '#38bdf8',
  path    : '#fbbf24',
  gridLine: '#232a36'
};

const EMPTY=0,WALL=1,START=2,END=3,VISITED=4,FRONTIER=5,PATH=6;

const ALGORITHMS = [
  { id:'astar',    name:'A* (Shortest Path)',   class:AStarAlgorithm },
  { id:'dijkstra', name:'Dijkstra’s',           class:DijkstraAlgorithm },
  { id:'bfs',      name:'Breadth‑First Search', class:BFSAlgorithm }
];

const TOOLS = [
  {
    id:'wall', label:'Wall',
    svg:`<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="#475569"/></svg>`
  },
  {
    id:'start', label:'Start',
    svg:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#22c55e"/><polygon points="10,8 16,12 10,16" fill="#ffffff"/></svg>`
  },
  {
    id:'end', label:'End',
    svg:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#e74c3c"/><rect x="10" y="8" width="4" height="8" fill="#ffffff"/></svg>`
  },
  {
    id:'erase', label:'Erase',
    svg:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#232a36"/><line x1="8" y1="8" x2="16" y2="16" stroke="#7b8794" stroke-width="2"/><line x1="16" y1="8" x2="8" y2="16" stroke="#7b8794" stroke-width="2"/></svg>`
  }
];

let isRunning=false, intervalId=null, currentAlgorithm=null, currentTool='wall';
let elapsedStart = null;
let elapsedTimer = null;

function resetElapsedTime() {
  elapsedStart = null;
  document.getElementById('elapsedTime').textContent = '0.00s';
  if (elapsedTimer) clearInterval(elapsedTimer);
}

function startElapsedTime() {
  elapsedStart = performance.now();
  elapsedTimer = setInterval(() => {
    const now = performance.now();
    const elapsed = ((now - elapsedStart) / 1000).toFixed(2);
    document.getElementById('elapsedTime').textContent = `${elapsed}s`;
  }, 50);
}

function stopElapsedTime() {
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = null;
}

/* ============================================================
   DOM — once document loaded
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
  const canvas  = document.getElementById('grid');
  const ctx     = canvas.getContext('2d');
  const startBtn       = document.getElementById('startButton');
  const resetBtn       = document.getElementById('resetButton');
  const speedSelect    = document.getElementById('speedSelect');
  const algorithmSelect= document.getElementById('algorithmSelect');
  const densitySelect  = document.getElementById('densitySelect');
  const toolBtnsWrap   = document.getElementById('toolBtns');
  const mazeBtn        = document.getElementById('mazeButton');

  /* ---------- Controls/Buttons UI ---------- */
  algorithmSelect.innerHTML = ALGORITHMS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  function renderToolButtons(){
    toolBtnsWrap.innerHTML='';
    TOOLS.forEach(t=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='tool-btn'+(t.id===currentTool?' selected':'');
      b.dataset.tool=t.id;
      b.title=b.ariaLabel=t.label;
      b.innerHTML=t.svg;
      b.onclick=()=>{ currentTool=t.id; renderToolButtons(); updateCursor(); };
      toolBtnsWrap.appendChild(b);
    });
  }
  function updateCursor() {
    switch (currentTool) {
      case 'wall':   canvas.style.cursor = 'crosshair'; break;
      case 'erase':  canvas.style.cursor = 'not-allowed'; break;
      case 'start':  case 'end': canvas.style.cursor = 'cell'; break;
      default:       canvas.style.cursor = 'pointer';
    }
  }

  /* ---------- grid helpers ---------- */
  function setDefaultPositions() {
    startPos = { x: 1, y: Math.floor(gridHeight / 2) };
    endPos   = { x: gridWidth - 2, y: Math.floor(gridHeight / 2) };
  }
  function initGrid() {
    grid = [];
    for (let y = 0; y < gridHeight; y++) {
      const row = [];
      for (let x = 0; x < gridWidth; x++) {
        if (x === startPos.x && y === startPos.y) row.push(START);
        else if (endPos && x === endPos.x && y === endPos.y) row.push(END);
        else row.push(EMPTY);
      }
      grid.push(row);
    }
    placeRandomSimpleWall();
    grid[startPos.y][startPos.x] = START;
    if(endPos) grid[endPos.y][endPos.x] = END;
  }
  function placeRandomSimpleWall() {
    // Random vertical/horizontal wall (min 4 long), not blocking start-end path
    const isVertical = Math.random() < 0.5;
    let wallPlaced = false, tries = 0;
    while (!wallPlaced && tries++ < 40) {
      if (isVertical) {
        const x = Math.floor(Math.random() * (gridWidth - 4)) + 2;
        const yStart = Math.floor(Math.random() * (gridHeight - 6)) + 2;
        let canPlace = true;
        for (let y = yStart; y < yStart + 4; y++)
          if ((x === startPos.x && y === startPos.y) || (x === endPos.x && y === endPos.y))
            canPlace = false;
        if (canPlace) {
          for (let y = yStart; y < yStart + 4; y++) grid[y][x] = WALL;
          wallPlaced = true;
        }
      } else {
        const y = Math.floor(Math.random() * (gridHeight - 4)) + 2;
        const xStart = Math.floor(Math.random() * (gridWidth - 6)) + 2;
        let canPlace = true;
        for (let x = xStart; x < xStart + 4; x++)
          if ((x === startPos.x && y === startPos.y) || (x === endPos.x && y === endPos.y))
            canPlace = false;
        if (canPlace) {
          for (let x = xStart; x < xStart + 4; x++) grid[y][x] = WALL;
          wallPlaced = true;
        }
      }
    }
  }
  function drawGrid(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<gridHeight;y++){
      for(let x=0;x<gridWidth;x++){
        const state = grid[y][x];
        ctx.fillStyle =
          state===EMPTY   ? colors.empty   :
          state===WALL    ? colors.wall    :
          state===START   ? colors.start   :
          state===END     ? colors.end     :
          state===VISITED ? colors.visited :
          state===FRONTIER? colors.frontier: colors.path;
        ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
        ctx.strokeStyle = colors.gridLine;
        ctx.strokeRect(x*cellSize, y*cellSize, cellSize, cellSize);
      }
    }
  }
  function resizeCanvas(){
    const wrapW = canvas.parentElement.clientWidth;
    const scale = Math.min(1, wrapW / (gridWidth*cellSize));
    canvas.width  = gridWidth  * cellSize * scale;
    canvas.height = gridHeight * cellSize * scale;
    ctx.setTransform(scale,0,0,scale,0,0);
    drawGrid();
  }
  window.addEventListener('resize',resizeCanvas);

  /* ---------- pointer helpers ---------- */
  /**
   * Map a MouseEvent or TouchEvent to a grid cell index,
   * regardless of CSS scaling or transform.
   */
  function pointerToCell(e) {
    const rect = canvas.getBoundingClientRect();
    // distance from canvas’s top-left in CSS pixels
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    // compute which cell that lands in
    const cellX = Math.floor((offsetX * gridWidth)  / rect.width);
    const cellY = Math.floor((offsetY * gridHeight) / rect.height);
    return { x: cellX, y: cellY };
  }

  const inBounds = ({x,y}) => x>=0 && x<gridWidth && y>=0 && y<gridHeight;
  function editCell({x,y}){
    switch(currentTool){
      case 'wall':
        if(grid[y][x] !== START) grid[y][x] = WALL;
        if(grid[y][x] === WALL && endPos && x === endPos.x && y === endPos.y) endPos = null;
        break;
      case 'erase':
        if(grid[y][x] === END) { grid[y][x] = EMPTY; endPos = null; }
        else if(grid[y][x] !== START) grid[y][x] = EMPTY;
        break;
      case 'start':
        if(grid[y][x] !== END && grid[y][x] !== WALL){
          grid[startPos.y][startPos.x]=EMPTY;
          startPos={x,y}; grid[y][x]=START;
        }
        break;
      case 'end':
        if(grid[y][x] !== START && grid[y][x] !== WALL){
          if(endPos) grid[endPos.y][endPos.x]=EMPTY;
          endPos={x,y}; grid[y][x]=END;
        }
        break;
    }
  }

  function isReachable(s, e, grid) {
    const visited = Array.from({length: gridHeight}, ()=> Array(gridWidth).fill(false));
    const queue = [s];
    visited[s.y][s.x] = true;
    while (queue.length) {
      const {x, y} = queue.shift();
      if (x === e.x && y === e.y) return true;
      for (const [dx, dy] of [[0,1],[1,0],[-1,0],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx>=0 && nx<gridWidth && ny>=0 && ny<gridHeight && !visited[ny][nx] && grid[ny][nx] !== WALL) {
          visited[ny][nx] = true;
          queue.push({x:nx, y:ny});
        }
      }
    }
    return false;
  }

  function generateMaze() {
    // Fill grid with walls
    for (let y = 0; y < gridHeight; y++) for (let x = 0; x < gridWidth; x++) grid[y][x] = WALL;

    // Carve passages with recursive backtracker
    function carve(x, y) {
      grid[y][x] = EMPTY;
      const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }
      dirs.forEach(({dx, dy}) => {
        const nx = x + dx * 2, ny = y + dy * 2;
        if (nx > 0 && nx < gridWidth - 1 && ny > 0 && ny < gridHeight - 1 && grid[ny][nx] === WALL) {
          grid[y + dy][x + dx] = EMPTY;
          carve(nx, ny);
        }
      });
    }
    carve(1, 1);

    // --- Add extra openings to create multiple paths ---
    // Try to remove random walls between empty cells to create loops
    const extraOpenings = Math.floor((gridWidth * gridHeight) / 18); // tweak this for more/less loops
    let attempts = 0, opened = 0;
    while (opened < extraOpenings && attempts < extraOpenings * 10) {
      attempts++;
      // Pick a random wall cell not on the border
      const x = Math.floor(Math.random() * (gridWidth - 2)) + 1;
      const y = Math.floor(Math.random() * (gridHeight - 2)) + 1;
      if (grid[y][x] !== WALL) continue;
      // Check if removing this wall connects two separate empty regions
      let emptyNeighbors = 0;
      for (const [dx, dy] of [[0,1],[1,0],[-1,0],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (grid[ny][nx] === EMPTY) emptyNeighbors++;
      }
      if (emptyNeighbors >= 2) {
        grid[y][x] = EMPTY;
        opened++;
      }
    }

    // Restore start/end markers
    grid[startPos.y][startPos.x] = START;
    if(endPos) grid[endPos.y][endPos.x] = END;

    // If end isn't reachable, move it to a reachable empty cell
    if (!isReachable(startPos, endPos, grid)) {
      let found = false;
      for (let radius = 1; radius < Math.max(gridWidth, gridHeight) && !found; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = endPos.x + dx, ny = endPos.y + dy;
            if (
              nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight &&
              grid[ny][nx] === EMPTY && isReachable(startPos, {x: nx, y: ny}, grid)
            ) {
              grid[endPos.y][endPos.x] = EMPTY;
              endPos = {x: nx, y: ny};
              grid[endPos.y][endPos.x] = END;
              found = true; break;
            }
          }
          if (found) break;
        }
      }
    }
  }

  /* ---------- pointer events ---------- */
  let drawing=false;
  canvas.addEventListener('mousedown',e=>{
    if(isRunning) return;
    drawing=true; const c=pointerToCell(e); if(inBounds(c)){ editCell(c); drawGrid(); }
  });
  canvas.addEventListener('mousemove',e=>{
    if(isRunning || !drawing) return;
    const c=pointerToCell(e); if(inBounds(c)){ editCell(c); drawGrid(); }
  });
  window.addEventListener('mouseup',()=>drawing=false);
  const touchHandler = (type) => (e)=>{
    e.preventDefault();
    const t=e.touches[0];
    canvas.dispatchEvent(new MouseEvent(type,{clientX:t.clientX, clientY:t.clientY}));
  };
  canvas.addEventListener('touchstart',touchHandler('mousedown'),{passive:false});
  canvas.addEventListener('touchmove', touchHandler('mousemove'),{passive:false});
  canvas.addEventListener('touchend', ()=> window.dispatchEvent(new Event('mouseup')));

  /* ---------- algorithm harness ---------- */
  function spawnAlgorithm(){
    const {class:Algo} = ALGORITHMS.find(a=>a.id===algorithmSelect.value);
    return new Algo(grid, startPos, endPos, cellSize, gridWidth, gridHeight);
  }
  const step = ()=>{
    const {status} = currentAlgorithm.step();
    if(status==='found' || status==='no-path'){
      clearInterval(intervalId);
      isRunning=false;
      startBtn.innerHTML='&#9658;';
      stopElapsedTime();
    }
    drawGrid();
  };

  /* ---------- controls ---------- */
  startBtn.addEventListener('click',()=>{
    if(isRunning){
      clearInterval(intervalId); isRunning=false; startBtn.innerHTML='&#9658;';
      stopElapsedTime();
      return;
    }
    currentAlgorithm = spawnAlgorithm();
    currentAlgorithm.init();
    isRunning=true;
    startBtn.innerHTML='&#10073;&#10073;';
    resetElapsedTime();
    startElapsedTime();
    intervalId = setInterval(step, +speedSelect.value);
  });
  resetBtn.addEventListener('click',()=>{
    clearInterval(intervalId);
    isRunning=false;
    startBtn.innerHTML='&#9658;';
    setDefaultPositions();
    initGrid(); drawGrid();
    resetElapsedTime();
  });
  speedSelect.addEventListener('change',()=>{
    if(isRunning){
      clearInterval(intervalId);
      intervalId = setInterval(step, +speedSelect.value);
    }
  });
  algorithmSelect.addEventListener('change',()=>{
    clearInterval(intervalId); isRunning=false; startBtn.innerHTML='&#9658;';
    grid.forEach(row=> row.forEach((v,i)=>{ if([VISITED,FRONTIER,PATH].includes(v)) row[i]=EMPTY; }));
    drawGrid();
    resetElapsedTime();
  });
  densitySelect.addEventListener('change', () => {
    const d = DENSITIES[densitySelect.value];
    gridWidth = d.cols; gridHeight = d.rows;
    setDefaultPositions();
    initGrid(); resizeCanvas();
    resetElapsedTime();
  });
  mazeBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    isRunning = false;
    generateMaze();
    drawGrid();
    resetElapsedTime();
  });

  /* ---------- boot ---------- */
  // Grid density
  const d = DENSITIES[densitySelect.value];
  gridWidth = d.cols; gridHeight = d.rows;
  setDefaultPositions();
  initGrid();
  renderToolButtons();
  updateCursor();
  resizeCanvas();
  drawGrid();

  console.info('%cPathfinding visualizer ready', 'color:#4f8cff');
});
