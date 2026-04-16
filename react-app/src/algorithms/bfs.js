// bfs.js - Breadth-First Search
// BFS explores neighbors level by level and guarantees the shortest path in an unweighted grid.

export async function runBFS(cells, start, end, neighbors, stepCb, isAborted, passCallback){
  for(const row of cells){ for(const n of row){ n.g=Infinity; n.parent=null; } }
  const q=[start]; start.g=0;
  const visited=new Set([start]);
  let depth = 0;
  while(q.length && !isAborted()){
    const levelSize = q.length;
    for(let i=0;i<levelSize;i++){
      const current = q.shift();
      if(current===end){ return true; }
      const updated=[];
      for(const n of neighbors(current)){
        if(visited.has(n)) continue;
        visited.add(n);
        n.parent=current; n.g=current.g+1;
        q.push(n);
        updated.push(n);
      }
      await stepCb(current, updated, (node)=>node.g);
    }
    // a full breadth level (pass) is complete
    if(typeof passCallback === 'function') await passCallback({ algo: 'bfs', pass: depth });
    depth++;
  }
  return false;
}
