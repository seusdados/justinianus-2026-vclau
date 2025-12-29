'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type QualificacaoInsert = Database['public']['Tables']['qualificacoes_lead']['Insert'];

// ============================================================================
// Criar Lead
// ============================================================================

interface CriarLeadParams {
  organizacaoId: string;
  tipoCliente: 'pessoa_fisica' | 'pessoa_juridica';
  nome: string;
  email?: string;
  telefone?: string;
  tipoServico: 'consultivo' | 'contencioso' | 'administrativo' | 'consensual';
  nivelUrgencia?: 'baixa' | 'media' | 'alta' | 'critica';
  origem?: 'formulario' | 'email' | 'upload' | 'api' | 'manual' | 'indicacao';
  descricaoInicial?: string;
  clienteId?: number;
  criadoPor?: string;
}

export async function criarLead(params: CriarLeadParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const leadData: LeadInsert = {
      organizacao_id: params.organizacaoId,
      tipo_cliente: params.tipoCliente,
      nome: params.nome,
      email: params.email,
      telefone: params.telefone,
      tipo_servico: params.tipoServico,
      nivel_urgencia: params.nivelUrgencia || 'media',
      origem: params.origem || 'manual',
      descricao_inicial: params.descricaoInicial,
      cliente_id: params.clienteId,
      criado_por: params.criadoPor,
      status: 'novo',
    };

    const { data: lead, error: leadError } = await (supabase as any)
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) throw leadError;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'lead_criado',
      categoria_evento: 'lead',
      tipo_ator: 'usuario',
      actor_user_id: params.criadoPor,
      tipo_entidade: 'lead',
      id_entidade: lead.id,
      dados_depois: lead,
    });

    // Emitir evento de domínio
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: params.organizacaoId,
      nome_evento: 'lead_criado',
      tipo_entidade: 'lead',
      id_entidade: lead.id,
      payload: lead,
      usuario_ator_id: params.criadoPor,
    });

    revalidatePath('/app/captacao');
    
    return { success: true, data: lead };
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao criar lead' 
    };
  }
}

// ============================================================================
// Atualizar Lead
// ============================================================================

export async function atualizarLead(id: string, data: LeadUpdate, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar lead atual para auditoria
    const { data: leadAnterior } = await (supabase as any)
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    const { data: lead, error } = await (supabase as any)
      .from('leads')
      .update({ ...data, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    if (leadAnterior) {
      await (supabase as any).from('logs_auditoria').insert({
        organizacao_id: lead.organizacao_id,
        evento: 'lead_atualizado',
        categoria_evento: 'lead',
        tipo_ator: 'usuario',
        actor_user_id: usuarioId,
        tipo_entidade: 'lead',
        id_entidade: id,
        dados_antes: leadAnterior,
        dados_depois: lead,
      });
    }

    revalidatePath('/app/captacao');
    revalidatePath(`/app/captacao/${id}`);

    return { success: true, data: lead };
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar lead' 
    };
  }
}

// ============================================================================
// Qualificar Lead
// ============================================================================

interface QualificarLeadParams {
  leadId: string;
  organizacaoId: string;
  classificacao?: string;
  nivelRisco?: 'baixo' | 'medio' | 'alto' | 'critico';
  areaJuridica?: string[];
  prazoCritico?: string; // ISO date
  dataPrescriscao?: string; // ISO date
  resumoExecutivo?: string;
  fatosPrincipais?: Record<string, unknown>;
  estrategiaRecomendada?: string;
  confiancaIA?: number;
  idExecucaoIA?: string;
  validadoPor?: string;
}

export async function qualificarLead(params: QualificarLeadParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Verificar se já existe qualificação
    const { data: existente } = await (supabase as any)
      .from('qualificacoes_lead')
      .select('id')
      .eq('lead_id', params.leadId)
      .single();

    const qualificacaoData: Partial<QualificacaoInsert> = {
      organizacao_id: params.organizacaoId,
      lead_id: params.leadId,
      classificacao: params.classificacao,
      nivel_risco: params.nivelRisco,
      area_juridica: params.areaJuridica,
      prazo_critico: params.prazoCritico,
      data_prescricao: params.dataPrescriscao,
      resumo_executivo: params.resumoExecutivo,
      fatos_principais: params.fatosPrincipais as any,
      estrategia_recomendada: params.estrategiaRecomendada as any,
      confianca_ia: params.confiancaIA,
      id_execucao_ia: params.idExecucaoIA,
      validado_por: params.validadoPor,
      validado_em: params.validadoPor ? new Date().toISOString() : undefined,
      decisao: 'pendente',
    };

    let qualificacao;

    if (existente) {
      // Atualizar existente
      const { data, error } = await (supabase as any)
        .from('qualificacoes_lead')
        .update(qualificacaoData)
        .eq('id', existente.id)
        .select()
        .single();

      if (error) throw error;
      qualificacao = data;
    } else {
      // Criar nova
      const { data, error } = await (supabase as any)
        .from('qualificacoes_lead')
        .insert(qualificacaoData as QualificacaoInsert)
        .select()
        .single();

      if (error) throw error;
      qualificacao = data;
    }

    // Atualizar status do lead
    await (supabase as any)
      .from('leads')
      .update({ 
        status: 'em_analise',
        atualizado_em: new Date().toISOString()
      })
      .eq('id', params.leadId);

    // Emitir evento
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: params.organizacaoId,
      nome_evento: 'lead_qualificado',
      tipo_entidade: 'lead',
      id_entidade: params.leadId,
      payload: qualificacao,
      usuario_ator_id: params.validadoPor,
    });

    revalidatePath('/app/qualificacao');
    revalidatePath(`/app/captacao/${params.leadId}`);

    return { success: true, data: qualificacao };
  } catch (error) {
    console.error('Erro ao qualificar lead:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao qualificar lead' 
    };
  }
}

