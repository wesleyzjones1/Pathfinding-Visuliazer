import { ALGORITHMS, MODES, PRESETS } from '../constants';

export default function Controls({ algo, onAlgoChange, mode, onModeChange, speed, onSpeedChange, theme, onThemeToggle, onRun, onReset, onPreset }) {
  return (
    <>
      <div className="controls-row">
        <button className={`ctrl-btn${mode === MODES.START ? ' active' : ''}`} onClick={() => onModeChange(MODES.START)}>
          <span className="btn-dot dot-start"></span>Start
        </button>
        <button className={`ctrl-btn${mode === MODES.END ? ' active' : ''}`} onClick={() => onModeChange(MODES.END)}>
          <span className="btn-dot dot-end"></span>End
        </button>
        <button className={`ctrl-btn${mode === MODES.WALL ? ' active' : ''}`} onClick={() => onModeChange(MODES.WALL)}>
          <span className="btn-dot dot-wall"></span>Wall
        </button>
        <div className="algo-group">
          <label className="algo-label">Algorithm</label>
          <select id="algo-select" value={algo} onChange={e => onAlgoChange(e.target.value)}>
            {ALGORITHMS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
      </div>
      <div className="controls-row">
        <button className="action-btn run-btn" onClick={onRun}>&#9654; Run</button>
        <button className="action-btn secondary" onClick={onReset}>&#8635; Reset</button>
        <div className="slider-group">
          <label className="slider-label">Speed</label>
          <input id="speed" type="range" min="1" max="500" step="1" value={speed} onChange={e => onSpeedChange(Number(e.target.value))} />
        </div>
        <label className="theme-switch" title="Toggle light/dark mode">
          <input type="checkbox" checked={theme === 'dark'} onChange={onThemeToggle} />
          <span className="theme-track">
            <span className="theme-icon theme-icon-light">&#9788;</span>
            <span className="theme-icon theme-icon-dark">&#9790;</span>
            <span className="theme-thumb"></span>
          </span>
        </label>
      </div>
      <div className="controls-row preset-row">
        <span className="preset-label">Presets</span>
        {PRESETS.map(p => (
          <button key={p.value} className="preset-btn" onClick={() => onPreset(p.value)}>{p.label}</button>
        ))}
      </div>
    </>
  );
}
