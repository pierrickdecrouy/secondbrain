import { useState, useEffect } from 'react';

export function IndexingProgress() {
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    // Bind the progress callback from semanticSearch to this state
    import("../semanticSearch").then(({ setIndexingProgressCallback }) => {
      setIndexingProgressCallback(setProgress);
    });
  }, []);

  if (progress === null) return null;

  return (
    <div className="fixed bottom-5 right-5 bg-white dark:bg-slate-800 px-5 py-3 rounded-xl shadow-lg z-[9999] flex items-center gap-3 border border-slate-200 dark:border-slate-700">
      <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
        Indexation sémantique : {progress}%
      </div>
    </div>
  );
}
