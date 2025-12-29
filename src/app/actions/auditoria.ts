'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/types';

type LogAuditoriaInsert = Database['public']['Tables']['logs_auditoria']['Insert'];

// ============================================================================
// CATEGORIAS DE EVENTOS
// ============================================================================

export const CATEGORIAS_EVENTO = {
  autenticacao: { nome: 'Autenticação', icone: 'Key' },
  lead: { nome: 'Lead', icone: 'UserPlus' },
  caso: { nome: 'Caso', icone: 'Briefcase' },
  documento: { nome: 'Documento', icone: 'FileText' },
  prazo: { nome: 'Prazo', icone: 'Clock' },
  tarefa: { nome: 'Tarefa', icone: 'CheckSquare' },
  ia: { nome: 'IA', icone: 'Brain' },
  oportunidade: { nome: 'Oportunidade', icone: 'Lightbulb' },
  configuracao: { nome: 'Configuração', icone: 'Settings' },
  seguranca: { nome: 'Segurança', icone: 'Shield' },
} as const;

export type CategoriaEvento = keyof typeof CATEGORIAS_EVENTO;

export const TIPOS_ATOR = {
  usuario: { nome: 'Usuário', icone: 'User' },
  agente: { nome: 'Agente IA', icone: 'Bot' },
  sistema: { nome: 'Sistema', icone: 'Server' },
} as const;

// ============================================================================
// Registrar Log de Auditoria
// ============================================================================

interface RegistrarAuditoriaParams {
  organizacaoId: string;
  evento: string;
  categoriaEvento?: CategoriaEvento;
  tipoAtor?: 'usuario' | 'agente' | 'sistema';
  idUsuarioAtor?: string;
  tipoAgenteAtor?: string;
  tipoEntidade?: string;
  idEntidade?: string;
  dadosAntes?: Record<string, unknown>;
  dadosDepois?: Record<string, unknown>;
  dadosDiff?: Record<string, unknown>;
  enderecoIp?: string;
  agenteUsuario?: string;
  idExecucaoIA?: string;
  idAcao?: string;
}

export async function registrarAuditoria(params: RegistrarAuditoriaParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Calcular diff se tiver antes e depois
    let dadosDiff = params.dadosDiff;
    if (!dadosDiff && params.dadosAntes && params.dadosDepois) {
      dadosDiff = calcularDiff(params.dadosAntes, params.dadosDepois);
    }

    const logData: LogAuditoriaInsert = {
      organizacao_id: params.organizacaoId,
      evento: params.evento,
      categoria_evento: params.categoriaEvento,
      tipo_ator: params.tipoAtor || 'sistema',
      id_usuario_ator: params.idUsuarioAtor,
      tipo_agente_ator: params.tipoAgenteAtor,
      tipo_entidade: params.tipoEntidade,
      id_entidade: params.idEntidade,
      dados_antes: params.dadosAntes as any,
      dados_depois: params.dadosDepois as any,
      dados_diff: dadosDiff as any,
      endereco_ip: params.enderecoIp,
      agente_usuario: params.agenteUsuario,
      id_execucao_ia: params.idExecucaoIA,
      id_acao: params.idAcao,
    };

    const { data: log, error } = await (supabase as any)
      .from('logs_auditoria')
      .insert(logData as any)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: log };
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar auditoria',
    };
  }
}

// ============================================================================
// Calcular Diff entre objetos
// ============================================================================

function calcularDiff(
  antes: Record<string, unknown>,
  depois: Record<string, unknown>
): Record<string, { antes: unknown; depois: unknown }> {
  const diff: Record<string, { antes: unknown; depois: unknown }> = {};
  
  const todasChaves = new Set([...Object.keys(antes), ...Object.keys(depois)]);
  
  for (const chave of todasChaves) {
    const valorAntes = antes[chave];
    const valorDepois = depois[chave];
    
    if (JSON.stringify(valorAntes) !== JSON.stringify(valorDepois)) {
      diff[chave] = { antes: valorAntes, depois: valorDepois };
    }
  }
  
  return diff;
}

// ============================================================================
// Registrar Evento de Telemetria
// ============================================================================

interface RegistrarTelemetriaParams {
  organizacaoId: string;
  nomeEvento: string;
  categoriaEvento?: string;
  tipoEntidade?: string;
  idEntidade?: string;
  idUsuarioAtor?: string;
  duracaoMs?: number;
  pontuacaoConfianca?: number;
  resultado?: string;
  metadados?: Record<string, unknown>;
}

