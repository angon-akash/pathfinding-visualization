// Bidirectional Breadth-First Search Algorithm
export class BidirectionalBFSAlgorithm {
  constructor(grid, startPos, endPos, cellSize, gridWidth, gridHeight) {
    Object.assign(this, {grid, startPos, endPos, cellSize, gridWidth, gridHeight});
    this.EMPTY=0;this.WALL=1;this.START=2;this.END=3;
    this.VISITED=4;this.FRONTIER=5;this.PATH=6;
  }
  init() {
    for(let y=0;y<this.gridHeight;y++)
      for(let x=0;x<this.gridWidth;x++)
        if([this.VISITED,this.FRONTIER,this.PATH].includes(this.grid[y][x]))
          this.grid[y][x]=this.EMPTY;
    this.queueA = [this.startPos];
    this.queueB = [this.endPos];
    this.visA = new Set([key(this.startPos)]);
    this.visB = new Set([key(this.endPos)]);
    this.cameA = {};
    this.cameB = {};
    this.meeting = null;
  }
  step() {
    if (!this.queueA.length || !this.queueB.length) return {status:'no-path'};
    // Expand from start
    if (this.expand(this.queueA, this.visA, this.visB, this.cameA, true)) return {status:'found'};
    // Expand from end
    if (this.expand(this.queueB, this.visB, this.visA, this.cameB, false)) return {status:'found'};
    return {status:'running'};
  }
  expand(queue, visThis, visOther, came, fromStart) {
    const current = queue.shift();
    paint(this.grid, current, this.VISITED, this.START, this.END);
    for (const n of neighbors(current, this)) {
      const nk = key(n);
      if (visThis.has(nk)) continue;
      visThis.add(nk);
      came[nk] = current;
      if (visOther.has(nk)) {
        this.meeting = n;
        this.rebuildPath();
        return true;
      }
      queue.push(n);
      paint(this.grid, n, this.FRONTIER, this.START, this.END);
    }
    return false;
  }
  rebuildPath() {
    // Path from start to meeting
    let c = this.meeting;
    while (this.cameA[key(c)]) {
      c = this.cameA[key(c)];
      if (this.grid[c.y][c.x] !== this.START) this.grid[c.y][c.x] = this.PATH;
    }
    // Path from end to meeting
    c = this.meeting;
    while (this.cameB[key(c)]) {
      c = this.cameB[key(c)];
      if (this.grid[c.y][c.x] !== this.END) this.grid[c.y][c.x] = this.PATH;
    }
  }
}

const dirs = [{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}];
function neighbors({x,y},ctx){
  return dirs.map(d=>({x:x+d.x,y:y+d.y}))
             .filter(p=>p.x>=0&&p.x<ctx.gridWidth&&p.y>=0&&p.y<ctx.gridHeight &&
                        ctx.grid[p.y][p.x]!==ctx.WALL);
}
const key=p=>`${p.x},${p.y}`;
function paint(grid,{x,y},state,start,end){
  if(![start,end].includes(grid[y][x])) grid[y][x]=state;
}