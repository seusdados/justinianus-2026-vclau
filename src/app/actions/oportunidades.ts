'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types';

type SinalOportunidadeInsert = Database['public']['Tables']['sinais_oportunidade']['Insert'];

// ============================================================================
// TIPOS DE SINAIS E CONFIGURAÇÕES
// ============================================================================

export const TIPOS_SINAL = {
  pressao_financeira: {
    nome: 'Pressão Financeira',
    descricao: 'Adversário sob pressão financeira detectada',
    icone: 'TrendingDown',
    cor: 'text-orange-500',
    impactoPadrao: 'alto',
  },
  pressao_prazo: {
    nome: 'Pressão de Prazo',
    descricao: 'Prazo crítico afetando adversário',
    icone: 'Clock',
    cor: 'text-red-500',
    impactoPadrao: 'alto',
  },
  lacuna_prova: {
    nome: 'Lacuna de Prova',
    descricao: 'Gap probatório identificado',
    icone: 'FileQuestion',
    cor: 'text-yellow-500',
    impactoPadrao: 'medio',
  },
  precedente_favoravel: {
    nome: 'Precedente Favorável',
    descricao: 'Jurisprudência favorável publicada recentemente',
    icone: 'Scale',
    cor: 'text-green-500',
    impactoPadrao: 'alto',
  },
  fraqueza_oponente: {
    nome: 'Fraqueza do Oponente',
    descricao: 'Ponto fraco identificado na estratégia adversária',
    icone: 'Target',
    cor: 'text-blue-500',
    impactoPadrao: 'medio',
  },
  janela_acordo: {
    nome: 'Janela de Acordo',
    descricao: 'Momento propício para negociação',
    icone: 'Handshake',
    cor: 'text-emerald-500',
    impactoPadrao: 'alto',
  },
  oportunidade_urgencia: {
    nome: 'Oportunidade de Urgência',
    descricao: 'Momento ideal para tutela de urgência',
    icone: 'Zap',
    cor: 'text-purple-500',
    impactoPadrao: 'critico',
  },
  momento_estrategico: {
    nome: 'Momento Estratégico',
    descricao: 'Oportunidade estratégica identificada',
    icone: 'Lightbulb',
    cor: 'text-amber-500',
    impactoPadrao: 'medio',
  },
} as const;

export type TipoSinal = keyof typeof TIPOS_SINAL;

export const IMPACTOS = {
  baixo: { valor: 0.5, nome: 'Baixo', cor: 'bg-gray-500' },
  medio: { valor: 1, nome: 'Médio', cor: 'bg-yellow-500' },
  alto: { valor: 2, nome: 'Alto', cor: 'bg-orange-500' },
  critico: { valor: 3, nome: 'Crítico', cor: 'bg-red-500' },
} as const;

// ============================================================================
// Criar Sinal de Oportunidade
// ============================================================================

interface CriarSinalParams {
  organizacaoId: string;
  casoId: number;
  tipoSinal: TipoSinal;
  titulo: string;
  descricao?: string;
  acaoRecomendada?: string;
  timingRecomendado?: string;
  confianca?: number;
  impactoPotencial?: 'baixo' | 'medio' | 'alto' | 'critico';
  expiraEm?: string; // ISO date
  dadosFonte?: Record<string, unknown>;
  idExecucaoIA?: string;
}

export async function criarSinalOportunidade(params: CriarSinalParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const configSinal = TIPOS_SINAL[params.tipoSinal];
    
    if (!configSinal) {
      throw new Error(`Tipo de sinal inválido: ${params.tipoSinal}`);
    }

    const sinalData: SinalOportunidadeInsert = {
      organizacao_id: params.organizacaoId,
      caso_id: params.casoId,
      tipo_sinal: params.tipoSinal,
      titulo: params.titulo,
      descricao: params.descricao,
      acao_recomendada: params.acaoRecomendada,
      timing_recomendado: params.timingRecomendado,
      confianca: params.confianca,
      impacto_potencial: params.impactoPotencial || configSinal.impactoPadrao as 'baixo' | 'medio' | 'alto' | 'critico',
      expira_em: params.expiraEm,
      dados_fonte: params.dadosFonte as any,
      id_execucao_ia: params.idExecucaoIA,
      expirado: false,
      acao_tomada: false,
    };

    const { data: sinal, error } = await (supabase as any)
      .from('sinais_oportunidade')
      .insert(sinalData)
      .select()
      .single();

    if (error) throw error;

    // Emitir evento de domínio
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: params.organizacaoId,
      nome_evento: 'sinal_oportunidade_detectado',
      tipo_entidade: 'sinal_oportunidade',
      id_entidade: sinal.id,
      payload: {
        tipo_sinal: params.tipoSinal,
        caso_id: params.casoId,
        impacto: params.impactoPotencial || configSinal.impactoPadrao,
        confianca: params.confianca,
      },
    });

    // Se for impacto crítico ou alto, registrar auditoria especial
    if (['critico', 'alto'].includes(params.impactoPotencial || configSinal.impactoPadrao)) {
      await (supabase as any).from('logs_auditoria').insert({
        organizacao_id: params.organizacaoId,
        evento: 'oportunidade_critica_detectada',
        categoria_evento: 'oportunidade',
        tipo_ator: 'agente',
        tipo_entidade: 'sinal_oportunidade',
        id_entidade: sinal.id,
        dados_depois: sinal,
      });
    }

    revalidatePath('/app/acao');
    revalidatePath(`/app/analise/${params.casoId}`);

    return { success: true, data: sinal };
  } catch (error) {
    console.error('Erro ao criar sinal de oportunidade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar sinal',
    };
  }
}

