import { useState, useRef, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  Send,
  Trash2,
  Loader2,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { aiApi, ChatMessage } from '../services/api';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
  isError?: boolean;
}

export function Assistant() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ available: boolean; model: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check AI status on mount
  useEffect(() => {
    checkAIStatus();
  }, []);

  // Add welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: t('assistant.welcome'),
          timestamp: new Date(),
        },
      ]);
    }
  }, [t]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAIStatus = async () => {
    try {
      const status = await aiApi.getStatus();
      setAiStatus(status);
    } catch {
      setAiStatus({ available: false, model: 'unknown' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare messages for API (exclude welcome message and errors)
      const chatMessages: ChatMessage[] = [...messages, userMessage]
        .filter((m) => m.id !== 'welcome' && !m.isError)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await aiApi.chat(chatMessages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('assistant.error'),
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: t('assistant.welcome'),
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Bot className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('assistant.title')}</h1>
            <p className="text-sm text-gray-500">{t('assistant.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Status */}
          <div className="flex items-center gap-2 text-sm">
            {aiStatus?.available ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {t('assistant.online')}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="w-4 h-4" />
                {t('assistant.offline')}
              </span>
            )}
            {aiStatus?.model && (
              <span className="text-gray-400">({aiStatus.model})</span>
            )}
          </div>

          {/* Clear chat button */}
          <button
            onClick={handleClearChat}
            className="btn btn-secondary btn-sm flex items-center gap-2"
            title={t('assistant.clearChat')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Unavailable Warning */}
      {aiStatus && !aiStatus.available && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">{t('assistant.unavailable')}</p>
            <p className="text-sm text-yellow-700">{t('assistant.unavailableDesc')}</p>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 card flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={clsx(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  message.isError ? 'bg-red-100' : 'bg-primary-100'
                )}>
                  {message.isError ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-primary-600" />
                  )}
                </div>
              )}

              <div
                className={clsx(
                  'max-w-[80%] rounded-2xl px-4 py-3',
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : message.isError
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-800'
                )}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                <p className={clsx(
                  'text-xs mt-2 opacity-60',
                  message.role === 'user' ? 'text-right' : ''
                )}>
                  {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                <span className="text-gray-600">{t('assistant.thinking')}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">{t('assistant.suggestions')}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSuggestionClick(t('assistant.suggestion1'))}
                className="text-sm px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
              >
                {t('assistant.suggestion1')}
              </button>
              <button
                onClick={() => handleSuggestionClick(t('assistant.suggestion2'))}
                className="text-sm px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
              >
                {t('assistant.suggestion2')}
              </button>
              <button
                onClick={() => handleSuggestionClick(t('assistant.suggestion3'))}
                className="text-sm px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
              >
                {t('assistant.suggestion3')}
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('assistant.placeholder')}
              className="flex-1 input resize-none min-h-[44px] max-h-32"
              rows={1}
              disabled={isLoading || !aiStatus?.available}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !aiStatus?.available}
              className="btn btn-primary px-4 self-end"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
