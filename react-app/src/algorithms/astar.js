// astar.js - A* pathfinding
// A* uses a heuristic (here Manhattan distance) to guide the search.
// It maintains open and closed sets, updating g (cost so far), h (heuristic), and f=g+h.
// Each iteration picks the node with the lowest f from the open set.

export async function runAStar(cells, start, end, neighbors, stepCb, isAborted, passCallback){
  // init
  for(const row of cells){ for(const n of row){ n.g=Infinity; n.h=Infinity; n.f=Infinity; n.parent=null; } }
  start.g = 0; start.h = Math.abs(start.r-end.r)+Math.abs(start.c-end.c); start.f = start.h;
  const open = [start];
  const closed = new Set();

  while(open.length && !isAborted()){
    open.sort((a,b)=>a.f-b.f);
    const current = open.shift();
    if(current===end){ return true; }
    closed.add(current);
    const updated=[];
    for(const n of neighbors(current)){
      if(closed.has(n)) continue;
      const tentativeG = current.g + 1;
      if(tentativeG < n.g){
        n.parent=current; n.g=tentativeG; n.h=Math.abs(n.r-end.r)+Math.abs(n.c-end.c); n.f=n.g+n.h;
        if(!open.includes(n)) open.push(n);
        updated.push(n);
      }
    }
    await stepCb(current, updated, (node)=>node.f);
  }
  return false;
}
