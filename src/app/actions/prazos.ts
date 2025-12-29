'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types';

type PrazoInsert = Database['public']['Tables']['prazos']['Insert'];
type PrazoUpdate = Database['public']['Tables']['prazos']['Update'];

// ============================================================================
// TIPOS DE PRAZO
// ============================================================================

export const TIPOS_PRAZO = [
  'contestacao',
  'recurso',
  'audiencia',
  'manifestacao',
  'impugnacao',
  'cumprimento_sentenca',
  'embargo',
  'agravo',
  'apelacao',
  'recurso_especial',
  'recurso_extraordinario',
  'diligencia',
  'juntada',
  'pericia',
  'contrato',
  'prescricao',
  'decadencia',
  'outro',
] as const;

// ============================================================================
// Criar Prazo
// ============================================================================

interface CriarPrazoParams {
  organizacaoId: string;
  casoId: number;
  tipoPrazo: string;
  descricao: string;
  dataOriginal: string; // ISO date
  dataAjustada?: string; // ISO date
  origem?: 'publicacao' | 'intimacao' | 'contrato' | 'manual' | 'detectado_por_ia';
  referenciaOrigem?: string;
  idDocumentoOrigem?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  atribuidoA?: string;
  backupAtribuidoA?: string;
  configAlertas?: Record<string, boolean>;
  criadoPor?: string;
}

export async function criarPrazo(params: CriarPrazoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Calcular prioridade automática se não fornecida
    const diasAteVencimento = Math.ceil(
      (new Date(params.dataAjustada || params.dataOriginal).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    let prioridade = params.prioridade;
    if (!prioridade) {
      if (diasAteVencimento <= 3) prioridade = 'critica';
      else if (diasAteVencimento <= 7) prioridade = 'alta';
      else if (diasAteVencimento <= 15) prioridade = 'media';
      else prioridade = 'baixa';
    }

    // Ativar sala de guerra se prazo crítico
    const salaGuerraAtivada = diasAteVencimento <= 3;

    const prazoData: PrazoInsert = {
      organizacao_id: params.organizacaoId,
      caso_id: params.casoId,
      tipo_prazo: params.tipoPrazo,
      descricao: params.descricao,
      data_original: params.dataOriginal,
      data_ajustada: params.dataAjustada || params.dataOriginal,
      origem: params.origem || 'manual',
      referencia_origem: params.referenciaOrigem,
      id_documento_origem: params.idDocumentoOrigem,
      prioridade,
      status: 'pendente',
      atribuido_a: params.atribuidoA,
      backup_atribuido_a: params.backupAtribuidoA,
      config_alertas: params.configAlertas || {
        d10: true,
        d7: true,
        d5: true,
        d3: true,
        d1: true,
        d0: true,
      },
      sala_guerra_ativada: salaGuerraAtivada,
      sala_guerra_ativada_em: salaGuerraAtivada ? new Date().toISOString() : null,
    };

    const { data: prazo, error } = await (supabase as any)
      .from('prazos')
      .insert(prazoData)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'prazo_criado',
      categoria_evento: 'prazo',
      tipo_ator: 'usuario',
      id_usuario_ator: params.criadoPor,
      tipo_entidade: 'prazo',
      id_entidade: prazo.id,
      dados_depois: prazo,
    });

    // Emitir evento
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: params.organizacaoId,
      nome_evento: 'prazo_detectado',
      tipo_entidade: 'prazo',
      id_entidade: prazo.id,
      payload: prazo,
      usuario_ator_id: params.criadoPor,
    });

    // Se sala de guerra ativada, emitir evento especial
    if (salaGuerraAtivada) {
      await (supabase as any).from('eventos_dominio').insert({
        organizacao_id: params.organizacaoId,
        nome_evento: 'sala_guerra_ativada',
        tipo_entidade: 'prazo',
        id_entidade: prazo.id,
        payload: {
          prazo_id: prazo.id,
          dias_restantes: diasAteVencimento,
          caso_id: params.casoId,
        },
      });
    }

    revalidatePath('/app/prazos');
    revalidatePath(`/app/casos/${params.casoId}`);

    return { success: true, data: prazo };
  } catch (error) {
    console.error('Erro ao criar prazo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar prazo',
    };
  }
}

// ============================================================================
// Atualizar Prazo
// ============================================================================

