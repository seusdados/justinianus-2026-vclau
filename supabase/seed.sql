-- ═══════════════════════════════════════════════════════════════════════════
-- JUSTINIANUS.AI — SEED DATA (DESENVOLVIMENTO)
-- Execute este script APENAS em ambiente de desenvolvimento
-- ═══════════════════════════════════════════════════════════════════════════

-- Organização demo
INSERT INTO organizacoes (id, nome, tipo_organizacao, configuracoes)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Escritório Demo',
    'escritorio_advocacia',
    '{
        "cores": {"primaria": "#3B82F6", "secundaria": "#10B981"},
        "logo_url": null,
        "timezone": "America/Sao_Paulo",
        "idioma": "pt-BR"
    }'::jsonb
);

-- Cliente demo
INSERT INTO clientes (id, organizacao_id, tipo_cliente, nome, documento, email, telefone, endereco, dados_adicionais)
VALUES 
(1, '00000000-0000-0000-0000-000000000001', 'pessoa_fisica', 'Maria Silva Santos', '123.456.789-00', 'maria.santos@email.com', '(11) 98765-4321', 
    '{"logradouro": "Rua das Flores", "numero": "123", "bairro": "Jardim América", "cidade": "São Paulo", "uf": "SP", "cep": "01234-567"}'::jsonb,
    '{"profissao": "Engenheira", "empresa": "Tech Corp", "renda_mensal": 15000}'::jsonb
),
(2, '00000000-0000-0000-0000-000000000001', 'pessoa_juridica', 'Comércio ABC Ltda', '12.345.678/0001-90', 'contato@comercioabc.com.br', '(11) 3456-7890',
    '{"logradouro": "Av. Paulista", "numero": "1000", "complemento": "Sala 501", "bairro": "Bela Vista", "cidade": "São Paulo", "uf": "SP", "cep": "01310-100"}'::jsonb,
    '{"porte": "pequena_empresa", "faturamento_anual": 1200000, "setor": "varejo"}'::jsonb
);

-- Leads demo
INSERT INTO leads (id, organizacao_id, tipo_cliente, nome, email, telefone, tipo_servico, nivel_urgencia, status, origem, descricao_inicial, metadados)
VALUES 
(
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'pessoa_fisica',
    'João Carlos Oliveira',
    'joao.oliveira@email.com',
    '(11) 91234-5678',
    'contencioso',
    'alta',
    'novo',
    'formulario',
    'Fui demitido sem justa causa após 8 anos de empresa. Não recebi todas as verbas rescisórias e tenho horas extras não pagas.',
    '{"empresa_anterior": "Indústria XYZ", "cargo": "Supervisor de Produção", "salario": 8500, "tempo_empresa_meses": 96}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'pessoa_juridica',
    'Startup Tech Solutions',
    'juridico@techsolutions.io',
    '(11) 3333-4444',
    'consultivo',
    'media',
    'em_analise',
    'indicacao',
    'Precisamos de assessoria para estruturação societária e contratos com investidores para rodada Series A.',
    '{"tipo_rodada": "Series A", "valor_rodada": 5000000, "investidor_lead": "Fundo ABC Ventures"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    'pessoa_fisica',
    'Ana Paula Ferreira',
    'ana.ferreira@email.com',
    '(21) 99876-5432',
    'contencioso',
    'critica',
    'qualificado',
    'email',
    'Sofri acidente de trabalho que resultou em incapacidade parcial permanente. A empresa não está pagando o auxílio-doença corretamente.',
    '{"tipo_acidente": "queda_altura", "data_acidente": "2024-06-15", "afastamento_dias": 180, "cid": "S32.0"}'::jsonb
);

-- Casos demo
INSERT INTO casos (id, organizacao_id, cliente_id, numero_interno, titulo, descricao, tipo_caso, area_direito, status_caso, fase_atual, tribunal, vara, comarca, uf, valor_causa, metadados)
VALUES 
(
    1,
    '00000000-0000-0000-0000-000000000001',
    1,
    'CASO-2024-001',
    'Maria Silva Santos vs. Empresa ABC - Rescisão Indireta',
    'Reclamação trabalhista por rescisão indireta devido a assédio moral e descumprimento de obrigações contratuais.',
    'contencioso',
    'trabalhista',
    'ativo',
    'analise',
    'TRT-2',
    '45ª Vara do Trabalho',
    'São Paulo',
    'SP',
    250000.00,
    '{"numero_processo": "1234567-89.2024.5.02.0045", "polo_passivo": "Empresa ABC S/A", "data_ajuizamento": "2024-08-15"}'::jsonb
),
(
    2,
    '00000000-0000-0000-0000-000000000001',
    2,
    'CASO-2024-002',
    'Comércio ABC vs. Fornecedor XYZ - Inadimplemento Contratual',
    'Ação de cobrança por inadimplemento de contrato de fornecimento.',
    'contencioso',
    'civil',
    'ativo',
    'acao',
    'TJSP',
    '5ª Vara Cível',
    'São Paulo',
    'SP',
    180000.00,
    '{"numero_processo": "9876543-21.2024.8.26.0100", "valor_contrato": 180000, "parcelas_inadimplidas": 6}'::jsonb
);

