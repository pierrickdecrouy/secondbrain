import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Badge } from '../Badge';
import './styles/SuggestionList.css';

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
      className="suggestionlist-style-1" style={{
  top: rect.bottom + 4,
  left: rect.left
}}
    >
      <div className="suggestionlist-style-2" >
        Insérer un lien...
      </div>
      <div className="suggestionlist-style-3" >
        {props.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className="suggestionlist-style-4" style={{
  background: index === selectedIndex ? 'var(--color-surface-hover, #f1f5f9)' : 'transparent'
}}
          >
            <Badge type={item.type} />
            <span className="suggestionlist-style-5" >
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

SuggestionList.displayName = 'SuggestionList';
