export const BLAST={size:7,moves:30,target:2500,bonusTarget:4000,coins:200,bonusCoins:100,points:40};
export function blastMatches(board){const n=BLAST.size,out=new Set();for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x,v=board[i];if(!v)continue;if(x<=n-3&&v===board[i+1]&&v===board[i+2]){let k=x;while(k<n&&board[y*n+k]===v)out.add(y*n+k++);}if(y<=n-3&&v===board[i+n]&&v===board[i+n*2]){let k=y;while(k<n&&board[k*n+x]===v)out.add(k++*n+x);}}return [...out];}
export function blastAdjacent(a,b){return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<49&&b<49&&Math.abs(a%7-b%7)+Math.abs(Math.floor(a/7)-Math.floor(b/7))===1;}
export function blastLegalMoves(board){const out=[];for(let a=0;a<49;a++)for(const b of [a+1,a+7])if(blastAdjacent(a,b)){const test=[...board];[test[a],test[b]]=[test[b],test[a]];if(blastMatches(test).length)out.push([a,b]);}return out;}
export class BlastPuzzle{
 constructor(saved=null){this.seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;this.score=0;this.moves=BLAST.moves;this.turns=0;this.status='playing';this.board=[];if(saved)Object.assign(this,saved,{board:[...saved.board]});else this.newBoard();}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 newBoard(){for(let attempt=0;attempt<200;attempt++){this.board=[];for(let i=0;i<49;i++){const available=[1,2,3,4,5].filter(v=>!(i%7>=2&&this.board[i-1]===v&&this.board[i-2]===v)&&!(i>=14&&this.board[i-7]===v&&this.board[i-14]===v));this.board.push(available[Math.floor(this.random()*available.length)]);}if(blastLegalMoves(this.board).length)return;}this.board=Array.from({length:49},(_,i)=>1+(i%7+Math.floor(i/7))%5);this.board[0]=1;this.board[1]=2;this.board[2]=1;this.board[8]=1;}
 snapshot(){const {seed,score,moves,turns,status,board}=this;return {seed,score,moves,turns,status,board:[...board]};}
 swap(a,b){if(this.status!=='playing'||!blastAdjacent(a,b))return null;[this.board[a],this.board[b]]=[this.board[b],this.board[a]];if(!blastMatches(this.board).length){[this.board[a],this.board[b]]=[this.board[b],this.board[a]];return null;}
 this.moves--;this.turns++;const frames=[];let chain=0,matches=blastMatches(this.board);
 while(matches.length&&chain<40){chain++;frames.push({board:[...this.board],cells:matches,chain});this.score+=matches.length*BLAST.points*Math.min(chain,5);for(const i of matches)this.board[i]=0;
  for(let x=0;x<7;x++){const col=[];for(let y=6;y>=0;y--)if(this.board[y*7+x])col.push(this.board[y*7+x]);for(let y=6;y>=0;y--)this.board[y*7+x]=col[6-y]||1+Math.floor(this.random()*5);}matches=blastMatches(this.board);
 }
 let shuffled=false;if(matches.length||!blastLegalMoves(this.board).length){this.newBoard();shuffled=true;}if(this.moves<=0)this.status='over';return {frames,chain,shuffled};}
}
