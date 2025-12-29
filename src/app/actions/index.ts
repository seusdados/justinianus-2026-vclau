// ============================================================================
// JUSTINIANUS.AI - SERVER ACTIONS INDEX
// Exportação centralizada de todas as Server Actions
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// LEADS
// ─────────────────────────────────────────────────────────────────────────────
export {
  criarLead,
  atualizarLead,
  qualificarLead,
  decidirLead,
  converterLeadEmCaso,
} from './leads';

// ─────────────────────────────────────────────────────────────────────────────
// CASOS
// ─────────────────────────────────────────────────────────────────────────────
export {
  atualizarCaso,
  mudarFaseCaso,
  encerrarCaso,
  reabrirCaso,
  atribuirResponsavel,
  criarTarefaCaso,
  concluirTarefa,
  togglePortalCliente,
} from './casos';

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTOS
// ─────────────────────────────────────────────────────────────────────────────
export {
  uploadDocumento,
  atualizarDocumento,
  deletarDocumento,
  registrarOCR,
  registrarDadosPessoais,
  anonimizarDocumento,
  registrarAnaliseIA,
  alterarVisibilidade,
  obterUrlDownload,
  copiarDocumentoParaCaso,
  TIPOS_DOCUMENTO,
} from './documentos';

// ─────────────────────────────────────────────────────────────────────────────
// PRAZOS
// ─────────────────────────────────────────────────────────────────────────────
export {
  criarPrazo,
  atualizarPrazo,
  concluirPrazo,
  ativarSalaGuerra,
  registrarAlertaEnviado,
  marcarPrazoPerdido,
  atribuirPrazo,
  iniciarPrazo,
  marcarMinutaPronta,
  verificarPrazosCriticos,
  detectarPrazoDeDocumento,
  TIPOS_PRAZO,
} from './prazos';

// ─────────────────────────────────────────────────────────────────────────────
// GRAFO DE EVIDÊNCIAS
// ─────────────────────────────────────────────────────────────────────────────
export {
  criarNo,
  criarNosEmLote,
  atualizarNo,
  deletarNo,
  criarAresta,
  criarArestasEmLote,
  deletarAresta,
  recalcularForcas,
  analisarGrafo,
  construirGrafoAutomaticamente,
  exportarGrafoParaVisualizacao,
  TIPOS_NO,
  TIPOS_RELACAO,
} from './grafo';

// ─────────────────────────────────────────────────────────────────────────────
// IA (AGENTES)
// ─────────────────────────────────────────────────────────────────────────────
export {
  enfileirarExecucao,
  iniciarExecucao,
  finalizarExecucao,
  registrarErroExecucao,
  darFeedbackSugestao,
  processarSugestoesEmLote,
  cancelarExecucao,
  buscarProximaExecucao,
  obterEstatisticasIA,
  TIPOS_AGENTE,
  type TipoAgente,
} from './ia';

// ─────────────────────────────────────────────────────────────────────────────
// OPORTUNIDADES (TIMING)
// ─────────────────────────────────────────────────────────────────────────────
export {
  criarSinalOportunidade,
  acionarOportunidade,
  descartarOportunidade,
  atualizarExpiracoesOportunidades,
  analisarTimingCaso,
  detectarSinaisOportunidade,
  obterDashboardOportunidades,
  TIPOS_SINAL,
  IMPACTOS,
  type TipoSinal,
} from './oportunidades';

// ─────────────────────────────────────────────────────────────────────────────
// AUDITORIA
// ─────────────────────────────────────────────────────────────────────────────
export {
  registrarAuditoria,
  registrarTelemetria,
  buscarAuditoria,
  buscarAuditoriaEntidade,
  exportarAuditoria,
  obterEstatisticasAuditoria,
  gerarRelatorioLGPD,
  gerarDossieCaso,
  buscarEventosDominio,
  buscarCadeiaEventos,
  CATEGORIAS_EVENTO,
  TIPOS_ATOR,
  type CategoriaEvento,
} from './auditoria';