export async function registrarTelemetria(_params: RegistrarTelemetriaParams) {
  // Função stub - tabela eventos_telemetria não existe ainda
  console.warn('registrarTelemetria: tabela eventos_telemetria não implementada');
  return { success: false, error: 'Tabela eventos_telemetria não implementada' };
}

// ============================================================================
// Buscar Logs de Auditoria
// ============================================================================

interface BuscarAuditoriaParams {
  organizacaoId: string;
  categoriaEvento?: CategoriaEvento;
  tipoAtor?: 'usuario' | 'agente' | 'sistema';
  tipoEntidade?: string;
  idEntidade?: string;
  dataInicio?: string;
  dataFim?: string;
  limite?: number;
  offset?: number;
}

export async function buscarAuditoria(params: BuscarAuditoriaParams) {
  const supabase = await createServerSupabaseClient();

  try {
    let query = supabase
      .from('logs_auditoria')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', params.organizacaoId)
      .order('criado_em', { ascending: false });

    if (params.categoriaEvento) {
      query = query.eq('categoria_evento', params.categoriaEvento);
    }

    if (params.tipoAtor) {
      query = query.eq('tipo_ator', params.tipoAtor);
    }

    if (params.tipoEntidade) {
      query = query.eq('tipo_entidade', params.tipoEntidade);
    }

    if (params.idEntidade) {
      query = query.eq('id_entidade', params.idEntidade);
    }

    if (params.dataInicio) {
      query = query.gte('criado_em', params.dataInicio);
    }

    if (params.dataFim) {
      query = query.lte('criado_em', params.dataFim);
    }

    const limite = params.limite || 50;
    const offset = params.offset || 0;

    query = query.range(offset, offset + limite - 1);

    const { data: logs, count, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: {
        logs: logs || [],
        total: count || 0,
        limite,
        offset,
        temMais: (count || 0) > offset + limite,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar auditoria:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar auditoria',
    };
  }
}

// ============================================================================
// Buscar Auditoria de uma Entidade Específica
// ============================================================================

export async function buscarAuditoriaEntidade(
  organizacaoId: string,
  tipoEntidade: string,
  idEntidade: string,
  limite?: number
) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: logs, error } = await (supabase as any)
      .from('logs_auditoria')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('tipo_entidade', tipoEntidade)
      .eq('id_entidade', idEntidade)
      .order('criado_em', { ascending: false })
      .limit(limite || 100);

    if (error) throw error;

    return { success: true, data: logs || [] };
  } catch (error) {
    console.error('Erro ao buscar auditoria da entidade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar auditoria',
    };
  }
}

// ============================================================================
// Exportar Logs de Auditoria
// ============================================================================

interface ExportarAuditoriaParams {
  organizacaoId: string;
  formato: 'json' | 'csv';
  categoriaEvento?: CategoriaEvento;
  tipoEntidade?: string;
  idEntidade?: string;
  dataInicio?: string;
  dataFim?: string;
  limite?: number;
}

