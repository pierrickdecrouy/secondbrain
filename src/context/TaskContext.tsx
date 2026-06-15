import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { PausedTask } from '../types';
import { loadSettingAsync, saveSettingAsync } from '../persistentSettings';

interface TaskContextType {
  pausedTasks: PausedTask[];
  handleAutoSaveTask: (task: PausedTask) => void;
  handleRemoveTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const PAUSED_TASKS_KEY = 'pharmabrain_paused_tasks_v1';

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pausedTasks, setPausedTasks] = useState<PausedTask[]>([]);

  useEffect(() => {
    const loadTasks = async () => {
      const storedTasks = await loadSettingAsync(PAUSED_TASKS_KEY, []);
      if (storedTasks && Array.isArray(storedTasks)) {
        setPausedTasks(storedTasks);
      }
    };
    loadTasks();
  }, []);

  const handleAutoSaveTask = useCallback((task: PausedTask) => {
    setPausedTasks(prev => {
      const isCardEdit = task.type === 'card_edit';
      const editingCardId = isCardEdit ? (task.state.card as any)?.id : null;

      let filtered = prev.filter(t => t.id !== task.id);
      
      // Prevent duplicates of the same card being edited
      if (isCardEdit && editingCardId) {
          filtered = filtered.filter(t => t.type !== 'card_edit' || (t.state.card as any)?.id !== editingCardId);
      }

      const next = [task, ...filtered];
      saveSettingAsync(PAUSED_TASKS_KEY, next);
      return next;
    });
  }, []);

  const handleRemoveTask = useCallback((id: string) => {
    setPausedTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      saveSettingAsync(PAUSED_TASKS_KEY, next);
      return next;
    });
  }, []);

  const contextValue = useMemo(() => ({
    pausedTasks, handleAutoSaveTask, handleRemoveTask
  }), [pausedTasks, handleAutoSaveTask, handleRemoveTask]);

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
