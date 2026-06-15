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
      style={{
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 9999,
        background: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        minWidth: '250px',
        maxHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
        Insérer un lien...
      </div>
      <div style={{ overflowY: 'auto' }}>
        {props.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: index === selectedIndex ? 'var(--color-surface-hover, #f1f5f9)' : 'transparent',
              color: 'var(--color-text, #1e293b)',
              cursor: 'pointer',
              textAlign: 'left',
              gap: '8px',
            }}
          >
            <Badge type={item.type} />
            <span style={{ fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

SuggestionList.displayName = 'SuggestionList';
