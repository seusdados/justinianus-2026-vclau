// ═══════════════════════════════════════════════════════════════════════════
// JUSTINIANUS.AI — TIPOS DO BANCO DE DADOS (GERADO DO SUPABASE)
// Baseado no schema real do projeto gxsncnggihsxxebceago
// ═══════════════════════════════════════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      acoes: {
        Row: {
          id: string;
          organizacao_id: string;
          tipo_entidade: string;
          id_entidade: string;
          tipo_acao: string;
          titulo: string;
          descricao: string | null;
          payload: Json;
          id_execucao_ia: string | null;
          requer_aprovacao: boolean;
          aprovadores_necessarios: string[];
          aprovacoes_recebidas: Json;
          sla_horas: number | null;
          sla_expira_em: string | null;
          status: string;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['acoes']['Row']> & { organizacao_id: string; tipo_entidade: string; id_entidade: string; tipo_acao: string; titulo: string };
        Update: Partial<Database['public']['Tables']['acoes']['Row']>;
      };
      arestas_grafo_evidencias: {
        Row: {
          id: string;
          organizacao_id: string;
          caso_id: number;
          no_origem_id: string;
          no_destino_id: string;
          tipo_relacao: string;
          peso: number;
          metadados: Json;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['arestas_grafo_evidencias']['Row']> & { organizacao_id: string; caso_id: number; no_origem_id: string; no_destino_id: string; tipo_relacao: string };
        Update: Partial<Database['public']['Tables']['arestas_grafo_evidencias']['Row']>;
      };
      casos: {
        Row: {
          id: number;
          organizacao_id: string;
          cliente_id: number;
          lead_id: string | null;
          titulo: string;
          numero_interno: string | null;
          numero_externo: string | null;
          tipo_caso: string;
          area_juridica: string[];
          status_caso: string;
          fase_atual: string;
          usuario_responsavel_id: string | null;
          ids_usuarios_equipe: string[] | null;
          portal_cliente_habilitado: boolean;
          valor_causa: number | null;
          tribunal: string | null;
          id_perfil_juiz: string | null;
          aberto_em: string;
          encerrado_em: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['casos']['Row']> & { organizacao_id: string; cliente_id: number; titulo: string; tipo_caso: string };
        Update: Partial<Database['public']['Tables']['casos']['Row']>;
      };
      clientes: {
        Row: {
          id: number;
          organizacao_id: string;
          tipo_cliente: string;
          nome: string;
          cpf_cnpj: string | null;
          email: string | null;
          telefone: string | null;
          endereco: Json | null;
          metadados: Json;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['clientes']['Row']> & { organizacao_id: string; nome: string; tipo_cliente: string };
        Update: Partial<Database['public']['Tables']['clientes']['Row']>;
      };
      documentos: {
        Row: {
          id: string;
          organizacao_id: string;
          caso_id: number | null;
          lead_id: string | null;
          titulo: string;
          nome_arquivo: string;
          descricao: string | null;
          tipo_documento: string;
          tipo_mime: string | null;
          tamanho_bytes: number | null;
          caminho_storage: string;
          hash_arquivo: string | null;
          status: string;
          metadados: Json;
          versao: number;
          documento_pai_id: string | null;
          enviado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['documentos']['Row']> & { organizacao_id: string; titulo: string; nome_arquivo: string; caminho_storage: string };
        Update: Partial<Database['public']['Tables']['documentos']['Row']>;
      };
      leads: {
        Row: {
          id: string;
          organizacao_id: string;
          tipo_cliente: string;
          nome: string;
          email: string | null;
          telefone: string | null;
          tipo_servico: string;
          nivel_urgencia: string;
          status: string;
          origem: string | null;
          referencia_origem: string | null;
          cliente_id: number | null;
          caso_convertido_id: number | null;
          descricao_inicial: string | null;
          metadados: Json;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['leads']['Row']> & { organizacao_id: string; nome: string; tipo_cliente: string; tipo_servico: string };
        Update: Partial<Database['public']['Tables']['leads']['Row']>;
      };
      nos_grafo_evidencias: {
        Row: {
          id: string;
          organizacao_id: string;
          caso_id: number;
          tipo_no: string;
          titulo: string;
          conteudo: string | null;
          documento_id: string | null;
          pagina: number | null;
          trecho: string | null;
          confianca: number | null;
          verificado: boolean;
          verificado_por: string | null;
          verificado_em: string | null;
          metadados: Json;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['nos_grafo_evidencias']['Row']> & { organizacao_id: string; caso_id: number; tipo_no: string; titulo: string };
        Update: Partial<Database['public']['Tables']['nos_grafo_evidencias']['Row']>;
      };
      organizacoes: {
        Row: {
          id: string;
          nome: string;
          tipo_organizacao: string;
          configuracoes: Json;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['organizacoes']['Row']> & { nome: string };
        Update: Partial<Database['public']['Tables']['organizacoes']['Row']>;
      };
      prazos: {
        Row: {
          id: string;
          organizacao_id: string;
          caso_id: number;
          titulo: string;
          descricao: string | null;
          tipo_prazo: string;
          data_original: string;
          data_ajustada: string;
          dias_uteis: boolean;
          prioridade: string;
          status: string;
          sala_guerra_ativada: boolean;
          sala_guerra_ativada_em: string | null;
          responsavel_id: string | null;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['prazos']['Row']> & { organizacao_id: string; caso_id: number; titulo: string; tipo_prazo: string; data_original: string };
        Update: Partial<Database['public']['Tables']['prazos']['Row']>;
      };
      qualificacoes_lead: {
        Row: {
          id: string;
          organizacao_id: string;
          lead_id: string;
          id_execucao_ia: string | null;
          classificacao: string | null;
          area_juridica: string[];
          resumo_executivo: string | null;
          fatos_principais: Json;
          nivel_risco: string | null;
          estrategia_recomendada: string | null;
          data_prescricao: string | null;
          prazo_critico: string | null;
          alerta_prescricao_enviado: boolean;
          pontuacao_fundamentacao: number | null;
          pontuacao_consistencia: number | null;
          confianca_ia: number | null;
          decisao: string | null;
          motivo_recusa: string | null;
          validado_por: string | null;
          validado_em: string | null;
          criado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['qualificacoes_lead']['Row']> & { organizacao_id: string; lead_id: string };
        Update: Partial<Database['public']['Tables']['qualificacoes_lead']['Row']>;
      };
      sinais_oportunidade: {
        Row: {
          id: string;
          organizacao_id: string;
          caso_id: number;
          tipo_sinal: string;
          titulo: string;
          descricao: string;
          acao_recomendada: string | null;
          timing_recomendado: string | null;
          impacto_potencial: string | null;
          confianca: number | null;
          dados_fonte: Json;
          id_execucao_ia: string | null;
          expira_em: string | null;
          expirado: boolean;
          acao_tomada: boolean;
          acao_tomada_em: string | null;
          resultado_acao: string | null;
          detectado_em: string;
          criado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['sinais_oportunidade']['Row']> & { organizacao_id: string; caso_id: number; tipo_sinal: string; titulo: string; descricao: string };
        Update: Partial<Database['public']['Tables']['sinais_oportunidade']['Row']>;
      };
      sugestoes_ia: {
        Row: {
          id: string;
          organizacao_id: string;
          id_execucao: string;
          tipo_sugestao: string;
          titulo: string;
          conteudo: string;
          impacto: string | null;
          confianca: number | null;
          status: string;
          aceita_por: string | null;
          aceita_em: string | null;
          feedback_usuario: string | null;
          expira_em: string | null;
          criado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['sugestoes_ia']['Row']> & { organizacao_id: string; id_execucao: string; tipo_sugestao: string; titulo: string; conteudo: string };
        Update: Partial<Database['public']['Tables']['sugestoes_ia']['Row']>;
      };
      tarefas_caso: {
        Row: {
          id: string;
          organizacao_id: string;
          caso_id: number;
          prazo_id: string | null;
          titulo: string;
          descricao: string | null;
          tipo_tarefa: string | null;
          status: string;
          prioridade: string;
          responsavel_id: string | null;
          data_vencimento: string | null;
          concluida_em: string | null;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['tarefas_caso']['Row']> & { organizacao_id: string; caso_id: number; titulo: string };
        Update: Partial<Database['public']['Tables']['tarefas_caso']['Row']>;
      };
      execucoes_agente: {
        Row: {
          id: string;
          organizacao_id: string;
          caso_id: number | null;
          lead_id: string | null;
          documento_id: string | null;
          tipo_agente: string;
          status: string;
          parametros_entrada: Json;
          resultado: Json | null;
          erro: string | null;
          modelo_usado: string | null;
          tokens_entrada: number | null;
          tokens_saida: number | null;
          custo_estimado: number | null;
          duracao_ms: number | null;
          iniciado_em: string | null;
          concluido_em: string | null;
          solicitado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['execucoes_agente']['Row']> & { organizacao_id: string; tipo_agente: string };
        Update: Partial<Database['public']['Tables']['execucoes_agente']['Row']>;
      };
      logs_auditoria: {
        Row: {
          id: string;
          organizacao_id: string;
          usuario_id: string | null;
          tipo_evento: string;
          categoria: string;
          id_entidade: string;
          tipo_entidade: string;
          descricao: string;
          dados_anteriores: Json | null;
          dados_novos: Json | null;
          ip_origem: string | null;
          user_agent: string | null;
          metadados: Json;
          criado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['logs_auditoria']['Row']> & { organizacao_id: string; tipo_evento: string; categoria: string; id_entidade: string; tipo_entidade: string; descricao: string };
        Update: Partial<Database['public']['Tables']['logs_auditoria']['Row']>;
      };
      membros_organizacao: {
        Row: {
          id: string;
          organizacao_id: string;
          usuario_id: string;
          papel: string;
          permissoes: Json;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['membros_organizacao']['Row']> & { organizacao_id: string; usuario_id: string };
        Update: Partial<Database['public']['Tables']['membros_organizacao']['Row']>;
      };
      perfis_juiz: {
        Row: {
          id: string;
          organizacao_id: string;
          nome: string;
          tribunal: string;
          vara: string | null;
          comarca: string | null;
          uf: string | null;
          especialidade: string | null;
          estatisticas: Json;
          tendencias: Json;
          observacoes: string | null;
          ultima_atualizacao: string;
          criado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['perfis_juiz']['Row']> & { organizacao_id: string; nome: string; tribunal: string };
        Update: Partial<Database['public']['Tables']['perfis_juiz']['Row']>;
      };
      playbooks: {
        Row: {
          id: string;
          organizacao_id: string;
          nome: string;
          descricao: string | null;
          categoria: string | null;
          tipo_gatilho: string;
          config_gatilho: Json;
          ativo: boolean;
          versao: number;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['playbooks']['Row']> & { organizacao_id: string; nome: string; tipo_gatilho: string };
        Update: Partial<Database['public']['Tables']['playbooks']['Row']>;
      };
      politicas_organizacao: {
        Row: {
          id: string;
          organizacao_id: string;
          chave_politica: string;
          valor_politica: Json;
          descricao: string | null;
          ativo: boolean;
          atualizado_por: string | null;
          atualizado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['politicas_organizacao']['Row']> & { organizacao_id: string; chave_politica: string; valor_politica: Json };
        Update: Partial<Database['public']['Tables']['politicas_organizacao']['Row']>;
      };
      usuarios_cliente: {
        Row: {
          id: string;
          organizacao_id: string;
          cliente_id: number;
          usuario_id: string;
          portal_habilitado: boolean;
          criado_em: string;
        };
        Insert: Partial<Database['public']['Tables']['usuarios_cliente']['Row']> & { organizacao_id: string; cliente_id: number; usuario_id: string };
        Update: Partial<Database['public']['Tables']['usuarios_cliente']['Row']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Tipos auxiliares
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Aliases
export type Organizacao = Tables<'organizacoes'>;
export type MembroOrganizacao = Tables<'membros_organizacao'>;
export type Cliente = Tables<'clientes'>;
export type Lead = Tables<'leads'>;
export type QualificacaoLead = Tables<'qualificacoes_lead'>;
export type Caso = Tables<'casos'>;
export type Prazo = Tables<'prazos'>;
export type TarefaCaso = Tables<'tarefas_caso'>;
export type Documento = Tables<'documentos'>;
export type NoGrafoEvidencias = Tables<'nos_grafo_evidencias'>;
export type ArestaGrafoEvidencias = Tables<'arestas_grafo_evidencias'>;
export type ExecucaoAgente = Tables<'execucoes_agente'>;
export type SugestaoIA = Tables<'sugestoes_ia'>;
export type Acao = Tables<'acoes'>;
export type LogAuditoria = Tables<'logs_auditoria'>;
export type PerfilJuiz = Tables<'perfis_juiz'>;
export type Playbook = Tables<'playbooks'>;
export type SinalOportunidade = Tables<'sinais_oportunidade'>;
