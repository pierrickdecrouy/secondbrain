import React, { useState, useEffect } from 'react';
import { Timer } from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext';

interface SessionTimerProps {
    index: number;
    title?: string;
    isPaused: boolean;
    isAnswerRevealed: boolean;
    onTimeUp: () => void;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const SessionTimer: React.FC<SessionTimerProps> = ({
    index,
    title,
    isPaused,
    isAnswerRevealed,
    onTimeUp
}) => {
    const { darkMode } = useTheme();
    const [timeSpent, setTimeSpent] = useState(0);
    const [quizTimeLeft, setQuizTimeLeft] = useState<number | null>(title === 'Quiz Express' ? 30 : null);

    // Reset stopwatch on new card
    useEffect(() => {
        setTimeSpent(0);
        if (title === 'Quiz Express') {
            setQuizTimeLeft(30);
        }
    }, [index, title]);

    // Track time spent answering (count up)
    useEffect(() => {
        if (isPaused || isAnswerRevealed) return;
        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isPaused, isAnswerRevealed]);

    // Quiz Express countdown logic
    useEffect(() => {
        if (quizTimeLeft === null || isPaused) return;
        if (quizTimeLeft <= 0) {
            onTimeUp();
            return;
        }
        const timer = setInterval(() => {
            setQuizTimeLeft(prev => prev !== null ? prev - 1 : null);
        }, 1000);
        return () => clearInterval(timer);
    }, [quizTimeLeft, isPaused, onTimeUp]);

    if (quizTimeLeft !== null) {
        return (
            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all border ${quizTimeLeft <= 10 ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300"}`}>
                <Timer size={16} weight={quizTimeLeft <= 10 ? "bold" : "duotone"} />
                <span className="font-mono tracking-wide">{quizTimeLeft}s</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all border ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
            <Timer size={16} weight="duotone" />
            <span className="font-mono tracking-wide">{formatTime(timeSpent)}</span>
        </div>
    );
};
