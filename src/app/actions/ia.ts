'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types';

type ExecucaoInsert = Database['public']['Tables']['execucoes_agente']['Insert'];
type SugestaoInsert = Database['public']['Tables']['sugestoes_ia']['Insert'];

// ============================================================================
// TIPOS DE AGENTES E AUTONOMIA
// ============================================================================

export const TIPOS_AGENTE = {
  // Operacionais
  processador_docs: { nome: 'Processador de Documentos', autonomia: 'A3', categoria: 'operacional' },
  extrator_entidades: { nome: 'Extrator de Entidades', autonomia: 'A3', categoria: 'operacional' },
  avaliador_risco: { nome: 'Avaliador de Risco', autonomia: 'A2', categoria: 'operacional' },
  classificador: { nome: 'Classificador', autonomia: 'A2', categoria: 'operacional' },
  construtor_timeline: { nome: 'Construtor de Timeline', autonomia: 'A3', categoria: 'operacional' },
  mapeador_evidencias: { nome: 'Mapeador de Evidências', autonomia: 'A2', categoria: 'operacional' },
  redator_minutas: { nome: 'Redator de Minutas', autonomia: 'A1', categoria: 'operacional' },
  guardiao_prazos: { nome: 'Guardião de Prazos', autonomia: 'A3', categoria: 'operacional' },
  enriquecedor_caso: { nome: 'Enriquecedor de Caso', autonomia: 'A2', categoria: 'operacional' },
  
  // Estratégicos
  perfilador_juiz: { nome: 'Perfilador de Juiz', autonomia: 'A2', categoria: 'estrategico' },
  analisador_turma: { nome: 'Analisador de Turma', autonomia: 'A2', categoria: 'estrategico' },
  scanner_oponente: { nome: 'Scanner de Oponente', autonomia: 'A2', categoria: 'estrategico' },
  otimizador_timing: { nome: 'Otimizador de Timing', autonomia: 'A1', categoria: 'estrategico' },
  preditor_acordo: { nome: 'Preditor de Acordo', autonomia: 'A1', categoria: 'estrategico' },
  detector_fraquezas: { nome: 'Detector de Fraquezas', autonomia: 'A2', categoria: 'estrategico' },
  avaliador_urgencia: { nome: 'Avaliador de Urgência', autonomia: 'A1', categoria: 'estrategico' },
  preditor_resultado: { nome: 'Preditor de Resultado', autonomia: 'A1', categoria: 'estrategico' },
  gerador_memorial: { nome: 'Gerador de Memorial', autonomia: 'A1', categoria: 'estrategico' },
  
  // Relacionais
  copiloto_consulta: { nome: 'Copiloto de Consulta', autonomia: 'A1', categoria: 'relacional' },
  conciliador_audiencia: { nome: 'Conciliador de Audiência', autonomia: 'A0', categoria: 'relacional' },
  instrutor_audiencia: { nome: 'Instrutor de Audiência', autonomia: 'A0', categoria: 'relacional' },
  assistente_depoimento: { nome: 'Assistente de Depoimento', autonomia: 'A0', categoria: 'relacional' },
  comunicador_cliente: { nome: 'Comunicador com Cliente', autonomia: 'A1', categoria: 'relacional' },
  resumidor_reuniao: { nome: 'Resumidor de Reunião', autonomia: 'A2', categoria: 'relacional' },
} as const;

export type TipoAgente = keyof typeof TIPOS_AGENTE;

// Níveis de autonomia
// A0: Apenas sugere, nunca executa automaticamente
// A1: Sugere com prévia, executa após aprovação
// A2: Executa automaticamente em baixo risco, sugere em médio/alto
// A3: Executa automaticamente sempre (tarefas operacionais sem risco)

// ============================================================================
// Enfileirar Execução de Agente
// ============================================================================

interface EnfileirarExecucaoParams {
  organizacaoId: string;
  tipoAgente: TipoAgente;
  tipoEntidadeGatilho: string;
  idEntidadeGatilho: string;
  tipoGatilho?: 'evento' | 'manual' | 'agendado' | 'encadeado';
  dadosEntrada?: Record<string, unknown>;
  baseLegal?: string;
  finalidade?: string;
  idEventoGatilho?: string;
  criadoPor?: string;
}

