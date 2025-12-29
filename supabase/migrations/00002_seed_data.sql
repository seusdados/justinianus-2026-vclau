-- ═══════════════════════════════════════════════════════════════════════════
-- JUSTINIANUS.AI — DADOS DE EXEMPLO (SEED)
-- Para desenvolvimento e demonstração
-- ═══════════════════════════════════════════════════════════════════════════

-- Desabilitar RLS temporariamente para seed
ALTER TABLE organizacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE membros_organizacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE qualificacoes_lead DISABLE ROW LEVEL SECURITY;
ALTER TABLE casos DISABLE ROW LEVEL SECURITY;
ALTER TABLE prazos DISABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas_caso DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE nos_grafo_evidencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE arestas_grafo_evidencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes_agente DISABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes_ia DISABLE ROW LEVEL SECURITY;
ALTER TABLE acoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE sinais_oportunidade DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGANIZAÇÃO DEMO
-- ============================================================================

INSERT INTO organizacoes (id, nome, tipo_organizacao, configuracoes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Escritório Silva & Associados', 'escritorio_advocacia', 
   '{"areas_atuacao": ["trabalhista", "civil", "tributario"], "plano": "profissional"}');

-- ============================================================================
-- CLIENTES
-- ============================================================================

INSERT INTO clientes (id, organizacao_id, tipo_cliente, nome, cpf_cnpj, email, telefone) VALUES
  (1, '11111111-1111-1111-1111-111111111111', 'pessoa_fisica', 'João Carlos Mendes', '123.456.789-00', 'joao.mendes@email.com', '(11) 98765-4321'),
  (2, '11111111-1111-1111-1111-111111111111', 'pessoa_juridica', 'Tech Solutions Ltda', '12.345.678/0001-90', 'contato@techsolutions.com.br', '(11) 3456-7890'),
  (3, '11111111-1111-1111-1111-111111111111', 'pessoa_fisica', 'Maria Fernanda Costa', '987.654.321-00', 'maria.costa@email.com', '(11) 91234-5678');

-- ============================================================================
-- LEADS
-- ============================================================================

INSERT INTO leads (id, organizacao_id, tipo_cliente, nome, email, telefone, tipo_servico, nivel_urgencia, status, origem, descricao_inicial) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 
   'pessoa_fisica', 'Carlos Eduardo Lima', 'carlos.lima@email.com', '(11) 99876-5432',
   'contencioso', 'alta', 'em_analise', 'formulario',
   'Demissão sem justa causa após 15 anos de empresa. Possível assédio moral nos últimos meses.'),
  ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'pessoa_juridica', 'Comércio ABC Eireli', 'juridico@comercioabc.com.br', '(11) 3333-4444',
   'consultivo', 'media', 'novo', 'indicacao',
   'Precisa de assessoria para reestruturação societária e planejamento tributário.');

-- ============================================================================
-- QUALIFICAÇÕES
-- ============================================================================

INSERT INTO qualificacoes_lead (id, organizacao_id, lead_id, classificacao, nivel_risco, area_juridica, 
  resumo_executivo, fatos_principais, estrategia_recomendada, confianca_ia, pontuacao_fundamentacao, 
  pontuacao_consistencia, decisao) VALUES
  ('bbbb1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'aaaa1111-1111-1111-1111-111111111111', 'Reclamação Trabalhista - Rescisão + Danos Morais',
   'medio', ARRAY['trabalhista', 'danos_morais'],
   'Funcionário com 15 anos de empresa alega demissão arbitrária após período de assédio moral. Há potencial para pedido de reintegração ou indenização substancial.',
   '{"tempo_empresa": "15 anos", "tipo_demissao": "sem_justa_causa", "alegacao_assedio": true, "testemunhas": "possiveis"}',
   'Propor acordo extrajudicial como primeira abordagem. Caso recusado, ajuizar reclamação trabalhista com pedido de danos morais.',
   0.87, 0.82, 0.91, 'aceito');

-- ============================================================================
-- CASOS
-- ============================================================================

