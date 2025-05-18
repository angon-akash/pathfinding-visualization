// Depth-First Search (DFS) Algorithm
export class DFSAlgorithm {
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
    this.stack=[this.startPos];
    this.came={};
    this.vis=new Set([`${this.startPos.x},${this.startPos.y}`]);
  }
  step() {
    if(!this.stack.length) return {status:'no-path'};
    const current=this.stack.pop();
    if(current.x===this.endPos.x && current.y===this.endPos.y){
      let c=current;
      while(this.came[`${c.x},${c.y}`]){
        c=this.came[`${c.x},${c.y}`];
        if(this.grid[c.y][c.x]!==this.START) this.grid[c.y][c.x]=this.PATH;
      }
      return {status:'found'};
    }
    this.grid[current.y][current.x]=this.VISITED;
    let nodesVisited = 1;
    for(const d of [{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}]){
      const n={x:current.x+d.x,y:current.y+d.y};
      const k=`${n.x},${n.y}`;
      if(n.x>=0&&n.x<this.gridWidth&&n.y>=0&&n.y<this.gridHeight&&
         this.grid[n.y][n.x]!==this.WALL&&!this.vis.has(k)){
        this.stack.push(n);
        this.came[k]=current;
        this.vis.add(k);
        this.grid[n.y][n.x]=this.FRONTIER;
      }
    }
    return {status:'running', nodesVisited};
  }
}