export async function enfileirarExecucao(params: EnfileirarExecucaoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const configAgente = TIPOS_AGENTE[params.tipoAgente];
    
    if (!configAgente) {
      throw new Error(`Tipo de agente inválido: ${params.tipoAgente}`);
    }

    // Avaliar nível de risco baseado no tipo de agente e contexto
    const nivelRisco = await avaliarNivelRisco(supabase, params);

    const execucaoData: ExecucaoInsert = {
      organizacao_id: params.organizacaoId,
      tipo_agente: params.tipoAgente,
      versao_agente: '1.0.0',
      nivel_autonomia: configAgente.autonomia,
      nivel_risco: nivelRisco,
      tipo_gatilho: params.tipoGatilho || 'manual',
      id_evento_gatilho: params.idEventoGatilho,
      tipo_entidade_gatilho: params.tipoEntidadeGatilho,
      id_entidade_gatilho: params.idEntidadeGatilho,
      dados_entrada: params.dadosEntrada as any,
      base_legal: params.baseLegal || 'art. 7º, V - execução de contrato',
      finalidade: params.finalidade || `Execução do agente ${configAgente.nome}`,
      status: 'na_fila',
    };

    const { data: execucao, error } = await (supabase as any)
      .from('execucoes_agente')
      .insert(execucaoData)
      .select()
      .single();

    if (error) throw error;

    // Emitir evento de domínio
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: params.organizacaoId,
      nome_evento: 'execucao_agente_enfileirada',
      tipo_entidade: 'execucao_agente',
      id_entidade: execucao.id,
      payload: {
        tipo_agente: params.tipoAgente,
        entidade_gatilho: `${params.tipoEntidadeGatilho}:${params.idEntidadeGatilho}`,
        nivel_risco: nivelRisco,
      },
      usuario_ator_id: params.criadoPor,
      tipo_agente_ator: params.tipoAgente,
    });

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'execucao_ia_enfileirada',
      categoria_evento: 'ia',
      tipo_ator: params.criadoPor ? 'usuario' : 'sistema',
      id_usuario_ator: params.criadoPor,
      tipo_agente_ator: params.tipoAgente,
      tipo_entidade: 'execucao_agente',
      id_entidade: execucao.id,
      dados_depois: execucao,
    });

    revalidatePath('/app/ia');

    return { success: true, data: execucao };
  } catch (error) {
    console.error('Erro ao enfileirar execução:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao enfileirar execução',
    };
  }
}

// ============================================================================
// Avaliar Nível de Risco (helper interno)
// ============================================================================

async function avaliarNivelRisco(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  params: EnfileirarExecucaoParams
): Promise<'baixo' | 'medio' | 'alto' | 'critico'> {
  const configAgente = TIPOS_AGENTE[params.tipoAgente];
  
  // Agentes de alta autonomia geralmente têm baixo risco
  if (configAgente.autonomia === 'A3') return 'baixo';
  
  // Agentes relacionais (tempo real) são sempre de alto cuidado
  if (configAgente.categoria === 'relacional') return 'alto';
  
  // Agentes estratégicos dependem do contexto
  if (configAgente.categoria === 'estrategico') {
    // Se envolve geração de minuta ou predição, risco médio/alto
    if (['gerador_memorial', 'preditor_resultado', 'preditor_acordo'].includes(params.tipoAgente)) {
      return 'alto';
    }
    return 'medio';
  }
  
  // Para agentes operacionais, verificar se envolve documentos sensíveis
  if (params.tipoAgente === 'redator_minutas') {
    return 'medio';
  }
  
  return 'baixo';
}

// ============================================================================
// Iniciar Execução de Agente
// ============================================================================

export async function iniciarExecucao(execucaoId: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: execucao, error } = await (supabase as any)
      .from('execucoes_agente')
      .update({
        status: 'executando',
        iniciado_em: new Date().toISOString(),
      })
      .eq('id', execucaoId)
      .select()
      .single();

    if (error) throw error;

    // Emitir evento
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: execucao.organizacao_id,
      nome_evento: 'execucao_agente_iniciada',
      tipo_entidade: 'execucao_agente',
      id_entidade: execucaoId,
      payload: { tipo_agente: execucao.tipo_agente },
      tipo_agente_ator: execucao.tipo_agente,
    });

    return { success: true, data: execucao };
  } catch (error) {
    console.error('Erro ao iniciar execução:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao iniciar execução',
    };
  }
}

// ============================================================================
// Finalizar Execução de Agente
// ============================================================================

