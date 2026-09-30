// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Robot, PaperPlaneRight, CircleNotch, WarningCircle } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useUIStore } from '../store/useUIStore';
import { useCardStore } from '../store/useCardStore';
import { askEXTNDBot } from '../services/ragService';
import type { ChatMessage } from '../services/llmService';
import { isSemanticSearchReady } from '../semanticSearch';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const { } = useUIStore();

  const { cards } = useCardStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll down
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (!isSemanticSearchReady()) {
      setError('L\'indexation sémantique est en cours de chargement. Veuillez patienter.');
      return;
    }

    const userQuery = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userQuery }];
    setMessages(newMessages);

    // Placeholder for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      await askEXTNDBot(
        userQuery, 
        cards, 
        messages, // We send previous history minus system prompt
        (chunk) => {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + chunk }
              ];
            }
            return prev;
          });
        }
      );
    } catch (err: unknown) {
      setError((err as Error).message || 'Une erreur est survenue.');
      // Enlever le message vide si erreur avant même d'avoir streamé
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === 'assistant' && lastMsg.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] md:bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[420px] max-h-[75vh] min-h-[400px] h-[600px] bg-white/85 dark:bg-[#18181b]/85 backdrop-blur-2xl shadow-[0_16px_64px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_16px_64px_-12px_rgba(0,0,0,0.6)] z-[9999] flex flex-col border border-white/40 dark:border-white/10 rounded-[28px] transform transition-all duration-300 origin-bottom-right animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/50 dark:border-slate-700/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Robot size={22} weight="duotone" />
          </div>
          <div>
            <div className="font-bold text-[15px] text-slate-900 dark:text-slate-100 leading-none mb-1">EXTND bot</div>
            <div className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Assistant Pédagogique (RAG)</div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 mt-10">
            <Robot size={56} weight="duotone" className="text-teal-500 mb-5" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bonjour ! Je suis EXTND bot.</p>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-[250px] mt-2">
              Posez-moi une question sur vos cours. J'analyserai vos fiches pour vous répondre.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-[20px] px-5 py-3.5 text-[14px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-br-sm shadow-[0_4px_12px_rgba(13,148,136,0.2)]' 
                    : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-800 dark:text-slate-200 rounded-bl-sm border border-white/50 dark:border-white/5 shadow-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {(() => {
                        const text = msg.content || '...';
                        if (text.includes('<think>') && !text.includes('</think>')) {
                          return "*(analyse en cours...)*";
                        }
                        return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || (text.includes('</think>') ? '...' : text);
                      })()}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-tl-sm border border-slate-200 dark:border-slate-700">
              <CircleNotch size={18} className="animate-spin text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 shrink-0">
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 font-medium">
            <WarningCircle size={14} weight="bold" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative flex items-end bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[20px] p-1 border border-slate-200/50 dark:border-slate-700/50 shadow-sm focus-within:ring-2 focus-within:ring-teal-500/50 focus-within:border-teal-500/50 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Posez votre question..."
            className="flex-1 max-h-[120px] min-h-[44px] bg-transparent border-none px-4 py-3 text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-0 resize-none custom-scrollbar"
            rows={1}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white flex items-center justify-center transition-colors shadow-sm disabled:shadow-none"
          >
            {isLoading ? <CircleNotch size={16} className="animate-spin" /> : <PaperPlaneRight size={16} weight="fill" />}
          </button>
        </form>
        <div className="text-[10px] text-center mt-3 text-slate-400 dark:text-slate-500">
          Les réponses sont générées par IA et peuvent contenir des erreurs.
        </div>
      </div>
    </div>
  );
};
