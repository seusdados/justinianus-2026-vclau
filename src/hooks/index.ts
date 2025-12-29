// ============================================================================
// JUSTINIANUS.AI - HOOKS INDEX
// Exportação centralizada de todos os hooks customizados
// ============================================================================

// --- Leads ---
export {
  useLeads,
  useLead,
  useLeadsCounters,
} from './useLeads';

// --- Qualificações ---
export {
  useQualificacoes,
} from './useQualificacoes';

// --- Casos ---
export {
  useCasos,
  useCaso,
  useCasosCounters,
  useCasosPorFase,
} from './useCasos';

// --- Prazos ---
export {
  usePrazos,
  usePrazo,
  usePrazosCounters,
  useSalaGuerra,
  calcularDiasRestantes,
  getCorPrazo,
  getAlertaPrazo,
} from './usePrazos';

// --- Tarefas ---
export {
  useTarefas,
  useTarefa,
  useTarefasCounters,
  useMinhasTarefas,
} from './useTarefas';

// --- Documentos ---
export {
  useDocumentos,
  useDocumento,
  useDocumentosCounters,
  TIPOS_DOCUMENTO,
} from './useDocumentos';
export type { TipoDocumento } from './useDocumentos';

// --- Grafo de Evidências ---
export {
  useGrafoEvidencias,
  useNoGrafo,
  useGrafoStats,
  TIPOS_NO,
  TIPOS_RELACAO,
  converterParaVisualizacao,
  encontrarCaminhoMaisForte,
} from './useGrafoEvidencias';
export type { TipoNo, TipoRelacao } from './useGrafoEvidencias';

// --- IA (Execuções e Sugestões) ---
export {
  useExecucoesIA,
  useExecucaoIA,
  useSugestoesIA,
  useIACounters,
  useExecucoesRecentes,
  TIPOS_AGENTE,
  NIVEIS_AUTONOMIA,
  STATUS_EXECUCAO,
} from './useIA';
export type { TipoAgente, NivelAutonomia, StatusExecucao } from './useIA';

// --- Ações ---
export {
  useAcoes,
  useAcoesPendentes,
  useAcoesCounters,
  useAcoesEntidade,
  criarAcaoDesugestaoIA,
  TIPOS_ACAO,
  STATUS_ACAO,
  ORIGENS_ACAO,
} from './useAcoes';
export type { TipoAcao, StatusAcao, OrigemAcao } from './useAcoes';

// --- Oportunidades (Timing Optimizer) ---
export {
  useOportunidades,
  useOportunidadesAtivas,
  useOportunidadesCriticas,
  useOportunidadesCounters,
  useTimingAnalysis,
  obterConfigTipoSinal,
  obterConfigImpacto,
  TIPOS_SINAL,
  IMPACTOS,
} from './useOportunidades';
export type { TipoSinal, Impacto } from './useOportunidades';

// --- Auditoria ---
export {
  useAuditoria,
  useAuditoriaEntidade,
  useAuditoriaRecente,
  useAuditoriaStats,
  formatarLog,
  registrarAuditoria,
  CATEGORIAS_EVENTO,
  TIPOS_ATOR,
} from './useAuditoria';
export type { CategoriaEvento, TipoAtor } from './useAuditoria';