INSERT INTO casos (id, organizacao_id, cliente_id, lead_id, titulo, numero_interno, tipo_caso, 
  area_juridica, status_caso, fase_atual, valor_causa, tribunal) VALUES
  (1, '11111111-1111-1111-1111-111111111111', 1, NULL,
   'Reclamação Trabalhista - Mendes vs. Indústria XYZ',
   'TRAB-2024-0042', 'contencioso', ARRAY['trabalhista'],
   'ativo', 'analise', 150000.00, 'TRT-2'),
  (2, '11111111-1111-1111-1111-111111111111', 2, NULL,
   'Consultoria Tributária - Reestruturação Tech Solutions',
   'CONS-2024-0018', 'consultivo', ARRAY['tributario', 'societario'],
   'ativo', 'acao', 0, NULL),
  (3, '11111111-1111-1111-1111-111111111111', 3, NULL,
   'Divórcio Consensual - Costa',
   'FAM-2024-0089', 'consensual', ARRAY['familia'],
   'ativo', 'registro', 500000.00, 'TJSP');

-- ============================================================================
-- PRAZOS
-- ============================================================================

INSERT INTO prazos (id, organizacao_id, caso_id, tipo_prazo, descricao, origem, 
  data_original, data_ajustada, prioridade, status) VALUES
  ('cccc1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1,
   'contestacao', 'Prazo para contestação da reclamação trabalhista',
   'intimacao', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '10 days',
   'alta', 'pendente'),
  ('cccc2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 1,
   'audiencia', 'Audiência inicial de conciliação',
   'publicacao', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days',
   'critica', 'pendente'),
  ('cccc3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 3,
   'manifestacao', 'Prazo para manifestação sobre partilha de bens',
   'manual', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days',
   'media', 'em_andamento');

-- ============================================================================
-- TAREFAS
-- ============================================================================

INSERT INTO tarefas_caso (id, organizacao_id, caso_id, prazo_id, titulo, descricao, 
  status, prioridade, data_limite, origem) VALUES
  (1, '11111111-1111-1111-1111-111111111111', 1, 'cccc1111-1111-1111-1111-111111111111',
   'Elaborar contestação trabalhista', 
   'Analisar documentos e preparar contestação completa com todas as teses de defesa',
   'em_andamento', 'alta', CURRENT_DATE + INTERVAL '8 days', 'manual'),
  (2, '11111111-1111-1111-1111-111111111111', 1, NULL,
   'Solicitar documentos ao RH da empresa',
   'Requisitar ficha de registro, controles de ponto e avaliações de desempenho',
   'aberta', 'media', CURRENT_DATE + INTERVAL '3 days', 'sugerida_por_ia'),
  (3, '11111111-1111-1111-1111-111111111111', 2, NULL,
   'Análise de estrutura societária atual',
   'Mapear participações, quotas e distribuição de lucros',
   'concluida', 'media', CURRENT_DATE - INTERVAL '2 days', 'manual'),
  (4, '11111111-1111-1111-1111-111111111111', 3, 'cccc3333-3333-3333-3333-333333333333',
   'Revisar proposta de partilha',
   'Conferir valores dos bens e proposta de divisão acordada',
   'em_andamento', 'media', CURRENT_DATE + INTERVAL '4 days', 'manual');

-- ============================================================================
-- DOCUMENTOS
-- ============================================================================

INSERT INTO documentos (id, organizacao_id, caso_id, titulo, tipo_documento, caminho_storage, 
  nome_arquivo, visibilidade, resumo_ia) VALUES
  ('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1,
   'Petição Inicial - Reclamação Trabalhista', 'peticao_inicial',
   '/casos/1/docs/peticao_inicial.pdf', 'peticao_inicial.pdf', 'interno',
   'Reclamação trabalhista alegando demissão sem justa causa e assédio moral. Pedidos: verbas rescisórias, FGTS, danos morais (R$ 50.000).'),
  ('dddd2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 1,
   'CTPS do Reclamante', 'documento_pessoal',
   '/casos/1/docs/ctps.pdf', 'ctps.pdf', 'interno',
   'Carteira de Trabalho mostrando vínculo de 15 anos com a empresa reclamada.'),
  ('dddd3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 2,
   'Contrato Social Consolidado', 'contrato_social',
   '/casos/2/docs/contrato_social.pdf', 'contrato_social.pdf', 'cliente',
   'Contrato social da Tech Solutions Ltda com três sócios e capital de R$ 500.000.');