// ============================================================================
// Marcar Oportunidade como Acionada
// ============================================================================

interface AcionarOportunidadeParams {
  sinalId: string;
  resultadoAcao?: string;
  usuarioId?: string;
}

export async function acionarOportunidade(params: AcionarOportunidadeParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: sinal, error } = await (supabase as any)
      .from('sinais_oportunidade')
      .update({
        acao_tomada: true,
        acao_tomada_em: new Date().toISOString(),
        resultado_acao: params.resultadoAcao,
      })
      .eq('id', params.sinalId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: sinal.organizacao_id,
      evento: 'oportunidade_acionada',
      categoria_evento: 'oportunidade',
      tipo_ator: 'usuario',
      id_usuario_ator: params.usuarioId,
      tipo_entidade: 'sinal_oportunidade',
      id_entidade: params.sinalId,
      dados_depois: { resultado_acao: params.resultadoAcao },
    });

    // Registrar telemetria
    await (supabase as any).from('eventos_telemetria').insert({
      organizacao_id: sinal.organizacao_id,
      nome_evento: 'oportunidade_acionada',
      categoria_evento: 'estrategia',
      tipo_entidade: 'sinal_oportunidade',
      id_entidade: params.sinalId,
      id_usuario_ator: params.usuarioId,
      resultado: params.resultadoAcao || 'acionada',
      metadados: {
        tipo_sinal: sinal.tipo_sinal,
        impacto: sinal.impacto_potencial,
      },
    });

    revalidatePath('/app/acao');

    return { success: true, data: sinal };
  } catch (error) {
    console.error('Erro ao acionar oportunidade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao acionar oportunidade',
    };
  }
}

// ============================================================================
// Descartar Oportunidade
// ============================================================================

export async function descartarOportunidade(sinalId: string, motivo?: string, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: sinal, error } = await (supabase as any)
      .from('sinais_oportunidade')
      .update({
        expirado: true,
        resultado_acao: motivo || 'Descartada manualmente',
      })
      .eq('id', sinalId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: sinal.organizacao_id,
      evento: 'oportunidade_descartada',
      categoria_evento: 'oportunidade',
      tipo_ator: 'usuario',
      id_usuario_ator: usuarioId,
      tipo_entidade: 'sinal_oportunidade',
      id_entidade: sinalId,
      dados_depois: { motivo },
    });

    revalidatePath('/app/acao');

    return { success: true, data: sinal };
  } catch (error) {
    console.error('Erro ao descartar oportunidade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao descartar oportunidade',
    };
  }
}

// ============================================================================
// Atualizar Expiração de Oportunidades (Job periódico)
// ============================================================================

export async function atualizarExpiracoesOportunidades(organizacaoId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    let query = (supabase as any)
      .from('sinais_oportunidade')
      .update({ expirado: true })
      .eq('expirado', false)
      .lt('expira_em', new Date().toISOString())
      .select();

    if (organizacaoId) {
      query = query.eq('organizacao_id', organizacaoId);
    }

    const { data: expiradas, error } = await query;

    if (error) throw error;

    return { 
      success: true, 
      data: { 
        expiradas: expiradas?.length || 0 
      } 
    };
  } catch (error) {
    console.error('Erro ao atualizar expirações:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar expirações',
    };
  }
}

// ============================================================================
// Análise de Timing para um Caso
// ============================================================================

interface AnalisarTimingParams {
  organizacaoId: string;
  casoId: number;
}

