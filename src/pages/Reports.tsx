import { useState, FormEvent, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileBarChart,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { aiApi } from '../services/api';
import { useGenerateReport } from '../hooks/useReports';
import { DynamicChart } from '../components/Reports';
import { ReportResult } from '../types';

export function Reports() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [aiStatus, setAiStatus] = useState<{ available: boolean; model: string } | null>(null);
  const [currentReport, setCurrentReport] = useState<ReportResult | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const generateReportMutation = useGenerateReport();

  // Check AI status on mount
  useEffect(() => {
    checkAIStatus();
  }, []);

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
    if (!input.trim() || generateReportMutation.isPending) return;

    try {
      const result = await generateReportMutation.mutateAsync(input.trim());
      setCurrentReport(result);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setCurrentReport(null);
    setInput('');
    generateReportMutation.reset();
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
            <FileBarChart className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
            <p className="text-sm text-gray-500">{t('reports.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Status */}
          <div className="flex items-center gap-2 text-sm">
            {aiStatus?.available ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {t('reports.online')}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="w-4 h-4" />
                {t('reports.offline')}
              </span>
            )}
            {aiStatus?.model && (
              <span className="text-gray-400">({aiStatus.model})</span>
            )}
          </div>

          {/* Clear button */}
          {currentReport && (
            <button
              onClick={handleClear}
              className="btn btn-secondary btn-sm flex items-center gap-2"
              title={t('reports.clear')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* AI Unavailable Warning */}
      {aiStatus && !aiStatus.available && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">{t('reports.unavailable')}</p>
            <p className="text-sm text-yellow-700">{t('reports.unavailableDesc')}</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-0 gap-4">
        {/* Input Section */}
        <div className="card">
          {/* Input */}
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('reports.placeholder')}
                className="flex-1 input resize-none min-h-[60px] max-h-32"
                rows={2}
                disabled={generateReportMutation.isPending || !aiStatus?.available}
              />
              <button
                type="submit"
                disabled={!input.trim() || generateReportMutation.isPending || !aiStatus?.available}
                className="btn btn-primary px-6 self-end"
              >
                {generateReportMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {t('reports.generate')}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Suggestions */}
          {!currentReport && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">{t('reports.suggestions')}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSuggestionClick(t('reports.suggestion1'))}
                  className="text-sm px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
                >
                  {t('reports.suggestion1')}
                </button>
                <button
                  onClick={() => handleSuggestionClick(t('reports.suggestion2'))}
                  className="text-sm px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
                >
                  {t('reports.suggestion2')}
                </button>
                <button
                  onClick={() => handleSuggestionClick(t('reports.suggestion3'))}
                  className="text-sm px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
                >
                  {t('reports.suggestion3')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {generateReportMutation.isPending && (
          <div className="card flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-primary-600" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
              </div>
              <p className="text-gray-600 font-medium">{t('reports.generating')}</p>
              <p className="text-sm text-gray-400 mt-1">Analisando dados e gerando grafico...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {generateReportMutation.isError && (
          <div className="card bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">{t('reports.error')}</p>
                <p className="text-sm text-red-700">
                  {generateReportMutation.error?.message || 'Erro desconhecido'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {currentReport && !generateReportMutation.isPending && (
          <div className="flex-1 overflow-y-auto">
            <DynamicChart config={currentReport.config} data={currentReport.data} />
          </div>
        )}

        {/* Empty State */}
        {!currentReport && !generateReportMutation.isPending && !generateReportMutation.isError && (
          <div className="flex-1 card flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FileBarChart className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-lg mb-1">Nenhum relatorio gerado</p>
              <p className="text-sm">Descreva o relatorio que deseja visualizar usando linguagem natural.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
