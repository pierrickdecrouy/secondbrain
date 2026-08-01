import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Badge } from '../Badge';

interface SuggestionListProps {
  items: any[];
  command: (item: any) => void;
  clientRect: DOMRect | null;
}

export const SuggestionList = forwardRef((props: SuggestionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  // @ts-ignore
  const rect = typeof props.clientRect === 'function' ? props.clientRect() : props.clientRect;

  if (!rect || props.items.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden min-w-[250px] max-h-[300px] flex flex-col" style={{
  top: rect.bottom + 4,
  left: rect.left
}}
    >
      <div className="px-3 py-2 text-[0.8rem] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800" >
        Insérer un lien...
      </div>
      <div className="overflow-y-auto custom-scrollbar" >
        {props.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className="flex items-center w-full px-3 py-2 border-none text-slate-900 dark:text-slate-100 cursor-pointer text-left gap-2" style={{
  background: index === selectedIndex ? 'var(--color-surface-hover, #f1f5f9)' : 'transparent'
}}
          >
            <Badge type={item.type} />
            <span className="font-medium flex-1 whitespace-nowrap overflow-hidden text-ellipsis" >
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

SuggestionList.displayName = 'SuggestionList';