-- ============================================================================
-- GRAFO DE EVIDÊNCIAS
-- ============================================================================

-- Nós
INSERT INTO nos_grafo_evidencias (id, organizacao_id, caso_id, tipo_no, titulo, conteudo, forca, gerado_por_ia) VALUES
  ('eeee1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1,
   'fato', 'Vínculo empregatício de 15 anos',
   'Funcionário trabalhou na empresa de 2009 a 2024, conforme registros na CTPS.',
   0.95, false),
  ('eeee2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 1,
   'fato', 'Demissão sem justa causa',
   'Dispensa comunicada em 15/01/2024 sem apresentação de motivo ou advertência prévia.',
   0.90, false),
  ('eeee3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 1,
   'alegacao', 'Assédio moral nos últimos 6 meses',
   'Reclamante alega ter sofrido humilhações e cobranças excessivas por parte do supervisor direto.',
   0.60, false),
  ('eeee4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 1,
   'prova', 'E-mails com cobranças agressivas',
   'Série de e-mails do supervisor com linguagem hostil e prazos impossíveis.',
   0.75, true),
  ('eeee5555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 1,
   'pedido', 'Danos morais - R$ 50.000',
   'Indenização por danos morais decorrentes do assédio.',
   0.70, false),
  ('eeee6666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 1,
   'base_legal', 'Art. 483 CLT - Rescisão Indireta',
   'Possibilidade de conversão para rescisão indireta por descumprimento de obrigações pelo empregador.',
   0.65, true);

-- Arestas
INSERT INTO arestas_grafo_evidencias (id, organizacao_id, caso_id, no_origem, no_destino, relacao, peso) VALUES
  ('ffff1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1,
   'eeee4444-4444-4444-4444-444444444444', 'eeee3333-3333-3333-3333-333333333333',
   'suportado_por', 0.80),
  ('ffff2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 1,
   'eeee3333-3333-3333-3333-333333333333', 'eeee5555-5555-5555-5555-555555555555',
   'fundamentado_por', 0.75),
  ('ffff3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 1,
   'eeee6666-6666-6666-6666-666666666666', 'eeee3333-3333-3333-3333-333333333333',
   'fundamentado_por', 0.60);

-- ============================================================================
-- EXECUÇÕES DE IA
-- ============================================================================

INSERT INTO execucoes_agente (id, organizacao_id, tipo_agente, nivel_autonomia, status, 
  pontuacao_confianca, pontuacao_fundamentacao, dados_saida, nome_modelo) VALUES
  ('gggg1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'qualificador_lead', 'A1', 'concluido', 0.87, 0.82,
   '{"classificacao": "trabalhista", "recomendacao": "aceitar", "valor_estimado": 150000}',
   'claude-3-opus'),
  ('gggg2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'analisador_documentos', 'A1', 'concluido', 0.92, 0.88,
   '{"entidades_extraidas": 15, "classificacao": "peticao_inicial", "resumo_gerado": true}',
   'claude-3-sonnet');

-- ============================================================================
-- SUGESTÕES DE IA
-- ============================================================================

