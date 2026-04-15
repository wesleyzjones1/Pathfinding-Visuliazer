import { runIDDFS } from '../algorithms/iddfs.js';
import { runBFS } from '../algorithms/bfs.js';

async function runTest(gridRows, gridCols, walls, startPos, endPos){
  // build cells like in app.js
  const cells = [];
  for(let r=0;r<gridRows;r++){
    const row=[];
    for(let c=0;c<gridCols;c++){
      row.push({ r, c, state: 'empty', g: Infinity, h: Infinity, f: Infinity, parent: null });
    }
    cells.push(row);
  }
  for(const w of walls){
    cells[w.r][w.c].state='wall';
  }
  const start = cells[startPos.r][startPos.c];
  const end = cells[endPos.r][endPos.c];

  const neighbors = (cell)=>{
    const list=[];
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    for(const [dr,dc] of dirs){
      const nr = cell.r + dr, nc = cell.c + dc;
      if(nr>=0 && nr<gridRows && nc>=0 && nc<gridCols){
        const n = cells[nr][nc];
        if(n.state !== 'wall') list.push(n);
      }
    }
    return list;
  };

  let iterations=0;
  const stepCb = async (current, updated, metric)=>{ iterations++; /* no delay */ };
  const isAborted = ()=> false;
  let passCount = 0;
  const passCb = async (info)=>{ passCount++; /*small no-op*/ };
  const ok = await runIDDFS(cells, start, end, neighbors, stepCb, isAborted, passCb);
  const bfsOk = await runBFS(cells, start, end, neighbors, stepCb, isAborted, passCb);

  // compute path length if ok
  let pathLength = 0;
  if(ok){
    let cur=end; let safety=0; const maxSafety = gridRows * gridCols * 2;
    while(cur && safety < maxSafety){ pathLength++; cur = cur.parent; safety++; }
    pathLength--; if(pathLength < 0) pathLength = 0;
  }

  return { ok, iterations, pathLength, bfsOk, passCount };
}

(async ()=>{
  const tests = [
    {
      name: 'Simple 1 row 3 cols, direct',
      grid: [1,3], walls: [], start:[0,0], end:[0,2], expected:2
    },
    {
      name: '3x3 with wall blocking direct, alternate path available',
      grid: [3,3], walls: [{r:0,c:1}], start:[0,0], end:[0,2], expected:4
    },
    {
      name: 'No path due to walls',
      grid: [3,3], walls: [{r:0,c:1},{r:1,c:0},{r:1,c:1},{r:1,c:2}], start:[0,0], end:[0,2], expected:null
    },
    {
      name: 'Larger 8x8 with winding walls',
      grid: [8,8], walls:[
        {r:0,c:1},{r:1,c:1},{r:2,c:1},{r:3,c:1},{r:4,c:1},{r:5,c:1},{r:6,c:1},
        {r:6,c:2},{r:6,c:3},{r:6,c:4},{r:6,c:5},{r:6,c:6},
      ], start:[0,0], end:[7,7], expected: null // BFS may find path if openings
    },
  ];

  for(const t of tests){
    const res = await runTest(t.grid[0], t.grid[1], t.walls, {r:t.start[0],c:t.start[1]}, {r:t.end[0],c:t.end[1]});
    console.log('\nTest:', t.name);
  console.log(' ok:', res.ok, ' iterations:', res.iterations, ' pathLength:', res.pathLength, ' expected:', t.expected);
  console.log(' bfsOk:', res.bfsOk, ' passCount:', res.passCount);
  }
})();
