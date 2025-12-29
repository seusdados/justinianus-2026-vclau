'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types';

type CasoUpdate = Database['public']['Tables']['casos']['Update'];
type TarefaInsert = Database['public']['Tables']['tarefas_caso']['Insert'];

// ============================================================================
// Atualizar Caso
// ============================================================================

export async function atualizarCaso(
  id: number, 
  data: CasoUpdate, 
  usuarioId?: string
) {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar caso atual para auditoria
    const { data: casoAnterior } = await (supabase as any)
      .from('casos')
      .select('*')
      .eq('id', id)
      .single();

    const { data: caso, error } = await (supabase as any)
      .from('casos')
      .update({ ...data, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    if (casoAnterior) {
      await (supabase as any).from('logs_auditoria').insert({
        organizacao_id: caso.organizacao_id,
        evento: 'caso_atualizado',
        categoria_evento: 'caso',
        tipo_ator: 'usuario',
        actor_user_id: usuarioId,
        tipo_entidade: 'caso',
        id_entidade: id.toString(),
        dados_antes: casoAnterior,
        dados_depois: caso,
      });
    }

    revalidatePath('/app/analise');
    revalidatePath(`/app/analise/${id}`);

    return { success: true, data: caso };
  } catch (error) {
    console.error('Erro ao atualizar caso:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar caso' 
    };
  }
}

// ============================================================================
// Mudar Fase do Caso
// ============================================================================

type FaseCaso = 'captacao' | 'qualificacao' | 'analise' | 'acao' | 'registro';

export async function mudarFaseCaso(
  casoId: number, 
  novaFase: FaseCaso,
  usuarioId?: string
) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: caso, error } = await (supabase as any)
      .from('casos')
      .update({ 
        fase_atual: novaFase,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', casoId)
      .select()
      .single();

    if (error) throw error;

    // Emitir evento
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: caso.organizacao_id,
      nome_evento: `caso_fase_${novaFase}`,
      tipo_entidade: 'caso',
      id_entidade: casoId.toString(),
      payload: { fase_anterior: caso.fase_atual, nova_fase: novaFase },
      usuario_ator_id: usuarioId,
    });

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: caso.organizacao_id,
      evento: 'caso_fase_alterada',
      categoria_evento: 'caso',
      tipo_ator: 'usuario',
      actor_user_id: usuarioId,
      tipo_entidade: 'caso',
      id_entidade: casoId.toString(),
      dados_depois: { fase: novaFase },
    });

    revalidatePath('/app/analise');
    revalidatePath(`/app/analise/${casoId}`);

    return { success: true, data: caso };
  } catch (error) {
    console.error('Erro ao mudar fase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao mudar fase' 
    };
  }
}

// ============================================================================
// Encerrar Caso
// ============================================================================

interface EncerrarCasoParams {
  casoId: number;
  motivo?: string;
  resultado?: 'ganho' | 'perdido' | 'acordo' | 'arquivado' | 'desistencia';
  valorObtido?: number;
  usuarioId?: string;
}

export async function encerrarCaso(params: EncerrarCasoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Verificar se há prazos pendentes
    const { data: prazosPendentes } = await (supabase as any)
      .from('prazos')
      .select('id')
      .eq('caso_id', params.casoId)
      .in('status', ['pendente', 'em_andamento'])
      .limit(1);

    if (prazosPendentes && prazosPendentes.length > 0) {
      throw new Error('Existem prazos pendentes. Conclua ou cancele antes de encerrar.');
    }

    // Verificar se há tarefas abertas
    const { data: tarefasAbertas } = await (supabase as any)
      .from('tarefas_caso')
      .select('id')
      .eq('caso_id', params.casoId)
      .in('status', ['aberta', 'em_andamento', 'aguardando'])
      .limit(1);

    if (tarefasAbertas && tarefasAbertas.length > 0) {
      throw new Error('Existem tarefas abertas. Conclua ou cancele antes de encerrar.');
    }

    const { data: caso, error } = await (supabase as any)
      .from('casos')
      .update({
        status_caso: 'encerrado',
        fase_atual: 'registro',
        encerrado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', params.casoId)
      .select()
      .single();

    if (error) throw error;

    // Emitir evento
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: caso.organizacao_id,
      nome_evento: 'caso_encerrado',
      tipo_entidade: 'caso',
      id_entidade: params.casoId.toString(),
      payload: { 
        motivo: params.motivo, 
        resultado: params.resultado,
        valor_obtido: params.valorObtido 
      },
      usuario_ator_id: params.usuarioId,
    });

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: caso.organizacao_id,
      evento: 'caso_encerrado',
      categoria_evento: 'caso',
      tipo_ator: 'usuario',
      actor_user_id: params.usuarioId,
      tipo_entidade: 'caso',
      id_entidade: params.casoId.toString(),
      dados_depois: { 
        status: 'encerrado',
        motivo: params.motivo,
        resultado: params.resultado 
      },
    });

    // Registrar telemetria
    await (supabase as any).from('eventos_telemetria').insert({
      organizacao_id: caso.organizacao_id,
      nome_evento: 'encerrado',
      categoria_evento: 'caso',
      tipo_entidade: 'caso',
      id_entidade: params.casoId.toString(),
      id_usuario_ator: params.usuarioId,
      resultado: params.resultado,
    });

    revalidatePath('/app/analise');
    revalidatePath('/app/registro');

    return { success: true, data: caso };
  } catch (error) {
    console.error('Erro ao encerrar caso:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao encerrar caso' 
    };
  }
}

// ============================================================================
// Reabrir Caso
// ============================================================================