INSERT INTO sugestoes_ia (id, organizacao_id, id_execucao_ia, tipo_sugestao, titulo, resumo, 
  razao, confianca, pontuacao_fundamentacao, pontuacao_acionabilidade, status) VALUES
  ('hhhh1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'gggg1111-1111-1111-1111-111111111111', 'estrategia',
   'Propor acordo extrajudicial primeiro',
   'Considerando o tempo de empresa e custos processuais, um acordo pode ser vantajoso para ambas as partes.',
   'Casos similares no TRT-2 mostram acordos entre 60-80% do valor da causa em média.',
   0.85, 0.78, 0.92, 'pendente'),
  ('hhhh2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'gggg2222-2222-2222-2222-222222222222', 'documento',
   'Solicitar perícia médica para danos morais',
   'Para fortalecer o pedido de danos morais, seria estratégico solicitar perícia médica.',
   'Laudo médico documentando impacto psicológico aumenta chances de deferimento do pedido.',
   0.72, 0.80, 0.65, 'pendente'),
  ('hhhh3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'gggg1111-1111-1111-1111-111111111111', 'prova',
   'Arrolar testemunhas do setor',
   'Identificar e arrolar colegas de trabalho que presenciaram as situações de assédio.',
   'Prova testemunhal é essencial em casos de assédio moral onde faltam provas documentais.',
   0.80, 0.85, 0.88, 'aceita');

-- ============================================================================
-- AÇÕES PENDENTES
-- ============================================================================

INSERT INTO acoes (id, organizacao_id, tipo_entidade, id_entidade, tipo_acao, parametros_acao,
  origem, id_sugestao_ia, status, requer_aprovacao) VALUES
  ('iiii1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'caso', '1', 'gerar_minuta',
   '{"tipo_documento": "contestacao", "template": "trabalhista_defesa", "prazo_id": "cccc1111-1111-1111-1111-111111111111"}',
   'sugerida_por_ia', NULL, 'proposta', true),
  ('iiii2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'caso', '1', 'agendar_reuniao',
   '{"tipo": "preparacao_audiencia", "participantes": ["advogado", "cliente"], "duracao_minutos": 60}',
   'manual', NULL, 'aprovada', false),
  ('iiii3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'caso', '2', 'enviar_documento',
   '{"documento_id": "dddd3333-3333-3333-3333-333333333333", "destinatario": "cliente", "mensagem": "Segue contrato para análise"}',
   'manual', NULL, 'executada', false);

-- ============================================================================
-- SINAIS DE OPORTUNIDADE
-- ============================================================================

INSERT INTO sinais_oportunidade (id, organizacao_id, lead_id, caso_id, tipo_sinal, 
  descricao, impacto_potencial, acao_recomendada, expira_em) VALUES
  ('jjjj1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   NULL, 1, 'prazo_critico',
   'Prazo de contestação vence em 10 dias',
   'Perda do prazo pode resultar em revelia',
   'Priorizar elaboração da contestação imediatamente',
   CURRENT_TIMESTAMP + INTERVAL '10 days'),
  ('jjjj2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'aaaa2222-2222-2222-2222-222222222222', NULL, 'valor_alto',
   'Lead com potencial de contrato recorrente',
   'Consultoria tributária pode gerar honorários mensais',
   'Agendar reunião para apresentar proposta de assessoria contínua',
   CURRENT_TIMESTAMP + INTERVAL '7 days');

-- ============================================================================
-- PERFIS DE JUIZ (REFERÊNCIA)
-- ============================================================================

INSERT INTO perfis_juiz (id, nome, tribunal, unidade, cargo, estatisticas, preferencias) VALUES
  ('kkkk1111-1111-1111-1111-111111111111', 'Dr. Ricardo Almeida Santos', 'TRT-2', 
   '15ª Vara do Trabalho', 'Juiz Titular',
   '{"tempo_medio_sentenca_dias": 120, "taxa_acordo": 0.45, "taxa_procedencia_total": 0.30, "taxa_procedencia_parcial": 0.50}',
   '{"estilo_petição": "objetivo", "limite_paginas": 30, "aceita_documentos_digitais": true}');

-- ============================================================================
-- RE-HABILITAR RLS
-- ============================================================================

ALTER TABLE organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_organizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE sinais_oportunidade ENABLE ROW LEVEL SECURITY;

-- Reset sequences
SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes));
SELECT setval('casos_id_seq', (SELECT MAX(id) FROM casos));
SELECT setval('tarefas_caso_id_seq', (SELECT MAX(id) FROM tarefas_caso));
