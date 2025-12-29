'use client';
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types';

type SinalOportunidade = Database['public']['Tables']['sinais_oportunidade']['Row'];
type SinalOportunidadeInsert = Database['public']['Tables']['sinais_oportunidade']['Insert'];

// ============================================================================
// Tipos de Sinais de Oportunidade
// ============================================================================

export const TIPOS_SINAL = [
  { 
    value: 'pressao_financeira', 
    label: 'Pressão Financeira', 
    cor: '#F59E0B', 
    icone: 'trending-down',
    descricao: 'Adversário com dificuldades financeiras',
  },
  { 
    value: 'pressao_prazo', 
    label: 'Pressão de Prazo', 
    cor: '#EF4444', 
    icone: 'clock',
    descricao: 'Prazo crítico se aproximando',
  },
  { 
    value: 'lacuna_prova', 
    label: 'Lacuna de Prova', 
    cor: '#6366F1', 
    icone: 'search',
    descricao: 'Gap de evidência detectado',
  },
  { 
    value: 'precedente_favoravel', 
    label: 'Precedente Favorável', 
    cor: '#22C55E', 
    icone: 'scale',
    descricao: 'Jurisprudência favorável publicada',
  },
  { 
    value: 'fraqueza_oponente', 
    label: 'Fraqueza do Oponente', 
    cor: '#A855F7', 
    icone: 'target',
    descricao: 'Ponto fraco do adversário identificado',
  },
  { 
    value: 'janela_acordo', 
    label: 'Janela de Acordo', 
    cor: '#3B82F6', 
    icone: 'handshake',
    descricao: 'Momento propício para negociação',
  },
  { 
    value: 'oportunidade_urgencia', 
    label: 'Oportunidade de Urgência', 
    cor: '#EC4899', 
    icone: 'zap',
    descricao: 'Condições para tutela de urgência',
  },
  { 
    value: 'momento_estrategico', 
    label: 'Momento Estratégico', 
    cor: '#14B8A6', 
    icone: 'compass',
    descricao: 'Momento ideal para ação estratégica',
  },
] as const;

export const IMPACTOS = [
  { value: 'baixo', label: 'Baixo', cor: '#6B7280' },
  { value: 'medio', label: 'Médio', cor: '#F59E0B' },
  { value: 'alto', label: 'Alto', cor: '#EF4444' },
  { value: 'critico', label: 'Crítico', cor: '#DC2626' },
] as const;

export type TipoSinal = typeof TIPOS_SINAL[number]['value'];
export type Impacto = typeof IMPACTOS[number]['value'];

// ============================================================================
// useOportunidades - Sinais de oportunidade de um caso
// ============================================================================

interface UseOportunidadesOptions {
  organizacaoId?: string;
  casoId?: number;
  tipoSinal?: TipoSinal | TipoSinal[];
  impactoPotencial?: Impacto | Impacto[];
  apenasAtivas?: boolean; // Não expiradas e não acionadas
  confiancaMinima?: number;
  limite?: number;
}

interface UseOportunidadesReturn {
  oportunidades: SinalOportunidade[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  marcarAcionada: (id: string, resultado?: string) => Promise<boolean>;
  descartar: (id: string) => Promise<boolean>;
}

export function useOportunidades(options: UseOportunidadesOptions = {}): UseOportunidadesReturn {
  const [oportunidades, setOportunidades] = useState<SinalOportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = getSupabaseClient();

  const fetchOportunidades = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('sinais_oportunidade')
        .select('*', { count: 'exact' });

      // Filtros
      if (options.organizacaoId) {
        query = query.eq('organizacao_id', options.organizacaoId);
      }

      if (options.casoId) {
        query = query.eq('caso_id', options.casoId);
      }

      if (options.tipoSinal) {
        if (Array.isArray(options.tipoSinal)) {
          query = query.in('tipo_sinal', options.tipoSinal);
        } else {
          query = query.eq('tipo_sinal', options.tipoSinal);
        }
      }

      if (options.impactoPotencial) {
        if (Array.isArray(options.impactoPotencial)) {
          query = query.in('impacto_potencial', options.impactoPotencial);
        } else {
          query = query.eq('impacto_potencial', options.impactoPotencial);
        }
      }

      if (options.apenasAtivas) {
        query = query
          .eq('expirado', false)
          .eq('acao_tomada', false)
          .or(`expira_em.is.null,expira_em.gt.${new Date().toISOString()}`);
      }

      if (options.confiancaMinima !== undefined) {
        query = query.gte('confianca', options.confiancaMinima);
      }

      if (options.limite) {
        query = query.limit(options.limite);
      }

      // Ordenar por impacto (crítico primeiro) e confiança
      query = query.order('detectado_em', { ascending: false });

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setOportunidades(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar oportunidades'));
    } finally {
      setLoading(false);
    }
  }, [supabase, options]);

  const marcarAcionada = useCallback(async (id: string, resultado?: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('sinais_oportunidade')
        .update({
          acao_tomada: true,
          acao_tomada_em: new Date().toISOString(),
          resultado_acao: resultado,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setOportunidades(prev => prev.map(o => o.id === id ? {
        ...o,
        acao_tomada: true,
        acao_tomada_em: new Date().toISOString(),
        resultado_acao: resultado,
      } : o));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao marcar como acionada'));
      return false;
    }
  }, [supabase]);

  const descartar = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('sinais_oportunidade')
        .update({ expirado: true })
        .eq('id', id);

      if (updateError) throw updateError;

      setOportunidades(prev => prev.filter(o => o.id !== id));
      setTotal(prev => prev - 1);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao descartar oportunidade'));
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    fetchOportunidades();
  }, [fetchOportunidades]);

  return {
    oportunidades,
    loading,
    error,
    total,
    refetch: fetchOportunidades,
    marcarAcionada,
    descartar,
  };
}

