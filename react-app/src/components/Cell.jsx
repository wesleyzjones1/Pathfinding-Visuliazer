export default function Cell({ cell, algo, onPointerDown, onPointerEnter, onClick }) {
  const vis = cell.visual;
  let className = 'cell';
  if (vis === 'start') className += ' start fill';
  else if (vis === 'end') className += ' end fill';
  else if (vis === 'wall') className += ' wall fill';
  else if (vis === 'path') className += ' path fill';
  else if (vis === 'open') className += ' open';

  let circleColor = 'transparent';
  if (vis === 'start') circleColor = 'var(--start)';
  else if (vis === 'end') circleColor = 'var(--end)';
  else if (vis === 'wall') circleColor = 'var(--wall)';
  else if (vis === 'path') circleColor = `var(--${algo}-path, #69b3ff)`;

  let bgColor = '';
  if (vis === 'open') bgColor = `var(--${algo}-open)`;

  return (
    <div
      className={className}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onClick={onClick}
    >
      <div className="circle" style={{ backgroundColor: circleColor }} />
      <span className="label">{cell.label}</span>
    </div>
  );
}
