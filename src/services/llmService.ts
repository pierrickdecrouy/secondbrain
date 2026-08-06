import type { LlmConfig } from '../types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function streamLLMResponse(
  messages: ChatMessage[],
  config: LlmConfig,
  onChunk: (chunk: string) => void
): Promise<void> {
  if (!config.apiKey) {
    throw new Error('Clé API manquante. Veuillez configurer PharmaBot dans les paramètres.');
  }

  if (config.provider === 'openai') {
    await streamOpenAI(messages, config.apiKey, onChunk);
  } else if (config.provider === 'gemini') {
    await streamGemini(messages, config.apiKey, onChunk);
  } else {
    throw new Error('Fournisseur IA non supporté.');
  }
}

async function streamOpenAI(messages: ChatMessage[], apiKey: string, onChunk: (chunk: string) => void) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Can be configurable later
      messages,
      stream: true,
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
  }

  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
      if (line === 'data: [DONE]') return;
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.choices && data.choices[0].delta?.content) {
            onChunk(data.choices[0].delta.content);
          }
        } catch (e) {
          // ignore partial JSON
        }
      }
    }
  }
}

async function streamGemini(messages: ChatMessage[], apiKey: string, onChunk: (chunk: string) => void) {
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
  
  const payload: unknown = {
    contents: geminiMessages,
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:streamGenerateContent?alt=sse&key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Gemini API Error: ${error.error?.message || response.statusText}`);
  }

  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.candidates && data.candidates[0].content?.parts) {
            const text = data.candidates[0].content.parts[0].text;
            if (text) {
                onChunk(text);
            }
          }
        } catch (e) {
          // ignore partial JSON
        }
      }
    }
  }
}