-- Prazos demo
INSERT INTO prazos (id, organizacao_id, caso_id, titulo, descricao, tipo_prazo, data_limite, data_alerta, status, prioridade)
VALUES 
(
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    1,
    'Contestação - Prazo Fatal',
    'Prazo para apresentação de contestação à reclamação trabalhista',
    'fatal',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '3 days',
    'pendente',
    'urgente'
),
(
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000001',
    1,
    'Audiência Inicial',
    'Audiência de conciliação e instrução',
    'judicial',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '25 days',
    'pendente',
    'alta'
),
(
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000001',
    2,
    'Recurso de Apelação',
    'Prazo para interposição de recurso de apelação',
    'recursal',
    NOW() + INTERVAL '15 days',
    NOW() + INTERVAL '10 days',
    'pendente',
    'alta'
);

-- Tarefas demo
INSERT INTO tarefas_caso (id, organizacao_id, caso_id, titulo, descricao, status, prioridade, data_vencimento, estimativa_horas)
VALUES 
(
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000001',
    1,
    'Revisar documentos do cliente',
    'Analisar toda documentação fornecida pela cliente para preparação da contestação',
    'em_andamento',
    'alta',
    NOW() + INTERVAL '2 days',
    4.0
),
(
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000001',
    1,
    'Pesquisar jurisprudência',
    'Levantar jurisprudência favorável sobre rescisão indireta por assédio moral',
    'pendente',
    'media',
    NOW() + INTERVAL '3 days',
    6.0
),
(
    '00000000-0000-0000-0000-000000000032',
    '00000000-0000-0000-0000-000000000001',
    2,
    'Elaborar petição inicial',
    'Redigir petição inicial da ação de cobrança',
    'concluida',
    'alta',
    NOW() - INTERVAL '5 days',
    8.0
);

-- Nós do grafo de evidências demo
INSERT INTO nos_grafo_evidencias (id, organizacao_id, caso_id, tipo_no, titulo, conteudo, confianca, verificado)
VALUES 
(
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000001',
    1,
    'fato',
    'Assédio moral reiterado',
    'Cliente relata episódios de humilhação pública pelo supervisor direto durante reuniões de equipe, com frequência semanal por período de 6 meses.',
    0.85,
    true
),
(
    '00000000-0000-0000-0000-000000000041',
    '00000000-0000-0000-0000-000000000001',
    1,
    'prova',
    'E-mails com conteúdo ofensivo',
    'Conjunto de 15 e-mails do supervisor com linguagem agressiva e cobranças abusivas.',
    0.92,
    true
),
(
    '00000000-0000-0000-0000-000000000042',
    '00000000-0000-0000-0000-000000000001',
    1,
    'base_legal',
    'Art. 483, CLT - Rescisão Indireta',
    'Art. 483, alínea "e" da CLT: "praticar o empregador ou seus prepostos, contra ele ou pessoas de sua família, ato lesivo da honra e boa fama"',
    1.0,
    true
),
(
    '00000000-0000-0000-0000-000000000043',
    '00000000-0000-0000-0000-000000000001',
    1,
    'pedido',
    'Rescisão Indireta com verbas integrais',
    'Reconhecimento da rescisão indireta do contrato de trabalho com pagamento de todas as verbas rescisórias como se demissão sem justa causa fosse.',
    0.88,
    false
),
(
    '00000000-0000-0000-0000-000000000044',
    '00000000-0000-0000-0000-000000000001',
    1,
    'risco',
    'Prova testemunhal insuficiente',
    'Apenas 2 testemunhas disponíveis, sendo que uma delas ainda trabalha na empresa e pode se recusar a depor.',
    0.65,
    false
);

-- Arestas do grafo demo
INSERT INTO arestas_grafo_evidencias (organizacao_id, caso_id, no_origem, no_destino, relacao, peso, descricao)
VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    1,
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000041',
    'fundamentado_por',
    0.9,
    'Fato de assédio comprovado pelos e-mails'
),
(
    '00000000-0000-0000-0000-000000000001',
    1,
    '00000000-0000-0000-0000-000000000043',
    '00000000-0000-0000-0000-000000000040',
    'depende_de',
    1.0,
    'Pedido de rescisão indireta depende da comprovação do assédio'
),
(
    '00000000-0000-0000-0000-000000000001',
    1,
    '00000000-0000-0000-0000-000000000043',
    '00000000-0000-0000-0000-000000000042',
    'fundamentado_por',
    1.0,
    'Pedido fundamentado no art. 483 CLT'
),
(
    '00000000-0000-0000-0000-000000000001',
    1,
    '00000000-0000-0000-0000-000000000043',
    '00000000-0000-0000-0000-000000000044',
    'enfraquecido_por',
    0.7,
    'Risco de prova testemunhal enfraquece o pedido'
);

