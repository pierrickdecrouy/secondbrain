import { ReactRenderer } from '@tiptap/react';
import { SuggestionList } from './SuggestionList';
import type { Card } from '../../types';

export const getSuggestionOptions = (cards: Card[]) => ({
  char: '[[',
  items: ({ query }: { query: string }) => {
    return cards
      .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5); // Limit to 5 results
  },
  render: () => {
    let component: ReactRenderer<any>;

    return {
      onStart: (props: any) => {
        // Render the React component and pass the props
        component = new ReactRenderer(SuggestionList, {
          props,
          editor: props.editor,
        });

        // The component handles rendering itself since we pass clientRect
      },
      onUpdate(props: any) {
        component.updateProps(props);
      },
      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          return true; // We can handle escape here if needed
        }
        return component.ref?.onKeyDown(props);
      },
      onExit() {
        if (component) {
          component.destroy();
        }
      },
    };
  },
});
