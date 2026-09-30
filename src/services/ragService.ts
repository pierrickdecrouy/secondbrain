import { semanticSearch } from '../semanticSearch';
import type { Card } from '../types';
import { streamLLMResponse, type ChatMessage } from './llmService';
import type { LlmConfig } from '../types';

export async function askEXTNDBot(
  query: string,
  allCards: Card[],
  chatHistory: ChatMessage[],
  onChunk: (chunk: string) => void
): Promise<void> {
  // 1. Retrouver les fiches les plus pertinentes sémantiquement
  let matchingIds = await semanticSearch(query, 4);
  
  // Fallback : recherche par mots-clés si le moteur sémantique est hors-ligne ou vide
  if (matchingIds.length === 0) {
    const cleanQuery = query.toLowerCase().replace(/\b(l'|d'|qu'|l|d|qu)(?=[a-z])/g, '');
    const keywords = cleanQuery.split(/[\s,.'’?-]+/).filter(w => w.length > 2);
    const scoredCards = allCards.map(card => {
      let score = 0;
      const textToSearch = `${card.title} ${card.subtitle || ''} ${card.content || ''} ${card.tags?.join(' ') || ''}`.toLowerCase();
      for (const kw of keywords) {
        if (textToSearch.includes(kw)) score++;
      }
      return { id: card.id, score };
    }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);
    
    matchingIds = scoredCards.slice(0, 4).map(c => c.id);
  }
  
  // 2. Extraire le texte de ces fiches
    const contextCards = matchingIds
    .map(id => allCards.find(c => c.id === id))
    .filter((c): c is Card => c !== undefined);
  
  // 3. Mode LLM / RAG classique
  const contextText = contextCards.length > 0 
    ? contextCards.map(c => `[ID Fiche: ${c.id} | Titre: ${c.title}]\n${c.subtitle ? c.subtitle + '\n' : ''}${c.content || ''}\n${c.details ? 'Détails:\n' + c.details + '\n' : ''}`).join('\n---\n')
    : "Aucune fiche pertinente trouvée.";
  
  const systemPrompt: ChatMessage = {
    role: 'system',
    content: `Tu es EXTND bot, un tuteur pédagogique.
Tu as tendance à produire un brouillon de pensée. Tu DOIS obligatoirement placer toute ton analyse et ton brouillon entre des balises <think> et </think>.
Ta réponse finale destinée à l'étudiant doit se trouver UNIQUEMENT après la balise </think>. 
Réponds directement à la question, utilise Markdown, et cite les sources sous forme de lien : [Titre de la fiche](#id-de-la-fiche).`
  };
  
  const userPrompt = `Voici des extraits de cours pour m'aider à répondre :
---
${contextText}
---

Question : ${query}`;

  const messages: ChatMessage[] = [
    systemPrompt, 
    ...chatHistory, 
    { role: 'user', content: userPrompt }
  ];
  
  await streamLLMResponse(messages, onChunk);
}