// ============================================================================
// useOportunidadesAtivas - Apenas oportunidades ativas (helper)
// ============================================================================

export function useOportunidadesAtivas(casoId?: number) {
  return useOportunidades({
    casoId,
    apenasAtivas: true,
  });
}

// ============================================================================
// useOportunidadesCriticas - Oportunidades de alto impacto
// ============================================================================

export function useOportunidadesCriticas(organizacaoId?: string) {
  return useOportunidades({
    organizacaoId,
    impactoPotencial: ['alto', 'critico'],
    apenasAtivas: true,
  });
}

// ============================================================================
// useOportunidadesCounters - Contadores de oportunidades
// ============================================================================

interface OportunidadesCounters {
  total: number;
  ativas: number;
  porTipo: Record<TipoSinal, number>;
  porImpacto: {
    baixo: number;
    medio: number;
    alto: number;
    critico: number;
  };
  acionadas: number;
  expiradas: number;
  taxaAcao: number;
}

export function useOportunidadesCounters(
  organizacaoId?: string,
  casoId?: number
): {
  counters: OportunidadesCounters;
  loading: boolean;
} {
  const [counters, setCounters] = useState<OportunidadesCounters>({
    total: 0,
    ativas: 0,
    porTipo: {
      pressao_financeira: 0,
      pressao_prazo: 0,
      lacuna_prova: 0,
      precedente_favoravel: 0,
      fraqueza_oponente: 0,
      janela_acordo: 0,
      oportunidade_urgencia: 0,
      momento_estrategico: 0,
    },
    porImpacto: {
      baixo: 0,
      medio: 0,
      alto: 0,
      critico: 0,
    },
    acionadas: 0,
    expiradas: 0,
    taxaAcao: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchCounters() {
      setLoading(true);

      try {
        let query = supabase
          .from('sinais_oportunidade')
          .select('tipo_sinal, impacto_potencial, acao_tomada, expirado, expira_em');

        if (organizacaoId) {
          query = query.eq('organizacao_id', organizacaoId);
        }

        if (casoId) {
          query = query.eq('caso_id', casoId);
        }

        const { data } = await query;

        if (data) {
          const agora = new Date();
          const result: OportunidadesCounters = {
            total: data.length,
            ativas: 0,
            porTipo: {
              pressao_financeira: 0,
              pressao_prazo: 0,
              lacuna_prova: 0,
              precedente_favoravel: 0,
              fraqueza_oponente: 0,
              janela_acordo: 0,
              oportunidade_urgencia: 0,
              momento_estrategico: 0,
            },
            porImpacto: {
              baixo: 0,
              medio: 0,
              alto: 0,
              critico: 0,
            },
            acionadas: 0,
            expiradas: 0,
            taxaAcao: 0,
          };

          data.forEach(o => {
            // Por tipo
            result.porTipo[o.tipo_sinal as TipoSinal]++;

            // Por impacto
            if (o.impacto_potencial) {
              result.porImpacto[o.impacto_potencial as Impacto]++;
            }

            // Acionadas
            if (o.acao_tomada) {
              result.acionadas++;
            }

            // Expiradas
            const expirada = o.expirado || 
              (o.expira_em && new Date(o.expira_em) < agora);
            
            if (expirada) {
              result.expiradas++;
            }

            // Ativas
            if (!o.acao_tomada && !expirada) {
              result.ativas++;
            }
          });

          // Taxa de ação
          const totalFechadas = result.acionadas + result.expiradas;
          if (totalFechadas > 0) {
            result.taxaAcao = result.acionadas / totalFechadas;
          }

          setCounters(result);
        }
      } catch (err) {
        console.error('Erro ao buscar contadores:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCounters();
  }, [organizacaoId, casoId, supabase]);

  return { counters, loading };
}

// ============================================================================
// useTimingAnalysis - Análise de timing para um caso
// ============================================================================

interface TimingAnalysis {
  janelaAtual: 'favoravel' | 'neutra' | 'desfavoravel';
  proximaJanela: Date | null;
  fatores: Array<{
    tipo: string;
    descricao: string;
    peso: number;
    direcao: 'positivo' | 'negativo';
  }>;
  recomendacao: string;
  confianca: number;
}

export function useTimingAnalysis(casoId: number): {
  analise: TimingAnalysis | null;
  loading: boolean;
  error: Error | null;
} {
  const [analise, setAnalise] = useState<TimingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchAnalise() {
      if (!casoId) return;

      setLoading(true);
      setError(null);

      try {
        // Buscar oportunidades ativas do caso
        const { data: oportunidades } = await supabase
          .from('sinais_oportunidade')
          .select('*')
          .eq('caso_id', casoId)
          .eq('expirado', false)
          .eq('acao_tomada', false);

        // Buscar prazos próximos
        const { data: prazos } = await supabase
          .from('prazos')
          .select('*')
          .eq('caso_id', casoId)
          .neq('status', 'concluido')
          .gte('data_ajustada', new Date().toISOString().split('T')[0])
          .order('data_ajustada', { ascending: true })
          .limit(5);

        if (!oportunidades && !prazos) {
          setAnalise(null);
          return;
        }

        // Calcular análise
        const fatores: TimingAnalysis['fatores'] = [];
        let pontuacaoTotal = 0;

        // Analisar oportunidades
        oportunidades?.forEach(o => {
          const impactoPeso = {
            critico: 3,
            alto: 2,
            medio: 1,
            baixo: 0.5,
          };

          const peso = impactoPeso[o.impacto_potencial as Impacto] || 1;
          const direcao = ['precedente_favoravel', 'janela_acordo', 'fraqueza_oponente']
            .includes(o.tipo_sinal) ? 'positivo' : 'negativo';

          fatores.push({
            tipo: o.tipo_sinal,
            descricao: o.titulo,
            peso,
            direcao,
          });

          pontuacaoTotal += direcao === 'positivo' ? peso : -peso;
        });

        // Analisar prazos
        prazos?.forEach(p => {
          const diasAte = Math.ceil(
            (new Date(p.data_ajustada).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          if (diasAte <= 3) {
            fatores.push({
              tipo: 'prazo_iminente',
              descricao: `${p.descricao} em ${diasAte} dias`,
              peso: 2,
              direcao: 'negativo',
            });
            pontuacaoTotal -= 2;
          } else if (diasAte <= 7) {
            fatores.push({
              tipo: 'prazo_proximo',
              descricao: `${p.descricao} em ${diasAte} dias`,
              peso: 1,
              direcao: 'negativo',
            });
            pontuacaoTotal -= 1;
          }
        });

        // Determinar janela
        let janelaAtual: TimingAnalysis['janelaAtual'];
        if (pontuacaoTotal > 2) {
          janelaAtual = 'favoravel';
        } else if (pontuacaoTotal < -2) {
          janelaAtual = 'desfavoravel';
        } else {
          janelaAtual = 'neutra';
        }

        // Gerar recomendação
        let recomendacao = '';
        if (janelaAtual === 'favoravel') {
          const oportunidadeMaisForte = oportunidades
            ?.sort((a, b) => {
              const impactoA = { critico: 4, alto: 3, medio: 2, baixo: 1 }[a.impacto_potencial as Impacto] || 0;
              const impactoB = { critico: 4, alto: 3, medio: 2, baixo: 1 }[b.impacto_potencial as Impacto] || 0;
              return impactoB - impactoA;
            })[0];
          
          recomendacao = oportunidadeMaisForte?.acao_recomendada || 
            'Momento favorável para ação. Considere avançar com estratégia principal.';
        } else if (janelaAtual === 'desfavoravel') {
          recomendacao = 'Momento desfavorável. Priorize resolver prazos e mitigar riscos.';
        } else {
          recomendacao = 'Momento neutro. Continue monitorando e prepare próximos passos.';
        }

        // Calcular confiança
        const confianca = Math.min(
          0.9,
          0.5 + (fatores.length * 0.05) + (Math.abs(pontuacaoTotal) * 0.05)
        );

        setAnalise({
          janelaAtual,
          proximaJanela: null, // TODO: calcular baseado em expirações
          fatores,
          recomendacao,
          confianca,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao analisar timing'));
      } finally {
        setLoading(false);
      }
    }

    fetchAnalise();
  }, [casoId, supabase]);

  return { analise, loading, error };
}

// ============================================================================
// Helper: Obter configuração de tipo de sinal
// ============================================================================

export function obterConfigTipoSinal(tipo: TipoSinal) {
  return TIPOS_SINAL.find(t => t.value === tipo);
}

export function obterConfigImpacto(impacto: Impacto) {
  return IMPACTOS.find(i => i.value === impacto);
}
