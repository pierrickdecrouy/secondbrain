import React, { useState, useEffect } from 'react';
import { X, GearSix, ArrowLeft } from '@phosphor-icons/react';
import { usePomodoroStore, type PomodoroMode } from '../store/usePomodoroStore';
import { useTheme } from '../context/ThemeContext';

// ─── SVG Progress Ring ────────────────────────────────────────────────────────

interface ProgressRingProps {
    size: number;
    stroke: number;
    progress: number;
    color: string;
    trackColor: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ size, stroke, progress, color, trackColor }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
    return (
        <svg width={size} height={size} className={`-rotate-90 absolute top-0 left-0 ${trackColor}`} >
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                className="transition-[stroke-dashoffset,stroke] duration-[1s,600ms] ease-[linear,ease]" 
            />
        </svg>
    );
};

// ─── Mode tab ─────────────────────────────────────────────────────────────────

const ModeTab: React.FC<{
    label: string; active: boolean; color: string;
    onClick: () => void;
}> = ({ label, active, color, onClick }) => {
    
    
    
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 relative border-none ${active ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white dark:shadow-none' : 'bg-transparent text-slate-400 dark:text-white/35'} pomodoromodal-style-3`}
        >
            {label}
            {active && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full block" style={{ backgroundColor: color }} />
            )}
        </button>
    );
};

// ─── Settings slider ──────────────────────────────────────────────────────────