-- Sinais de oportunidade demo
INSERT INTO sinais_oportunidade (id, organizacao_id, caso_id, tipo_sinal, titulo, descricao, acao_recomendada, impacto_potencial, confianca, expira_em)
VALUES 
(
    '00000000-0000-0000-0000-000000000050',
    '00000000-0000-0000-0000-000000000001',
    1,
    'janela_acordo',
    'Momento favorável para acordo',
    'Empresa ré está em processo de reestruturação e demonstrou interesse em resolver pendências trabalhistas rapidamente.',
    'Propor audiência de conciliação prévia com valor mínimo de R$ 180.000,00',
    'Resolução rápida do caso com economia de custos processuais',
    0.78,
    NOW() + INTERVAL '14 days'
),
(
    '00000000-0000-0000-0000-000000000051',
    '00000000-0000-0000-0000-000000000001',
    2,
    'precedente_favoravel',
    'Jurisprudência recente favorável',
    'Nova decisão do STJ (REsp 2.XXX.XXX) fortalece tese sobre juros de mora em contratos comerciais.',
    'Atualizar petição com citação do novo precedente',
    'Aumento da probabilidade de êxito em 15-20%',
    0.85,
    NOW() + INTERVAL '30 days'
);

-- Perfil de juiz demo
INSERT INTO perfis_juiz (id, organizacao_id, nome, tribunal, vara, comarca, uf, especialidade, estatisticas, tendencias, tempo_medio_decisao_dias, taxa_deferimento)
VALUES 
(
    '00000000-0000-0000-0000-000000000060',
    '00000000-0000-0000-0000-000000000001',
    'Dr. Roberto Ferreira Lima',
    'TRT-2',
    '45ª Vara do Trabalho',
    'São Paulo',
    'SP',
    'Direito do Trabalho',
    '{"total_processos": 1250, "acordos": 420, "procedentes": 580, "improcedentes": 250}'::jsonb,
    '{"favoravel_trabalhador": 0.72, "aceita_rescisao_indireta": 0.68, "valoriza_prova_documental": 0.85}'::jsonb,
    45,
    0.68
);

-- Playbook demo
INSERT INTO playbooks (id, organizacao_id, nome, descricao, tipo_caso_aplicavel, fase_aplicavel, condicoes_ativacao, passos, ativo)
VALUES 
(
    '00000000-0000-0000-0000-000000000070',
    '00000000-0000-0000-0000-000000000001',
    'Reclamação Trabalhista - Rescisão Indireta',
    'Playbook padrão para casos de rescisão indireta do contrato de trabalho',
    ARRAY['contencioso']::tipo_caso[],
    ARRAY['qualificacao', 'analise', 'acao']::fase_caso[],
    '{"area_direito": "trabalhista", "valor_minimo": 50000}'::jsonb,
    '[
        {"ordem": 1, "titulo": "Análise documental", "descricao": "Revisar todos os documentos fornecidos pelo cliente", "tipo_acao": "criar_tarefa", "tempo_estimado_horas": 4},
        {"ordem": 2, "titulo": "Pesquisa jurisprudencial", "descricao": "Levantar jurisprudência sobre rescisão indireta", "tipo_acao": "criar_tarefa", "tempo_estimado_horas": 6},
        {"ordem": 3, "titulo": "Construção do grafo de evidências", "descricao": "Mapear fatos, provas e fundamentos", "tipo_acao": "executar_agente", "agente": "construtor_grafo"},
        {"ordem": 4, "titulo": "Geração de minuta", "descricao": "Gerar minuta da petição inicial", "tipo_acao": "executar_agente", "agente": "gerador_minutas"},
        {"ordem": 5, "titulo": "Revisão e ajustes", "descricao": "Revisar minuta e fazer ajustes necessários", "tipo_acao": "criar_tarefa", "tempo_estimado_horas": 3}
    ]'::jsonb,
    true
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ATUALIZAR SEQUÊNCIAS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes));
SELECT setval('casos_id_seq', (SELECT MAX(id) FROM casos));

-- ═══════════════════════════════════════════════════════════════════════════
-- FIM DO SEED
-- ═══════════════════════════════════════════════════════════════════════════
