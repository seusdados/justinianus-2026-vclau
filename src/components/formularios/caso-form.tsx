'use client';

import { useState, useTransition } from 'react';
import { converterLeadEmCaso, atualizarCaso } from '@/app/actions';
import { cn } from '@/lib/utils';

// ============================================================================
// Tipos
// ============================================================================

interface CasoFormData {
  titulo: string;
  descricao?: string;
  tipoCaso: 'contencioso' | 'consultivo' | 'administrativo' | 'consensual';
  areaJuridica: string[];
  usuarioResponsavelId?: string;
  valorCausa?: number;
  numeroExterno?: string;
  tribunal?: string;
}

interface CasoFormProps {
  organizacaoId: string;
  usuarioId?: string;
  leadId?: string; // Se vier de um lead
  casoId?: number; // Se for edição
  dadosIniciais?: Partial<CasoFormData>;
  usuarios?: Array<{ id: string; nome: string }>;
  onSucesso?: (caso: unknown) => void;
  onCancelar?: () => void;
  className?: string;
}

// ============================================================================
// Constantes
// ============================================================================

const TIPOS_CASO = [
  { value: 'contencioso', label: 'Contencioso', descricao: 'Processos judiciais', icone: '⚖️' },
  { value: 'consultivo', label: 'Consultivo', descricao: 'Análises e pareceres', icone: '📋' },
  { value: 'administrativo', label: 'Administrativo', descricao: 'ANPD, Procon, agências', icone: '🏛️' },
  { value: 'consensual', label: 'Consensual', descricao: 'Acordo, mediação', icone: '🤝' },
] as const;

const AREAS_JURIDICAS = [
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'civil', label: 'Civil' },
  { value: 'tributario', label: 'Tributário' },
  { value: 'penal', label: 'Penal' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'familia', label: 'Família' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'digital', label: 'Digital / LGPD' },
  { value: 'outro', label: 'Outro' },
] as const;

const TRIBUNAIS = [
  { value: 'tjsp', label: 'TJSP - Tribunal de Justiça de SP' },
  { value: 'trt2', label: 'TRT-2 - Tribunal Regional do Trabalho 2ª Região' },
  { value: 'trt15', label: 'TRT-15 - Tribunal Regional do Trabalho 15ª Região' },
  { value: 'trf3', label: 'TRF-3 - Tribunal Regional Federal 3ª Região' },
  { value: 'stj', label: 'STJ - Superior Tribunal de Justiça' },
  { value: 'stf', label: 'STF - Supremo Tribunal Federal' },
  { value: 'tst', label: 'TST - Tribunal Superior do Trabalho' },
  { value: 'anpd', label: 'ANPD - Autoridade Nacional de Proteção de Dados' },
  { value: 'procon', label: 'Procon' },
  { value: 'outro', label: 'Outro' },
] as const;

// ============================================================================
// Componente
// ============================================================================