const SettingsSlider: React.FC<{
    label: string; value: number; min: number; max: number; step: number;
    color: string; onChange: (v: number) => void;
}> = ({ label, value, min, max, step, color, onChange }) => {
    const pct = ((value - min) / (max - min)) * 100;
    
    
    
    
    
    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-baseline">
                <span className="text-[13px] font-medium tracking-[0.02em] text-slate-500 dark:text-white/55">
                    {label}
                </span>
                <span className="text-[15px] font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {value}<span className="text-[11px] font-medium ml-0.5 text-slate-400 dark:text-white/40">min</span>
                </span>
            </div>
            <div className="relative h-[3px] rounded-full bg-black/5 dark:bg-white/10">
                <div className="absolute top-0 left-0 h-full rounded-full transition-[width] duration-100" style={{ width: `${pct}%`, background: color }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full pointer-events-none transition-[left] duration-100 bg-white" style={{
                    boxShadow: `0 0 0 3px ${color}60, 0 2px 6px rgba(0,0,0,0.25)`,
                }} />
                <input
                    type="range" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(parseInt(e.target.value))}
                    className="absolute -inset-y-1.5 inset-x-0 opacity-0 w-full cursor-pointer m-0"
                />
            </div>
        </div>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export const PomodoroModal: React.FC = () => {
    const {
        showModal, closeModal,
        settings, updateSettings,
        timeLeft, isRunning, mode, cycleCount,
        start, pause, reset,
    } = usePomodoroStore();

    const { darkMode } = useTheme();

    const [localFocus, setLocalFocus] = useState(settings.focus);
    const [localShort, setLocalShort] = useState(settings.shortBreak);
    const [localLong, setLocalLong] = useState(settings.longBreak);
    const [view, setView] = useState<'timer' | 'settings'>('timer');

    useEffect(() => {
        if (showModal) {
            setLocalFocus(settings.focus);
            setLocalShort(settings.shortBreak);
            setLocalLong(settings.longBreak);
            setView('timer');
        }
    }, [showModal, settings]);

    if (!showModal) return null;
    // Removed t theme tokens
// ── Mode config ─────────────────────────────────────────────────────────────
    const modeColors: Record<PomodoroMode, string> = {
        focus:      '#0d9488',
        shortBreak: '#6366f1',
        longBreak:  '#8b5cf6',
    };
    const modeLabels: Record<PomodoroMode, string> = {
        focus:      'Focus',
        shortBreak: 'Pause',
        longBreak:  'Longue',
    };
    const modeTotals: Record<PomodoroMode, number> = {
        focus:      settings.focus * 60,
        shortBreak: settings.shortBreak * 60,
        longBreak:  settings.longBreak * 60,
    };

    const color = modeColors[mode];
    const total = modeTotals[mode];
    const progress = total > 0 ? 1 - timeLeft / total : 0;
    const completedInRound = cycleCount % 4;

    const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const ss = (timeLeft % 60).toString().padStart(2, '0');

    const switchMode = (m: PomodoroMode) => {
        const mins = m === 'focus' ? settings.focus : m === 'shortBreak' ? settings.shortBreak : settings.longBreak;
        usePomodoroStore.setState({ mode: m, isRunning: false, timeLeft: mins * 60 });
    };

    const handleSave = () => {
        updateSettings({ focus: localFocus, shortBreak: localShort, longBreak: localLong });
        setView('timer');
    };

    const RING = 240;
    const STROKE = 8;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-[pomo-backdrop-in_0.25s_ease] backdrop-blur-[24px] bg-slate-900/45 dark:bg-slate-950/75"
        >
            <style>{`
                @keyframes pomo-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes pomo-card-in {
                    from { opacity: 0; transform: scale(0.93) translateY(14px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .pm-icon-btn:hover { background: ${darkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} !important; color: ${darkMode ? 'rgba(255,255,255,0.8)' : '#475569'} !important; }
                .pm-ctrl-btn:hover  { background: ${darkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'} !important; color: ${darkMode ? 'rgba(255,255,255,0.8)' : '#475569'} !important; }
                .pm-play-btn { transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s; }
                .pm-play-btn:hover { transform: scale(1.07) !important; }
                .pm-play-btn:active { transform: scale(0.97) !important; }
                .pm-cancel-btn:hover { background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} !important; }
            `}</style>

            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={closeModal} />

            {/* Card */}
            <div 
                className="relative w-full max-w-[360px] rounded-[28px] overflow-hidden animate-[pomo-card-in_0.3s_cubic-bezier(0.16,1,0.3,1)] bg-gradient-to-br from-white to-slate-50 border border-black/5 shadow-[0_24px_64px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.04)] dark:from-slate-900 dark:to-[#0a111f] dark:border-white/10 dark:shadow-[0_32px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
                {/* Glow */}
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full pointer-events-none transition-colors duration-600 ease-in-out" style={{ background: `radial-gradient(circle, ${color}14 0%, transparent 70%)` }} />

                {view === 'settings' ? (
                    /* ─── SETTINGS ─── */
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-8">
                            <button
                                
                                onClick={() => setView('timer')}
                                className="pm-icon-btn w-8 h-8 rounded-[10px] border-none cursor-pointer flex items-center justify-center transition-all duration-150 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/35 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/35"
                                 >
                                <ArrowLeft size={16} />
                            </button>
                            <span className="text-[15px] font-semibold tracking-[0.01em] text-slate-900 dark:text-white">
                                Paramètres
                            </span>
                        </div>

                        <div className="flex flex-col gap-7 mb-8">
                            <SettingsSlider label="Durée Focus"   value={localFocus} min={15} max={60} step={5}  color={modeColors.focus}      onChange={setLocalFocus} />
                            <SettingsSlider label="Pause courte"  value={localShort} min={2}  max={15} step={1}  color={modeColors.shortBreak}  onChange={setLocalShort} />
                            <SettingsSlider label="Pause longue"  value={localLong}  min={10} max={30} step={5}  color={modeColors.longBreak}   onChange={setLocalLong} />
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                className="pm-cancel-btn flex-1 p-3 rounded-[14px] text-[14px] font-semibold cursor-pointer transition-all duration-150 border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50"
                                onClick={() => setView('timer')}
                                
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 p-3 rounded-[14px] border-none text-white text-sm font-bold cursor-pointer transition-all duration-150" style={{
  background: color,
  boxShadow: `0 4px 20px ${color}50`
}}
                            >
                                Appliquer
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ─── TIMER ─── */
                    <div className="flex flex-col items-center">
                        {/* Top bar */}
                        <div className="flex items-center gap-1 pt-4 px-4 w-full">
                            <div className="flex-1 flex gap-0.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 mb-12">
                                <ModeTab label="Focus"  active={mode === 'focus'}      color={modeColors.focus}      onClick={() => switchMode('focus')} />
                                <ModeTab label="Pause"  active={mode === 'shortBreak'} color={modeColors.shortBreak} onClick={() => switchMode('shortBreak')} />
                                <ModeTab label="Longue" active={mode === 'longBreak'}  color={modeColors.longBreak}  onClick={() => switchMode('longBreak')} />
                            </div>

                            <button
                                
                                onClick={() => setView('settings')}
                                className="pm-icon-btn w-8 h-8 rounded-[10px] border-none cursor-pointer flex items-center justify-center transition-all duration-150 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/35 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/35"
                                 title="Paramètres"
                            >
                                <GearSix size={15} />
                            </button>

                            <button
                                
                                onClick={closeModal}
                                className="pm-icon-btn w-8 h-8 rounded-[10px] border-none cursor-pointer flex items-center justify-center transition-all duration-150 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/35 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/35"
                                 >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Ring + time */}
                        <div className="relative flex items-center justify-center my-8" style={{ width: RING, height: RING }}>
                            <ProgressRing
                                size={RING} stroke={STROKE}
                                progress={progress} color={color}
                                trackColor="text-black/5 dark:text-white/10"
                            />
                            <div className="flex flex-col items-center gap-1">
                                <div className="font-mono text-[52px] font-extrabold tracking-[-0.03em] leading-none tabular-nums transition-colors duration-400 text-slate-900 dark:text-white">
                                    {mm}<span className="font-light text-slate-300 dark:text-white/20">:</span>{ss}
                                </div>
                                <div className="text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors duration-400" style={{ color: color }}>
                                    {modeLabels[mode]}
                                </div>
                            </div>
                        </div>

                        {/* Cycle dots */}
                        <div className="flex items-center gap-3 mb-8">
                            <span className="text-[11px] font-medium tracking-[0.05em] text-slate-300 dark:text-white/20">
                                {cycleCount} session{cycleCount > 1 ? 's' : ''}
                            </span>
                            <div className="flex gap-[5px]">
                                {[0, 1, 2, 3].map(i => (
                                    <span key={i} className="block h-[6px] rounded-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{
                                        width: i < completedInRound ? '20px' : '6px',
                                        background: i < completedInRound ? color : 'rgba(0,0,0,0.1)',
                                        boxShadow: i < completedInRound ? `0 0 8px ${color}55` : 'none',
                                    }} />
                                ))}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3 mb-8">
                            <button
                                className="pm-ctrl-btn w-11 h-11 rounded-full cursor-pointer flex items-center justify-center transition-all duration-150 border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/45"
                                onClick={reset}
                                
                                title="Réinitialiser"
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115 0M20 15a9 9 0 01-15 0" />
                                </svg>
                            </button>

                            <button
                                className="pm-play-btn w-[72px] h-[72px] rounded-full border-none text-white cursor-pointer flex items-center justify-center"
                                onClick={isRunning ? pause : start}
                                style={{
                                    background: `linear-gradient(145deg, ${color}ee, ${color}99)`,
                                    boxShadow: `0 8px 32px ${color}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                                }}
                                title={isRunning ? 'Pause' : 'Démarrer'}
                            >
                                {isRunning ? (
                                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                                        <rect x="5" y="4" width="5" height="16" rx="1.5" />
                                        <rect x="14" y="4" width="5" height="16" rx="1.5" />
                                    </svg>
                                ) : (
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="ml-[3px]">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>

                            <button
                                className="pm-ctrl-btn w-11 h-11 rounded-full cursor-pointer flex items-center justify-center transition-all duration-150 border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/45"
                                onClick={() => {
                                    const nextMode: PomodoroMode = mode === 'focus'
                                        ? ((cycleCount + 1) % 4 === 0 ? 'longBreak' : 'shortBreak')
                                        : 'focus';
                                    switchMode(nextMode);
                                }}
                                
                                title="Session suivante"
                            >
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
