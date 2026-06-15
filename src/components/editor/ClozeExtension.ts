import { Mark, mergeAttributes } from '@tiptap/core';

export interface ClozeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cloze: {
      /**
       * Set a cloze mark
       */
      setCloze: () => ReturnType;
      /**
       * Toggle a cloze mark
       */
      toggleCloze: () => ReturnType;
      /**
       * Unset a cloze mark
       */
      unsetCloze: () => ReturnType;
    };
  }
}

export const ClozeExtension = Mark.create<ClozeOptions>({
  name: 'cloze',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-cloze]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-cloze': 'true', class: 'cloze-deletion' }), 0];
  },

  addCommands() {
    return {
      setCloze:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleCloze:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetCloze:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-E': () => this.editor.commands.toggleCloze(),
      'Mod-e': () => this.editor.commands.toggleCloze(),
    };
  },
});