export async function atualizarPrazo(
  id: string,
  data: PrazoUpdate,
  usuarioId?: string
) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: prazoAnterior } = await (supabase as any)
      .from('prazos')
      .select('*')
      .eq('id', id)
      .single();

    const { data: prazo, error } = await (supabase as any)
      .from('prazos')
      .update({ ...data, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    if (prazoAnterior) {
      await (supabase as any).from('logs_auditoria').insert({
        organizacao_id: prazo.organizacao_id,
        evento: 'prazo_atualizado',
        categoria_evento: 'prazo',
        tipo_ator: 'usuario',
        id_usuario_ator: usuarioId,
        tipo_entidade: 'prazo',
        id_entidade: id,
        dados_antes: prazoAnterior,
        dados_depois: prazo,
      });
    }

    revalidatePath('/app/prazos');
    revalidatePath(`/app/casos/${prazo.caso_id}`);

    return { success: true, data: prazo };
  } catch (error) {
    console.error('Erro ao atualizar prazo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar prazo',
    };
  }
}

// ============================================================================
// Ativar Sala de Guerra
// ============================================================================

export async function ativarSalaGuerra(prazoId: string, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: prazo, error } = await (supabase as any)
      .from('prazos')
      .update({
        sala_guerra_ativada: true,
        sala_guerra_ativada_em: new Date().toISOString(),
        prioridade: 'critica',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', prazoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: prazo.organizacao_id,
      evento: 'sala_guerra_ativada_manual',
      categoria_evento: 'prazo',
      tipo_ator: 'usuario',
      id_usuario_ator: usuarioId,
      tipo_entidade: 'prazo',
      id_entidade: prazoId,
    });

    // Emitir evento
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: prazo.organizacao_id,
      nome_evento: 'sala_guerra_ativada',
      tipo_entidade: 'prazo',
      id_entidade: prazoId,
      payload: {
        prazo_id: prazoId,
        caso_id: prazo.caso_id,
        ativacao_manual: true,
      },
      usuario_ator_id: usuarioId,
    });

    revalidatePath('/app/prazos');
    revalidatePath(`/app/casos/${prazo.caso_id}`);

    return { success: true, data: prazo };
  } catch (error) {
    console.error('Erro ao ativar sala de guerra:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao ativar sala de guerra',
    };
  }
}

// ============================================================================
// Concluir Prazo
// ============================================================================

export async function concluirPrazo(prazoId: string, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: prazo, error } = await (supabase as any)
      .from('prazos')
      .update({
        status: 'concluido',
        concluido_em: new Date().toISOString(),
        concluido_por: usuarioId,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', prazoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: prazo.organizacao_id,
      evento: 'prazo_concluido',
      categoria_evento: 'prazo',
      tipo_ator: 'usuario',
      id_usuario_ator: usuarioId,
      tipo_entidade: 'prazo',
      id_entidade: prazoId,
    });

    // Registrar telemetria
    const diasAntecedencia = Math.ceil(
      (new Date(prazo.data_ajustada).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    await (supabase as any).from('eventos_telemetria').insert({
      organizacao_id: prazo.organizacao_id,
      nome_evento: 'prazo_concluido',
      categoria_evento: 'prazo',
      tipo_entidade: 'prazo',
      id_entidade: prazoId,
      id_usuario_ator: usuarioId,
      resultado: diasAntecedencia >= 0 ? 'no_prazo' : 'atrasado',
      metadados: {
        dias_antecedencia: diasAntecedencia,
        tipo_prazo: prazo.tipo_prazo,
        tinha_sala_guerra: prazo.sala_guerra_ativada,
      },
    });

    revalidatePath('/app/prazos');
    revalidatePath(`/app/casos/${prazo.caso_id}`);

    return { success: true, data: prazo };
  } catch (error) {
    console.error('Erro ao concluir prazo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao concluir prazo',
    };
  }
}

// ============================================================================
// Registrar Alerta Enviado
// ============================================================================

interface RegistrarAlertaParams {
  prazoId: string;
  tipoAlerta: string; // d10, d7, d5, d3, d1, d0
  destinatarios: string[];
  canal?: 'email' | 'push' | 'sistema';
}

