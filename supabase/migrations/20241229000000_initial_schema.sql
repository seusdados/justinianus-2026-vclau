-- ═══════════════════════════════════════════════════════════════════════════
-- JUSTINIANUS.AI — SCHEMA SQL COMPLETO v2.0
-- Migration inicial para Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE tipo_organizacao AS ENUM ('escritorio_advocacia', 'departamento_juridico', 'plataforma');
CREATE TYPE tipo_cliente AS ENUM ('pessoa_fisica', 'pessoa_juridica');
CREATE TYPE tipo_servico AS ENUM ('consultivo', 'contencioso', 'administrativo', 'consensual');
CREATE TYPE nivel_urgencia AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE status_lead AS ENUM ('novo', 'em_analise', 'qualificado', 'recusado', 'convertido');
CREATE TYPE origem_lead AS ENUM ('formulario', 'email', 'upload', 'api', 'manual', 'indicacao');
CREATE TYPE status_qualificacao AS ENUM ('em_andamento', 'concluida', 'cancelada');
CREATE TYPE tipo_caso AS ENUM ('contencioso', 'consultivo', 'administrativo', 'consensual');
CREATE TYPE status_caso AS ENUM ('ativo', 'suspenso', 'encerrado', 'arquivado');
CREATE TYPE fase_caso AS ENUM ('captacao', 'qualificacao', 'analise', 'acao', 'registro');
CREATE TYPE tipo_prazo AS ENUM ('fatal', 'judicial', 'interno', 'contratual', 'prescricional', 'recursal');
CREATE TYPE status_prazo AS ENUM ('pendente', 'em_andamento', 'concluido', 'perdido', 'cancelado');
CREATE TYPE prioridade_prazo AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE status_tarefa AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada', 'bloqueada');
CREATE TYPE tipo_documento AS ENUM ('peticao', 'contrato', 'procuracao', 'documento_pessoal', 'comprovante', 'parecer', 'minuta', 'correspondencia', 'outro');
CREATE TYPE status_documento AS ENUM ('pendente', 'processando', 'processado', 'erro');
CREATE TYPE tipo_no_grafo AS ENUM ('fato', 'prova', 'alegacao', 'pedido', 'base_legal', 'risco');
CREATE TYPE tipo_relacao_grafo AS ENUM ('fundamentado_por', 'contraditado_por', 'suporta', 'depende_de', 'relacionado_a', 'enfraquecido_por');
CREATE TYPE status_execucao AS ENUM ('pendente', 'executando', 'concluida', 'falhou', 'cancelada');
CREATE TYPE tipo_agente AS ENUM ('qualificador', 'analisador_documentos', 'construtor_grafo', 'gerador_minutas', 'detector_oportunidades', 'avaliador_riscos', 'pesquisador_jurisprudencia');
CREATE TYPE status_sugestao AS ENUM ('pendente', 'aceita', 'rejeitada', 'expirada', 'aplicada_parcialmente');
CREATE TYPE tipo_sugestao AS ENUM ('estrategia', 'acao', 'minuta', 'argumento', 'prazo', 'alerta');
CREATE TYPE status_acao AS ENUM ('proposta', 'em_aprovacao', 'aprovada', 'executando', 'executada', 'concluida', 'rejeitada', 'falhou');
CREATE TYPE origem_acao AS ENUM ('manual', 'playbook', 'sugerida_por_ia', 'automacao');
CREATE TYPE categoria_evento_auditoria AS ENUM ('acesso', 'modificacao', 'exclusao', 'execucao_ia', 'aprovacao', 'sistema', 'seguranca');
CREATE TYPE tipo_sinal_oportunidade AS ENUM ('pressao_financeira', 'pressao_prazo', 'lacuna_prova', 'precedente_favoravel', 'fraqueza_oponente', 'janela_acordo', 'oportunidade_urgencia', 'momento_estrategico');

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELAS CORE
-- ═══════════════════════════════════════════════════════════════════════════

-- Organizações (escritórios/departamentos)
CREATE TABLE organizacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    tipo_organizacao tipo_organizacao NOT NULL DEFAULT 'escritorio_advocacia',
    configuracoes JSONB DEFAULT '{}',
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Membros da organização (relacionamento users <-> org)
CREATE TABLE membros_organizacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    ativo BOOLEAN DEFAULT TRUE,
    atualizado_por UUID REFERENCES auth.users(id),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organizacao_id, chave_politica)
);

