import { EventEmitter } from '../utils/eventEmitter.js';

export class AStarAlgorithm extends EventEmitter {
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

    this.openSet = [this.startPos];
    this.closed  = new Set();
    this.came    = {};
    this.gScore  = {[key(this.startPos)]:0};
    this.fScore  = {[key(this.startPos)]:heuristic(this.startPos,this.endPos)};
  }

  step(){
    if(!this.openSet.length) return {status:'no-path'};

    let best = 0;
    for(let i=1;i<this.openSet.length;i++){
      if(this.fScore[key(this.openSet[i])] <
         this.fScore[key(this.openSet[best])]) best=i;
    }
    const current=this.openSet.splice(best,1)[0];

    if(current.x===this.endPos.x && current.y===this.endPos.y){
      reconstructPath(this.came,current,this);
      return {status:'found'};
    }

    this.closed.add(key(current));
    this.emit('visit', current);

    for(const n of neighbors(current,this)){
      if(this.closed.has(key(n))) continue;

      const tentative = (this.gScore[key(current)]??Infinity)+1;
      if(tentative < (this.gScore[key(n)]??Infinity)){
        this.came[key(n)] = current;
        this.gScore[key(n)] = tentative;
        this.fScore[key(n)] = tentative + heuristic(n,this.endPos);
        if(!this.openSet.some(p=>p.x===n.x&&p.y===n.y)){
          this.openSet.push(n);
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
const key=p=>`${p.x},${p.y}`;
const heuristic=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function reconstructPath(came,current,algo){
  while(came[key(current)]){
    current=came[key(current)];
    algo.emit('path', current);
  }
}