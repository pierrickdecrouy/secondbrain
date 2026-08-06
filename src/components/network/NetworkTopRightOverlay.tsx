import React from 'react';

interface NetworkTopRightOverlayProps {
    searchQuery?: string;
    searchDepth: number;
    setSearchDepth: (depth: number) => void;
    isDark: boolean;
}

export const NetworkTopRightOverlay: React.FC<NetworkTopRightOverlayProps> = ({
    searchQuery,
    searchDepth,
    setSearchDepth,
    isDark
}) => {
    return (
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end pointer-events-none z-40">
            {searchQuery && (
                <div className={`pointer-events-auto flex items-center gap-2 p-1.5 rounded-lg border shadow-sm backdrop-blur-sm
                    ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200'}`}>
                    <span className={`text-xs font-semibold px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Profondeur:</span>
                    <div className={`flex rounded p-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        {[0, 1, 2, 3].map(d => (
                            <button
                                key={d}
                                onClick={() => setSearchDepth(d)}
                                className={`
                                    px-2 py-0.5 text-xs rounded transition-all border-none cursor-pointer outline-none
                                    ${searchDepth === d
                                        ? isDark ? 'bg-slate-900 text-emerald-400 shadow-sm font-medium' : 'bg-white text-emerald-600 shadow-sm font-medium'
                                        : isDark ? 'text-slate-400 hover:text-slate-200 bg-transparent' : 'text-slate-400 hover:text-slate-600 bg-transparent'}
                                `}
                            >
                                {d === 0 ? 'Match' : `+${d}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
