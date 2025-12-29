// ═══════════════════════════════════════════════════════════════════════════
// JUSTINIANUS.AI — TIPOS DO DOMÍNIO
// ═══════════════════════════════════════════════════════════════════════════

// Enums de status
export type TipoOrganizacao = 'escritorio_advocacia' | 'departamento_juridico' | 'plataforma';
export type TipoCliente = 'pessoa_fisica' | 'pessoa_juridica';
export type TipoServico = 'consultivo' | 'contencioso' | 'administrativo' | 'consensual';
export type NivelUrgencia = 'baixa' | 'media' | 'alta' | 'critica';
export type NivelRisco = 'baixo' | 'medio' | 'alto' | 'critico';
export type StatusLead = 'novo' | 'em_analise' | 'qualificado' | 'recusado' | 'convertido';
export type StatusCaso = 'ativo' | 'suspenso' | 'em_execucao' | 'encerrado';
export type FaseCaso = 'captacao' | 'qualificacao' | 'analise' | 'acao' | 'registro';
export type StatusTarefa = 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';
export type StatusPrazo = 'pendente' | 'em_andamento' | 'minuta_pronta' | 'concluido' | 'perdido';
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta' | 'critica';
export type VisibilidadeDoc = 'interno' | 'cliente' | 'convidado';
export type StatusAcao = 'proposta' | 'em_aprovacao' | 'aprovada' | 'executada' | 'cancelada' | 'rejeitada';
export type NivelAutonomia = 'A0' | 'A1' | 'A2' | 'A3';
export type StatusExecucaoIA = 'na_fila' | 'executando' | 'concluido' | 'falhou' | 'cancelado';
export type FeedbackHumano = 'aceito' | 'modificado' | 'rejeitado';
export type OrigemLead = 'formulario' | 'email' | 'upload' | 'api' | 'manual' | 'indicacao';

// ═══════════════════════════════════════════════════════════════════════════
// ENTIDADES PRINCIPAIS
// ═══════════════════════════════════════════════════════════════════════════

export interface Organizacao {
  id: string;
  nome: string;
  tipo_organizacao: TipoOrganizacao;
  configuracoes: Record<string, unknown>;
  criado_em: string;
  atualizado_em: string;
}

export interface MembroOrganizacao {
  id: string;
  organizacao_id: string;
  usuario_id: string;
  papel: string;
  permissoes: string[];
  criado_em: string;
}

