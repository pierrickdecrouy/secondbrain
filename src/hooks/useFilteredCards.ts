import { useState, useEffect, useMemo } from 'react';
import type { Card } from '../types';
import { hybridSearch } from '../searchIndex';
import { calculateQualityScore } from '../algorithms/qualityScoring';
import { useDebounce } from './useDebounce';

export function useFilteredCards(cards: Card[], searchQuery: string, activeFilters: string[]) {
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null);

  // Perform search when query changes
  useEffect(() => {
    if (!debouncedSearchQuery) {
      setSearchResultIds(null);
      return;
    }

    // Use hybrid search (keyword + semantic)
    hybridSearch(debouncedSearchQuery).then(setSearchResultIds);
  }, [debouncedSearchQuery]);

  const filteredCards = useMemo(() => {
    // 1. Type filter / Quality Filter
    let result = cards;
    if (activeFilters.length > 0) {
      if (activeFilters.includes('needs-review')) {
        // Quality Filter
        result = result.filter(card => {
          if (card.nodeType === 'course') return false;
          const score = calculateQualityScore(card, card.manualConnections?.length || 0);
          return score.score < 50;
        });
      } else {
        // Standard Type Filter (still filters by the subject tag: drug, patho, etc.)
        result = result.filter(card => activeFilters.includes(card.type) && card.nodeType !== 'course');
      }
    } else {
      // Exclude courses from the main cards view by default
      result = result.filter(card => card.nodeType !== 'course');
    }

    // 2. Search filter using hybrid (FlexSearch + semantic)
    if (searchResultIds !== null) {
      const idSet = new Set(searchResultIds);

      // Filter to only matching IDs and maintain search order (relevance)
      const idToCard = new Map(result.map(c => [c.id, c]));
      result = searchResultIds
        .filter(id => idSet.has(id) && idToCard.has(id))
        .map(id => idToCard.get(id)!)
        .filter(c => (activeFilters.length === 0 || activeFilters.includes(c.type)) && c.nodeType !== 'course');
    }

    return result;
  }, [cards, searchResultIds, activeFilters]);

  return { filteredCards, searchResultIds };
}