-- Eventos de domínio (event sourcing)
CREATE TABLE eventos_dominio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    tipo_evento TEXT NOT NULL,
    tipo_agregado TEXT NOT NULL,
    id_agregado TEXT NOT NULL,
    payload JSONB NOT NULL,
    metadados JSONB DEFAULT '{}',
    versao INTEGER NOT NULL DEFAULT 1,
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- CLIENTES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    tipo_cliente tipo_cliente NOT NULL,
    nome TEXT NOT NULL,
    documento TEXT,
    email TEXT,
    telefone TEXT,
    endereco JSONB,
    dados_adicionais JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usuarios_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    papel TEXT DEFAULT 'contato',
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cliente_id, usuario_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- LEADS E QUALIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════════════════

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
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE qualificacoes_lead (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    id_execucao_ia UUID,
    status status_qualificacao DEFAULT 'em_andamento',
    pontuacao_viabilidade DECIMAL(3,2),
    pontuacao_complexidade DECIMAL(3,2),
    pontuacao_valor_potencial DECIMAL(3,2),
    pontuacao_urgencia DECIMAL(3,2),
    pontuacao_geral DECIMAL(3,2),
    tipo_caso_sugerido tipo_caso,
    areas_direito TEXT[],
    riscos_identificados JSONB DEFAULT '[]',
    documentos_necessarios JSONB DEFAULT '[]',
    proximos_passos JSONB DEFAULT '[]',
    analise_detalhada TEXT,
    resumo_executivo TEXT,
    recomendacao TEXT,
    confianca_analise DECIMAL(3,2),
    valor_causa_estimado DECIMAL(15,2),
    honorarios_sugeridos JSONB,
    tempo_estimado_resolucao TEXT,
    qualificado_por UUID REFERENCES auth.users(id),
    qualificado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- CASOS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE casos (
    id SERIAL PRIMARY KEY,
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    lead_origem_id UUID REFERENCES leads(id),
    numero_interno TEXT,
    numero_externo TEXT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo_caso tipo_caso NOT NULL,
    area_direito TEXT,
    status_caso status_caso DEFAULT 'ativo',
    fase_atual fase_caso DEFAULT 'captacao',
    tribunal TEXT,
    vara TEXT,
    comarca TEXT,
    uf CHAR(2),
    valor_causa DECIMAL(15,2),
    valor_condenacao DECIMAL(15,2),
    data_distribuicao DATE,
    data_citacao DATE,
    data_audiencia DATE,
    responsavel_id UUID REFERENCES auth.users(id),
    equipe_ids UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    metadados JSONB DEFAULT '{}',
    aberto_em TIMESTAMPTZ DEFAULT NOW(),
    encerrado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PRAZOS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE prazos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    caso_id INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo_prazo tipo_prazo NOT NULL,
    data_limite TIMESTAMPTZ NOT NULL,
    data_alerta TIMESTAMPTZ,
    status status_prazo DEFAULT 'pendente',
    prioridade prioridade_prazo DEFAULT 'media',
    responsavel_id UUID REFERENCES auth.users(id),
    dias_corridos BOOLEAN DEFAULT TRUE,
    conta_dias_uteis BOOLEAN DEFAULT FALSE,
    base_legal TEXT,
    observacoes TEXT,
    concluido_em TIMESTAMPTZ,
    concluido_por UUID REFERENCES auth.users(id),
    cancelado_em TIMESTAMPTZ,
    cancelado_por UUID REFERENCES auth.users(id),
    motivo_cancelamento TEXT,
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- TAREFAS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE tarefas_caso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    caso_id INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    prazo_id UUID REFERENCES prazos(id),
    titulo TEXT NOT NULL,
    descricao TEXT,
    status status_tarefa DEFAULT 'pendente',
    prioridade prioridade_prazo DEFAULT 'media',
    responsavel_id UUID REFERENCES auth.users(id),
    data_vencimento TIMESTAMPTZ,
    estimativa_horas DECIMAL(5,2),
    horas_trabalhadas DECIMAL(5,2) DEFAULT 0,
    checklist JSONB DEFAULT '[]',
    anexos JSONB DEFAULT '[]',
    concluida_em TIMESTAMPTZ,
    concluida_por UUID REFERENCES auth.users(id),
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- DOCUMENTOS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    caso_id INTEGER REFERENCES casos(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    nome_arquivo TEXT NOT NULL,
    tipo_documento tipo_documento DEFAULT 'outro',
    mime_type TEXT,
    tamanho_bytes BIGINT,
    storage_path TEXT NOT NULL,
    storage_bucket TEXT DEFAULT 'documentos',
    hash_sha256 TEXT,
    status status_documento DEFAULT 'pendente',
    texto_extraido TEXT,
    metadados_extraidos JSONB DEFAULT '{}',
    paginas INTEGER,
    idioma TEXT DEFAULT 'pt-BR',
    confianca_ocr DECIMAL(3,2),
    processado_em TIMESTAMPTZ,
    erro_processamento TEXT,
    tags TEXT[] DEFAULT '{}',
    versao INTEGER DEFAULT 1,
    documento_pai_id UUID REFERENCES documentos(id),
    enviado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- GRAFO DE EVIDÊNCIAS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE nos_grafo_evidencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    caso_id INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    tipo_no tipo_no_grafo NOT NULL,
    titulo TEXT NOT NULL,
    conteudo TEXT,
    documento_origem_id UUID REFERENCES documentos(id),
    pagina_origem INTEGER,
    trecho_origem TEXT,
    confianca DECIMAL(3,2),
    verificado BOOLEAN DEFAULT FALSE,
    verificado_por UUID REFERENCES auth.users(id),
    verificado_em TIMESTAMPTZ,
    metadados JSONB DEFAULT '{}',
    embedding VECTOR(1536),
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE arestas_grafo_evidencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    caso_id INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    no_origem UUID NOT NULL REFERENCES nos_grafo_evidencias(id) ON DELETE CASCADE,
    no_destino UUID NOT NULL REFERENCES nos_grafo_evidencias(id) ON DELETE CASCADE,
    relacao tipo_relacao_grafo NOT NULL,
    peso DECIMAL(3,2) DEFAULT 1.0,
    descricao TEXT,
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(no_origem, no_destino, relacao)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- EXECUÇÕES DE IA
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE execucoes_agente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    caso_id INTEGER REFERENCES casos(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    documento_id UUID REFERENCES documentos(id) ON DELETE SET NULL,
    tipo_agente tipo_agente NOT NULL,
    status status_execucao DEFAULT 'pendente',
    parametros_entrada JSONB DEFAULT '{}',
    resultado JSONB,
    erro TEXT,
    modelo_usado TEXT,
    tokens_entrada INTEGER,
    tokens_saida INTEGER,
    custo_estimado DECIMAL(10,6),
    tempo_execucao_ms INTEGER,
    iniciado_em TIMESTAMPTZ,
    concluido_em TIMESTAMPTZ,
    solicitado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SUGESTÕES DA IA
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sugestoes_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    id_execucao_ia UUID NOT NULL REFERENCES execucoes_agente(id) ON DELETE CASCADE,
    tipo_sugestao tipo_sugestao NOT NULL,
    titulo TEXT NOT NULL,
    resumo TEXT NOT NULL,
    razao TEXT,
    estruturado JSONB DEFAULT '{}',
    confianca DECIMAL(3,2),
    pontuacao_fundamentacao DECIMAL(3,2),
    pontuacao_acionabilidade DECIMAL(3,2),
    status status_sugestao DEFAULT 'pendente',
    respondido_por UUID REFERENCES auth.users(id),
    respondido_em TIMESTAMPTZ,
    feedback TEXT,
    expira_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- AÇÕES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE acoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    tipo_entidade TEXT NOT NULL,
    id_entidade TEXT NOT NULL,
    tipo_acao TEXT NOT NULL,
    parametros_acao JSONB DEFAULT '{}',
    origem origem_acao,
    id_sugestao_origem UUID REFERENCES sugestoes_ia(id),
    id_playbook_origem UUID,
    status status_acao DEFAULT 'proposta',
    aprovada_por UUID REFERENCES auth.users(id),
    aprovada_em TIMESTAMPTZ,
    rejeitada_em TIMESTAMPTZ,
    motivo_rejeicao TEXT,
    executada_em TIMESTAMPTZ,
    resultado_execucao JSONB,
    erro_execucao TEXT,
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- AUDITORIA
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id),
    tipo_evento TEXT NOT NULL,
    categoria_evento categoria_evento_auditoria NOT NULL,
    tipo_entidade TEXT NOT NULL,
    id_entidade TEXT NOT NULL,
    descricao TEXT NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_origem TEXT,
    user_agent TEXT,
    metadados JSONB DEFAULT '{}',
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PERFIS DE JUÍZES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE perfis_juiz (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tribunal TEXT NOT NULL,
    vara TEXT,
    comarca TEXT,
    uf CHAR(2),
    especialidade TEXT,
    estatisticas JSONB DEFAULT '{}',
    tendencias JSONB DEFAULT '{}',
    tempo_medio_decisao_dias INTEGER,
    taxa_deferimento DECIMAL(3,2),
    observacoes TEXT,
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PLAYBOOKS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE playbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo_caso_aplicavel tipo_caso[],
    fase_aplicavel fase_caso[],
    condicoes_ativacao JSONB DEFAULT '{}',
    passos JSONB NOT NULL DEFAULT '[]',
    ativo BOOLEAN DEFAULT TRUE,
    execucoes_count INTEGER DEFAULT 0,
    taxa_sucesso DECIMAL(3,2),
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SINAIS DE OPORTUNIDADE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sinais_oportunidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    caso_id INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    tipo_sinal tipo_sinal_oportunidade NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    acao_recomendada TEXT,
    impacto_potencial TEXT,
    confianca DECIMAL(3,2),
    dados_suporte JSONB DEFAULT '{}',
    fonte TEXT,
    id_execucao_ia UUID REFERENCES execucoes_agente(id),
    expira_em TIMESTAMPTZ,
    expirado BOOLEAN DEFAULT FALSE,
    acao_tomada BOOLEAN DEFAULT FALSE,
    acao_id UUID REFERENCES acoes(id),
    detectado_em TIMESTAMPTZ DEFAULT NOW(),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════════════════════════════

-- Organizações
CREATE INDEX idx_membros_org_usuario ON membros_organizacao(usuario_id);
CREATE INDEX idx_membros_org_organizacao ON membros_organizacao(organizacao_id);

-- Leads
CREATE INDEX idx_leads_organizacao ON leads(organizacao_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_criado_em ON leads(criado_em DESC);

-- Qualificações
CREATE INDEX idx_qualificacoes_lead ON qualificacoes_lead(lead_id);
CREATE INDEX idx_qualificacoes_status ON qualificacoes_lead(status);

-- Casos
CREATE INDEX idx_casos_organizacao ON casos(organizacao_id);
CREATE INDEX idx_casos_cliente ON casos(cliente_id);
CREATE INDEX idx_casos_status ON casos(status_caso);
CREATE INDEX idx_casos_fase ON casos(fase_atual);
CREATE INDEX idx_casos_responsavel ON casos(responsavel_id);

-- Prazos
CREATE INDEX idx_prazos_caso ON prazos(caso_id);
CREATE INDEX idx_prazos_data_limite ON prazos(data_limite);
CREATE INDEX idx_prazos_status ON prazos(status);
CREATE INDEX idx_prazos_responsavel ON prazos(responsavel_id);

-- Tarefas
CREATE INDEX idx_tarefas_caso ON tarefas_caso(caso_id);
CREATE INDEX idx_tarefas_status ON tarefas_caso(status);
CREATE INDEX idx_tarefas_responsavel ON tarefas_caso(responsavel_id);

-- Documentos
CREATE INDEX idx_documentos_caso ON documentos(caso_id);
CREATE INDEX idx_documentos_lead ON documentos(lead_id);
CREATE INDEX idx_documentos_status ON documentos(status);

-- Grafo
CREATE INDEX idx_nos_grafo_caso ON nos_grafo_evidencias(caso_id);
CREATE INDEX idx_nos_grafo_tipo ON nos_grafo_evidencias(tipo_no);
CREATE INDEX idx_arestas_origem ON arestas_grafo_evidencias(no_origem);
CREATE INDEX idx_arestas_destino ON arestas_grafo_evidencias(no_destino);

-- Execuções IA
CREATE INDEX idx_execucoes_caso ON execucoes_agente(caso_id);
CREATE INDEX idx_execucoes_status ON execucoes_agente(status);
CREATE INDEX idx_execucoes_tipo ON execucoes_agente(tipo_agente);

-- Sugestões
CREATE INDEX idx_sugestoes_execucao ON sugestoes_ia(id_execucao_ia);
CREATE INDEX idx_sugestoes_status ON sugestoes_ia(status);

-- Ações
CREATE INDEX idx_acoes_entidade ON acoes(tipo_entidade, id_entidade);
CREATE INDEX idx_acoes_status ON acoes(status);

-- Auditoria
CREATE INDEX idx_auditoria_entidade ON logs_auditoria(tipo_entidade, id_entidade);
CREATE INDEX idx_auditoria_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_auditoria_criado ON logs_auditoria(criado_em DESC);

-- Oportunidades
CREATE INDEX idx_oportunidades_caso ON sinais_oportunidade(caso_id);
CREATE INDEX idx_oportunidades_tipo ON sinais_oportunidade(tipo_sinal);
CREATE INDEX idx_oportunidades_expira ON sinais_oportunidade(expira_em) WHERE NOT expirado;

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS PARA UPDATED_AT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_organizacoes_updated_at BEFORE UPDATE ON organizacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_qualificacoes_updated_at BEFORE UPDATE ON qualificacoes_lead FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_casos_updated_at BEFORE UPDATE ON casos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_prazos_updated_at BEFORE UPDATE ON prazos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_tarefas_updated_at BEFORE UPDATE ON tarefas_caso FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_documentos_updated_at BEFORE UPDATE ON documentos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_nos_grafo_updated_at BEFORE UPDATE ON nos_grafo_evidencias FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_playbooks_updated_at BEFORE UPDATE ON playbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_perfis_juiz_updated_at BEFORE UPDATE ON perfis_juiz FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