interface FatorTiming {
  tipo: TipoSinal;
  titulo: string;
  impacto: 'positivo' | 'negativo';
  peso: number;
  descricao?: string;
}

interface ResultadoTiming {
  janelaAtual: 'favoravel' | 'neutra' | 'desfavoravel';
  pontuacaoGeral: number; // -10 a +10
  fatores: FatorTiming[];
  recomendacao: string;
  confianca: number;
}

export async function analisarTimingCaso(params: AnalisarTimingParams): Promise<{
  success: boolean;
  data?: ResultadoTiming;
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar sinais ativos do caso
    const { data: sinais, error: sinaisError } = await (supabase as any)
      .from('sinais_oportunidade')
      .select('*')
      .eq('caso_id', params.casoId)
      .eq('expirado', false)
      .eq('acao_tomada', false);

    if (sinaisError) throw sinaisError;

    // Buscar prazos críticos
    const { data: prazos, error: prazosError } = await (supabase as any)
      .from('prazos')
      .select('*')
      .eq('caso_id', params.casoId)
      .eq('status', 'pendente')
      .order('data_ajustada', { ascending: true })
      .limit(5);

    if (prazosError) throw prazosError;

    // Calcular fatores
    const fatores: FatorTiming[] = [];
    let pontuacao = 0;

    // Processar sinais de oportunidade
    if (sinais) {
      for (const sinal of sinais) {
        const tipoSinal = sinal.tipo_sinal as TipoSinal;
        const config = TIPOS_SINAL[tipoSinal];
        const impactoConfig = IMPACTOS[sinal.impacto_potencial as keyof typeof IMPACTOS];
        
        // Determinar se é positivo ou negativo
        const isPositivo = ['precedente_favoravel', 'fraqueza_oponente', 'janela_acordo', 'oportunidade_urgencia'].includes(tipoSinal);
        
        const peso = impactoConfig.valor * (sinal.confianca || 0.7);
        
        fatores.push({
          tipo: tipoSinal,
          titulo: sinal.titulo,
          impacto: isPositivo ? 'positivo' : 'negativo',
          peso,
          descricao: sinal.descricao || undefined,
        });
        
        pontuacao += isPositivo ? peso : -peso;
      }
    }

    // Processar prazos críticos (afetam negativamente se muito próximos)
    if (prazos) {
      for (const prazo of prazos) {
        const diasRestantes = Math.ceil(
          (new Date(prazo.data_ajustada).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        if (diasRestantes <= 3) {
          fatores.push({
            tipo: 'pressao_prazo',
            titulo: `Prazo crítico: ${prazo.descricao}`,
            impacto: 'negativo',
            peso: prazo.prioridade === 'critica' ? 3 : 2,
            descricao: `${diasRestantes} dias restantes`,
          });
          pontuacao -= prazo.prioridade === 'critica' ? 3 : 2;
        } else if (diasRestantes <= 7) {
          fatores.push({
            tipo: 'pressao_prazo',
            titulo: `Prazo próximo: ${prazo.descricao}`,
            impacto: 'negativo',
            peso: 1,
            descricao: `${diasRestantes} dias restantes`,
          });
          pontuacao -= 1;
        }
      }
    }

    // Determinar janela atual
    let janelaAtual: 'favoravel' | 'neutra' | 'desfavoravel';
    if (pontuacao >= 2) {
      janelaAtual = 'favoravel';
    } else if (pontuacao <= -2) {
      janelaAtual = 'desfavoravel';
    } else {
      janelaAtual = 'neutra';
    }

    // Gerar recomendação
    let recomendacao: string;
    if (janelaAtual === 'favoravel') {
      const oportunidades = fatores.filter(f => f.impacto === 'positivo');
      if (oportunidades.some(o => o.tipo === 'janela_acordo')) {
        recomendacao = 'Momento ideal para propor acordo - aproveite a janela de negociação';
      } else if (oportunidades.some(o => o.tipo === 'oportunidade_urgencia')) {
        recomendacao = 'Considere ajuizar tutela de urgência - condições favoráveis identificadas';
      } else if (oportunidades.some(o => o.tipo === 'precedente_favoravel')) {
        recomendacao = 'Reforce argumentação com precedente favorável recente';
      } else {
        recomendacao = 'Momento favorável para ações estratégicas - avalie opções disponíveis';
      }
    } else if (janelaAtual === 'desfavoravel') {
      const riscos = fatores.filter(f => f.impacto === 'negativo');
      if (riscos.some(r => r.tipo === 'pressao_prazo')) {
        recomendacao = 'Priorize prazos urgentes antes de novas iniciativas';
      } else if (riscos.some(r => r.tipo === 'pressao_financeira')) {
        recomendacao = 'Avalie posição financeira antes de ações que aumentem custos';
      } else {
        recomendacao = 'Momento de cautela - foque em estabilização antes de novas ações';
      }
    } else {
      recomendacao = 'Momento neutro - prossiga conforme planejamento normal do caso';
    }

    // Calcular confiança baseada na quantidade de sinais
    const confianca = Math.min(0.95, 0.5 + (fatores.length * 0.1));

    const resultado: ResultadoTiming = {
      janelaAtual,
      pontuacaoGeral: Math.max(-10, Math.min(10, pontuacao)),
      fatores,
      recomendacao,
      confianca,
    };

    return { success: true, data: resultado };
  } catch (error) {
    console.error('Erro ao analisar timing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao analisar timing',
    };
  }
}

// ============================================================================
// Detectar Sinais de Oportunidade (análise automática)
// ============================================================================

interface DetectarSinaisParams {
  organizacaoId: string;
  casoId: number;
  contexto?: {
    dadosFinanceirosAdversario?: Record<string, unknown>;
    jurisprudenciaRecente?: Array<{ titulo: string; favoravel: boolean }>;
    comportamentoOponente?: Record<string, unknown>;
  };
  idExecucaoIA?: string;
}

export async function detectarSinaisOportunidade(params: DetectarSinaisParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const sinaisCriados: Array<Database['public']['Tables']['sinais_oportunidade']['Row']> = [];

    // 1. Verificar jurisprudência favorável
    if (params.contexto?.jurisprudenciaRecente) {
      const favoraveis = params.contexto.jurisprudenciaRecente.filter(j => j.favoravel);
      
      for (const jurisprudencia of favoraveis) {
        const resultado = await criarSinalOportunidade({
          organizacaoId: params.organizacaoId,
          casoId: params.casoId,
          tipoSinal: 'precedente_favoravel',
          titulo: `Precedente favorável: ${jurisprudencia.titulo}`,
          descricao: 'Jurisprudência recente alinhada com a tese do caso',
          acaoRecomendada: 'Incorporar precedente na argumentação',
          confianca: 0.85,
          impactoPotencial: 'alto',
          expiraEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          idExecucaoIA: params.idExecucaoIA,
        });
        
        if (resultado.success && resultado.data) {
          sinaisCriados.push(resultado.data);
        }
      }
    }

    // 2. Verificar pressão financeira do adversário
    if (params.contexto?.dadosFinanceirosAdversario) {
      const dados = params.contexto.dadosFinanceirosAdversario;
      
      if (dados.protestos && (dados.protestos as number) > 0) {
        const resultado = await criarSinalOportunidade({
          organizacaoId: params.organizacaoId,
          casoId: params.casoId,
          tipoSinal: 'pressao_financeira',
          titulo: 'Adversário com protestos registrados',
          descricao: `${dados.protestos} protesto(s) identificado(s)`,
          acaoRecomendada: 'Considerar proposta de acordo ou intensificar cobrança',
          confianca: 0.9,
          impactoPotencial: 'alto',
          dadosFonte: dados,
          idExecucaoIA: params.idExecucaoIA,
        });
        
        if (resultado.success && resultado.data) {
          sinaisCriados.push(resultado.data);
        }
      }
    }

    // 3. Verificar comportamento do oponente
    if (params.contexto?.comportamentoOponente) {
      const comportamento = params.contexto.comportamentoOponente;
      
      if (comportamento.trocouAdvogado) {
        const resultado = await criarSinalOportunidade({
          organizacaoId: params.organizacaoId,
          casoId: params.casoId,
          tipoSinal: 'momento_estrategico',
          titulo: 'Adversário trocou de advogado',
          descricao: 'Possível momento de transição e vulnerabilidade',
          acaoRecomendada: 'Avaliar oportunidade de acordo ou ação decisiva',
          confianca: 0.7,
          impactoPotencial: 'medio',
          expiraEm: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias
          idExecucaoIA: params.idExecucaoIA,
        });
        
        if (resultado.success && resultado.data) {
          sinaisCriados.push(resultado.data);
        }
      }
      
      if (comportamento.respostasAtrasadas && (comportamento.respostasAtrasadas as number) >= 2) {
        const resultado = await criarSinalOportunidade({
          organizacaoId: params.organizacaoId,
          casoId: params.casoId,
          tipoSinal: 'fraqueza_oponente',
          titulo: 'Adversário com padrão de atrasos',
          descricao: 'Múltiplas respostas fora do prazo detectadas',
          acaoRecomendada: 'Aproveitar para acelerar andamento processual',
          confianca: 0.75,
          impactoPotencial: 'medio',
          idExecucaoIA: params.idExecucaoIA,
        });
        
        if (resultado.success && resultado.data) {
          sinaisCriados.push(resultado.data);
        }
      }
    }

    // 4. Verificar prazos do caso para detectar janela de acordo
    const { data: prazos } = await (supabase as any)
      .from('prazos')
      .select('*')
      .eq('caso_id', params.casoId)
      .eq('status', 'pendente')
      .gte('data_ajustada', new Date().toISOString())
      .order('data_ajustada', { ascending: true })
      .limit(1);

    if (prazos && prazos.length > 0) {
      const proximoPrazo = prazos[0];
      const diasAteProximo = Math.ceil(
        (new Date(proximoPrazo.data_ajustada).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Se prazo de audiência de conciliação próximo
      if (proximoPrazo.tipo_prazo?.includes('audiencia') && diasAteProximo <= 15) {
        const resultado = await criarSinalOportunidade({
          organizacaoId: params.organizacaoId,
          casoId: params.casoId,
          tipoSinal: 'janela_acordo',
          titulo: 'Audiência de conciliação próxima',
          descricao: `${diasAteProximo} dias até a audiência - momento ideal para preparar proposta`,
          acaoRecomendada: 'Preparar estratégia de negociação e definir limites de acordo',
          confianca: 0.95,
          impactoPotencial: 'alto',
          expiraEm: new Date(proximoPrazo.data_ajustada).toISOString(),
          idExecucaoIA: params.idExecucaoIA,
        });
        
        if (resultado.success && resultado.data) {
          sinaisCriados.push(resultado.data);
        }
      }
    }

    return {
      success: true,
      data: {
        sinaisDetectados: sinaisCriados.length,
        sinais: sinaisCriados,
      },
    };
  } catch (error) {
    console.error('Erro ao detectar sinais:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao detectar sinais',
    };
  }
}

// ============================================================================
// Obter Dashboard de Oportunidades
// ============================================================================

export async function obterDashboardOportunidades(organizacaoId: string) {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar todas as oportunidades ativas
    const { data: ativas, error: ativasError } = await (supabase as any)
      .from('sinais_oportunidade')
      .select('*, casos(titulo)')
      .eq('organizacao_id', organizacaoId)
      .eq('expirado', false)
      .eq('acao_tomada', false)
      .order('criado_em', { ascending: false });

    if (ativasError) throw ativasError;

    // Buscar oportunidades críticas
    const criticas = ativas?.filter((o: any) => o.impacto_potencial === 'critico') || [];
    
    // Buscar oportunidades que expiram em breve (próximos 3 dias)
    const tresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const expirandoEmBreve = ativas?.filter((o: any) => 
      o.expira_em && o.expira_em <= tresDias
    ) || [];

    // Estatísticas
    const { data: estatisticas, error: statsError } = await (supabase as any)
      .from('sinais_oportunidade')
      .select('tipo_sinal, impacto_potencial, acao_tomada, expirado')
      .eq('organizacao_id', organizacaoId);

    if (statsError) throw statsError;

    // Calcular métricas
    const total = estatisticas?.length || 0;
    const acionadas = estatisticas?.filter((e: any) => e.acao_tomada).length || 0;
    const expiradas = estatisticas?.filter((e: any) => e.expirado && !e.acao_tomada).length || 0;
    const taxaAcao = total > 0 ? Math.round((acionadas / total) * 100) : 0;

    // Por tipo de sinal
    const porTipo: Record<string, number> = {};
    ativas?.forEach((o: any) => {
      porTipo[o.tipo_sinal] = (porTipo[o.tipo_sinal] || 0) + 1;
    });

    // Por impacto
    const porImpacto: Record<string, number> = {};
    ativas?.forEach((o: any) => {
      porImpacto[o.impacto_potencial || 'medio'] = (porImpacto[o.impacto_potencial || 'medio'] || 0) + 1;
    });

    return {
      success: true,
      data: {
        oportunidadesAtivas: ativas || [],
        criticas,
        expirandoEmBreve,
        estatisticas: {
          total,
          ativas: ativas?.length || 0,
          acionadas,
          expiradas,
          taxaAcao,
          porTipo,
          porImpacto,
        },
      },
    };
  } catch (error) {
    console.error('Erro ao obter dashboard de oportunidades:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao obter dashboard',
    };
  }
}
