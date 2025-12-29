'use client';

import { useState, useTransition } from 'react';
import { criarLead, atualizarLead } from '@/app/actions';
import { cn } from '@/lib/utils';

// ============================================================================
// Tipos
// ============================================================================

interface LeadFormData {
  tipoCliente: 'pessoa_fisica' | 'pessoa_juridica';
  nome: string;
  email?: string;
  telefone?: string;
  tipoServico: 'consultivo' | 'contencioso' | 'administrativo' | 'consensual';
  nivelUrgencia: 'baixa' | 'media' | 'alta' | 'critica';
  origem?: 'formulario' | 'email' | 'upload' | 'api' | 'manual' | 'indicacao';
  descricaoInicial?: string;
}

interface LeadFormProps {
  organizacaoId: string;
  usuarioId?: string;
  leadId?: string;
  dadosIniciais?: Partial<LeadFormData>;
  onSucesso?: (lead: unknown) => void;
  onCancelar?: () => void;
  className?: string;
}

// ============================================================================
// Constantes
// ============================================================================

const TIPOS_CLIENTE = [
  { value: 'pessoa_fisica', label: 'Pessoa Física' },
  { value: 'pessoa_juridica', label: 'Pessoa Jurídica' },
] as const;

const TIPOS_SERVICO = [
  { value: 'consultivo', label: 'Consultivo', descricao: 'Análise, pareceres, consultoria' },
  { value: 'contencioso', label: 'Contencioso', descricao: 'Processos judiciais' },
  { value: 'administrativo', label: 'Administrativo', descricao: 'ANPD, Procon, agências' },
  { value: 'consensual', label: 'Consensual', descricao: 'Acordo, mediação, negociação' },
] as const;

const NIVEIS_URGENCIA = [
  { value: 'baixa', label: 'Baixa', cor: 'bg-gray-500' },
  { value: 'media', label: 'Média', cor: 'bg-yellow-500' },
  { value: 'alta', label: 'Alta', cor: 'bg-orange-500' },
  { value: 'critica', label: 'Crítica', cor: 'bg-red-500' },
] as const;

const ORIGENS = [
  { value: 'formulario', label: 'Formulário' },
  { value: 'email', label: 'E-mail' },
  { value: 'upload', label: 'Upload de Documentos' },
  { value: 'manual', label: 'Cadastro Manual' },
  { value: 'indicacao', label: 'Indicação' },
] as const;

// ============================================================================
// Componente
// ============================================================================