export interface Cliente {
  id: number;
  organizacao_id: string;
  tipo_cliente: TipoCliente;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: Record<string, unknown>;
  metadados: Record<string, unknown>;
  criado_em: string;
  atualizado_em: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEADS E QUALIFICAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

export interface Lead {
  id: string;
  organizacao_id: string;
  tipo_cliente: TipoCliente;
  nome: string;
  email?: string;
  telefone?: string;
  tipo_servico: TipoServico;
  nivel_urgencia: NivelUrgencia;
  status: StatusLead;
  origem?: OrigemLead;
  referencia_origem?: string;
  cliente_id?: number;
  caso_convertido_id?: number;
  descricao_inicial?: string;
  metadados: Record<string, unknown>;
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
  // Relacionamentos
  qualificacao?: QualificacaoLead;
  documentos?: Documento[];
}

export interface QualificacaoLead {
  id: string;
  organizacao_id: string;
  lead_id: string;
  classificacao?: string;
  nivel_risco?: NivelRisco;
  area_juridica: string[];
  prazo_critico?: string;
  data_prescricao?: string;
  alerta_prescricao_enviado: boolean;
  resumo_executivo?: string;
  fatos_principais?: Record<string, unknown>[];
  estrategia_recomendada?: string;
  confianca_ia?: number;
  id_execucao_ia?: string;
  pontuacao_fundamentacao?: number;
  pontuacao_consistencia?: number;
  decisao: 'aceito' | 'recusado' | 'pendente';
  motivo_recusa?: string;
  validado_por?: string;
  validado_em?: string;
  criado_em: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CASOS
// ═══════════════════════════════════════════════════════════════════════════

export interface Caso {
  id: number;
  organizacao_id: string;
  cliente_id: number;
  lead_id?: string;
  titulo: string;
  numero_interno?: string;
  numero_externo?: string;
  tipo_caso: TipoServico;
  area_juridica: string[];
  status_caso: StatusCaso;
  fase_atual?: FaseCaso;
  usuario_responsavel_id?: string;
  ids_usuarios_equipe: string[];
  portal_cliente_habilitado: boolean;
  valor_causa?: number;
  tribunal?: string;
  id_perfil_juiz?: string;
  aberto_em: string;
  encerrado_em?: string;
  criado_em: string;
  atualizado_em: string;
  // Relacionamentos
  cliente?: Cliente;
  tarefas?: TarefaCaso[];
  prazos?: Prazo[];
  documentos?: Documento[];
  grafo_evidencias?: NoGrafoEvidencias[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TAREFAS E PRAZOS
// ═══════════════════════════════════════════════════════════════════════════

export interface TarefaCaso {
  id: number;
  organizacao_id: string;
  caso_id: number;
  prazo_id?: string;
  titulo: string;
  descricao?: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  data_limite?: string;
  iniciada_em?: string;
  concluida_em?: string;
  atribuida_a?: string;
  origem?: 'manual' | 'playbook' | 'sugerida_por_ia' | 'automatica_prazo';
  id_passo_playbook?: string;
  id_execucao_ia?: string;
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Prazo {
  id: string;
  organizacao_id: string;
  caso_id: number;
  tipo_prazo: string;
  descricao: string;
  origem?: 'publicacao' | 'intimacao' | 'contrato' | 'manual' | 'detectado_por_ia';
  referencia_origem?: string;
  id_documento_origem?: string;
  data_original: string;
  data_ajustada: string;
  prioridade: PrioridadeTarefa;
  status: StatusPrazo;
  sala_guerra_ativada: boolean;
  sala_guerra_ativada_em?: string;
  atribuido_a?: string;
  backup_atribuido_a?: string;
  minuta_automatica_gerada: boolean;
  id_documento_minuta_automatica?: string;
  config_alertas: Record<string, boolean>;
  alertas_enviados: Record<string, unknown>[];
  concluido_em?: string;
  concluido_por?: string;
  criado_em: string;
  atualizado_em: string;
  // Computado
  dias_restantes?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTOS
// ═══════════════════════════════════════════════════════════════════════════

export interface Documento {
  id: string;
  organizacao_id: string;
  caso_id?: number;
  lead_id?: string;
  titulo: string;
  descricao?: string;
  tipo_documento?: string;
  caminho_storage: string;
  nome_arquivo?: string;
  tamanho_arquivo?: number;
  tipo_mime?: string;
  ocr_processado: boolean;
  texto_ocr?: string;
  visibilidade: VisibilidadeDoc;
  contem_dados_pessoais: boolean;
  dados_pessoais_anonimizados: boolean;
  resumo_ia?: string;
  entidades_ia?: Record<string, unknown>;
  classificacao_ia?: Record<string, unknown>;
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GRAFO DE EVIDÊNCIAS
// ═══════════════════════════════════════════════════════════════════════════

export type TipoNoGrafo = 'fato' | 'prova' | 'alegacao' | 'pedido' | 'base_legal' | 'risco';
export type TipoRelacaoGrafo = 'suportado_por' | 'depende_de' | 'fundamentado_por' | 'enfraquecido_por' | 'contradiz' | 'corrobora';

export interface NoGrafoEvidencias {
  id: string;
  organizacao_id: string;
  caso_id: number;
  tipo_no: TipoNoGrafo;
  titulo: string;
  conteudo?: string;
  referencias?: Record<string, unknown>;
  forca: number; // 0-1
  gerado_por_ia: boolean;
  id_execucao_ia?: string;
  confianca_ia?: number;
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface ArestaGrafoEvidencias {
  id: string;
  organizacao_id: string;
  caso_id: number;
  no_origem: string;
  no_destino: string;
  relacao: TipoRelacaoGrafo;
  peso: number; // 0-1
  notas?: string;
  gerado_por_ia: boolean;
  criado_em: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// IA E AGENTES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExecucaoAgente {
  id: string;
  organizacao_id: string;
  tipo_agente: string;
  versao_agente?: string;
  nivel_autonomia: NivelAutonomia;
  nivel_risco?: NivelRisco;
  tipo_gatilho?: 'evento' | 'manual' | 'agendado' | 'encadeado';
  id_evento_gatilho?: string;
  tipo_entidade_gatilho?: string;
  id_entidade_gatilho?: string;
  dados_entrada?: Record<string, unknown>;
  dados_saida?: Record<string, unknown>;
  pontuacao_confianca?: number;
  pontuacao_fundamentacao?: number;
  pontuacao_consistencia?: number;
  iniciado_em: string;
  finalizado_em?: string;
  duracao_ms?: number;
  status: StatusExecucaoIA;
  mensagem_erro?: string;
  feedback_humano?: FeedbackHumano;
  feedback_humano_por?: string;
  feedback_humano_em?: string;
  notas_feedback_humano?: string;
  nome_modelo?: string;
  versao_modelo?: string;
  base_legal?: string;
  finalidade?: string;
  criado_em: string;
}

export interface SugestaoIA {
  id: string;
  organizacao_id: string;
  id_execucao_ia: string;
  tipo_sugestao: string;
  titulo: string;
  resumo: string;
  razao?: string; // "por quê" - explicabilidade
  estruturado?: Record<string, unknown>;
  confianca?: number;
  pontuacao_fundamentacao?: number;
  pontuacao_acionabilidade?: number;
  pontuacao_risco?: number;
  status: 'pendente' | 'aceita' | 'modificada' | 'rejeitada' | 'expirada';
  acionada_por?: string;
  acionada_em?: string;
  notas_acao?: string;
  criado_em: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AÇÕES
// ═══════════════════════════════════════════════════════════════════════════

export interface Acao {
  id: string;
  organizacao_id: string;
  tipo_entidade: string;
  id_entidade: string;
  tipo_acao: string;
  parametros_acao?: Record<string, unknown>;
  origem?: 'manual' | 'sugerida_por_ia' | 'playbook' | 'automacao';
  id_sugestao_ia?: string;
  status: StatusAcao;
  requer_aprovacao: boolean;
  papeis_aprovadores_requeridos: string[];
  aprovada_por?: string;
  aprovada_em?: string;
  notas_aprovacao?: string;
  executada_por?: string;
  executada_em?: string;
  resultado_execucao?: Record<string, unknown>;
  rejeitada_por?: string;
  rejeitada_em?: string;
  motivo_rejeicao?: string;
  criado_por?: string;
  criado_em: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFIL DE JUIZ
// ═══════════════════════════════════════════════════════════════════════════

export interface PerfilJuiz {
  id: string;
  nome: string;
  tribunal: string;
  unidade?: string;
  cargo?: string;
  estatisticas: {
    total_casos?: number;
    taxa_procedencia?: number;
    taxa_parcial?: number;
    taxa_improcedencia?: number;
    tempo_medio_meses?: number;
    taxa_reforma?: number;
    taxa_acordo?: number;
  };
  padroes_por_materia: Array<{
    materia: string;
    taxa: number;
    tamanho_amostra: number;
    tendencia?: string;
  }>;
  preferencias: Record<string, number>;
  insights: Array<{
    tipo: 'positivo' | 'negativo' | 'neutro';
    texto: string;
    confianca: number;
    amostra?: number;
  }>;
  janela_dados_meses: number;
  tamanho_amostra?: number;
  ultima_atualizacao: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSÕES DO COPILOTO
// ═══════════════════════════════════════════════════════════════════════════

export type TipoSessaoCopiloto = 
  | 'consulta'
  | 'audiencia_conciliacao'
  | 'audiencia_instrucao'
  | 'mediacao'
  | 'depoimento'
  | 'reuniao_interna';

export interface SessaoCopiloto {
  id: string;
  organizacao_id: string;
  caso_id?: number;
  lead_id?: string;
  tipo_sessao: TipoSessaoCopiloto;
  consentimento_dado: boolean;
  consentimento_dado_em?: string;
  consentimento_dado_por?: string;
  iniciada_em: string;
  encerrada_em?: string;
  duracao_segundos?: number;
  status: 'ativa' | 'pausada' | 'encerrada' | 'cancelada';
  transcricao?: string;
  segmentos_transcricao?: Array<{
    falante: string;
    texto: string;
    horario: string;
    insights?: string[];
  }>;
  sugestoes_feitas?: Array<{
    tipo: string;
    conteudo: string;
    horario: string;
  }>;
  momentos_chave?: Array<{
    horario: string;
    tipo: string;
    descricao: string;
  }>;
  resultado?: string;
  detalhes_resultado?: Record<string, unknown>;
  resumo_automatico?: string;
  itens_acao?: Record<string, unknown>[];
  participantes?: Record<string, unknown>;
  criado_por?: string;
  criado_em: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOKS
// ═══════════════════════════════════════════════════════════════════════════

export interface Playbook {
  id: string;
  organizacao_id?: string;
  nome: string;
  descricao?: string;
  condicoes_gatilho?: Record<string, unknown>;
  area_juridica: string[];
  tipos_caso: TipoServico[];
  ativo: boolean;
  e_modelo: boolean;
  duracao_estimada_horas?: number;
  taxa_sucesso?: number;
  vezes_usado: number;
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
  passos?: PassoPlaybook[];
}

export type TipoPasso = 
  | 'analise_ia'
  | 'geracao_ia'
  | 'revisao_humana'
  | 'acao_humana'
  | 'notificacao'
  | 'prazo'
  | 'ponto_decisao'
  | 'aguardar';

export interface PassoPlaybook {
  id: string;
  playbook_id: string;
  ordem_passo: number;
  titulo: string;
  descricao?: string;
  tipo_passo: TipoPasso;
  tipo_agente?: string;
  config_agente?: Record<string, unknown>;
  template_entrada?: Record<string, unknown>;
  esquema_saida?: Record<string, unknown>;
  requer_aprovacao: boolean;
  papeis_aprovacao: string[];
  timeout_horas?: number;
  config_escalacao?: Record<string, unknown>;
  depende_de_passos: string[];
  criado_em: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SINAIS DE OPORTUNIDADE
// ═══════════════════════════════════════════════════════════════════════════

export type TipoSinalOportunidade =
  | 'pressao_financeira'
  | 'pressao_prazo'
  | 'lacuna_prova'
  | 'precedente_favoravel'
  | 'fraqueza_oponente'
  | 'janela_acordo'
  | 'oportunidade_urgencia'
  | 'momento_estrategico';

export interface SinalOportunidade {
  id: string;
  organizacao_id: string;
  caso_id: number;
  tipo_sinal: TipoSinalOportunidade;
  titulo: string;
  descricao?: string;
  acao_recomendada?: string;
  timing_recomendado?: string;
  confianca?: number;
  impacto_potencial?: 'baixo' | 'medio' | 'alto' | 'critico';
  detectado_em: string;
  expira_em?: string;
  expirado: boolean;
  acao_tomada: boolean;
  acao_tomada_em?: string;
  resultado_acao?: string;
  dados_fonte?: Record<string, unknown>;
  id_execucao_ia?: string;
  criado_em: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENTOS DE DOMÍNIO
// ═══════════════════════════════════════════════════════════════════════════

export type NomeEventoDominio =
  | 'documento_enviado'
  | 'lead_criado'
  | 'lead_qualificado'
  | 'caso_aberto'
  | 'prazo_detectado'
  | 'audiencia_agendada'
  | 'audiencia_iniciada'
  | 'acao_proposta'
  | 'acao_aprovada'
  | 'acao_executada'
  | 'caso_encerrado'
  | 'execucao_agente_iniciada'
  | 'execucao_agente_concluida'
  | 'sala_guerra_ativada';

export interface EventoDominio {
  id: string;
  organizacao_id: string;
  nome_evento: NomeEventoDominio;
  tipo_entidade?: string;
  id_entidade?: string;
  payload: Record<string, unknown>;
  id_correlacao?: string;
  id_causacao?: string;
  usuario_ator_id?: string;
  tipo_agente_ator?: string;
  criado_em: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════════════

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

// Re-export Database from database.ts
export type { Database, Json } from './database';