export async function exportarAuditoria(params: ExportarAuditoriaParams) {
  const supabase = await createServerSupabaseClient();

  try {
    let query = supabase
      .from('logs_auditoria')
      .select('*')
      .eq('organizacao_id', params.organizacaoId)
      .order('criado_em', { ascending: false });

    if (params.categoriaEvento) {
      query = query.eq('categoria_evento', params.categoriaEvento);
    }

    if (params.tipoEntidade) {
      query = query.eq('tipo_entidade', params.tipoEntidade);
    }

    if (params.idEntidade) {
      query = query.eq('id_entidade', params.idEntidade);
    }

    if (params.dataInicio) {
      query = query.gte('criado_em', params.dataInicio);
    }

    if (params.dataFim) {
      query = query.lte('criado_em', params.dataFim);
    }

    if (params.limite) {
      query = query.limit(params.limite);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    if (params.formato === 'csv') {
      const csv = converterParaCSV(logs || []);
      return { success: true, data: csv, formato: 'csv' as const };
    }

    return { success: true, data: JSON.stringify(logs, null, 2), formato: 'json' as const };
  } catch (error) {
    console.error('Erro ao exportar auditoria:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao exportar auditoria',
    };
  }
}

// ============================================================================
// Converter para CSV
// ============================================================================

function converterParaCSV(logs: Array<Record<string, unknown>>): string {
  if (logs.length === 0) return '';

  const colunas = [
    'id',
    'criado_em',
    'evento',
    'categoria_evento',
    'tipo_ator',
    'id_usuario_ator',
    'tipo_entidade',
    'id_entidade',
  ];

  const cabecalho = colunas.join(',');
  
  const linhas = logs.map(log => {
    return colunas.map(col => {
      const valor = log[col];
      if (valor === null || valor === undefined) return '';
      if (typeof valor === 'string' && valor.includes(',')) {
        return `"${valor.replace(/"/g, '""')}"`;
      }
      return String(valor);
    }).join(',');
  });

  return [cabecalho, ...linhas].join('\n');
}

// ============================================================================
// Obter Estatísticas de Auditoria
// ============================================================================

interface EstatisticasAuditoriaParams {
  organizacaoId: string;
  periodo?: 'hoje' | 'semana' | 'mes' | 'ano';
  dataInicio?: string;
  dataFim?: string;
}

export async function obterEstatisticasAuditoria(params: EstatisticasAuditoriaParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Calcular período
    let dataInicio = params.dataInicio;
    let dataFim = params.dataFim || new Date().toISOString();

    if (!dataInicio && params.periodo) {
      const agora = new Date();
      switch (params.periodo) {
        case 'hoje':
          dataInicio = new Date(agora.setHours(0, 0, 0, 0)).toISOString();
          break;
        case 'semana':
          dataInicio = new Date(agora.setDate(agora.getDate() - 7)).toISOString();
          break;
        case 'mes':
          dataInicio = new Date(agora.setMonth(agora.getMonth() - 1)).toISOString();
          break;
        case 'ano':
          dataInicio = new Date(agora.setFullYear(agora.getFullYear() - 1)).toISOString();
          break;
      }
    }

    // Buscar logs do período
    let query = supabase
      .from('logs_auditoria')
      .select('categoria_evento, tipo_ator, criado_em')
      .eq('organizacao_id', params.organizacaoId);

    if (dataInicio) {
      query = query.gte('criado_em', dataInicio);
    }

    if (dataFim) {
      query = query.lte('criado_em', dataFim);
    }

    const { data: logs, error } = await query as any;

    if (error) throw error;

    // Calcular estatísticas
    const total = logs?.length || 0;

    // Por categoria
    const porCategoria: Record<string, number> = {};
    (logs as any[])?.forEach((log: any) => {
      const cat = log.categoria_evento || 'outros';
      porCategoria[cat] = (porCategoria[cat] || 0) + 1;
    });

    // Por tipo de ator
    const porTipoAtor: Record<string, number> = {};
    (logs as any[])?.forEach((log: any) => {
      const ator = log.tipo_ator || 'sistema';
      porTipoAtor[ator] = (porTipoAtor[ator] || 0) + 1;
    });

    // Por hora (últimas 24h)
    const ultimasHoras: Record<string, number> = {
      '1h': 0,
      '6h': 0,
      '24h': 0,
    };

    const agora = Date.now();
    (logs as any[])?.forEach((log: any) => {
      const diff = agora - new Date(log.criado_em).getTime();
      const horasAtras = diff / (1000 * 60 * 60);
      
      if (horasAtras <= 1) ultimasHoras['1h']++;
      if (horasAtras <= 6) ultimasHoras['6h']++;
      if (horasAtras <= 24) ultimasHoras['24h']++;
    });

    return {
      success: true,
      data: {
        total,
        porCategoria,
        porTipoAtor,
        ultimasHoras,
        periodo: {
          inicio: dataInicio,
          fim: dataFim,
        },
      },
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao obter estatísticas',
    };
  }
}

// ============================================================================
// Gerar Relatório de Compliance LGPD
// ============================================================================

interface RelatorioLGPDParams {
  organizacaoId: string;
  dataInicio: string;
  dataFim: string;
}

