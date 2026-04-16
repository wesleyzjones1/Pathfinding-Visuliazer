// dijkstra.js - Dijkstra's algorithm
// Dijkstra is A* with h=0 (no heuristic). It finds the shortest path on graphs with non-negative weights.

export async function runDijkstra(cells, start, end, neighbors, stepCb, isAborted, passCallback){
  for(const row of cells){ for(const n of row){ n.g=Infinity; n.h=0; n.f=Infinity; n.parent=null; } }
  start.g = 0; start.f = 0;
  const open = [start];
  const closed = new Set();
  
  while(open.length && !isAborted()){
    open.sort((a,b)=>a.g-b.g);
    const current = open.shift();
    if(current===end){ return true; }
    closed.add(current);
    const updated=[];
    for(const n of neighbors(current)){
      if(closed.has(n)) continue;
      const tentativeG = current.g + 1;
      if(tentativeG < n.g){
        n.parent=current; n.g=tentativeG; n.f=n.g; // f mirrors g
        if(!open.includes(n)) open.push(n);
        updated.push(n);
      }
    }
    await stepCb(current, updated, (node)=>node.g);
  }
  return false;
}
