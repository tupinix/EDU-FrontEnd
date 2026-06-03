import { useState, useRef } from 'react';
import { Download, Upload, Loader2, Check, AlertCircle, FileJson } from 'lucide-react';
import { configTransferApi, ConfigImportSummary } from '../services/api';

const ENTITY_LABELS: Record<string, string> = {
  mqtt_brokers: 'Brokers MQTT',
  modbus_connections: 'Conexões Modbus',
  opcua_connections: 'Conexões OPC-UA',
  ethip_connections: 'Conexões EtherNet/IP',
  hierarchy_mappings: 'Mapeamentos ISA-95',
  data_models: 'Data Models',
  alert_rules: 'Regras de Alerta',
  alarm_definitions: 'Definições de Alarme',
  rules: 'Regras',
  oee_definitions: 'Definições de OEE',
  process_dashboards: 'Dashboards de Processo',
};

export function ConfigTransferPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ConfigImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true); setError(null);
    try { await configTransferApi.exportAll(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao exportar'); }
    finally { setExporting(false); }
  };

  const handleFile = async (file: File) => {
    setImporting(true); setError(null); setSummary(null);
    try {
      const text = await file.text();
      const bundle = JSON.parse(text);
      const result = await configTransferApi.importAll(bundle);
      setSummary(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Arquivo inválido ou erro ao importar');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const totalImported = summary
    ? Object.values(summary.postgres).reduce((a, b) => a + b, 0) + summary.neo4j.nodes
    : 0;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Backup &amp; Migração
        </h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
          Exporte todas as configurações desta organização (brokers, conexões, hierarquia,
          data models, alertas, dashboards e Knowledge Graph) e importe noutra organização.
        </p>
      </div>

      {/* Export */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">Exportar configurações</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Baixa um arquivo <code className="font-mono">.json</code> com todas as configs desta org.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="shrink-0 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[12px] font-medium hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Exportar
          </button>
        </div>
      </div>

      {/* Import */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">Importar configurações</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Modo <strong>merge</strong>: tudo entra como novo, nada existente é apagado.
            </p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="shrink-0 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-[12px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Escolher arquivo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {error && (
          <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-[12px] text-red-600 dark:text-red-300">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {summary && (
          <div className="mt-3 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
            <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              <Check className="w-4 h-4" />
              {totalImported} item(s) importado(s)
            </div>
            <div className="space-y-1 text-[12px] text-gray-600 dark:text-gray-300">
              {Object.entries(summary.postgres)
                .filter(([, n]) => n > 0)
                .map(([table, n]) => (
                  <div key={table} className="flex justify-between">
                    <span className="text-gray-500">{ENTITY_LABELS[table] ?? table}</span>
                    <span className="font-mono">{n}</span>
                  </div>
                ))}
              {(summary.neo4j.nodes > 0 || summary.neo4j.skipped > 0) && (
                <div className="flex justify-between border-t border-emerald-100 dark:border-emerald-800/30 pt-1 mt-1">
                  <span className="text-gray-500">Knowledge Graph (nós / relações)</span>
                  <span className="font-mono">{summary.neo4j.nodes} / {summary.neo4j.relationships}</span>
                </div>
              )}
              {summary.neo4j.skipped > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Nós ignorados (já existiam)</span>
                  <span className="font-mono">{summary.neo4j.skipped}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 text-[11px] text-gray-400 px-1">
        <FileJson className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Não são exportados: usuários, sessões, tokens de API, licenças, logs de auditoria
          nem valores históricos — apenas configuração.
        </span>
      </div>
    </div>
  );
}