interface FinalizarExecucaoParams {
  execucaoId: string;
  dadosSaida?: Record<string, unknown>;
  pontuacaoConfianca?: number;
  pontuacaoFundamentacao?: number;
  pontuacaoConsistencia?: number;
  sugestoes?: Array<{
    tipoSugestao: string;
    titulo: string;
    resumo: string;
    razao?: string;
    estruturado?: Record<string, unknown>;
    confianca?: number;
    pontuacaoFundamentacao?: number;
    pontuacaoAcionabilidade?: number;
    pontuacaoRisco?: number;
  }>;
}

export async function finalizarExecucao(params: FinalizarExecucaoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const iniciadoEm = new Date();
    
    // Buscar execução para calcular duração
    const { data: execucaoAnterior } = await (supabase as any)
      .from('execucoes_agente')
      .select('iniciado_em, organizacao_id, tipo_agente')
      .eq('id', params.execucaoId)
      .single();

    const duracaoMs = execucaoAnterior?.iniciado_em
      ? Math.round(iniciadoEm.getTime() - new Date(execucaoAnterior.iniciado_em).getTime())
      : 0;

    // Atualizar execução
    const { data: execucao, error } = await (supabase as any)
      .from('execucoes_agente')
      .update({
        status: 'concluido',
        finalizado_em: new Date().toISOString(),
        duracao_ms: duracaoMs,
        dados_saida: params.dadosSaida,
        pontuacao_confianca: params.pontuacaoConfianca,
        pontuacao_fundamentacao: params.pontuacaoFundamentacao,
        pontuacao_consistencia: params.pontuacaoConsistencia,
      })
      .eq('id', params.execucaoId)
      .select()
      .single();

    if (error) throw error;

    // Criar sugestões se houver
    if (params.sugestoes && params.sugestoes.length > 0) {
      const sugestoesData = params.sugestoes.map((s) => ({
        organizacao_id: execucao.organizacao_id,
        id_execucao_ia: params.execucaoId,
        tipo_sugestao: s.tipoSugestao,
        titulo: s.titulo,
        resumo: s.resumo,
        razao: s.razao,
        estruturado: s.estruturado as any,
        confianca: s.confianca,
        pontuacao_fundamentacao: s.pontuacaoFundamentacao,
        pontuacao_acionabilidade: s.pontuacaoAcionabilidade,
        pontuacao_risco: s.pontuacaoRisco,
        status: 'pendente',
      }));

      const { error: sugestoesError } = await (supabase as any)
        .from('sugestoes_ia')
        .insert(sugestoesData);

      if (sugestoesError) {
        console.error('Erro ao criar sugestões:', sugestoesError);
      }
    }

    // Emitir evento
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: execucao.organizacao_id,
      nome_evento: 'execucao_agente_concluida',
      tipo_entidade: 'execucao_agente',
      id_entidade: params.execucaoId,
      payload: {
        tipo_agente: execucao.tipo_agente,
        duracao_ms: duracaoMs,
        total_sugestoes: params.sugestoes?.length || 0,
        confianca: params.pontuacaoConfianca,
      },
      tipo_agente_ator: execucao.tipo_agente,
    });

    // Registrar telemetria
    await (supabase as any).from('eventos_telemetria').insert({
      organizacao_id: execucao.organizacao_id,
      nome_evento: 'execucao_ia_concluida',
      categoria_evento: 'ia',
      tipo_entidade: 'execucao_agente',
      id_entidade: params.execucaoId,
      duracao_ms: duracaoMs,
      pontuacao_confianca: params.pontuacaoConfianca,
      resultado: 'sucesso',
      metadados: {
        tipo_agente: execucao.tipo_agente,
        total_sugestoes: params.sugestoes?.length || 0,
      },
    });

    revalidatePath('/app/ia');

    return { success: true, data: execucao };
  } catch (error) {
    console.error('Erro ao finalizar execução:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao finalizar execução',
    };
  }
}

// ============================================================================
// Registrar Erro na Execução
// ============================================================================

export async function registrarErroExecucao(execucaoId: string, mensagemErro: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: execucao, error } = await (supabase as any)
      .from('execucoes_agente')
      .update({
        status: 'falhou',
        finalizado_em: new Date().toISOString(),
        mensagem_erro: mensagemErro,
      })
      .eq('id', execucaoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar telemetria de erro
    await (supabase as any).from('eventos_telemetria').insert({
      organizacao_id: execucao.organizacao_id,
      nome_evento: 'execucao_ia_falhou',
      categoria_evento: 'ia',
      tipo_entidade: 'execucao_agente',
      id_entidade: execucaoId,
      resultado: 'erro',
      metadados: {
        tipo_agente: execucao.tipo_agente,
        mensagem_erro: mensagemErro,
      },
    });

    revalidatePath('/app/ia');

    return { success: true, data: execucao };
  } catch (error) {
    console.error('Erro ao registrar erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar erro',
    };
  }
}