export function CasoForm({
  organizacaoId,
  usuarioId,
  leadId,
  casoId,
  dadosIniciais,
  usuarios = [],
  onSucesso,
  onCancelar,
  className,
}: CasoFormProps) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CasoFormData>({
    titulo: dadosIniciais?.titulo || '',
    descricao: dadosIniciais?.descricao || '',
    tipoCaso: dadosIniciais?.tipoCaso || 'contencioso',
    areaJuridica: dadosIniciais?.areaJuridica || [],
    usuarioResponsavelId: dadosIniciais?.usuarioResponsavelId || '',
    valorCausa: dadosIniciais?.valorCausa,
    numeroExterno: dadosIniciais?.numeroExterno || '',
    tribunal: dadosIniciais?.tribunal || '',
  });

  const isEdicao = !!casoId;
  const isConversaoLead = !!leadId && !casoId;

  // ──────────────────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────────────────

  const handleChange = (campo: keyof CasoFormData, valor: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setErro(null);
  };

  const toggleAreaJuridica = (area: string) => {
    setFormData(prev => ({
      ...prev,
      areaJuridica: prev.areaJuridica.includes(area)
        ? prev.areaJuridica.filter(a => a !== area)
        : [...prev.areaJuridica, area],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!formData.titulo) {
      setErro('título é obrigatório');
      return;
    }

    if (formData.areaJuridica.length === 0) {
      setErro('selecione ao menos uma área jurídica');
      return;
    }

    startTransition(async () => {
      try {
        let resultado;

        if (isEdicao) {
          resultado = await atualizarCaso(casoId, {
            titulo: formData.titulo,
            tipo_caso: formData.tipoCaso,
            area_juridica: formData.areaJuridica,
            usuario_responsavel_id: formData.usuarioResponsavelId || null,
            valor_causa: formData.valorCausa || null,
            numero_externo: formData.numeroExterno || null,
            tribunal: formData.tribunal || null,
          } as any, usuarioId);
        } else if (isConversaoLead) {
          resultado = await converterLeadEmCaso({
            leadId,
            titulo: formData.titulo,
            descricao: formData.descricao,
            tipoCaso: formData.tipoCaso,
            areaJuridica: formData.areaJuridica,
            usuarioResponsavelId: formData.usuarioResponsavelId,
            valorCausa: formData.valorCausa,
            criadoPor: usuarioId,
          });
        } else {
          setErro('formulário requer um lead ou caso existente');
          return;
        }

        if (resultado.success) {
          onSucesso?.(resultado.data);
        } else {
          setErro(resultado.error || 'erro ao salvar caso');
        }
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'erro inesperado');
      }
    });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <h2 className="text-xl font-normal text-zinc-200">
          {isEdicao ? 'editar caso' : isConversaoLead ? 'converter lead em caso' : 'novo caso'}
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          {isConversaoLead 
            ? 'preencha os dados do caso para converter o lead' 
            : 'atualize as informações do caso'}
        </p>
      </div>

      {/* Título */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">título do caso</label>
        <input
          type="text"
          value={formData.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          placeholder="Ex: Reclamação Trabalhista - João vs. Empresa ABC"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Tipo de Caso */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">tipo de caso</label>
        <div className="grid grid-cols-2 gap-3">
          {TIPOS_CASO.map(tipo => (
            <button
              key={tipo.value}
              type="button"
              onClick={() => handleChange('tipoCaso', tipo.value)}
              className={cn(
                'p-4 rounded-lg border transition-all text-left',
                formData.tipoCaso === tipo.value
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{tipo.icone}</span>
                <span className={cn(
                  'text-sm font-medium',
                  formData.tipoCaso === tipo.value ? 'text-amber-400' : 'text-zinc-300'
                )}>
                  {tipo.label}
                </span>
              </div>
              <span className="text-xs text-zinc-500">{tipo.descricao}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Áreas Jurídicas */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">áreas jurídicas</label>
        <div className="flex flex-wrap gap-2">
          {AREAS_JURIDICAS.map(area => (
            <button
              key={area.value}
              type="button"
              onClick={() => toggleAreaJuridica(area.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-all',
                formData.areaJuridica.includes(area.value)
                  ? 'bg-amber-500 text-zinc-900'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              )}
            >
              {area.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-2">selecione todas as áreas aplicáveis</p>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">descrição</label>
        <textarea
          value={formData.descricao || ''}
          onChange={(e) => handleChange('descricao', e.target.value)}
          placeholder="Descreva os principais fatos e objetivos do caso..."
          rows={4}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
        />
      </div>

      {/* Dados do Processo (se contencioso/administrativo) */}
      {['contencioso', 'administrativo'].includes(formData.tipoCaso) && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">número do processo</label>
            <input
              type="text"
              value={formData.numeroExterno || ''}
              onChange={(e) => handleChange('numeroExterno', e.target.value)}
              placeholder="0000000-00.0000.0.00.0000"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">tribunal/órgão</label>
            <select
              value={formData.tribunal || ''}
              onChange={(e) => handleChange('tribunal', e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="">selecione...</option>
              {TRIBUNAIS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Valor da Causa */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">valor da causa (estimado)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
          <input
            type="number"
            value={formData.valorCausa || ''}
            onChange={(e) => handleChange('valorCausa', parseFloat(e.target.value) || 0)}
            placeholder="0,00"
            className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Responsável */}
      {usuarios.length > 0 && (
        <div>
          <label className="block text-sm text-zinc-400 mb-2">responsável</label>
          <select
            value={formData.usuarioResponsavelId || ''}
            onChange={(e) => handleChange('usuarioResponsavelId', e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">selecione um responsável...</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{erro}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'px-6 py-2 bg-amber-500 text-zinc-900 rounded-lg text-sm font-medium transition-colors',
            isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-400'
          )}
        >
          {isPending 
            ? 'salvando...' 
            : isEdicao 
              ? 'atualizar caso' 
              : isConversaoLead 
                ? 'converter em caso' 
                : 'criar caso'}
        </button>
      </div>
    </form>
  );
}
