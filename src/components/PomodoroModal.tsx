import React, { useState, useEffect } from 'react';
import { X, GearSix, ArrowLeft } from '@phosphor-icons/react';
import { usePomodoroStore, type PomodoroMode } from '../store/usePomodoroStore';
import { useTheme } from '../context/ThemeContext';
import './styles/PomodoroModal.css';

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
        <svg width={size} height={size} className="pomodoromodal-style-1" >
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                className="pomodoromodal-style-2" 
            />
        </svg>
    );
};

// ─── Mode tab ─────────────────────────────────────────────────────────────────

const ModeTab: React.FC<{
    label: string; active: boolean; color: string;
    darkMode: boolean; onClick: () => void;
}> = ({ label, active, color, darkMode, onClick }) => {
    const activeBg = darkMode ? 'rgba(255,255,255,0.12)' : '#ffffff';
    const activeColor = darkMode ? '#ffffff' : '#0f172a';
    const inactiveColor = darkMode ? 'rgba(255,255,255,0.35)' : '#94a3b8';
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 relative border-none ${active && !darkMode ? 'shadow-sm' : ''} pomodoromodal-style-3`}
            style={{
  background: active ? activeBg : 'transparent',
  color: active ? activeColor : inactiveColor
}}
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
    color: string; darkMode: boolean; onChange: (v: number) => void;
}> = ({ label, value, min, max, step, color, darkMode, onChange }) => {
    const pct = ((value - min) / (max - min)) * 100;
    const labelColor = darkMode ? 'rgba(255,255,255,0.55)' : '#64748b';
    const valueColor = darkMode ? '#ffffff' : '#0f172a';
    const unitColor = darkMode ? 'rgba(255,255,255,0.4)' : '#94a3b8';
    const trackBg = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)';
    const thumbBg = darkMode ? '#ffffff' : '#ffffff';
    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-baseline">
                <span className="text-[13px] font-medium tracking-[0.02em]" style={{ color: labelColor }}>
                    {label}
                </span>
                <span className="text-[15px] font-bold font-mono tabular-nums" style={{ color: valueColor }}>
                    {value}<span className="text-[11px] font-medium ml-0.5" style={{ color: unitColor }}>min</span>
                </span>
            </div>
            <div className="relative h-[3px] rounded-full" style={{ background: trackBg }}>
                <div className="absolute top-0 left-0 h-full rounded-full transition-[width] duration-100" style={{ width: `${pct}%`, background: color }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full pointer-events-none transition-[left] duration-100" style={{
                    left: `calc(${pct}% - 7px)`,
                    background: thumbBg,
                    boxShadow: `0 0 0 3px ${color}60, 0 2px 6px rgba(0,0,0,${darkMode ? 0.3 : 0.15})`,
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

    // ── Theme tokens ────────────────────────────────────────────────────────────
    const t = darkMode ? {
        backdrop:    'rgba(7, 10, 20, 0.72)',
        card:        'linear-gradient(160deg, #0f172a 0%, #0c1525 60%, #0a111f 100%)',
        cardBorder:  'rgba(255,255,255,0.07)',
        cardShadow:  '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
        textPrimary: '#ffffff',
        textMuted:   'rgba(255,255,255,0.35)',
        textSub:     'rgba(255,255,255,0.22)',
        ringTrack:   'rgba(255,255,255,0.07)',
        tabBg:       'rgba(255,255,255,0.05)',
        tabActive:   'rgba(255,255,255,0.12)',
        iconBtnBg:   'rgba(255,255,255,0.06)',
        iconBtnClr:  'rgba(255,255,255,0.35)',
        ctrlBg:      'rgba(255,255,255,0.07)',
        ctrlBorder:  '1px solid rgba(255,255,255,0.08)',
        ctrlColor:   'rgba(255,255,255,0.45)',
        cycleEmpty:  'rgba(255,255,255,0.12)',
        cancelBg:    'rgba(255,255,255,0.06)',
        cancelBorder:'1px solid rgba(255,255,255,0.08)',
        cancelColor: 'rgba(255,255,255,0.5)',
        glowBg:      (c: string) => `radial-gradient(circle, ${c}14 0%, transparent 70%)`,
    } : {
        backdrop:    'rgba(15, 23, 42, 0.45)',
        card:        'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
        cardBorder:  'rgba(0,0,0,0.07)',
        cardShadow:  '0 24px 64px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
        textPrimary: '#0f172a',
        textMuted:   '#94a3b8',
        textSub:     '#cbd5e1',
        ringTrack:   'rgba(0,0,0,0.06)',
        tabBg:       'rgba(0,0,0,0.04)',
        tabActive:   '#ffffff',
        iconBtnBg:   '#f1f5f9',
        iconBtnClr:  '#94a3b8',
        ctrlBg:      '#f1f5f9',
        ctrlBorder:  '1px solid #e2e8f0',
        ctrlColor:   '#94a3b8',
        cycleEmpty:  'rgba(0,0,0,0.08)',
        cancelBg:    '#f1f5f9',
        cancelBorder:'1px solid #e2e8f0',
        cancelColor: '#64748b',
        glowBg:      (c: string) => `radial-gradient(circle, ${c}10 0%, transparent 70%)`,
    };

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
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-[pomo-backdrop-in_0.25s_ease] pomodoromodal-style-4"
            style={{
  background: t.backdrop
}}
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
                className="relative w-full max-w-[360px] rounded-[28px] overflow-hidden animate-[pomo-card-in_0.3s_cubic-bezier(0.16,1,0.3,1)]"
                style={{
                    background: t.card,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.cardShadow,
                }}
            >
                {/* Glow */}
                <div className="pomodoromodal-style-5" style={{
  background: t.glowBg(color)
}} />

                {view === 'settings' ? (
                    /* ─── SETTINGS ─── */
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-8">
                            <button
                                className="pm-icon-btn w-8 h-8 rounded-[10px] border-none cursor-pointer flex items-center justify-center transition-all duration-150"
                                onClick={() => setView('timer')}
                                style={{
                                    background: t.iconBtnBg,
                                    color: t.iconBtnClr,
                                }}
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <span className="text-[15px] font-semibold tracking-[0.01em]" style={{ color: t.textPrimary }}>
                                Paramètres
                            </span>
                        </div>

                        <div className="flex flex-col gap-7 mb-8">
                            <SettingsSlider label="Durée Focus"   value={localFocus} min={15} max={60} step={5}  color={modeColors.focus}      darkMode={darkMode} onChange={setLocalFocus} />
                            <SettingsSlider label="Pause courte"  value={localShort} min={2}  max={15} step={1}  color={modeColors.shortBreak}  darkMode={darkMode} onChange={setLocalShort} />
                            <SettingsSlider label="Pause longue"  value={localLong}  min={10} max={30} step={5}  color={modeColors.longBreak}   darkMode={darkMode} onChange={setLocalLong} />
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                className="pm-cancel-btn flex-1 p-3 rounded-[14px] text-[14px] font-semibold cursor-pointer transition-all duration-150"
                                onClick={() => setView('timer')}
                                style={{
                                    background: t.cancelBg, border: t.cancelBorder,
                                    color: t.cancelColor,
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                className="pomodoromodal-style-6" style={{
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
                            <div className="flex-1 flex gap-0.5 p-1 rounded-xl" style={{ background: t.tabBg }}>
                                <ModeTab label="Focus"  active={mode === 'focus'}      color={modeColors.focus}      darkMode={darkMode} onClick={() => switchMode('focus')} />
                                <ModeTab label="Pause"  active={mode === 'shortBreak'} color={modeColors.shortBreak} darkMode={darkMode} onClick={() => switchMode('shortBreak')} />
                                <ModeTab label="Longue" active={mode === 'longBreak'}  color={modeColors.longBreak}  darkMode={darkMode} onClick={() => switchMode('longBreak')} />
                            </div>

                            <button
                                className="pm-icon-btn ml-2 w-[34px] h-[34px] rounded-[10px] border-none cursor-pointer flex items-center justify-center transition-all duration-150 shrink-0"
                                onClick={() => setView('settings')}
                                style={{
                                    background: t.iconBtnBg,
                                    color: t.iconBtnClr,
                                }}
                                title="Paramètres"
                            >
                                <GearSix size={15} />
                            </button>

                            <button
                                className="pm-icon-btn w-[34px] h-[34px] rounded-[10px] border-none cursor-pointer flex items-center justify-center transition-all duration-150 shrink-0"
                                onClick={closeModal}
                                style={{
                                    background: t.iconBtnBg,
                                    color: t.iconBtnClr,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Ring + time */}
                        <div className="relative flex items-center justify-center my-8" style={{ width: RING, height: RING }}>
                            <ProgressRing
                                size={RING} stroke={STROKE}
                                progress={progress} color={color}
                                trackColor={t.ringTrack}
                            />
                            <div className="flex flex-col items-center gap-1">
                                <div className="font-mono text-[52px] font-extrabold tracking-[-0.03em] leading-none tabular-nums transition-colors duration-400" style={{ color: t.textPrimary }}>
                                    {mm}<span className="font-light" style={{ color: t.textSub }}>:</span>{ss}
                                </div>
                                <div className="text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors duration-400" style={{ color: color }}>
                                    {modeLabels[mode]}
                                </div>
                            </div>
                        </div>

                        {/* Cycle dots */}
                        <div className="flex items-center gap-3 mb-8">
                            <span className="text-[11px] font-medium tracking-[0.05em]" style={{ color: t.textSub }}>
                                {cycleCount} session{cycleCount > 1 ? 's' : ''}
                            </span>
                            <div className="flex gap-[5px]">
                                {[0, 1, 2, 3].map(i => (
                                    <span key={i} className="block h-[6px] rounded-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{
                                        width: i < completedInRound ? '20px' : '6px',
                                        background: i < completedInRound ? color : t.cycleEmpty,
                                        boxShadow: i < completedInRound ? `0 0 8px ${color}55` : 'none',
                                    }} />
                                ))}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3 mb-8">
                            <button
                                className="pm-ctrl-btn w-11 h-11 rounded-full cursor-pointer flex items-center justify-center transition-all duration-150"
                                onClick={reset}
                                style={{
                                    background: t.ctrlBg, border: t.ctrlBorder,
                                    color: t.ctrlColor,
                                }}
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
                                className="pm-ctrl-btn w-11 h-11 rounded-full cursor-pointer flex items-center justify-center transition-all duration-150"
                                onClick={() => {
                                    const nextMode: PomodoroMode = mode === 'focus'
                                        ? ((cycleCount + 1) % 4 === 0 ? 'longBreak' : 'shortBreak')
                                        : 'focus';
                                    switchMode(nextMode);
                                }}
                                style={{
                                    background: t.ctrlBg, border: t.ctrlBorder,
                                    color: t.ctrlColor,
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
