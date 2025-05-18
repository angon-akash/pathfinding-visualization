// Random Walk Algorithm (not guaranteed to find shortest path)
export class RandomWalkAlgorithm {
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
    this.current = this.startPos;
    this.came = {};
    this.vis = new Set([`${this.startPos.x},${this.startPos.y}`]);
    this.done = false;
  }
  step() {
    if(this.done) return {status:'found'};
    if(this.current.x===this.endPos.x && this.current.y===this.endPos.y){
      let c=this.current;
      while(this.came[`${c.x},${c.y}`]){
        c=this.came[`${c.x},${c.y}`];
        if(this.grid[c.y][c.x]!==this.START) this.grid[c.y][c.x]=this.PATH;
      }
      this.done = true;
      return {status:'found'};
    }
    this.grid[this.current.y][this.current.x]=this.VISITED;
    let nodesVisited = 1;
    // Get all valid neighbors
    const dirs = [{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}];
    const neighbors = dirs.map(d=>({x:this.current.x+d.x,y:this.current.y+d.y}))
      .filter(n=>
        n.x>=0&&n.x<this.gridWidth&&n.y>=0&&n.y<this.gridHeight&&
        this.grid[n.y][n.x]!==this.WALL&&!this.vis.has(`${n.x},${n.y}`)
      );
    if(neighbors.length === 0) return {status:'no-path'};
    // Pick a random neighbor
    const next = neighbors[Math.floor(Math.random()*neighbors.length)];
    this.came[`${next.x},${next.y}`]=this.current;
    this.vis.add(`${next.x},${next.y}`);
    this.grid[next.y][next.x]=this.FRONTIER;
    this.current = next;
    return {status:'running', nodesVisited};
  }
}