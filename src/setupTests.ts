import '@testing-library/jest-dom';

// Polyfill for IndexedDB/Dexie issues in jsdom
import 'fake-indexeddb/auto';

// Mocks commonly used browser globals if they are missing
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };
}
