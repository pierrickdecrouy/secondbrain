import React from 'react';
import { Brain, Plus } from '@phosphor-icons/react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Votre cerveau est encore vide",
  description = "Ajoutez votre premier concept et commencez à construire votre base de connaissances !",
  actionLabel = "Ajouter un concept",
  onAction,
  icon = <Brain size={48} weight="duotone" className="text-indigo-500" />
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
      <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-sm transition-colors"
        >
          <Plus size={20} weight="bold" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
