// dfs.js - Depth-First Search
// DFS explores as far as possible along each branch before backtracking. It does not guarantee shortest path.

export async function runDFS(cells, start, end, neighbors, stepCb, isAborted, passCallback){
  for(const row of cells){ for(const n of row){ n.g=Infinity; n.parent=null; } }
  const stack=[start]; start.g=0;
  const visited=new Set();
  while(stack.length && !isAborted()){
    const current = stack.pop();
    if(visited.has(current)) continue;
    visited.add(current);
    if(current===end){ return true; }
    const updated=[];
    for(const n of neighbors(current)){
      if(visited.has(n)) continue;
      n.parent=current;
      n.g = current.g+1;
      stack.push(n);
      updated.push(n);
    }
    await stepCb(current, updated, (node)=>node.g);
  }
  return false;
}