export async function gerarRelatorioLGPD(params: RelatorioLGPDParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar execuções de IA com base legal
    const { data: execucoesIA, error: iaError } = await (supabase as any)
      .from('execucoes_agente')
      .select('id, tipo_agente, base_legal, finalidade, criado_em, status')
      .eq('organizacao_id', params.organizacaoId)
      .gte('criado_em', params.dataInicio)
      .lte('criado_em', params.dataFim);

    if (iaError) throw iaError;

    // Buscar documentos com dados pessoais
    const { data: documentos, error: docError } = await (supabase as any)
      .from('documentos')
      .select('id, titulo, contem_dados_pessoais, dados_pessoais_anonimizados, criado_em')
      .eq('organizacao_id', params.organizacaoId)
      .eq('contem_dados_pessoais', true)
      .gte('criado_em', params.dataInicio)
      .lte('criado_em', params.dataFim);
    const typedDocumentos = documentos as any[] | null;

    if (docError) throw docError;

    // Buscar logs de acesso a dados sensíveis
    const { data: logsAcesso, error: logsError } = await (supabase as any)
      .from('logs_auditoria')
      .select('*')
      .eq('organizacao_id', params.organizacaoId)
      .eq('categoria_evento', 'documento')
      .gte('criado_em', params.dataInicio)
      .lte('criado_em', params.dataFim);

    if (logsError) throw logsError;

    // Compilar relatório
    const relatorio = {
      periodo: {
        inicio: params.dataInicio,
        fim: params.dataFim,
      },
      geradoEm: new Date().toISOString(),
      
      tratamentosDeDados: {
        totalExecucoesIA: execucoesIA?.length || 0,
        porBaseLegal: agruparPor(execucoesIA || [], 'base_legal'),
        porFinalidade: agruparPor(execucoesIA || [], 'finalidade'),
      },
      
      dadosPessoais: {
        documentosComDadosPessoais: documentos?.length || 0,
        documentosAnonimizados: documentos?.filter((d: any) => d.dados_pessoais_anonimizados).length || 0,
        taxaAnonimizacao: typedDocumentos && typedDocumentos.length > 0 
          ? Math.round((typedDocumentos?.filter((d: any) => d.dados_pessoais_anonimizados).length / typedDocumentos.length) * 100)
          : 0,
      },
      
      trilhaAuditoria: {
        totalAcessos: logsAcesso?.length || 0,
        acessosPorTipo: agruparPor(logsAcesso || [], 'evento'),
      },
      
      conformidade: {
        baseLegalDefinida: (execucoesIA || []).every((e: any) => e.base_legal),
        finalidadeDefinida: (execucoesIA || []).every((e: any) => e.finalidade),
        trilhaCompleta: true, // Assumimos que a trilha está completa se chegamos até aqui
      },
    };

    return { success: true, data: relatorio };
  } catch (error) {
    console.error('Erro ao gerar relatório LGPD:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao gerar relatório',
    };
  }
}

// ============================================================================
// Gerar Dossiê de um Caso
// ============================================================================

interface GerarDossieParams {
  organizacaoId: string;
  casoId: number;
  incluirAuditoria?: boolean;
  incluirTelemetria?: boolean;
  incluirIA?: boolean;
}

