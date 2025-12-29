-- ═══════════════════════════════════════════════════════════════════════════
-- JUSTINIANUS.AI — SCHEMA INICIAL DO BANCO DE DADOS
-- Versão: 1.0.0
-- Data: 2025-01-01
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- EXTENSÕES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- TIPOS ENUMERADOS
-- ============================================================================

-- Organização
CREATE TYPE tipo_organizacao AS ENUM ('escritorio_advocacia', 'departamento_juridico', 'plataforma');

-- Cliente
CREATE TYPE tipo_cliente AS ENUM ('pessoa_fisica', 'pessoa_juridica');

-- Serviço
CREATE TYPE tipo_servico AS ENUM ('consultivo', 'contencioso', 'administrativo', 'consensual');

-- Níveis
CREATE TYPE nivel_urgencia AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE nivel_risco AS ENUM ('baixo', 'medio', 'alto', 'critico');
CREATE TYPE nivel_autonomia AS ENUM ('A0', 'A1', 'A2', 'A3');

-- Status Lead
CREATE TYPE status_lead AS ENUM ('novo', 'em_analise', 'qualificado', 'recusado', 'convertido');

-- Origem Lead
CREATE TYPE origem_lead AS ENUM ('formulario', 'email', 'upload', 'api', 'manual', 'indicacao');

-- Decisão Qualificação
CREATE TYPE decisao_qualificacao AS ENUM ('aceito', 'recusado', 'pendente');

-- Caso
CREATE TYPE tipo_caso AS ENUM ('contencioso', 'consultivo', 'administrativo', 'consensual');
CREATE TYPE status_caso AS ENUM ('ativo', 'suspenso', 'em_execucao', 'encerrado');
CREATE TYPE fase_caso AS ENUM ('captacao', 'qualificacao', 'analise', 'acao', 'registro');

-- Prazo
CREATE TYPE origem_prazo AS ENUM ('publicacao', 'intimacao', 'contrato', 'manual', 'detectado_por_ia');
CREATE TYPE status_prazo AS ENUM ('pendente', 'em_andamento', 'minuta_pronta', 'concluido', 'perdido');
CREATE TYPE prioridade AS ENUM ('baixa', 'media', 'alta', 'critica');

-- Tarefa
CREATE TYPE status_tarefa AS ENUM ('aberta', 'em_andamento', 'aguardando', 'concluida', 'cancelada');
CREATE TYPE origem_tarefa AS ENUM ('manual', 'playbook', 'sugerida_por_ia', 'automatica_prazo');

-- Documento
CREATE TYPE visibilidade_documento AS ENUM ('interno', 'cliente', 'convidado');

-- Grafo
CREATE TYPE tipo_no AS ENUM ('fato', 'prova', 'alegacao', 'pedido', 'base_legal', 'risco');
CREATE TYPE tipo_relacao AS ENUM ('suportado_por', 'depende_de', 'fundamentado_por', 'enfraquecido_por', 'contradiz', 'corrobora');

-- IA
CREATE TYPE tipo_gatilho AS ENUM ('evento', 'manual', 'agendado', 'encadeado');
CREATE TYPE status_execucao AS ENUM ('na_fila', 'executando', 'concluido', 'falhou', 'cancelado');
CREATE TYPE feedback_humano AS ENUM ('aceito', 'modificado', 'rejeitado');

-- Sugestão
CREATE TYPE status_sugestao AS ENUM ('pendente', 'aceita', 'modificada', 'rejeitada', 'expirada');

-- Ação
CREATE TYPE origem_acao AS ENUM ('manual', 'sugerida_por_ia', 'playbook', 'automacao');
CREATE TYPE status_acao AS ENUM ('proposta', 'em_aprovacao', 'aprovada', 'executada', 'cancelada', 'rejeitada');

-- Auditoria
CREATE TYPE tipo_ator AS ENUM ('usuario', 'agente', 'sistema');

-- Sinal Oportunidade
CREATE TYPE tipo_sinal AS ENUM ('prazo_critico', 'valor_alto', 'recorrencia_cliente', 'indicacao', 'urgencia_declarada', 'complexidade_alta');

