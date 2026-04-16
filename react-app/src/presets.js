function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function generateMaze(rows, cols) {
  const walls = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) walls.push([r, c]);
  const carved = Array.from({ length: rows }, () => Array(cols).fill(false));
  function carve(r, c) {
    carved[r][c] = true;
    const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]];
    shuffle(dirs);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !carved[nr][nc]) {
        carved[r + dr / 2][c + dc / 2] = true;
        carve(nr, nc);
      }
    }
  }
  carve(1, 1);
  const wallSet = new Set();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (!carved[r][c]) wallSet.add(r + ',' + c);
  }
  walls.length = 0;
  for (const key of wallSet) { const [r, c] = key.split(',').map(Number); walls.push([r, c]); }
  return walls;
}

export function generateSpiral(rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
  let top = 1, bottom = rows - 2, left = 1, right = cols - 2;
  let dir = 0;
  while (top <= bottom && left <= right) {
    if (dir === 0) {
      for (let c = left; c <= right; c++) grid[top][c] = true;
      grid[top][right] = false;
      top += 2;
    } else if (dir === 1) {
      for (let r = top; r <= bottom; r++) grid[r][right] = true;
      grid[bottom][right] = false;
      right -= 2;
    } else if (dir === 2) {
      for (let c = right; c >= left; c--) grid[bottom][c] = true;
      grid[bottom][left] = false;
      bottom -= 2;
    } else {
      for (let r = bottom; r >= top; r--) grid[r][left] = true;
      grid[top][left] = false;
      left += 2;
    }
    dir = (dir + 1) % 4;
  }
  const walls = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c]) walls.push([r, c]);
  return walls;
}

export function generateFortress(rows, cols) {
  const cx = Math.floor(rows / 2), cy = Math.floor(cols / 2);
  const walls = [];
  for (let ring = 2; ring < Math.min(cx, cy); ring += 3) {
    const t = cx - ring, b = cx + ring, l = cy - ring, r = cy + ring;
    if (t < 0 || l < 0 || b >= rows || r >= cols) continue;
    const side = Math.floor(Math.random() * 4);
    const gapSize = 2;
    for (let c = l; c <= r; c++) { if (side === 0 && Math.abs(c - cy) <= gapSize) continue; walls.push([t, c]); }
    for (let c = l; c <= r; c++) { if (side === 2 && Math.abs(c - cy) <= gapSize) continue; walls.push([b, c]); }
    for (let rr = t + 1; rr < b; rr++) { if (side === 3 && Math.abs(rr - cx) <= gapSize) continue; walls.push([rr, l]); }
    for (let rr = t + 1; rr < b; rr++) { if (side === 1 && Math.abs(rr - cx) <= gapSize) continue; walls.push([rr, r]); }
  }
  return walls;
}

export function generateScatter(rows, cols, sr, sc, er, ec) {
  const density = 0.25;
  const isWall = Array.from({ length: rows }, () => Array(cols).fill(false));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if ((r === sr && c === sc) || (r === er && c === ec)) continue;
    if (Math.random() < density) isWall[r][c] = true;
  }
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent = Array.from({ length: rows }, () => Array(cols).fill(null));
  const queue = [[sr, sc]]; visited[sr][sc] = true;
  let found = false;
  while (queue.length) {
    const [r, c] = queue.shift();
    if (r === er && c === ec) { found = true; break; }
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && !isWall[nr][nc]) {
        visited[nr][nc] = true; parent[nr][nc] = [r, c]; queue.push([nr, nc]);
      }
    }
  }
  if (!found) {
    const v2 = Array.from({ length: rows }, () => Array(cols).fill(false));
    const p2 = Array.from({ length: rows }, () => Array(cols).fill(null));
    const q2 = [[sr, sc]]; v2[sr][sc] = true;
    while (q2.length) {
      const [r, c] = q2.shift();
      if (r === er && c === ec) break;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !v2[nr][nc]) {
          v2[nr][nc] = true; p2[nr][nc] = [r, c]; q2.push([nr, nc]);
        }
      }
    }
    let cur = [er, ec];
    while (cur) { isWall[cur[0]][cur[1]] = false; cur = p2[cur[0]][cur[1]]; }
  }
  const walls = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (isWall[r][c]) walls.push([r, c]);
  return walls;
}
