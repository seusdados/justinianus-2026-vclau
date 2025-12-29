-- ═══════════════════════════════════════════════════════════════════════════
-- JUSTINIANUS.AI — ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar RLS em todas as tabelas
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
ALTER TABLE perfis_juiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinais_oportunidade ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÕES AUXILIARES
-- ═══════════════════════════════════════════════════════════════════════════

-- Retorna os IDs das organizações que o usuário pertence
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT organizacao_id 
        FROM membros_organizacao 
        WHERE usuario_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verifica se usuário pertence a uma organização específica
CREATE OR REPLACE FUNCTION user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM membros_organizacao 
        WHERE usuario_id = auth.uid() 
        AND organizacao_id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Retorna o papel do usuário na organização
CREATE OR REPLACE FUNCTION get_user_role_in_org(org_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT papel 
        FROM membros_organizacao 
        WHERE usuario_id = auth.uid() 
        AND organizacao_id = org_id
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: ORGANIZAÇÕES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver organizações que pertencem"
    ON organizacoes FOR SELECT
    USING (id = ANY(get_user_org_ids()));

CREATE POLICY "Admins podem atualizar sua organização"
    ON organizacoes FOR UPDATE
    USING (get_user_role_in_org(id) IN ('admin', 'owner'))
    WITH CHECK (get_user_role_in_org(id) IN ('admin', 'owner'));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: MEMBROS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Membros podem ver outros membros da mesma org"
    ON membros_organizacao FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Admins podem gerenciar membros"
    ON membros_organizacao FOR ALL
    USING (get_user_role_in_org(organizacao_id) IN ('admin', 'owner'))
    WITH CHECK (get_user_role_in_org(organizacao_id) IN ('admin', 'owner'));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: CLIENTES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver clientes da sua org"
    ON clientes FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar clientes na sua org"
    ON clientes FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar clientes da sua org"
    ON clientes FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()))
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: LEADS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver leads da sua org"
    ON leads FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar leads na sua org"
    ON leads FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar leads da sua org"
    ON leads FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()))
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem deletar leads da sua org"
    ON leads FOR DELETE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: QUALIFICAÇÕES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver qualificações da sua org"
    ON qualificacoes_lead FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar qualificações na sua org"
    ON qualificacoes_lead FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar qualificações da sua org"
    ON qualificacoes_lead FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: CASOS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver casos da sua org"
    ON casos FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar casos na sua org"
    ON casos FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar casos da sua org"
    ON casos FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()))
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: PRAZOS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver prazos da sua org"
    ON prazos FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar prazos na sua org"
    ON prazos FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar prazos da sua org"
    ON prazos FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem deletar prazos da sua org"
    ON prazos FOR DELETE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: TAREFAS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver tarefas da sua org"
    ON tarefas_caso FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar tarefas na sua org"
    ON tarefas_caso FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar tarefas da sua org"
    ON tarefas_caso FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem deletar tarefas da sua org"
    ON tarefas_caso FOR DELETE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: DOCUMENTOS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver documentos da sua org"
    ON documentos FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar documentos na sua org"
    ON documentos FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar documentos da sua org"
    ON documentos FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem deletar documentos da sua org"
    ON documentos FOR DELETE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: GRAFO DE EVIDÊNCIAS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver nós do grafo da sua org"
    ON nos_grafo_evidencias FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar nós do grafo na sua org"
    ON nos_grafo_evidencias FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar nós do grafo da sua org"
    ON nos_grafo_evidencias FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem deletar nós do grafo da sua org"
    ON nos_grafo_evidencias FOR DELETE
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem ver arestas do grafo da sua org"
    ON arestas_grafo_evidencias FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar arestas do grafo na sua org"
    ON arestas_grafo_evidencias FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem deletar arestas do grafo da sua org"
    ON arestas_grafo_evidencias FOR DELETE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: EXECUÇÕES IA
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver execuções da sua org"
    ON execucoes_agente FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar execuções na sua org"
    ON execucoes_agente FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Sistema pode atualizar execuções"
    ON execucoes_agente FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: SUGESTÕES IA
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver sugestões da sua org"
    ON sugestoes_ia FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Sistema pode criar sugestões"
    ON sugestoes_ia FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem responder sugestões da sua org"
    ON sugestoes_ia FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: AÇÕES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver ações da sua org"
    ON acoes FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar ações na sua org"
    ON acoes FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar ações da sua org"
    ON acoes FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: AUDITORIA
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver logs de auditoria da sua org"
    ON logs_auditoria FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Sistema pode criar logs de auditoria"
    ON logs_auditoria FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

-- Logs de auditoria são imutáveis (sem UPDATE ou DELETE)

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: PERFIS DE JUÍZES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver perfis de juízes da sua org"
    ON perfis_juiz FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem criar perfis de juízes na sua org"
    ON perfis_juiz FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar perfis de juízes da sua org"
    ON perfis_juiz FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: PLAYBOOKS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver playbooks da sua org"
    ON playbooks FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Admins podem criar playbooks"
    ON playbooks FOR INSERT
    WITH CHECK (get_user_role_in_org(organizacao_id) IN ('admin', 'owner'));

CREATE POLICY "Admins podem atualizar playbooks"
    ON playbooks FOR UPDATE
    USING (get_user_role_in_org(organizacao_id) IN ('admin', 'owner'));

CREATE POLICY "Admins podem deletar playbooks"
    ON playbooks FOR DELETE
    USING (get_user_role_in_org(organizacao_id) IN ('admin', 'owner'));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: SINAIS DE OPORTUNIDADE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver sinais da sua org"
    ON sinais_oportunidade FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Sistema pode criar sinais"
    ON sinais_oportunidade FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Usuários podem atualizar sinais da sua org"
    ON sinais_oportunidade FOR UPDATE
    USING (organizacao_id = ANY(get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: EVENTOS DE DOMÍNIO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver eventos da sua org"
    ON eventos_dominio FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Sistema pode criar eventos"
    ON eventos_dominio FOR INSERT
    WITH CHECK (organizacao_id = ANY(get_user_org_ids()));

-- Eventos são imutáveis (sem UPDATE ou DELETE)

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: POLÍTICAS DA ORGANIZAÇÃO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver políticas da sua org"
    ON politicas_organizacao FOR SELECT
    USING (organizacao_id = ANY(get_user_org_ids()));

CREATE POLICY "Admins podem gerenciar políticas"
    ON politicas_organizacao FOR ALL
    USING (get_user_role_in_org(organizacao_id) IN ('admin', 'owner'))
    WITH CHECK (get_user_role_in_org(organizacao_id) IN ('admin', 'owner'));

-- ═══════════════════════════════════════════════════════════════════════════
-- POLICIES: USUÁRIOS CLIENTE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Usuários podem ver usuários cliente da sua org"
    ON usuarios_cliente FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM clientes c 
            WHERE c.id = usuarios_cliente.cliente_id 
            AND c.organizacao_id = ANY(get_user_org_ids())
        )
    );

CREATE POLICY "Usuários podem gerenciar usuários cliente da sua org"
    ON usuarios_cliente FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM clientes c 
            WHERE c.id = usuarios_cliente.cliente_id 
            AND c.organizacao_id = ANY(get_user_org_ids())
        )
    );

-- ═══════════════════════════════════════════════════════════════════════════
-- FIM DAS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════