-- ============================================================================
-- TABELAS CORE
-- ============================================================================

-- Organizações (escritórios, departamentos jurídicos)
CREATE TABLE organizacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo_organizacao tipo_organizacao NOT NULL,
  configuracoes JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Membros da organização (vincula auth.users)
CREATE TABLE membros_organizacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  papel TEXT NOT NULL DEFAULT 'membro',
  permissoes JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organizacao_id, usuario_id)
);

-- Políticas da organização
CREATE TABLE politicas_organizacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  chave_politica TEXT NOT NULL,
  valor_politica JSONB NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  atualizado_por UUID,
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organizacao_id, chave_politica)
);

-- Eventos de domínio (Event Sourcing)
CREATE TABLE eventos_dominio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id),
  tipo_evento TEXT NOT NULL,
  tipo_agregado TEXT NOT NULL,
  id_agregado TEXT NOT NULL,
  payload JSONB NOT NULL,
  metadados JSONB DEFAULT '{}',
  versao INTEGER NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELAS DE NEGÓCIO
-- ============================================================================

-- Clientes
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  tipo_cliente tipo_cliente NOT NULL,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco JSONB,
  metadados JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários do cliente (portal)
CREATE TABLE usuarios_cliente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  portal_habilitado BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  tipo_cliente tipo_cliente NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  tipo_servico tipo_servico NOT NULL,
  nivel_urgencia nivel_urgencia DEFAULT 'media',
  status status_lead DEFAULT 'novo',
  origem origem_lead,
  referencia_origem TEXT,
  cliente_id INTEGER REFERENCES clientes(id),
  caso_convertido_id INTEGER,
  descricao_inicial TEXT,
  metadados JSONB DEFAULT '{}',
  criado_por UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Qualificações de Lead