// ============================================================================
// Aceitar/Recusar Lead
// ============================================================================

export async function decidirLead(
  leadId: string, 
  decisao: 'aceito' | 'recusado',
  motivoRecusa?: string,
  validadoPor?: string
) {
  const supabase = await createServerSupabaseClient();

  try {
    // Atualizar qualificação
    const { error: qualError } = await (supabase as any)
      .from('qualificacoes_lead')
      .update({
        decisao,
        motivo_recusa: decisao === 'recusado' ? motivoRecusa : null,
        validado_por: validadoPor,
        validado_em: new Date().toISOString(),
      })
      .eq('lead_id', leadId);

    if (qualError) throw qualError;

    // Atualizar status do lead
    const novoStatus = decisao === 'aceito' ? 'qualificado' : 'recusado';
    
    const { data: lead, error: leadError } = await (supabase as any)
      .from('leads')
      .update({ 
        status: novoStatus,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', leadId)
      .select()
      .single();

    if (leadError) throw leadError;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: lead.organizacao_id,
      evento: `lead_${decisao}`,
      categoria_evento: 'lead',
      tipo_ator: 'usuario',
      actor_user_id: validadoPor,
      tipo_entidade: 'lead',
      id_entidade: leadId,
      dados_depois: { decisao, motivo_recusa: motivoRecusa },
    });

    revalidatePath('/app/qualificacao');
    revalidatePath(`/app/captacao/${leadId}`);

    return { success: true, data: lead };
  } catch (error) {
    console.error('Erro ao decidir lead:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao decidir lead' 
    };
  }
}

// ============================================================================
// Converter Lead em Caso
// ============================================================================

interface ConverterLeadParams {
  leadId: string;
  titulo: string;
  descricao?: string;
  tipoCaso: 'contencioso' | 'consultivo' | 'administrativo' | 'consensual';
  areaJuridica?: string[];
  usuarioResponsavelId?: string;
  valorCausa?: number;
  criadoPor?: string;
}

export async function converterLeadEmCaso(params: ConverterLeadParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar lead
    const { data: lead, error: leadError } = await (supabase as any)
      .from('leads')
      .select('*, qualificacoes_lead(*)')
      .eq('id', params.leadId)
      .single();

    if (leadError) throw leadError;

    // Verificar se lead está qualificado
    if (lead.status !== 'qualificado') {
      throw new Error('Lead precisa estar qualificado para ser convertido');
    }

    // Buscar ou criar cliente
    let clienteId = lead.cliente_id;

    if (!clienteId) {
      // Criar cliente a partir dos dados do lead
      const { data: cliente, error: clienteError } = await (supabase as any)
        .from('clientes')
        .insert({
          organizacao_id: lead.organizacao_id,
          tipo_cliente: lead.tipo_cliente,
          nome: lead.nome,
          email: lead.email,
          telefone: lead.telefone,
        })
        .select()
        .single();

      if (clienteError) throw clienteError;
      clienteId = cliente.id;
    }

    // Criar caso
    const { data: caso, error: casoError } = await (supabase as any)
      .from('casos')
      .insert({
        organizacao_id: lead.organizacao_id,
        cliente_id: clienteId,
        lead_id: params.leadId,
        titulo: params.titulo,
        descricao: params.descricao,
        tipo_caso: params.tipoCaso,
        area_juridica: params.areaJuridica,
        usuario_responsavel_id: params.usuarioResponsavelId,
        valor_causa: params.valorCausa,
        status_caso: 'ativo',
        fase_atual: 'analise',
      })
      .select()
      .single();

    if (casoError) throw casoError;

    // Atualizar lead como convertido
    await (supabase as any)
      .from('leads')
      .update({ 
        status: 'convertido',
        caso_convertido_id: caso.id,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', params.leadId);

    // Vincular documentos do lead ao caso
    await (supabase as any)
      .from('documentos')
      .update({ caso_id: caso.id })
      .eq('lead_id', params.leadId);

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: lead.organizacao_id,
      evento: 'caso_criado_de_lead',
      categoria_evento: 'caso',
      tipo_ator: 'usuario',
      actor_user_id: params.criadoPor,
      tipo_entidade: 'caso',
      id_entidade: caso.id.toString(),
      dados_depois: caso,
    });

    // Emitir evento
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: lead.organizacao_id,
      nome_evento: 'caso_aberto',
      tipo_entidade: 'caso',
      id_entidade: caso.id.toString(),
      payload: caso,
      usuario_ator_id: params.criadoPor,
    });

    revalidatePath('/app/qualificacao');
    revalidatePath('/app/analise');

    return { success: true, data: caso };
  } catch (error) {
    console.error('Erro ao converter lead:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao converter lead' 
    };
  }
}
