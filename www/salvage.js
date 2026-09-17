export const SALVAGE={size:8,target:2500,baseCoins:300,bonusAt:5000,bonusCoins:100,rareAt:10000,maxCharges:3,placement:5,lineBase:100,lineExtra:25,chainGrace:2,maxChain:5};
export const SHAPES=[[[0,0]],[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]],[[0,0],[0,1],[1,1]],[[0,0],[0,1],[0,2],[1,2]],[[1,0],[1,1],[0,2],[1,2]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[0,2],[0,3]],[[0,0],[0,1],[0,2],[1,2],[2,2]],Array.from({length:9},(_,i)=>[i%3,Math.floor(i/3)])];
export function valid(board,shape,x,y){return Number.isInteger(x)&&Number.isInteger(y)&&shape.every(([dx,dy])=>x+dx>=0&&x+dx<8&&y+dy>=0&&y+dy<8&&!board[(y+dy)*8+x+dx]);}
export function placements(board,shape){const out=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(valid(board,shape,x,y))out.push([x,y]);return out;}
export function clearLines(board){const rows=[],cols=[];for(let i=0;i<8;i++){if(board.slice(i*8,i*8+8).every(Boolean))rows.push(i);if(Array.from({length:8},(_,y)=>board[y*8+i]).every(Boolean))cols.push(i);}const cells=[];for(let i=0;i<64;i++)if(rows.includes(Math.floor(i/8))||cols.includes(i%8))cells.push(i);for(const i of cells)board[i]=0;return {lines:rows.length+cols.length,cells};}
export class SalvagePuzzle{
 constructor(random=Math.random,saved=null){this.random=random;Object.assign(this,{board:Array(64).fill(0),tray:[],score:0,chain:0,misses:0,moves:0,status:'playing',overtime:false,targetShown:false},saved||{});if(!this.tray.length)this.generate();}
 snapshot(){const {board,tray,score,chain,misses,moves,status,overtime,targetShown}=this;return {board:[...board],tray:tray.map(p=>p?{...p}:null),score,chain,misses,moves,status,overtime,targetShown};}
 generate(){
  // Plan a legal sequence on a scratch board, including clears, then shuffle its order.
  const scratch=[...this.board],pieces=[];
  for(let slot=0;slot<3;slot++){
   const options=SHAPES.map((shape,id)=>({id,spots:placements(scratch,shape),weight:shape.length<=3?5:shape.length<=5?3:this.moves<9?.2:1})).filter(o=>o.spots.length);
   if(!options.length)break;
   let roll=this.random()*options.reduce((n,o)=>n+o.weight,0),pick=options.at(-1);for(const o of options){roll-=o.weight;if(roll<0){pick=o;break;}}
   const [x,y]=pick.spots[Math.min(pick.spots.length-1,Math.floor(this.random()*pick.spots.length))];for(const [dx,dy] of SHAPES[pick.id])scratch[(y+dy)*8+x+dx]=1;clearLines(scratch);
   pieces.push({shape:pick.id,material:1+Math.floor(this.random()*5)});
  }
  for(let i=pieces.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[pieces[i],pieces[j]]=[pieces[j],pieces[i]];}
  this.tray=pieces;this.check();
 }
 check(){if(!this.tray.some(p=>p&&placements(this.board,SHAPES[p.shape]).length))this.status='over';return this.status;}
 place(slot,x,y){const p=this.tray[slot];if(this.status!=='playing'||!p||!valid(this.board,SHAPES[p.shape],x,y))return null;
  const shape=SHAPES[p.shape];for(const [dx,dy] of shape)this.board[(y+dy)*8+x+dx]=p.material;this.tray[slot]=null;this.moves++;
  const result=clearLines(this.board);this.score+=shape.length*SALVAGE.placement;
  if(result.lines){this.chain=Math.min(SALVAGE.maxChain,this.chain+1);this.misses=0;this.score+=(SALVAGE.lineBase*result.lines+SALVAGE.lineExtra*result.lines*(result.lines-1))*this.chain;}else if(++this.misses>SALVAGE.chainGrace)this.chain=0;
  if(this.tray.every(p=>!p))this.generate();else this.check();return result;
 }
}

export const SALVAGE_MILESTONES=[[1,'coins',100],[5,'cosmetic','ion'],[10,'coins',500],[20,'cosmetic','arctic'],[30,'component','phase_module'],[50,'cosmetic','salvage-veteran']];
