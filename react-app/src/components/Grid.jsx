import { useEffect, useCallback } from 'react';
import { CELL_SIZE, MODES } from '../constants';
import Cell from './Cell';

export default function Grid({ cells, rows, cols, cellSize = CELL_SIZE, algo, onCellInteraction, mouseRef, mode }) {
  useEffect(() => {
    const up = () => { mouseRef.current.down = false; };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [mouseRef]);

  const onContextMenu = useCallback(e => e.preventDefault(), []);

  if (!rows || !cols || !cells.length) return null;

  return (
    <div
      id="grid"
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        '--cell-size': `${cellSize}px`,
      }}
      onContextMenu={onContextMenu}
    >
      {cells.flat().map(cell => (
        <Cell
          key={`${cell.r}-${cell.c}`}
          cell={cell}
          algo={algo}
          onPointerDown={(e) => {
            if (e.pointerType === 'touch') e.preventDefault();
            mouseRef.current.down = true;
            const button = typeof e.button === 'number' && e.button >= 0 ? e.button : 0;
            mouseRef.current.button = button;
            // set dragMode based on initial cell state so dragging can erase if started on a built cell
            if (mode === MODES.WALL) {
              mouseRef.current.dragMode = (cell.state === 'wall') ? 'erase' : 'draw';
            } else if (mode === MODES.START) {
              mouseRef.current.dragMode = (cell.state === 'start') ? 'erase' : 'draw';
            } else if (mode === MODES.END) {
              mouseRef.current.dragMode = (cell.state === 'end') ? 'erase' : 'draw';
            }
            // treat the initial mousedown as a drag action so the clicked cell is updated immediately
            onCellInteraction(cell.r, cell.c, true, button);
            // prevent the subsequent click event from toggling the same cell
            mouseRef.current.suppressNextClick = `${cell.r}-${cell.c}`;
          }}
          onPointerEnter={() => {
            if (mouseRef.current.down && mode === MODES.WALL) {
              onCellInteraction(cell.r, cell.c, true, mouseRef.current.button);
            }
          }}
          onClick={(e) => {
            // ignore the click if it immediately follows a mousedown we already handled
            const key = `${cell.r}-${cell.c}`;
            if (mouseRef.current.suppressNextClick === key) {
              mouseRef.current.suppressNextClick = null;
              return;
            }
            if (mode !== MODES.WALL) onCellInteraction(cell.r, cell.c, false, e.button);
          }}
        />
      ))}
    </div>
  );
}