export async function reabrirCaso(casoId: number, motivo: string, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: caso, error } = await (supabase as any)
      .from('casos')
      .update({
        status_caso: 'ativo',
        encerrado_em: null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', casoId)
      .select()
      .single();

    if (error) throw error;

    // Emitir evento
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: caso.organizacao_id,
      nome_evento: 'caso_reaberto',
      tipo_entidade: 'caso',
      id_entidade: casoId.toString(),
      payload: { motivo },
      usuario_ator_id: usuarioId,
    });

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: caso.organizacao_id,
      evento: 'caso_reaberto',
      categoria_evento: 'caso',
      tipo_ator: 'usuario',
      actor_user_id: usuarioId,
      tipo_entidade: 'caso',
      id_entidade: casoId.toString(),
      dados_depois: { status: 'ativo', motivo },
    });

    revalidatePath('/app/registro');
    revalidatePath('/app/analise');

    return { success: true, data: caso };
  } catch (error) {
    console.error('Erro ao reabrir caso:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao reabrir caso' 
    };
  }
}

// ============================================================================
// Atribuir Responsável
// ============================================================================

export async function atribuirResponsavel(
  casoId: number, 
  usuarioResponsavelId: string,
  atribuidoPor?: string
) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: caso, error } = await (supabase as any)
      .from('casos')
      .update({
        usuario_responsavel_id: usuarioResponsavelId,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', casoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: caso.organizacao_id,
      evento: 'caso_responsavel_atribuido',
      categoria_evento: 'caso',
      tipo_ator: 'usuario',
      actor_user_id: atribuidoPor,
      tipo_entidade: 'caso',
      id_entidade: casoId.toString(),
      dados_depois: { responsavel: usuarioResponsavelId },
    });

    revalidatePath('/app/analise');
    revalidatePath(`/app/analise/${casoId}`);

    return { success: true, data: caso };
  } catch (error) {
    console.error('Erro ao atribuir responsável:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atribuir responsável' 
    };
  }
}

// ============================================================================
// Criar Tarefa no Caso
// ============================================================================

interface CriarTarefaParams {
  casoId: number;
  organizacaoId: string;
  titulo: string;
  descricao?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  dataLimite?: string;
  atribuidaA?: string;
  prazoId?: string;
  origem?: 'manual' | 'playbook' | 'sugerida_por_ia' | 'automatica_prazo';
  criadoPor?: string;
}

export async function criarTarefaCaso(params: CriarTarefaParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const tarefaData: TarefaInsert = {
      organizacao_id: params.organizacaoId,
      caso_id: params.casoId,
      titulo: params.titulo,
      descricao: params.descricao,
      prioridade: params.prioridade || 'media',
      data_limite: params.dataLimite,
      atribuida_a: params.atribuidaA,
      prazo_id: params.prazoId,
      origem: params.origem || 'manual',
      status: 'aberta',
      criado_por: params.criadoPor,
    };

    const { data: tarefa, error } = await (supabase as any)
      .from('tarefas_caso')
      .insert(tarefaData)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'tarefa_criada',
      categoria_evento: 'tarefa',
      tipo_ator: 'usuario',
      actor_user_id: params.criadoPor,
      tipo_entidade: 'tarefa',
      id_entidade: tarefa.id.toString(),
      dados_depois: tarefa,
    });

    revalidatePath('/app/acao');
    revalidatePath(`/app/analise/${params.casoId}`);

    return { success: true, data: tarefa };
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao criar tarefa' 
    };
  }
}

// ============================================================================
// Concluir Tarefa
// ============================================================================

export async function concluirTarefa(tarefaId: number, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: tarefa, error } = await (supabase as any)
      .from('tarefas_caso')
      .update({
        status: 'concluida',
        concluida_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', tarefaId)
      .select()
      .single();

    if (error) throw error;

    // Se a tarefa está vinculada a um prazo, verificar se todas as tarefas estão concluídas
    if (tarefa.prazo_id) {
      const { data: tarefasPrazo } = await (supabase as any)
        .from('tarefas_caso')
        .select('status')
        .eq('prazo_id', tarefa.prazo_id);

      const todasConcluidas = tarefasPrazo?.every((t: any) => t.status === 'concluida' || t.status === 'cancelada');

      if (todasConcluidas) {
        await (supabase as any)
          .from('prazos')
          .update({ status: 'minuta_pronta' })
          .eq('id', tarefa.prazo_id);
      }
    }

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: tarefa.organizacao_id,
      evento: 'tarefa_concluida',
      categoria_evento: 'tarefa',
      tipo_ator: 'usuario',
      actor_user_id: usuarioId,
      tipo_entidade: 'tarefa',
      id_entidade: tarefaId.toString(),
    });

    revalidatePath('/app/acao');

    return { success: true, data: tarefa };
  } catch (error) {
    console.error('Erro ao concluir tarefa:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao concluir tarefa' 
    };
  }
}

// ============================================================================
// Habilitar/Desabilitar Portal do Cliente
// ============================================================================

export async function togglePortalCliente(casoId: number, habilitar: boolean, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: caso, error } = await (supabase as any)
      .from('casos')
      .update({
        portal_cliente_habilitado: habilitar,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', casoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: caso.organizacao_id,
      evento: habilitar ? 'portal_habilitado' : 'portal_desabilitado',
      categoria_evento: 'caso',
      tipo_ator: 'usuario',
      actor_user_id: usuarioId,
      tipo_entidade: 'caso',
      id_entidade: casoId.toString(),
    });

    revalidatePath(`/app/analise/${casoId}`);

    return { success: true, data: caso };
  } catch (error) {
    console.error('Erro ao alterar portal:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao alterar portal' 
    };
  }
}
