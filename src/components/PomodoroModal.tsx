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
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.6s ease' }}
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
            style={{
                flex: 1, padding: '8px 4px',
                fontSize: '12px', fontWeight: 600,
                background: active ? activeBg : 'transparent',
                color: active ? activeColor : inactiveColor,
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                letterSpacing: '0.04em',
                boxShadow: active && !darkMode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
            }}
        >
            {label}
            {active && (
                <span style={{
                    position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)',
                    width: '4px', height: '4px', borderRadius: '50%',
                    backgroundColor: color, display: 'block',
                }} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: labelColor, letterSpacing: '0.02em' }}>
                    {label}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: valueColor, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono, monospace)' }}>
                    {value}<span style={{ fontSize: '11px', fontWeight: 500, color: unitColor, marginLeft: '2px' }}>min</span>
                </span>
            </div>
            <div style={{ position: 'relative', height: '3px', borderRadius: '99px', background: trackBg }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, borderRadius: '99px', background: color, transition: 'width 0.1s' }} />
                <div style={{
                    position: 'absolute', top: '50%', left: `calc(${pct}% - 7px)`,
                    transform: 'translateY(-50%)',
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: thumbBg,
                    boxShadow: `0 0 0 3px ${color}60, 0 2px 6px rgba(0,0,0,${darkMode ? 0.3 : 0.15})`,
                    transition: 'left 0.1s', pointerEvents: 'none',
                }} />
                <input
                    type="range" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(parseInt(e.target.value))}
                    style={{ position: 'absolute', inset: '-6px 0', opacity: 0, width: '100%', cursor: 'pointer', margin: 0 }}
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
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
                background: t.backdrop,
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                animation: 'pomo-backdrop-in 0.25s ease',
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
            <div style={{ position: 'absolute', inset: 0 }} onClick={closeModal} />

            {/* Card */}
            <div style={{
                position: 'relative',
                width: '100%', maxWidth: '360px',
                background: t.card,
                borderRadius: '28px',
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.cardShadow,
                overflow: 'hidden',
                animation: 'pomo-card-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                {/* Glow */}
                <div style={{
                    position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
                    width: '200px', height: '200px', borderRadius: '50%',
                    background: t.glowBg(color),
                    pointerEvents: 'none', transition: 'background 0.6s ease',
                }} />

                {view === 'settings' ? (
                    /* ─── SETTINGS ─── */
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <button
                                className="pm-icon-btn"
                                onClick={() => setView('timer')}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '10px',
                                    background: t.iconBtnBg, border: 'none',
                                    color: t.iconBtnClr, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <span style={{ fontSize: '15px', fontWeight: 600, color: t.textPrimary, letterSpacing: '0.01em' }}>
                                Paramètres
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '32px' }}>
                            <SettingsSlider label="Durée Focus"   value={localFocus} min={15} max={60} step={5}  color={modeColors.focus}      darkMode={darkMode} onChange={setLocalFocus} />
                            <SettingsSlider label="Pause courte"  value={localShort} min={2}  max={15} step={1}  color={modeColors.shortBreak}  darkMode={darkMode} onChange={setLocalShort} />
                            <SettingsSlider label="Pause longue"  value={localLong}  min={10} max={30} step={5}  color={modeColors.longBreak}   darkMode={darkMode} onChange={setLocalLong} />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="pm-cancel-btn"
                                onClick={() => setView('timer')}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '14px',
                                    background: t.cancelBg, border: t.cancelBorder,
                                    color: t.cancelColor, fontSize: '14px', fontWeight: 600,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '14px',
                                    background: color, border: 'none',
                                    color: '#fff', fontSize: '14px', fontWeight: 700,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    boxShadow: `0 4px 20px ${color}50`,
                                }}
                            >
                                Appliquer
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ─── TIMER ─── */
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Top bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '16px 16px 0', width: '100%',
                        }}>
                            <div style={{
                                flex: 1, display: 'flex', gap: '2px',
                                background: t.tabBg, borderRadius: '12px', padding: '4px',
                            }}>
                                <ModeTab label="Focus"  active={mode === 'focus'}      color={modeColors.focus}      darkMode={darkMode} onClick={() => switchMode('focus')} />
                                <ModeTab label="Pause"  active={mode === 'shortBreak'} color={modeColors.shortBreak} darkMode={darkMode} onClick={() => switchMode('shortBreak')} />
                                <ModeTab label="Longue" active={mode === 'longBreak'}  color={modeColors.longBreak}  darkMode={darkMode} onClick={() => switchMode('longBreak')} />
                            </div>

                            <button
                                className="pm-icon-btn"
                                onClick={() => setView('settings')}
                                style={{
                                    marginLeft: '8px', width: '34px', height: '34px', borderRadius: '10px',
                                    background: t.iconBtnBg, border: 'none',
                                    color: t.iconBtnClr, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s', flexShrink: 0,
                                }}
                                title="Paramètres"
                            >
                                <GearSix size={15} />
                            </button>

                            <button
                                className="pm-icon-btn"
                                onClick={closeModal}
                                style={{
                                    width: '34px', height: '34px', borderRadius: '10px',
                                    background: t.iconBtnBg, border: 'none',
                                    color: t.iconBtnClr, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s', flexShrink: 0,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Ring + time */}
                        <div style={{
                            position: 'relative',
                            width: RING, height: RING,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '32px 0 24px',
                        }}>
                            <ProgressRing
                                size={RING} stroke={STROKE}
                                progress={progress} color={color}
                                trackColor={t.ringTrack}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <div style={{
                                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                                    fontSize: '52px', fontWeight: 800, letterSpacing: '-0.03em',
                                    color: t.textPrimary, lineHeight: 1,
                                    fontVariantNumeric: 'tabular-nums',
                                    transition: 'color 0.4s',
                                }}>
                                    {mm}<span style={{ color: t.textSub, fontWeight: 300 }}>:</span>{ss}
                                </div>
                                <div style={{
                                    fontSize: '11px', fontWeight: 600,
                                    color: color, letterSpacing: '0.12em', textTransform: 'uppercase',
                                    transition: 'color 0.4s',
                                }}>
                                    {modeLabels[mode]}
                                </div>
                            </div>
                        </div>

                        {/* Cycle dots */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <span style={{ fontSize: '11px', color: t.textSub, fontWeight: 500, letterSpacing: '0.05em' }}>
                                {cycleCount} session{cycleCount > 1 ? 's' : ''}
                            </span>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {[0, 1, 2, 3].map(i => (
                                    <span key={i} style={{
                                        display: 'block',
                                        width: i < completedInRound ? '20px' : '6px',
                                        height: '6px',
                                        borderRadius: '99px',
                                        background: i < completedInRound ? color : t.cycleEmpty,
                                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                        boxShadow: i < completedInRound ? `0 0 8px ${color}55` : 'none',
                                    }} />
                                ))}
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <button
                                className="pm-ctrl-btn"
                                onClick={reset}
                                style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: t.ctrlBg, border: t.ctrlBorder,
                                    color: t.ctrlColor, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                }}
                                title="Réinitialiser"
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115 0M20 15a9 9 0 01-15 0" />
                                </svg>
                            </button>

                            <button
                                className="pm-play-btn"
                                onClick={isRunning ? pause : start}
                                style={{
                                    width: '72px', height: '72px', borderRadius: '50%',
                                    background: `linear-gradient(145deg, ${color}ee, ${color}99)`,
                                    border: 'none', color: '#fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: '3px' }}>
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>

                            <button
                                className="pm-ctrl-btn"
                                onClick={() => {
                                    const nextMode: PomodoroMode = mode === 'focus'
                                        ? ((cycleCount + 1) % 4 === 0 ? 'longBreak' : 'shortBreak')
                                        : 'focus';
                                    switchMode(nextMode);
                                }}
                                style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: t.ctrlBg, border: t.ctrlBorder,
                                    color: t.ctrlColor, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
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
