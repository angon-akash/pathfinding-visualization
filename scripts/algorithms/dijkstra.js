import { EventEmitter } from '../utils/eventEmitter.js';

// scripts/algorithms/dijkstra.js
export class DijkstraAlgorithm extends EventEmitter {
  constructor(grid,startPos,endPos,cellSize,gridWidth,gridHeight){
    super();
    Object.assign(this,{grid,startPos,endPos,cellSize,gridWidth,gridHeight});
    this.EMPTY=0;this.WALL=1;this.START=2;this.END=3;
    this.VISITED=4;this.FRONTIER=5;this.PATH=6;
  }

  init(){
    for(let y=0;y<this.gridHeight;y++)
      for(let x=0;x<this.gridWidth;x++)
        if([this.VISITED,this.FRONTIER,this.PATH].includes(this.grid[y][x]))
          this.grid[y][x]=this.EMPTY;

    this.dist   = {[k(this.startPos)]:0};
    this.came   = {};
    this.queue  = [this.startPos];
    this.closed = new Set();
  }

  step(){
    if(!this.queue.length) return {status:'no-path'};

    this.queue.sort((a,b)=> (this.dist[k(a)]??Infinity)-(this.dist[k(b)]??Infinity));
    const current=this.queue.shift();
    const currentKey=k(current);
    if(this.closed.has(currentKey)) return {status:'running'};
    this.closed.add(currentKey);

    if(current.x===this.endPos.x && current.y===this.endPos.y){
      rebuild(this.came,current,this);
      return {status:'found'};
    }

    this.emit('visit', current);

    for(const n of neighbors(current,this)){
      const nk=k(n);
      if(this.closed.has(nk)) continue;
      const alt=(this.dist[currentKey]??Infinity)+1;
      if(alt < (this.dist[nk]??Infinity)){
        this.dist[nk]=alt;
        this.came[nk]=current;
        if(!this.queue.some(p=>p.x===n.x&&p.y===n.y)){
          this.queue.push(n);
          this.emit('frontier', n);
        }
      }
    }
    return {status:'running'};
  }
}

const dirs=[{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}];
function neighbors({x,y},ctx){
  return dirs.map(d=>({x:x+d.x,y:y+d.y}))
             .filter(p=>p.x>=0&&p.x<ctx.gridWidth&&p.y>=0&&p.y<ctx.gridHeight &&
                        ctx.grid[p.y][p.x]!==ctx.WALL);
}
const k=p=>`${p.x},${p.y}`;
function rebuild(came,current,algo){
  while(came[k(current)]){
    current=came[k(current)];
    algo.emit('path', current);
  }
}