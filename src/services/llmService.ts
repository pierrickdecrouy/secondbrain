import { useLLMStore } from '../store/useLLMStore';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

declare global {
  interface Window {
    ai?: any;
  }
}

export async function isLocalAIAvailable(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.ai && window.ai.languageModel) {
    try {
      const capabilities = await window.ai.languageModel.capabilities();
      return capabilities.available === 'readily' || capabilities.available === 'after-download';
    } catch (e) {
      return false;
    }
  } else if (typeof window !== 'undefined' && window.ai) {
    try {
      const status = await window.ai.canCreateTextSession();
      return status === 'readily' || status === 'after-download';
    } catch (e) {
      return false;
    }
  }
  return false;
}

export async function streamLLMResponse(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void
): Promise<void> {
  const { mode, apiKey, cloudModel } = useLLMStore.getState();
  const localAvailable = await isLocalAIAvailable();

  const useLocal = mode === 'local' || (mode === 'hybrid' && localAvailable);
  
  if (useLocal && localAvailable) {
    try {
      // Prompt construction for local AI (basic stringifying for now)
      const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n') + '\n\nASSISTANT:';
      
      let session;
      if (window.ai.languageModel) {
        session = await window.ai.languageModel.create();
      } else {
        session = await window.ai.createTextSession();
      }

      if (typeof session.promptStreaming === 'function') {
        const stream = session.promptStreaming(prompt);
        let previousLength = 0;
        for await (const chunk of stream) {
          const newContent = chunk.slice(previousLength);
          onChunk(newContent);
          previousLength = chunk.length;
        }
      } else {
        const result = await session.prompt(prompt);
        onChunk(result);
      }
      
      if (session.destroy) session.destroy();
      return;
    } catch (error) {
      console.error("Local AI failed", error);
      if (mode === 'local') {
        throw new Error("L'IA Locale a échoué. " + String(error));
      }
      // If hybrid, fall through to cloud
    }
  }

  if (mode === 'local' && !localAvailable) {
    throw new Error("L'IA Locale n'est pas supportée sur ce navigateur (Chrome requis avec flags activés).");
  }

  // Cloud Fallback
  if (!apiKey) {
    throw new Error("Clé d'API Gemini manquante pour utiliser le Cloud. Configurez-la dans Paramètres > Modèles IA.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: cloudModel || "gemini-1.5-flash" });
    
    const systemMsg = messages.find(m => m.role === 'system');
    const userAndAssistantMsgs = messages.filter(m => m.role !== 'system');
    
    if (systemMsg && userAndAssistantMsgs.length > 0 && userAndAssistantMsgs[0].role === 'user') {
      userAndAssistantMsgs[0] = {
        ...userAndAssistantMsgs[0],
        content: systemMsg.content + "\n\n" + userAndAssistantMsgs[0].content
      };
    }
    
    const geminiMessages = userAndAssistantMsgs.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Start streaming chat
    const chat = model.startChat({
        history: geminiMessages.slice(0, -1),
    });

    const lastMessage = geminiMessages[geminiMessages.length - 1];
    
    const result = await chat.sendMessageStream(lastMessage.parts[0].text);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      onChunk(chunkText);
    }
  } catch (error) {
    console.error("Cloud AI failed", error);
    throw new Error("Erreur de l'API Cloud : " + String(error));
  }
}

export async function explainCardConcept(title: string, content?: string): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: "Tu es un tuteur concis et pédagogique. Tu dois expliquer le concept demandé de la manière la plus simple et directe possible. Tu utilises le markdown pour formater ton texte (gras, listes)."
    },
    {
      role: 'user',
      content: `Explique-moi ce concept de manière très simple : ${title}.\n\nContexte additionnel : ${content || 'Aucun.'}`
    }
  ];

  let fullResponse = '';
  await streamLLMResponse(messages, (chunk) => {
    fullResponse += chunk;
  });
  
  return fullResponse;
}
