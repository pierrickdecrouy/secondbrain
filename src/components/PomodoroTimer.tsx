import React, { useEffect } from 'react';
import { usePomodoroStore } from '../store/usePomodoroStore';

export const PomodoroTimer: React.FC = () => {
    const {
        timeLeft, isRunning, mode, cycleCount,
        start, pause, reset, tick, openModal
    } = usePomodoroStore();

    useEffect(() => {
        if (!isRunning) return;
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [isRunning, tick]);

    const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const ss = (timeLeft % 60).toString().padStart(2, '0');
    const isUrgent = timeLeft <= 300 && timeLeft > 0 && isRunning;
    const completedInRound = cycleCount % 4;

    // Colors that work in both light and dark
    const dotColor = mode === 'focus'
        ? (isUrgent ? '#f43f5e' : '#0d9488')
        : mode === 'shortBreak' ? '#6366f1' : '#8b5cf6';

    return (
        <>
            <style>{`
                .pomo-pill {
                    display: flex;
                    align-items: center;
                    gap: 0;
                    border-radius: 999px;
                    border: 1px solid;
                    transition: all 0.3s ease;
                }
                .pomo-pill.urgent {
                    background-color: rgba(244, 63, 94, 0.06);
                    border-color: rgba(244, 63, 94, 0.3);
                }
                .pomo-pill.running {
                    background-color: var(--pomo-bg-running);
                    border-color: var(--pomo-border-running);
                    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.08);
                }
                .pomo-pill.idle {
                    background-color: var(--color-surface);
                    border-color: var(--color-border);
                }

                /* Light mode */
                :root {
                    --pomo-bg-running: rgba(13, 148, 136, 0.04);
                    --pomo-border-running: rgba(13, 148, 136, 0.25);
                    --pomo-time-idle: #475569;
                    --pomo-time-running: #0f766e;
                    --pomo-time-urgent: #e11d48;
                    --pomo-dot-empty: #e2e8f0;
                    --pomo-divider: #e2e8f0;
                    --pomo-btn-muted: #94a3b8;
                    --pomo-btn-hover: #0d9488;
                    --pomo-btn-hover-bg: rgba(13, 148, 136, 0.06);
                    --pomo-reset-color: #cbd5e1;
                }

                /* Dark mode */
                html.dark {
                    --pomo-bg-running: rgba(13, 148, 136, 0.06);
                    --pomo-border-running: rgba(13, 148, 136, 0.3);
                    --pomo-time-idle: #94a3b8;
                    --pomo-time-running: #34d399;
                    --pomo-time-urgent: #fb7185;
                    --pomo-dot-empty: #334155;
                    --pomo-divider: #1e293b;
                    --pomo-btn-muted: #64748b;
                    --pomo-btn-hover: #34d399;
                    --pomo-btn-hover-bg: rgba(52, 211, 153, 0.08);
                    --pomo-reset-color: #475569;
                }

                .pomo-open-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 6px 12px 6px 14px;
                    border-radius: 999px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    text-decoration: none;
                    transition: background 0.15s ease;
                }
                .pomo-open-btn:hover {
                    background: var(--color-surface-hover);
                }
                .pomo-open-btn:focus { outline: none; }

                .pomo-time {
                    font-family: var(--font-mono, 'JetBrains Mono', monospace);
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: -0.01em;
                    font-variant-numeric: tabular-nums;
                    transition: color 0.3s;
                }
                .pomo-time.idle    { color: var(--pomo-time-idle); }
                .pomo-time.running { color: var(--pomo-time-running); }
                .pomo-time.urgent  { color: var(--pomo-time-urgent); }

                .pomo-divider {
                    width: 1px;
                    height: 14px;
                    background: var(--pomo-divider);
                    flex-shrink: 0;
                }

                .pomo-ctrl-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--pomo-btn-muted);
                    transition: all 0.15s ease;
                }
                .pomo-ctrl-btn:hover {
                    background: var(--pomo-btn-hover-bg);
                    color: var(--pomo-btn-hover);
                }
                .pomo-ctrl-btn.reset-btn { color: var(--pomo-reset-color); }
                .pomo-ctrl-btn.reset-btn:hover {
                    background: var(--color-surface-hover);
                    color: var(--pomo-btn-muted);
                }
                .pomo-ctrl-btn.urgent-play:hover {
                    background: rgba(244, 63, 94, 0.08);
                    color: #f43f5e;
                }
                .pomo-ctrl-btn:focus { outline: none; }
            `}</style>

            <div
                className={`pomo-pill app-no-drag ${isUrgent ? 'urgent' : isRunning ? 'running' : 'idle'}`}
            >
                {/* Clickable zone: dot + time + cycles → opens modal */}
                <button
                    className="pomo-open-btn"
                    onClick={openModal}
                    title="Ouvrir le Pomodoro"
                >
                    {/* Mode dot */}
                    <span style={{
                        width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: dotColor,
                        boxShadow: isRunning ? `0 0 0 3px ${dotColor}25` : 'none',
                        transition: 'all 0.4s ease',
                    }} />

                    {/* Time */}
                    <span className={`pomo-time ${isUrgent ? 'urgent' : isRunning ? 'running' : 'idle'}`}>
                        {mm}:{ss}
                    </span>

                    {/* Cycle dots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {[0, 1, 2, 3].map(i => (
                            <span
                                key={i}
                                style={{
                                    display: 'block',
                                    borderRadius: '99px',
                                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                                    width:  i < completedInRound ? '10px' : '4px',
                                    height: '4px',
                                    backgroundColor: i < completedInRound
                                        ? dotColor
                                        : 'var(--pomo-dot-empty)',
                                }}
                            />
                        ))}
                    </div>
                </button>

                {/* Divider */}
                <div className="pomo-divider" />

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '4px 4px 4px 6px', gap: '0px' }}>
                    <button
                        className={`pomo-ctrl-btn ${isUrgent ? 'urgent-play' : ''}`}
                        onClick={isRunning ? pause : start}
                        title={isRunning ? 'Pause' : 'Démarrer'}
                    >
                        {isRunning ? (
                            <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="5" y="4" width="5" height="16" rx="1.5" />
                                <rect x="14" y="4" width="5" height="16" rx="1.5" />
                            </svg>
                        ) : (
                            <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: '1px' }}>
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    <button
                        className="pomo-ctrl-btn reset-btn"
                        onClick={reset}
                        title="Réinitialiser"
                    >
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115 0M20 15a9 9 0 01-15 0"/>
                        </svg>
                    </button>
                </div>

                <div style={{ width: '4px' }} />
            </div>
        </>
    );
};