// ============================================================================
// Dar Feedback em Sugestão
// ============================================================================

interface FeedbackSugestaoParams {
  sugestaoId: string;
  status: 'aceita' | 'modificada' | 'rejeitada';
  notasAcao?: string;
  usuarioId?: string;
}

export async function darFeedbackSugestao(params: FeedbackSugestaoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: sugestao, error } = await (supabase as any)
      .from('sugestoes_ia')
      .update({
        status: params.status,
        acionada_por: params.usuarioId,
        acionada_em: new Date().toISOString(),
        notas_acao: params.notasAcao,
      })
      .eq('id', params.sugestaoId)
      .select('*, execucoes_agente(*)')
      .single();

    if (error) throw error;

    // Atualizar feedback na execução também
    if (sugestao.id_execucao_ia) {
      await (supabase as any)
        .from('execucoes_agente')
        .update({
          feedback_humano: params.status === 'aceita' ? 'aceito' : 
                          params.status === 'modificada' ? 'modificado' : 'rejeitado',
          feedback_humano_por: params.usuarioId,
          feedback_humano_em: new Date().toISOString(),
          notas_feedback_humano: params.notasAcao,
        })
        .eq('id', sugestao.id_execucao_ia);
    }

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: sugestao.organizacao_id,
      evento: `sugestao_ia_${params.status}`,
      categoria_evento: 'ia',
      tipo_ator: 'usuario',
      id_usuario_ator: params.usuarioId,
      tipo_entidade: 'sugestao_ia',
      id_entidade: params.sugestaoId,
      dados_depois: { status: params.status, notas: params.notasAcao },
    });

    revalidatePath('/app/ia');

    return { success: true, data: sugestao };
  } catch (error) {
    console.error('Erro ao dar feedback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao dar feedback',
    };
  }
}

// ============================================================================
// Processar Sugestões em Lote
// ============================================================================

interface ProcessarSugestoesLoteParams {
  sugestaoIds: string[];
  acao: 'aceitar' | 'rejeitar';
  usuarioId?: string;
  notas?: string;
}

export async function processarSugestoesEmLote(params: ProcessarSugestoesLoteParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const status = params.acao === 'aceitar' ? 'aceita' : 'rejeitada';
    
    const { data: sugestoes, error } = await (supabase as any)
      .from('sugestoes_ia')
      .update({
        status,
        acionada_por: params.usuarioId,
        acionada_em: new Date().toISOString(),
        notas_acao: params.notas,
      })
      .in('id', params.sugestaoIds)
      .select();

    if (error) throw error;

    // Registrar auditoria para cada sugestão
    if (sugestoes && sugestoes.length > 0) {
      const auditorias = sugestoes.map((s: any) => ({
        organizacao_id: s.organizacao_id,
        evento: `sugestao_ia_${status}_lote`,
        categoria_evento: 'ia',
        tipo_ator: 'usuario' as const,
        id_usuario_ator: params.usuarioId,
        tipo_entidade: 'sugestao_ia',
        id_entidade: s.id,
        dados_depois: { status, notas: params.notas },
      }));

      await (supabase as any).from('logs_auditoria').insert(auditorias);
    }

    revalidatePath('/app/ia');

    return { 
      success: true, 
      data: { 
        processadas: sugestoes?.length || 0,
        acao: params.acao 
      } 
    };
  } catch (error) {
    console.error('Erro ao processar sugestões em lote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar sugestões',
    };
  }
}

// ============================================================================
// Cancelar Execução
// ============================================================================

export async function cancelarExecucao(execucaoId: string, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: execucao, error } = await (supabase as any)
      .from('execucoes_agente')
      .update({
        status: 'cancelado',
        finalizado_em: new Date().toISOString(),
      })
      .eq('id', execucaoId)
      .eq('status', 'na_fila') // Só pode cancelar se estiver na fila
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: execucao.organizacao_id,
      evento: 'execucao_ia_cancelada',
      categoria_evento: 'ia',
      tipo_ator: 'usuario',
      id_usuario_ator: usuarioId,
      tipo_entidade: 'execucao_agente',
      id_entidade: execucaoId,
    });

    revalidatePath('/app/ia');

    return { success: true, data: execucao };
  } catch (error) {
    console.error('Erro ao cancelar execução:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao cancelar execução',
    };
  }
}

