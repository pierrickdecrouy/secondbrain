import React, { useState, useEffect } from 'react';
import { Play, Pause, ArrowCounterClockwise, Coffee, Brain } from '@phosphor-icons/react';

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export const PomodoroTimer: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            // Auto switch
            if (!isBreak) {
                // Focus ended, start break
                new Audio('/bell.mp3').play().catch(() => {});
                setIsBreak(true);
                setTimeLeft(BREAK_TIME);
            } else {
                // Break ended, start focus
                new Audio('/bell.mp3').play().catch(() => {});
                setIsBreak(false);
                setTimeLeft(FOCUS_TIME);
                setIsActive(false); // Stop after a full cycle
            }
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, isBreak]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setIsBreak(false);
        setTimeLeft(FOCUS_TIME);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="app-no-drag flex items-center bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full h-9 px-3 shadow-sm transition-all"
             style={{ minWidth: isActive ? '120px' : '110px' }}
        >
            <div className="flex items-center gap-1.5 mr-2.5 text-slate-500 dark:text-slate-400">
                {isBreak ? (
                    <Coffee size={16} weight={isActive ? "fill" : "regular"} className={isActive ? "text-amber-500" : ""} />
                ) : (
                    <Brain size={16} weight={isActive ? "fill" : "regular"} className={isActive ? "text-emerald-500" : ""} />
                )}
                <span className="font-mono text-[12px] font-semibold tracking-wide text-slate-700 dark:text-slate-200 tabular-nums mt-0.5">
                    {timeString}
                </span>
            </div>
            
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                <button 
                    onClick={toggleTimer}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    title={isActive ? "Pause" : "Démarrer"}
                >
                    {isActive ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
                </button>
                <button 
                    onClick={resetTimer}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    title="Réinitialiser"
                >
                    <ArrowCounterClockwise size={15} weight="bold" />
                </button>
            </div>
        </div>
    );
};