export async function registrarAlertaEnviado(params: RegistrarAlertaParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar prazo atual
    const { data: prazo, error: fetchError } = await (supabase as any)
      .from('prazos')
      .select('alertas_enviados, organizacao_id')
      .eq('id', params.prazoId)
      .single();

    if (fetchError) throw fetchError;

    // Adicionar novo alerta ao histórico
    const alertasAtuais = (prazo.alertas_enviados as unknown[]) || [];
    const novoAlerta = {
      tipo: params.tipoAlerta,
      destinatarios: params.destinatarios,
      canal: params.canal || 'sistema',
      enviado_em: new Date().toISOString(),
    };

    const { data: prazoAtualizado, error: updateError } = await (supabase as any)
      .from('prazos')
      .update({
        alertas_enviados: [...alertasAtuais, novoAlerta],
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', params.prazoId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { success: true, data: prazoAtualizado };
  } catch (error) {
    console.error('Erro ao registrar alerta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar alerta',
    };
  }
}

// ============================================================================
// Marcar Prazo como Perdido
// ============================================================================

export async function marcarPrazoPerdido(prazoId: string, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: prazo, error } = await (supabase as any)
      .from('prazos')
      .update({
        status: 'perdido',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', prazoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria crítica
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: prazo.organizacao_id,
      evento: 'prazo_perdido',
      categoria_evento: 'prazo',
      tipo_ator: usuarioId ? 'usuario' : 'sistema',
      id_usuario_ator: usuarioId,
      tipo_entidade: 'prazo',
      id_entidade: prazoId,
      dados_depois: {
        tipo_prazo: prazo.tipo_prazo,
        data_ajustada: prazo.data_ajustada,
        caso_id: prazo.caso_id,
      },
    });

    // Emitir evento crítico
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: prazo.organizacao_id,
      nome_evento: 'prazo_perdido',
      tipo_entidade: 'prazo',
      id_entidade: prazoId,
      payload: {
        prazo_id: prazoId,
        caso_id: prazo.caso_id,
        tipo_prazo: prazo.tipo_prazo,
        data_ajustada: prazo.data_ajustada,
      },
    });

    revalidatePath('/app/prazos');
    revalidatePath(`/app/casos/${prazo.caso_id}`);

    return { success: true, data: prazo };
  } catch (error) {
    console.error('Erro ao marcar prazo como perdido:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao marcar prazo como perdido',
    };
  }
}

// ============================================================================
// Atribuir Prazo
// ============================================================================

interface AtribuirPrazoParams {
  prazoId: string;
  atribuidoA: string;
  backupAtribuidoA?: string;
  atribuidoPor?: string;
}

export async function atribuirPrazo(params: AtribuirPrazoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: prazoAnterior } = await (supabase as any)
      .from('prazos')
      .select('atribuido_a, backup_atribuido_a, organizacao_id, caso_id')
      .eq('id', params.prazoId)
      .single();

    const { data: prazo, error } = await (supabase as any)
      .from('prazos')
      .update({
        atribuido_a: params.atribuidoA,
        backup_atribuido_a: params.backupAtribuidoA,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', params.prazoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: prazo.organizacao_id,
      evento: 'prazo_atribuido',
      categoria_evento: 'prazo',
      tipo_ator: 'usuario',
      id_usuario_ator: params.atribuidoPor,
      tipo_entidade: 'prazo',
      id_entidade: params.prazoId,
      dados_antes: {
        atribuido_a: prazoAnterior?.atribuido_a,
        backup_atribuido_a: prazoAnterior?.backup_atribuido_a,
      },
      dados_depois: {
        atribuido_a: params.atribuidoA,
        backup_atribuido_a: params.backupAtribuidoA,
      },
    });

    revalidatePath('/app/prazos');
    revalidatePath(`/app/casos/${prazo.caso_id}`);

    return { success: true, data: prazo };
  } catch (error) {
    console.error('Erro ao atribuir prazo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atribuir prazo',
    };
  }
}

// ============================================================================
// Iniciar Prazo (mudar status para em_andamento)
// ============================================================================

export async function iniciarPrazo(prazoId: string, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: prazo, error } = await (supabase as any)
      .from('prazos')
      .update({
        status: 'em_andamento',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', prazoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: prazo.organizacao_id,
      evento: 'prazo_iniciado',
      categoria_evento: 'prazo',
      tipo_ator: 'usuario',
      id_usuario_ator: usuarioId,
      tipo_entidade: 'prazo',
      id_entidade: prazoId,
    });

    revalidatePath('/app/prazos');
    revalidatePath(`/app/casos/${prazo.caso_id}`);

    return { success: true, data: prazo };
  } catch (error) {
    console.error('Erro ao iniciar prazo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao iniciar prazo',
    };
  }
}

// ============================================================================
// Marcar Minuta Pronta
// ============================================================================

interface MarcarMinutaProntaParams {
  prazoId: string;
  idDocumentoMinuta: string;
  usuarioId?: string;
}

