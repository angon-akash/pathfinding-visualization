// scripts/algorithms/bfs.js
import { EventEmitter } from '../utils/eventEmitter.js';

// Unweighted Breadth‑First Search (guarantees shortest path length on grids)
export class BFSAlgorithm extends EventEmitter {
  constructor(grid,startPos,endPos,cellSize,gridWidth,gridHeight){
    super();
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
      rebuild(this.came,current,this);
      return {status:'found'};
    }

    this.emit('visit', current);

    for(const n of neighbors(current,this)){
      const nk=key(n);
      if(this.vis.has(nk)) continue;
      this.vis.add(nk);
      this.came[nk]=current;
      this.queue.push(n);
      this.emit('frontier', n);
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
function rebuild(came,current,algo){
  while(came[key(current)]){
    current=came[key(current)];
    algo.emit('path', current);
  }
}