CREATE TABLE qualificacoes_lead (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  classificacao TEXT,
  nivel_risco nivel_risco,
  area_juridica TEXT[],
  prazo_critico DATE,
  data_prescricao DATE,
  alerta_prescricao_enviado BOOLEAN DEFAULT false,
  resumo_executivo TEXT,
  fatos_principais JSONB,
  estrategia_recomendada TEXT,
  confianca_ia NUMERIC(3,2),
  id_execucao_ia UUID,
  pontuacao_fundamentacao NUMERIC(3,2),
  pontuacao_consistencia NUMERIC(3,2),
  decisao decisao_qualificacao DEFAULT 'pendente',
  motivo_recusa TEXT,
  validado_por UUID,
  validado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Casos
CREATE TABLE casos (
  id SERIAL PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  lead_id UUID REFERENCES leads(id),
  titulo TEXT NOT NULL,
  numero_interno TEXT,
  numero_externo TEXT,
  tipo_caso tipo_caso NOT NULL,
  area_juridica TEXT[],
  status_caso status_caso DEFAULT 'ativo',
  fase_atual fase_caso DEFAULT 'captacao',
  usuario_responsavel_id UUID,
  ids_usuarios_equipe UUID[],
  portal_cliente_habilitado BOOLEAN DEFAULT false,
  valor_causa NUMERIC(15,2),
  tribunal TEXT,
  id_perfil_juiz UUID,
  aberto_em TIMESTAMPTZ DEFAULT NOW(),
  encerrado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Atualizar referência de lead para caso
ALTER TABLE leads ADD CONSTRAINT fk_caso_convertido 
  FOREIGN KEY (caso_convertido_id) REFERENCES casos(id);

-- ============================================================================
-- TABELAS OPERACIONAIS
-- ============================================================================

-- Prazos
CREATE TABLE prazos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  caso_id INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  tipo_prazo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  origem origem_prazo,
  referencia_origem TEXT,
  id_documento_origem UUID,
  data_original DATE NOT NULL,
  data_ajustada DATE NOT NULL,
  prioridade prioridade DEFAULT 'media',
  status status_prazo DEFAULT 'pendente',
  sala_guerra_ativada BOOLEAN DEFAULT false,
  sala_guerra_ativada_em TIMESTAMPTZ,
  atribuido_a UUID,
  backup_atribuido_a UUID,
  minuta_automatica_gerada BOOLEAN DEFAULT false,
  id_documento_minuta_automatica UUID,
  config_alertas JSONB DEFAULT '{}',
  alertas_enviados JSONB DEFAULT '[]',
  concluido_em TIMESTAMPTZ,
  concluido_por UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tarefas do Caso
CREATE TABLE tarefas_caso (
  id SERIAL PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  caso_id INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  prazo_id UUID REFERENCES prazos(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status status_tarefa DEFAULT 'aberta',
  prioridade prioridade DEFAULT 'media',
  data_limite TIMESTAMPTZ,
  iniciada_em TIMESTAMPTZ,
  concluida_em TIMESTAMPTZ,
  atribuida_a UUID,
  origem origem_tarefa,
  id_passo_playbook UUID,
  id_execucao_ia UUID,
  criado_por UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Documentos
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  caso_id INTEGER REFERENCES casos(id),
  lead_id UUID REFERENCES leads(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo_documento TEXT,
  caminho_storage TEXT NOT NULL,
  nome_arquivo TEXT,
  tamanho_arquivo BIGINT,
  tipo_mime TEXT,
  ocr_processado BOOLEAN DEFAULT false,
  texto_ocr TEXT,
  visibilidade visibilidade_documento DEFAULT 'interno',
  contem_dados_pessoais BOOLEAN DEFAULT false,
  dados_pessoais_anonimizados BOOLEAN DEFAULT false,
  mapa_anonimizacao JSONB,
  resumo_ia TEXT,
  entidades_ia JSONB,
  classificacao_ia JSONB,
  criado_por UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Referências circulares para documentos
ALTER TABLE prazos ADD CONSTRAINT fk_documento_origem 
  FOREIGN KEY (id_documento_origem) REFERENCES documentos(id);
ALTER TABLE prazos ADD CONSTRAINT fk_documento_minuta 
  FOREIGN KEY (id_documento_minuta_automatica) REFERENCES documentos(id);

-- ============================================================================
-- GRAFO DE EVIDÊNCIAS
-- ============================================================================

-- Nós do Grafo
CREATE TABLE nos_grafo_evidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  caso_id INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  tipo_no tipo_no NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  referencias JSONB,
  forca NUMERIC(3,2) DEFAULT 0.5,
  gerado_por_ia BOOLEAN DEFAULT false,
  id_execucao_ia UUID,
  confianca_ia NUMERIC(3,2),
  criado_por UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Arestas do Grafo
CREATE TABLE arestas_grafo_evidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  caso_id INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  no_origem UUID NOT NULL REFERENCES nos_grafo_evidencias(id) ON DELETE CASCADE,
  no_destino UUID NOT NULL REFERENCES nos_grafo_evidencias(id) ON DELETE CASCADE,
  relacao tipo_relacao NOT NULL,
  peso NUMERIC(3,2) DEFAULT 1.0,
  notas TEXT,
  gerado_por_ia BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELAS DE IA
-- ============================================================================

-- Execuções de Agente IA
CREATE TABLE execucoes_agente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  tipo_agente TEXT NOT NULL,
  versao_agente TEXT,
  nivel_autonomia nivel_autonomia NOT NULL,
  nivel_risco nivel_risco,
  tipo_gatilho tipo_gatilho,
  id_evento_gatilho UUID REFERENCES eventos_dominio(id),
  tipo_entidade_gatilho TEXT,
  id_entidade_gatilho TEXT,
  dados_entrada JSONB,
  dados_saida JSONB,
  pontuacao_confianca NUMERIC(3,2),
  pontuacao_fundamentacao NUMERIC(3,2),
  pontuacao_consistencia NUMERIC(3,2),
  iniciado_em TIMESTAMPTZ DEFAULT NOW(),
  finalizado_em TIMESTAMPTZ,
  duracao_ms INTEGER,
  status status_execucao DEFAULT 'na_fila',
  mensagem_erro TEXT,
  feedback_humano feedback_humano,
  feedback_humano_por UUID,
  feedback_humano_em TIMESTAMPTZ,
  notas_feedback_humano TEXT,
  nome_modelo TEXT,
  versao_modelo TEXT,
  hash_prompt TEXT,
  base_legal TEXT,
  finalidade TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Sugestões de IA
CREATE TABLE sugestoes_ia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  id_execucao_ia UUID NOT NULL REFERENCES execucoes_agente(id),
  tipo_sugestao TEXT NOT NULL,
  titulo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  razao TEXT,
  estruturado JSONB,
  confianca NUMERIC(3,2),
  pontuacao_fundamentacao NUMERIC(3,2),
  pontuacao_acionabilidade NUMERIC(3,2),
  pontuacao_risco NUMERIC(3,2),
  status status_sugestao DEFAULT 'pendente',
  acionada_por UUID,
  acionada_em TIMESTAMPTZ,
  notas_acao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Ações
CREATE TABLE acoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  tipo_entidade TEXT NOT NULL,
  id_entidade TEXT NOT NULL,
  tipo_acao TEXT NOT NULL,
  parametros_acao JSONB,
  origem origem_acao,
  id_sugestao_ia UUID REFERENCES sugestoes_ia(id),
  status status_acao DEFAULT 'proposta',
  requer_aprovacao BOOLEAN DEFAULT true,
  papeis_aprovadores_requeridos TEXT[],
  aprovada_por UUID,
  aprovada_em TIMESTAMPTZ,
  notas_aprovacao TEXT,
  executada_por UUID,
  executada_em TIMESTAMPTZ,
  resultado_execucao JSONB,
  rejeitada_por UUID,
  rejeitada_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  criado_por UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUDITORIA E AUXILIARES
-- ============================================================================

-- Logs de Auditoria
CREATE TABLE logs_auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  tipo_ator tipo_ator,
  id_usuario_ator UUID,
  tipo_agente_ator TEXT,
  evento TEXT NOT NULL,
  categoria_evento TEXT,
  tipo_entidade TEXT,
  id_entidade TEXT,
  dados_antes JSONB,
  dados_depois JSONB,
  dados_diff JSONB,
  endereco_ip INET,
  agente_usuario TEXT,
  id_execucao_ia UUID REFERENCES execucoes_agente(id),
  id_acao UUID REFERENCES acoes(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Perfis de Juiz
CREATE TABLE perfis_juiz (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tribunal TEXT NOT NULL,
  unidade TEXT,
  cargo TEXT,
  estatisticas JSONB DEFAULT '{}',
  padroes_por_materia JSONB DEFAULT '{}',
  preferencias JSONB DEFAULT '{}',
  insights JSONB DEFAULT '{}',
  janela_dados_meses INTEGER DEFAULT 24,
  tamanho_amostra INTEGER,
  ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
  frequencia_atualizacao TEXT DEFAULT 'mensal',
  fontes_dados JSONB DEFAULT '[]'
);

-- Playbooks
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID REFERENCES organizacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  condicoes_gatilho JSONB,
  area_juridica TEXT[],
  tipos_caso TEXT[],
  ativo BOOLEAN DEFAULT true,
  e_modelo BOOLEAN DEFAULT false,
  duracao_estimada_horas INTEGER,
  taxa_sucesso NUMERIC(3,2),
  vezes_usado INTEGER DEFAULT 0,
  criado_por UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Sinais de Oportunidade
CREATE TABLE sinais_oportunidade (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  caso_id INTEGER REFERENCES casos(id),
  tipo_sinal tipo_sinal NOT NULL,
  descricao TEXT,
  impacto_potencial TEXT,
  acao_recomendada TEXT,
  expira_em TIMESTAMPTZ,
  acionado BOOLEAN DEFAULT false,
  acionado_em TIMESTAMPTZ,
  acionado_por UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relacionamento N:N (exemplo: membro de)
CREATE TABLE e_membro_de (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  entidade_tipo TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  papel TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Organizações
CREATE INDEX idx_organizacoes_tipo ON organizacoes(tipo_organizacao);

-- Membros
CREATE INDEX idx_membros_org ON membros_organizacao(organizacao_id);
CREATE INDEX idx_membros_usuario ON membros_organizacao(usuario_id);

-- Eventos
CREATE INDEX idx_eventos_org ON eventos_dominio(organizacao_id);
CREATE INDEX idx_eventos_tipo ON eventos_dominio(tipo_evento);
CREATE INDEX idx_eventos_agregado ON eventos_dominio(tipo_agregado, id_agregado);
CREATE INDEX idx_eventos_criado ON eventos_dominio(criado_em DESC);

-- Clientes
CREATE INDEX idx_clientes_org ON clientes(organizacao_id);
CREATE INDEX idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);

-- Leads
CREATE INDEX idx_leads_org ON leads(organizacao_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_cliente ON leads(cliente_id);

-- Qualificações
CREATE INDEX idx_qualificacoes_lead ON qualificacoes_lead(lead_id);
CREATE INDEX idx_qualificacoes_decisao ON qualificacoes_lead(decisao);

-- Casos
CREATE INDEX idx_casos_org ON casos(organizacao_id);
CREATE INDEX idx_casos_cliente ON casos(cliente_id);
CREATE INDEX idx_casos_status ON casos(status_caso);
CREATE INDEX idx_casos_fase ON casos(fase_atual);
CREATE INDEX idx_casos_responsavel ON casos(usuario_responsavel_id);

-- Prazos
CREATE INDEX idx_prazos_org ON prazos(organizacao_id);
CREATE INDEX idx_prazos_caso ON prazos(caso_id);
CREATE INDEX idx_prazos_status ON prazos(status);
CREATE INDEX idx_prazos_data ON prazos(data_ajustada);
CREATE INDEX idx_prazos_atribuido ON prazos(atribuido_a);

-- Tarefas
CREATE INDEX idx_tarefas_org ON tarefas_caso(organizacao_id);
CREATE INDEX idx_tarefas_caso ON tarefas_caso(caso_id);
CREATE INDEX idx_tarefas_status ON tarefas_caso(status);
CREATE INDEX idx_tarefas_atribuida ON tarefas_caso(atribuida_a);

-- Documentos
CREATE INDEX idx_documentos_org ON documentos(organizacao_id);
CREATE INDEX idx_documentos_caso ON documentos(caso_id);
CREATE INDEX idx_documentos_lead ON documentos(lead_id);
CREATE INDEX idx_documentos_tipo ON documentos(tipo_documento);

-- Grafo
CREATE INDEX idx_nos_caso ON nos_grafo_evidencias(caso_id);
CREATE INDEX idx_nos_tipo ON nos_grafo_evidencias(tipo_no);
CREATE INDEX idx_arestas_caso ON arestas_grafo_evidencias(caso_id);
CREATE INDEX idx_arestas_origem ON arestas_grafo_evidencias(no_origem);
CREATE INDEX idx_arestas_destino ON arestas_grafo_evidencias(no_destino);

-- Execuções IA
CREATE INDEX idx_execucoes_org ON execucoes_agente(organizacao_id);
CREATE INDEX idx_execucoes_tipo ON execucoes_agente(tipo_agente);
CREATE INDEX idx_execucoes_status ON execucoes_agente(status);

-- Sugestões
CREATE INDEX idx_sugestoes_org ON sugestoes_ia(organizacao_id);
CREATE INDEX idx_sugestoes_execucao ON sugestoes_ia(id_execucao_ia);
CREATE INDEX idx_sugestoes_status ON sugestoes_ia(status);

-- Ações
CREATE INDEX idx_acoes_org ON acoes(organizacao_id);
CREATE INDEX idx_acoes_entidade ON acoes(tipo_entidade, id_entidade);
CREATE INDEX idx_acoes_status ON acoes(status);

-- Auditoria
CREATE INDEX idx_auditoria_org ON logs_auditoria(organizacao_id);
CREATE INDEX idx_auditoria_evento ON logs_auditoria(evento);
CREATE INDEX idx_auditoria_entidade ON logs_auditoria(tipo_entidade, id_entidade);
CREATE INDEX idx_auditoria_criado ON logs_auditoria(criado_em DESC);

-- Sinais
CREATE INDEX idx_sinais_org ON sinais_oportunidade(organizacao_id);
CREATE INDEX idx_sinais_lead ON sinais_oportunidade(lead_id);
CREATE INDEX idx_sinais_caso ON sinais_oportunidade(caso_id);

-- ============================================================================
-- FUNÇÕES DE ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================================

CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de atualização
CREATE TRIGGER trg_organizacoes_atualizado BEFORE UPDATE ON organizacoes
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_clientes_atualizado BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_leads_atualizado BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_casos_atualizado BEFORE UPDATE ON casos
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_prazos_atualizado BEFORE UPDATE ON prazos
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_tarefas_atualizado BEFORE UPDATE ON tarefas_caso
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_documentos_atualizado BEFORE UPDATE ON documentos
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_nos_atualizado BEFORE UPDATE ON nos_grafo_evidencias
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_playbooks_atualizado BEFORE UPDATE ON playbooks
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas principais
ALTER TABLE organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_organizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicas_organizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_dominio ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualificacoes_lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prazos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas_caso ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE nos_grafo_evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE arestas_grafo_evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes_agente ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinais_oportunidade ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar membro da organização
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM membros_organizacao 
    WHERE organizacao_id = org_id 
    AND usuario_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas básicas (membros podem ver dados da sua organização)
CREATE POLICY "Membros veem sua organização" ON organizacoes
  FOR SELECT USING (is_org_member(id));

CREATE POLICY "Membros veem membros da org" ON membros_organizacao
  FOR SELECT USING (is_org_member(organizacao_id));

CREATE POLICY "Membros veem clientes da org" ON clientes
  FOR ALL USING (is_org_member(organizacao_id));

CREATE POLICY "Membros veem leads da org" ON leads
  FOR ALL USING (is_org_member(organizacao_id));

CREATE POLICY "Membros veem casos da org" ON casos
  FOR ALL USING (is_org_member(organizacao_id));

CREATE POLICY "Membros veem prazos da org" ON prazos
  FOR ALL USING (is_org_member(organizacao_id));

CREATE POLICY "Membros veem tarefas da org" ON tarefas_caso
  FOR ALL USING (is_org_member(organizacao_id));

CREATE POLICY "Membros veem documentos da org" ON documentos
  FOR ALL USING (is_org_member(organizacao_id));

CREATE POLICY "Membros veem grafo da org" ON nos_grafo_evidencias
  FOR ALL USING (is_org_member(organizacao_id));

CREATE POLICY "Membros veem arestas da org" ON arestas_grafo_evidencias
  FOR ALL USING (is_org_member(organizacao_id));

CREATE POLICY "Membros veem sugestoes da org" ON sugestoes_ia
  FOR ALL USING (is_org_member(organizacao_id));

CREATE POLICY "Membros veem acoes da org" ON acoes
  FOR ALL USING (is_org_member(organizacao_id));

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE organizacoes IS 'Escritórios de advocacia e departamentos jurídicos';
COMMENT ON TABLE casos IS 'Casos jurídicos (processos, consultorias, etc)';
COMMENT ON TABLE leads IS 'Potenciais clientes/casos em qualificação';
COMMENT ON TABLE prazos IS 'Prazos processuais e contratuais';
COMMENT ON TABLE documentos IS 'Documentos do caso com metadados de IA';
COMMENT ON TABLE nos_grafo_evidencias IS 'Nós do grafo de evidências (fatos, provas, alegações)';
COMMENT ON TABLE arestas_grafo_evidencias IS 'Relações entre nós do grafo';
COMMENT ON TABLE execucoes_agente IS 'Registro de execuções de agentes de IA';
COMMENT ON TABLE sugestoes_ia IS 'Sugestões geradas por IA';
COMMENT ON TABLE acoes IS 'Ações a serem executadas (com workflow de aprovação)';
COMMENT ON TABLE logs_auditoria IS 'Trilha de auditoria completa';