// ============================================================================
// Buscar Próxima Execução na Fila
// ============================================================================

export async function buscarProximaExecucao(organizacaoId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    let query = supabase
      .from('execucoes_agente')
      .select('*')
      .eq('status', 'na_fila')
      .order('criado_em', { ascending: true })
      .limit(1);

    if (organizacaoId) {
      query = query.eq('organizacao_id', organizacaoId);
    }

    const { data: execucao, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    return { success: true, data: execucao || null };
  } catch (error) {
    console.error('Erro ao buscar próxima execução:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar execução',
    };
  }
}

// ============================================================================
// Obter Estatísticas de IA
// ============================================================================

export async function obterEstatisticasIA(organizacaoId: string, periodo?: { inicio: string; fim: string }) {
  const supabase = await createServerSupabaseClient();

  try {
    // Execuções por status
    let execucoesQuery = supabase
      .from('execucoes_agente')
      .select('status, tipo_agente, nivel_risco, feedback_humano, duracao_ms')
      .eq('organizacao_id', organizacaoId);

    if (periodo) {
      execucoesQuery = execucoesQuery
        .gte('criado_em', periodo.inicio)
        .lte('criado_em', periodo.fim);
    }

    const { data: execucoes, error: execError } = await execucoesQuery;
    if (execError) throw execError;

    const execucoesTyped = (execucoes || []) as any[];

    // Sugestões por status
    let sugestoesQuery = supabase
      .from('sugestoes_ia')
      .select('status, tipo_sugestao, confianca')
      .eq('organizacao_id', organizacaoId);

    if (periodo) {
      sugestoesQuery = sugestoesQuery
        .gte('criado_em', periodo.inicio)
        .lte('criado_em', periodo.fim);
    }

    const { data: sugestoes, error: sugError } = await sugestoesQuery;
    if (sugError) throw sugError;

    const sugestoesTyped = (sugestoes || []) as any[];

    // Calcular estatísticas
    const totalExecucoes = execucoesTyped.length;
    const execucoesConcluidas = execucoesTyped.filter(e => e.status === 'concluido').length;
    const execucoesFalhas = execucoesTyped.filter(e => e.status === 'falhou').length;
    
    const totalSugestoes = sugestoesTyped.length;
    const sugestoesAceitas = sugestoesTyped.filter(s => s.status === 'aceita').length;
    const sugestoesRejeitadas = sugestoesTyped.filter(s => s.status === 'rejeitada').length;
    const sugestoesPendentes = sugestoesTyped.filter(s => s.status === 'pendente').length;
    
    const taxaAceitacao = totalSugestoes > 0 
      ? Math.round((sugestoesAceitas / (sugestoesAceitas + sugestoesRejeitadas)) * 100) 
      : 0;

    // Tempo médio de execução (apenas concluídas)
    const execucoesComDuracao = execucoesTyped.filter(e => e.duracao_ms != null);
    const tempoMedioMs = execucoesComDuracao.length > 0
      ? Math.round(execucoesComDuracao.reduce((sum: number, e: any) => sum + (e.duracao_ms || 0), 0) / execucoesComDuracao.length)
      : 0;

    // Por tipo de agente
    const porTipoAgente: Record<string, number> = {};
    execucoesTyped.forEach(e => {
      porTipoAgente[e.tipo_agente] = (porTipoAgente[e.tipo_agente] || 0) + 1;
    });

    // Feedbacks
    const feedbackAceito = execucoesTyped.filter(e => e.feedback_humano === 'aceito').length;
    const feedbackModificado = execucoesTyped.filter(e => e.feedback_humano === 'modificado').length;
    const feedbackRejeitado = execucoesTyped.filter(e => e.feedback_humano === 'rejeitado').length;

    return {
      success: true,
      data: {
        execucoes: {
          total: totalExecucoes,
          concluidas: execucoesConcluidas,
          falhas: execucoesFalhas,
          taxaSucesso: totalExecucoes > 0 
            ? Math.round((execucoesConcluidas / totalExecucoes) * 100) 
            : 0,
          tempoMedioMs,
        },
        sugestoes: {
          total: totalSugestoes,
          aceitas: sugestoesAceitas,
          rejeitadas: sugestoesRejeitadas,
          pendentes: sugestoesPendentes,
          taxaAceitacao,
        },
        feedback: {
          aceito: feedbackAceito,
          modificado: feedbackModificado,
          rejeitado: feedbackRejeitado,
        },
        porTipoAgente,
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
