// scripts/algorithms/bfs.js
// Unweighted Breadth‑First Search (guarantees shortest path length on grids)
export class BFSAlgorithm{
  constructor(grid,startPos,endPos,cellSize,gridWidth,gridHeight){
    Object.assign(this,{grid,startPos,endPos,cellSize,gridWidth,gridHeight});
    this.EMPTY=0;this.WALL=1;this.START=2;this.END=3;
    this.VISITED=4;this.FRONTIER=5;this.PATH=6;
  }

  init(){
    /* wipe previous run */
    for(let y=0;y<this.gridHeight;y++)
      for(let x=0;x<this.gridWidth;x++)
        if([this.VISITED,this.FRONTIER,this.PATH].includes(this.grid[y][x]))
          this.grid[y][x]=this.EMPTY;

    this.queue=[this.startPos];
    this.came={};
    this.vis=new Set([key(this.startPos)]);
  }

  step(){
    if(!this.queue.length) return {status:'no-path'};

    const current=this.queue.shift();

    /* reached destination */
    if(current.x===this.endPos.x && current.y===this.endPos.y){
      rebuild(this.came,current,this.grid,{START:this.START,PATH:this.PATH});
      return {status:'found'};
    }

    paint(this.grid,current,this.VISITED,this.START,this.END);

    for(const n of neighbors(current,this)){
      const nk=key(n);
      if(this.vis.has(nk)) continue;
      this.vis.add(nk);
      this.came[nk]=current;
      this.queue.push(n);
      paint(this.grid,n,this.FRONTIER,this.START,this.END);
    }
    return {status:'running'};
  }
}

/* helpers */
const dirs=[{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}];
function neighbors({x,y},ctx){
  return dirs.map(d=>({x:x+d.x,y:y+d.y}))
             .filter(p=>p.x>=0&&p.x<ctx.gridWidth&&p.y>=0&&p.y<ctx.gridHeight &&
                        ctx.grid[p.y][p.x]!==ctx.WALL);
}
const key=p=>`${p.x},${p.y}`;
function paint(grid,{x,y},state,start,end){
  if(![start,end].includes(grid[y][x])) grid[y][x]=state;
}
function rebuild(came,current,grid,{START,PATH}){
  while(came[key(current)]){
    current=came[key(current)];
    if(grid[current.y][current.x]!==START) grid[current.y][current.x]=PATH;
  }
}