export async function marcarMinutaPronta(params: MarcarMinutaProntaParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: prazo, error } = await (supabase as any)
      .from('prazos')
      .update({
        status: 'minuta_pronta',
        minuta_automatica_gerada: true,
        id_documento_minuta_automatica: params.idDocumentoMinuta,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', params.prazoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: prazo.organizacao_id,
      evento: 'minuta_prazo_pronta',
      categoria_evento: 'prazo',
      tipo_ator: params.usuarioId ? 'usuario' : 'agente',
      id_usuario_ator: params.usuarioId,
      tipo_agente_ator: params.usuarioId ? undefined : 'gerador_documento',
      tipo_entidade: 'prazo',
      id_entidade: params.prazoId,
      dados_depois: {
        id_documento_minuta: params.idDocumentoMinuta,
      },
    });

    revalidatePath('/app/prazos');
    revalidatePath(`/app/casos/${prazo.caso_id}`);

    return { success: true, data: prazo };
  } catch (error) {
    console.error('Erro ao marcar minuta pronta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao marcar minuta pronta',
    };
  }
}

// ============================================================================
// Verificar Prazos Críticos (para cron job)
// ============================================================================

export async function verificarPrazosCriticos(organizacaoId: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const hoje = new Date().toISOString().split('T')[0];
    const em3Dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Buscar prazos que vencem em até 3 dias e não estão concluídos
    const { data: prazosCriticos, error } = await (supabase as any)
      .from('prazos')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .in('status', ['pendente', 'em_andamento', 'minuta_pronta'])
      .lte('data_ajustada', em3Dias)
      .gte('data_ajustada', hoje);

    if (error) throw error;

    // Ativar sala de guerra para prazos que ainda não estão ativados
    const prazosParaAtivar = prazosCriticos.filter((p: any) => !p.sala_guerra_ativada);

    for (const prazo of prazosParaAtivar) {
      await ativarSalaGuerra(prazo.id);
    }

    return {
      success: true,
      data: {
        total: prazosCriticos.length,
        ativados: prazosParaAtivar.length,
        prazos: prazosCriticos,
      },
    };
  } catch (error) {
    console.error('Erro ao verificar prazos críticos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao verificar prazos',
    };
  }
}

// ============================================================================
// Detectar Prazo de Documento (chamado pelo agente de IA)
// ============================================================================

interface DetectarPrazoParams {
  organizacaoId: string;
  casoId: number;
  documentoId: string;
  tipoPrazo: string;
  descricao: string;
  dataOriginal: string;
  dataAjustada?: string;
  confiancaIA: number;
  idExecucaoIA: string;
}

export async function detectarPrazoDeDocumento(params: DetectarPrazoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Criar prazo detectado por IA
    const prazoData: PrazoInsert = {
      organizacao_id: params.organizacaoId,
      caso_id: params.casoId,
      tipo_prazo: params.tipoPrazo,
      descricao: params.descricao,
      data_original: params.dataOriginal,
      data_ajustada: params.dataAjustada || params.dataOriginal,
      origem: 'detectado_por_ia',
      id_documento_origem: params.documentoId,
      status: 'pendente',
      config_alertas: {
        d10: true,
        d7: true,
        d5: true,
        d3: true,
        d1: true,
        d0: true,
      },
    };

    const { data: prazo, error } = await (supabase as any)
      .from('prazos')
      .insert(prazoData)
      .select()
      .single();

    if (error) throw error;

    // Criar sugestão de IA para revisão humana
    await (supabase as any).from('sugestoes_ia').insert({
      organizacao_id: params.organizacaoId,
      id_execucao_ia: params.idExecucaoIA,
      tipo_sugestao: 'prazo_detectado',
      titulo: `Prazo detectado: ${params.tipoPrazo}`,
      resumo: params.descricao,
      razao: `Prazo identificado automaticamente no documento. Data: ${params.dataOriginal}`,
      estruturado: {
        prazo_id: prazo.id,
        tipo_prazo: params.tipoPrazo,
        data_original: params.dataOriginal,
        data_ajustada: params.dataAjustada,
      },
      confianca: params.confiancaIA,
      status: 'pendente',
    });

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'prazo_detectado_ia',
      categoria_evento: 'prazo',
      tipo_ator: 'agente',
      tipo_agente_ator: 'extrator_entidades',
      tipo_entidade: 'prazo',
      id_entidade: prazo.id,
      dados_depois: prazo,
      id_execucao_ia: params.idExecucaoIA,
    });

    return { success: true, data: prazo };
  } catch (error) {
    console.error('Erro ao detectar prazo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao detectar prazo',
    };
  }
}