export function LeadForm({
  organizacaoId,
  usuarioId,
  leadId,
  dadosIniciais,
  onSucesso,
  onCancelar,
  className,
}: LeadFormProps) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(1);
  
  const [formData, setFormData] = useState<LeadFormData>({
    tipoCliente: dadosIniciais?.tipoCliente || 'pessoa_fisica',
    nome: dadosIniciais?.nome || '',
    email: dadosIniciais?.email || '',
    telefone: dadosIniciais?.telefone || '',
    tipoServico: dadosIniciais?.tipoServico || 'consultivo',
    nivelUrgencia: dadosIniciais?.nivelUrgencia || 'media',
    origem: dadosIniciais?.origem || 'manual',
    descricaoInicial: dadosIniciais?.descricaoInicial || '',
  });

  const isEdicao = !!leadId;
  const totalEtapas = 3;

  // ──────────────────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────────────────

  const handleChange = (campo: keyof LeadFormData, valor: string) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setErro(null);
  };

  const handleProximaEtapa = () => {
    if (etapa === 1 && !formData.nome) {
      setErro('nome é obrigatório');
      return;
    }
    if (etapa < totalEtapas) {
      setEtapa(prev => prev + 1);
    }
  };

  const handleEtapaAnterior = () => {
    if (etapa > 1) {
      setEtapa(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome) {
      setErro('nome é obrigatório');
      return;
    }

    startTransition(async () => {
      try {
        let resultado;

        if (isEdicao) {
          resultado = await atualizarLead(leadId, {
            tipo_cliente: formData.tipoCliente,
            nome: formData.nome,
            email: formData.email || null,
            telefone: formData.telefone || null,
            tipo_servico: formData.tipoServico,
            nivel_urgencia: formData.nivelUrgencia,
            origem: formData.origem,
            descricao_inicial: formData.descricaoInicial || null,
          }, usuarioId);
        } else {
          resultado = await criarLead({
            organizacaoId,
            tipoCliente: formData.tipoCliente,
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            tipoServico: formData.tipoServico,
            nivelUrgencia: formData.nivelUrgencia,
            origem: formData.origem,
            descricaoInicial: formData.descricaoInicial,
            criadoPor: usuarioId,
          });
        }

        if (resultado.success) {
          onSucesso?.(resultado.data);
        } else {
          setErro(resultado.error || 'erro ao salvar lead');
        }
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'erro inesperado');
      }
    });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Renderização por Etapa
  // ──────────────────────────────────────────────────────────────────────────

  const renderEtapa1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-normal text-zinc-200 mb-4">identificação</h3>
        
        {/* Tipo de Cliente */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-2">tipo de cliente</label>
          <div className="grid grid-cols-2 gap-3">
            {TIPOS_CLIENTE.map(tipo => (
              <button
                key={tipo.value}
                type="button"
                onClick={() => handleChange('tipoCliente', tipo.value)}
                className={cn(
                  'p-4 rounded-lg border transition-all text-left',
                  formData.tipoCliente === tipo.value
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                )}
              >
                <span className="text-sm">{tipo.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nome */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-2">
            {formData.tipoCliente === 'pessoa_fisica' ? 'nome completo' : 'razão social'}
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            placeholder={formData.tipoCliente === 'pessoa_fisica' ? 'João da Silva' : 'Empresa Ltda.'}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* E-mail */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-2">e-mail</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="email@exemplo.com"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">telefone</label>
          <input
            type="tel"
            value={formData.telefone || ''}
            onChange={(e) => handleChange('telefone', e.target.value)}
            placeholder="(11) 99999-9999"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );

  const renderEtapa2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-normal text-zinc-200 mb-4">classificação</h3>
        
        {/* Tipo de Serviço */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">tipo de serviço</label>
          <div className="grid grid-cols-2 gap-3">
            {TIPOS_SERVICO.map(tipo => (
              <button
                key={tipo.value}
                type="button"
                onClick={() => handleChange('tipoServico', tipo.value)}
                className={cn(
                  'p-4 rounded-lg border transition-all text-left',
                  formData.tipoServico === tipo.value
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                )}
              >
                <span className={cn(
                  'block text-sm font-medium mb-1',
                  formData.tipoServico === tipo.value ? 'text-amber-400' : 'text-zinc-300'
                )}>
                  {tipo.label}
                </span>
                <span className="text-xs text-zinc-500">{tipo.descricao}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nível de Urgência */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">urgência</label>
          <div className="flex gap-3">
            {NIVEIS_URGENCIA.map(nivel => (
              <button
                key={nivel.value}
                type="button"
                onClick={() => handleChange('nivelUrgencia', nivel.value)}
                className={cn(
                  'flex-1 p-3 rounded-lg border transition-all',
                  formData.nivelUrgencia === nivel.value
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', nivel.cor)} />
                  <span className={cn(
                    'text-sm',
                    formData.nivelUrgencia === nivel.value ? 'text-amber-400' : 'text-zinc-400'
                  )}>
                    {nivel.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Origem */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">origem</label>
          <select
            value={formData.origem}
            onChange={(e) => handleChange('origem', e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
          >
            {ORIGENS.map(origem => (
              <option key={origem.value} value={origem.value}>{origem.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderEtapa3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-normal text-zinc-200 mb-4">descrição inicial</h3>
        
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-2">
            descreva brevemente a situação do cliente
          </label>
          <textarea
            value={formData.descricaoInicial || ''}
            onChange={(e) => handleChange('descricaoInicial', e.target.value)}
            placeholder="Conte-nos sobre a demanda jurídica, fatos principais, e qualquer informação relevante..."
            rows={6}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
          />
          <p className="text-xs text-zinc-500 mt-2">
            essa informação ajudará na triagem e qualificação do lead
          </p>
        </div>

        {/* Resumo */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <h4 className="text-sm text-zinc-400 mb-3">resumo</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">cliente</span>
              <span className="text-zinc-300">{formData.nome || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">tipo</span>
              <span className="text-zinc-300">
                {TIPOS_CLIENTE.find(t => t.value === formData.tipoCliente)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">serviço</span>
              <span className="text-zinc-300">
                {TIPOS_SERVICO.find(t => t.value === formData.tipoServico)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">urgência</span>
              <span className={cn(
                'px-2 py-0.5 rounded text-xs',
                formData.nivelUrgencia === 'critica' && 'bg-red-500/20 text-red-400',
                formData.nivelUrgencia === 'alta' && 'bg-orange-500/20 text-orange-400',
                formData.nivelUrgencia === 'media' && 'bg-yellow-500/20 text-yellow-400',
                formData.nivelUrgencia === 'baixa' && 'bg-gray-500/20 text-gray-400',
              )}>
                {NIVEIS_URGENCIA.find(n => n.value === formData.nivelUrgencia)?.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Render Principal
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Indicador de Etapas */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors',
                num < etapa && 'bg-amber-500 text-zinc-900',
                num === etapa && 'bg-amber-500/20 text-amber-400 border border-amber-500',
                num > etapa && 'bg-zinc-800 text-zinc-500 border border-zinc-700'
              )}
            >
              {num < etapa ? '✓' : num}
            </div>
            {num < 3 && (
              <div
                className={cn(
                  'w-24 h-0.5 mx-2',
                  num < etapa ? 'bg-amber-500' : 'bg-zinc-700'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Conteúdo da Etapa */}
      {etapa === 1 && renderEtapa1()}
      {etapa === 2 && renderEtapa2()}
      {etapa === 3 && renderEtapa3()}

      {/* Erro */}
      {erro && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{erro}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <div>
          {etapa > 1 && (
            <button
              type="button"
              onClick={handleEtapaAnterior}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              voltar
            </button>
          )}
          {onCancelar && etapa === 1 && (
            <button
              type="button"
              onClick={onCancelar}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              cancelar
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {etapa < totalEtapas ? (
            <button
              type="button"
              onClick={handleProximaEtapa}
              className="px-6 py-2 bg-amber-500 text-zinc-900 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
            >
              próximo
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'px-6 py-2 bg-amber-500 text-zinc-900 rounded-lg text-sm font-medium transition-colors',
                isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-400'
              )}
            >
              {isPending ? 'salvando...' : isEdicao ? 'atualizar lead' : 'criar lead'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
