import { AStarAlgorithm }   from './algorithms/astar.js';
import { DijkstraAlgorithm }from './algorithms/dijkstra.js';
import { BFSAlgorithm }     from './algorithms/bfs.js';
// Add imports for new algorithms:
import { DFSAlgorithm }     from './algorithms/dfs.js';
import { GreedyAlgorithm }  from './algorithms/greedy.js';
import { RandomWalkAlgorithm } from './algorithms/randomwalk.js';
// Add new import:
import { BidirectionalBFSAlgorithm } from './algorithms/bidirectionalbfs.js';

/* ============================================================
   Config & State
============================================================ */
const cellSize = 28;
const DENSITIES = {
  tiny:    { cols: 12, rows: 8 },
  small:   { cols: 18, rows: 12 },
  medium:  { cols: 32, rows: 20 },
  large:   { cols: 44, rows: 28 },
  xlarge:  { cols: 60, rows: 38 },
  extreme: { cols: 80, rows: 50 },
  insane:  { cols: 120, rows: 80 } // Extremely high density
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

// Algorithm metadata: fastest to slowest (approximate order)
const ALGORITHMS = [
  {
    id:'astar',
    name:'A* (Shortest Path)',
    class:AStarAlgorithm,
    desc:'A* uses both path cost and a heuristic to efficiently find the shortest path. Fast and optimal on grids.'
  },
  {
    id:'greedy',
    name:'Greedy Best‑First',
    class:GreedyAlgorithm,
    desc:'Greedy Best-First Search explores nodes closest to the goal, using only the heuristic. Fast but not always optimal.'
  },
  {
    id:'dijkstra',
    name:'Dijkstra’s',
    class:DijkstraAlgorithm,
    desc:'Dijkstra’s algorithm explores all possible paths with the lowest cost first. Guarantees shortest path.'
  },
  {
    id:'bfs',
    name:'Breadth‑First Search',
    class:BFSAlgorithm,
    desc:'BFS explores all neighbors at the current depth before moving deeper. Guarantees shortest path on unweighted grids.'
  },
  {
    id:'bidirectionalbfs',
    name:'Bidirectional BFS',
    class:BidirectionalBFSAlgorithm,
    desc:'Bidirectional BFS runs two simultaneous searches from start and end, meeting in the middle. Very fast for large open grids.'
  },
  {
    id:'dfs',
    name:'Depth‑First Search',
    class:DFSAlgorithm,
    desc:'DFS explores as far as possible along each branch before backtracking. Fast but does not guarantee shortest path.'
  },
  {
    id:'random',
    name:'Random Walk',
    class:RandomWalkAlgorithm,
    desc:'Random Walk moves randomly until it finds the goal or gets stuck. Very slow and not guaranteed to find a path.'
  }
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

// Add stats variables and helpers near the top (after let elapsedTimer = null;)
let nodesExplored = 0;
let pathLength = 0;

function updateStatsDisplay() {
  document.getElementById('nodesExplored').textContent = `Nodes explored: ${nodesExplored}`;
  document.getElementById('pathLength').textContent = `Path length: ${pathLength}`;
}
function resetStats() {
  nodesExplored = 0;
  pathLength = 0;
  updateStatsDisplay();
}

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
  const speedSlider    = document.getElementById('speedSlider');
  const speedValue     = document.getElementById('speedValue');
  const algorithmSelect= document.getElementById('algorithmSelect');
  const densitySelect  = document.getElementById('densitySelect');
  const toolBtnsWrap   = document.getElementById('toolBtns');
  const mazeBtn        = document.getElementById('mazeButton');

  // --- Maze Type Dropdown ---
  let mazeTypeSelect = document.getElementById('mazeTypeSelect');
  if (!mazeTypeSelect) {
    mazeTypeSelect = document.createElement('select');
    mazeTypeSelect.id = 'mazeTypeSelect';
    mazeTypeSelect.style.marginLeft = '0.7em';
    mazeTypeSelect.title = 'Maze Complexity';
    mazeTypeSelect.innerHTML = `
      <option value="simple">Simple Maze</option>
      <option value="complex">Complex Maze</option>
    `;
    mazeBtn.parentElement.insertBefore(mazeTypeSelect, mazeBtn.nextSibling);
  }

  // Move algorithm description/title below the grid, after the legend
  const gridSection = document.querySelector('.grid-container');
  const legend = gridSection.querySelector('.legend');
  let algorithmDescWrap = document.getElementById('algorithmDescWrap');
  if (algorithmDescWrap) algorithmDescWrap.remove();
  algorithmDescWrap = document.createElement('div');
  algorithmDescWrap.id = 'algorithmDescWrap';
  algorithmDescWrap.style.margin = '1.2rem auto 0.5rem auto';
  algorithmDescWrap.style.padding = '0.7rem 0 0.5rem 0';
  algorithmDescWrap.style.textAlign = 'center';
  algorithmDescWrap.style.minHeight = '2.5em';
  algorithmDescWrap.style.fontSize = '1.08em';
  algorithmDescWrap.style.fontWeight = '500';
  algorithmDescWrap.style.color = 'var(--muted)';
  algorithmDescWrap.style.width = '100%';
  algorithmDescWrap.style.boxSizing = 'border-box';
  algorithmDescWrap.style.background = 'var(--surface)';
  algorithmDescWrap.style.borderRadius = '0 0 var(--radius) var(--radius)';
  algorithmDescWrap.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
  algorithmDescWrap.style.borderTop = '1px solid var(--muted)';
  legend.insertAdjacentElement('afterend', algorithmDescWrap);

  function updateAlgorithmDesc() {
    const algo = ALGORITHMS.find(a => a.id === algorithmSelect.value);
    if (algo) {
      algorithmDescWrap.innerHTML = `
        <div style="font-size:1.13em;font-weight:600;color:var(--text);margin-bottom:0.15em;">
          ${algo.name}
        </div>
        <div style="font-size:.98em;color:var(--muted);font-weight:400;">
          ${algo.desc}
        </div>
      `;
    } else {
      algorithmDescWrap.innerHTML = '';
    }
  }

  // --- Maze Generation Functions ---
  function generateSimpleMaze() {
    // Clear grid, then add a few random walls (not blocking start/end)
    for (let y = 0; y < gridHeight; y++)
      for (let x = 0; x < gridWidth; x++)
        if (grid[y][x] !== START && grid[y][x] !== END) grid[y][x] = EMPTY;
    // Place several random walls
    const wallCount = Math.floor((gridWidth * gridHeight) / 7);
    let placed = 0, tries = 0;
    while (placed < wallCount && tries++ < wallCount * 4) {
      const x = Math.floor(Math.random() * gridWidth);
      const y = Math.floor(Math.random() * gridHeight);
      if (
        grid[y][x] === EMPTY &&
        !(x === startPos.x && y === startPos.y) &&
        !(endPos && x === endPos.x && y === endPos.y)
      ) {
        grid[y][x] = WALL;
        placed++;
      }
    }
  }

  function generateComplexMaze() {
    // Use the existing recursive backtracker maze with loops
    generateMaze();
  }

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
        ctx.globalAlpha = state === FRONTIER ? 0.7 : 1;
        ctx.fillStyle =
          state===EMPTY   ? colors.empty   :
          state===WALL    ? colors.wall    :
          state===START   ? colors.start   :
          state===END     ? colors.end     :
          state===VISITED ? colors.visited :
          state===FRONTIER? colors.frontier: colors.path;
        ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
        ctx.globalAlpha = 1;

        // Glow for frontier/path
        if(state === FRONTIER || state === PATH) {
          ctx.save();
          ctx.shadowColor = state === FRONTIER ? colors.frontier : colors.path;
          ctx.shadowBlur = 12;
          ctx.strokeStyle = ctx.shadowColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(x*cellSize+1, y*cellSize+1, cellSize-2, cellSize-2);
          ctx.restore();
        }

        // Draw start/end as circles
        if(state === START || state === END) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            x*cellSize + cellSize/2,
            y*cellSize + cellSize/2,
            cellSize*0.35, 0, 2*Math.PI
          );
          ctx.fillStyle = state === START ? colors.start : colors.end;
          ctx.shadowColor = state === START ? colors.start : colors.end;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        }

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
  function editCell({x, y}) {
    // Always keep start and end on the grid
    if ((x === startPos.x && y === startPos.y) || (endPos && x === endPos.x && y === endPos.y)) {
      // Only allow moving start/end if using the corresponding tool
      if (currentTool === 'start' && !(x === endPos?.x && y === endPos?.y)) {
        grid[startPos.y][startPos.x] = EMPTY;
        startPos = {x, y};
        grid[y][x] = START;
      } else if (currentTool === 'end' && !(x === startPos.x && y === startPos.y)) {
        if (endPos) grid[endPos.y][endPos.x] = EMPTY;
        endPos = {x, y};
        grid[y][x] = END;
      }
      // Do not allow erase or wall tool to affect start/end
      return;
    }

    switch (currentTool) {
      case 'wall':
        // Don't overwrite start or end
        if (grid[y][x] !== START && grid[y][x] !== END) grid[y][x] = WALL;
        break;
      case 'erase':
        // Don't erase start or end
        if (grid[y][x] !== START && grid[y][x] !== END) grid[y][x] = EMPTY;
        break;
      case 'start':
        // Only move start if not on end or wall
        if (grid[y][x] !== END && grid[y][x] !== WALL) {
          grid[startPos.y][startPos.x] = EMPTY;
          startPos = {x, y};
          grid[y][x] = START;
        }
        break;
      case 'end':
        // Only move end if not on start or wall
        if (grid[y][x] !== START && grid[y][x] !== WALL) {
          if (endPos) grid[endPos.y][endPos.x] = EMPTY;
          endPos = {x, y};
          grid[y][x] = END;
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
    const {status, nodesVisited} = currentAlgorithm.step();
    nodesExplored += (nodesVisited || 0);
    if(status==='found'){
      // Count PATH cells (excluding start/end)
      pathLength = grid.flat().filter(v=>v===PATH).length;
    }
    updateStatsDisplay();
    if(status==='found' || status==='no-path'){
      clearInterval(intervalId);
      isRunning=false;
      startBtn.innerHTML='&#9658;';
      stopElapsedTime();
    }
    drawGrid();
  };

  /* ---------- controls ---------- */
  // Map slider value (1 = slowest, 10 = fastest) to interval ms
  function getIntervalFromSlider(val) {
    // 1 = slowest (400ms), 10 = fastest (0ms/instant)
    if (val == 10) return 0; // instant
    // Linear mapping: 1→400ms, 10→0ms
    return Math.round(400 * (1 - (val-1)/9));
  }

  function speedLabel(val) {
    return String(val);
  }

  speedValue.textContent = speedLabel(+speedSlider.value);

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
    intervalId = setInterval(step, getIntervalFromSlider(+speedSlider.value));
  });

  resetBtn.addEventListener('click',()=>{
    clearInterval(intervalId);
    isRunning=false;
    startBtn.innerHTML='&#9658;';
    setDefaultPositions();
    initGrid(); drawGrid();
    resetElapsedTime();
    resetStats();
  });
  speedSlider.addEventListener('input',()=>{
    speedValue.textContent = speedLabel(+speedSlider.value);
    if(isRunning){
      clearInterval(intervalId);
      intervalId = setInterval(step, getIntervalFromSlider(+speedSlider.value));
    }
  });
  algorithmSelect.addEventListener('change', () => {
    clearInterval(intervalId);
    isRunning = false;
    startBtn.innerHTML = '&#9658;';
    grid.forEach(row => row.forEach((v, i) => {
      if ([VISITED, FRONTIER, PATH].includes(v)) row[i] = EMPTY;
    }));
    drawGrid();
    resetElapsedTime();
    resetStats(); // Reset node and path counters
    updateAlgorithmDesc();
  });
  densitySelect.addEventListener('change', () => {
    const d = DENSITIES[densitySelect.value];
    gridWidth = d.cols; gridHeight = d.rows;
    setDefaultPositions();
    initGrid(); resizeCanvas();
    resetElapsedTime();
    resetStats();
  });
  mazeBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    isRunning = false;
    if (mazeTypeSelect.value === 'simple') {
      generateSimpleMaze();
    } else {
      generateComplexMaze();
    }
    drawGrid();
    resetElapsedTime();
    resetStats();
  });

  densitySelect.innerHTML = `
    <option value="tiny">12 × 8</option>
    <option value="small">18 × 12</option>
    <option value="medium" selected>32 × 20</option>
    <option value="large">44 × 28</option>
    <option value="xlarge">60 × 38</option>
    <option value="extreme">80 × 50</option>
    <option value="insane">120 × 80</option>
  `;

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
  resetStats();

  // On boot, show description
  updateAlgorithmDesc();

  console.info('%cPathfinding visualizer ready', 'color:#4f8cff');
  drawGrid();
});