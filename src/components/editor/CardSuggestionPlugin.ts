import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionOptions } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';

export const SuggestionPluginKey = new PluginKey('card-suggestion');

export interface CardSuggestionOptions {
  suggestion: Omit<SuggestionOptions, 'editor'>;
}

export const CardSuggestionPlugin = Extension.create<CardSuggestionOptions>({
  name: 'cardSuggestion',

  addOptions() {
    return {
      suggestion: {
        char: '[[',
        pluginKey: SuggestionPluginKey,
        command: ({ editor, range, props }) => {
          // Insert the wiki-link format
          editor
            .chain()
            .focus()
            .insertContentAt(range, `[[${props.title}]]`)
            .run();
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