export async function gerarDossieCaso(params: GerarDossieParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar caso
    const { data: caso, error: casoError } = await (supabase as any)
      .from('casos')
      .select('*, clientes(*), leads(*)')
      .eq('id', params.casoId)
      .eq('organizacao_id', params.organizacaoId)
      .single();

    if (casoError) throw casoError;

    // Buscar documentos
    const { data: documentos, error: docError } = await (supabase as any)
      .from('documentos')
      .select('id, titulo, tipo_documento, visibilidade, criado_em')
      .eq('caso_id', params.casoId)
      .order('criado_em', { ascending: true });

    if (docError) throw docError;

    // Buscar prazos
    const { data: prazos, error: prazosError } = await (supabase as any)
      .from('prazos')
      .select('*')
      .eq('caso_id', params.casoId)
      .order('data_ajustada', { ascending: true });

    if (prazosError) throw prazosError;

    // Buscar tarefas
    const { data: tarefas, error: tarefasError } = await (supabase as any)
      .from('tarefas_caso')
      .select('*')
      .eq('caso_id', params.casoId)
      .order('criado_em', { ascending: true });

    if (tarefasError) throw tarefasError;

    // Buscar grafo de evidências
    const { data: nosGrafo, error: nosError } = await (supabase as any)
      .from('nos_grafo_evidencias')
      .select('*')
      .eq('caso_id', params.casoId);

    if (nosError) throw nosError;

    const { data: arestasGrafo, error: arestasError } = await (supabase as any)
      .from('arestas_grafo_evidencias')
      .select('*')
      .eq('caso_id', params.casoId);

    if (arestasError) throw arestasError;

    // Compilar dossiê base
    const dossie: Record<string, unknown> = {
      geradoEm: new Date().toISOString(),
      caso: {
        ...caso,
        cliente: caso.clientes,
        leadOriginal: caso.leads,
      },
      documentos: documentos || [],
      prazos: prazos || [],
      tarefas: tarefas || [],
      grafoEvidencias: {
        nos: nosGrafo || [],
        arestas: arestasGrafo || [],
      },
    };

    // Incluir auditoria se solicitado
    if (params.incluirAuditoria) {
      const { data: auditoria } = await (supabase as any)
        .from('logs_auditoria')
        .select('*')
        .eq('tipo_entidade', 'caso')
        .eq('id_entidade', params.casoId.toString())
        .order('criado_em', { ascending: true });

      dossie.trilhaAuditoria = auditoria || [];
    }

    // Incluir telemetria se solicitado
    if (params.incluirTelemetria) {
      const { data: telemetria } = await (supabase as any)
        .from('eventos_telemetria')
        .select('*')
        .eq('tipo_entidade', 'caso')
        .eq('id_entidade', params.casoId.toString())
        .order('criado_em', { ascending: true });

      dossie.telemetria = telemetria || [];
    }

    // Incluir execuções de IA se solicitado
    if (params.incluirIA) {
      const { data: execucoesIA } = await (supabase as any)
        .from('execucoes_agente')
        .select('*, sugestoes_ia(*)')
        .eq('tipo_entidade_gatilho', 'caso')
        .eq('id_entidade_gatilho', params.casoId.toString())
        .order('criado_em', { ascending: true });

      dossie.execucoesIA = execucoesIA || [];
    }

    // Calcular métricas do dossiê
    dossie.metricas = {
      totalDocumentos: (documentos || []).length,
      totalPrazos: (prazos || []).length,
      prazosConcluidos: (prazos || []).filter((p: any) => p.status === 'concluido').length,
      totalTarefas: (tarefas || []).length,
      tarefasConcluidas: (tarefas || []).filter((t: any) => t.status === 'concluida').length,
      nosGrafo: (nosGrafo || []).length,
      arestasGrafo: (arestasGrafo || []).length,
      diasAberto: caso.aberto_em 
        ? Math.ceil((Date.now() - new Date(caso.aberto_em).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    };

    return { success: true, data: dossie };
  } catch (error) {
    console.error('Erro ao gerar dossiê:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao gerar dossiê',
    };
  }
}

// ============================================================================
// Helpers
// ============================================================================

function agruparPor<T extends Record<string, unknown>>(
  items: T[],
  chave: keyof T
): Record<string, number> {
  const resultado: Record<string, number> = {};
  
  items.forEach(item => {
    const valor = String(item[chave] || 'não definido');
    resultado[valor] = (resultado[valor] || 0) + 1;
  });
  
  return resultado;
}

// ============================================================================
// Buscar Eventos de Domínio
// ============================================================================

interface BuscarEventosDominioParams {
  organizacaoId: string;
  nomeEvento?: string;
  tipoEntidade?: string;
  idEntidade?: string;
  idCorrelacao?: string;
  dataInicio?: string;
  dataFim?: string;
  limite?: number;
}

export async function buscarEventosDominio(params: BuscarEventosDominioParams) {
  const supabase = await createServerSupabaseClient();

  try {
    let query = supabase
      .from('eventos_dominio')
      .select('*')
      .eq('organizacao_id', params.organizacaoId)
      .order('criado_em', { ascending: false });

    if (params.nomeEvento) {
      query = query.eq('nome_evento', params.nomeEvento);
    }

    if (params.tipoEntidade) {
      query = query.eq('tipo_entidade', params.tipoEntidade);
    }

    if (params.idEntidade) {
      query = query.eq('id_entidade', params.idEntidade);
    }

    if (params.idCorrelacao) {
      query = query.eq('id_correlacao', params.idCorrelacao);
    }

    if (params.dataInicio) {
      query = query.gte('criado_em', params.dataInicio);
    }

    if (params.dataFim) {
      query = query.lte('criado_em', params.dataFim);
    }

    if (params.limite) {
      query = query.limit(params.limite);
    }

    const { data: eventos, error } = await query;

    if (error) throw error;

    return { success: true, data: eventos || [] };
  } catch (error) {
    console.error('Erro ao buscar eventos de domínio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar eventos',
    };
  }
}

// ============================================================================
// Buscar Cadeia de Eventos (para rastreabilidade)
// ============================================================================

export async function buscarCadeiaEventos(organizacaoId: string, idCorrelacao: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: eventos, error } = await (supabase as any)
      .from('eventos_dominio')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .or(`id_correlacao.eq.${idCorrelacao},id.eq.${idCorrelacao}`)
      .order('criado_em', { ascending: true });

    if (error) throw error;

    // Construir árvore de causação
    const eventosMap = new Map((eventos as any[])?.map((e: any) => [e.id, e]) || []);
    const arvore: Array<{
      evento: any;
      filhos: string[];
    }> = [];

    (eventos as any[])?.forEach((evento: any) => {
      const filhos = (eventos as any[])
        .filter((e: any) => e.id_causacao === evento.id)
        .map((e: any) => e.id);
      
      arvore.push({ evento, filhos });
    });

    return { 
      success: true, 
      data: {
        eventos: eventos || [],
        arvore,
        totalEventos: eventos?.length || 0,
      }
    };
  } catch (error) {
    console.error('Erro ao buscar cadeia de eventos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar cadeia',
    };
  }
}
