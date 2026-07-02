import React, { useEffect } from 'react';
import { Play, Pause, ArrowCounterClockwise, Coffee, Brain } from '@phosphor-icons/react';
import { usePomodoroStore } from '../store/usePomodoroStore';

export const PomodoroTimer: React.FC = () => {
    const { 
        timeLeft, 
        isRunning, 
        mode, 
        start, 
        pause, 
        reset, 
        tick, 
        openModal 
    } = usePomodoroStore();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                tick();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, tick]);

    // Format time
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const isBreak = mode === 'shortBreak' || mode === 'longBreak';

    return (
        <div 
            className={`app-no-drag flex items-center gap-3 pl-3.5 pr-2.5 py-1.5 border-[1.5px] shadow-sm rounded-full transition-all duration-300 cursor-pointer ${
                isRunning 
                    ? (isBreak ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400' 
                               : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400') 
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-700/80 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            onClick={(e) => {
                // Prevent opening modal if clicking on buttons
                if ((e.target as HTMLElement).closest('button')) return;
                openModal();
            }}
            title="Paramètres Pomodoro"
        >
            <div className={`flex items-center justify-center transition-colors ${isRunning ? (isBreak ? 'text-amber-500' : 'text-indigo-500') : 'text-slate-500 dark:text-slate-400'}`}>
                {isBreak ? (
                    <Coffee size={20} weight="bold" />
                ) : (
                    <Brain size={20} weight="bold" />
                )}
            </div>
            
            <span className={`font-mono font-bold text-[16px] tracking-wide w-[48px] text-center tabular-nums transition-colors ${isRunning ? (isBreak ? 'text-amber-700 dark:text-amber-400' : 'text-indigo-700 dark:text-indigo-400') : 'text-slate-700 dark:text-slate-200'}`}>
                {timeString}
            </span>
            
            <div className={`w-[1px] h-5 rounded-full transition-colors ${isRunning ? (isBreak ? 'bg-amber-200 dark:bg-amber-800' : 'bg-indigo-200 dark:bg-indigo-800') : 'bg-slate-200 dark:bg-slate-700/80'}`}></div>

            <div className="flex items-center gap-1">
                <button 
                    onClick={isRunning ? pause : start}
                    className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                        isRunning 
                            ? (isBreak ? 'text-amber-600 bg-amber-100/50 hover:bg-amber-200/60 dark:bg-amber-900/40 dark:text-amber-400' 
                                       : 'text-indigo-600 bg-indigo-100/50 hover:bg-indigo-200/60 dark:bg-indigo-900/40 dark:text-indigo-400') 
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400'
                    }`}
                    title={isRunning ? "Pause" : "Démarrer"}
                >
                    {isRunning ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
                </button>
                <button 
                    onClick={reset}
                    className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                        isRunning 
                            ? (isBreak ? 'text-amber-500 hover:bg-amber-200/40 dark:text-amber-500' 
                                       : 'text-indigo-500 hover:bg-indigo-200/40 dark:text-indigo-400') 
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300'
                    }`}
                    title="Réinitialiser"
                >
                    <ArrowCounterClockwise size={18} weight="bold" />
                </button>
            </div>
        </div>
    );
};

