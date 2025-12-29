'use client'

import { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  Clock, 
  User, 
  AlertCircle,
  X,
  ArrowRight,
  Loader2,
  Calendar,
  Flag,
  Link as LinkIcon,
  Sparkles,
  FileText,
  Target
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface Tarefa {
  id?: number
  organizacao_id?: string
  caso_id: number
  prazo_id?: string
  titulo: string
  descricao?: string
  status: StatusTarefa
  prioridade: PrioridadeTarefa
  data_limite?: string
  atribuida_a?: string
  origem?: OrigemTarefa
  id_passo_playbook?: string
  id_execucao_ia?: string
  criado_por?: string
  criado_em?: string
  atualizado_em?: string
}

export type StatusTarefa = 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada'
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta' | 'critica'
export type OrigemTarefa = 'manual' | 'playbook' | 'sugerida_por_ia' | 'automatica_prazo'

interface Usuario {
  id: string
  nome: string
  email?: string
  papel?: string
}

interface Prazo {
  id: string
  tipo_prazo: string
  descricao: string
  data_ajustada: string
  prioridade: string
  status: string
}

interface TarefaFormProps {
  casoId: number
  tarefa?: Tarefa
  usuarios?: Usuario[]
  prazos?: Prazo[]
  onSucesso?: (tarefa: Tarefa) => void
  onCancelar?: () => void
  modo?: 'criar' | 'editar' | 'completo'
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_TAREFA: Record<StatusTarefa, { label: string; cor: string; icone: React.ElementType }> = {
  aberta: { label: 'Aberta', cor: 'bg-slate-500', icone: CheckSquare },
  em_andamento: { label: 'Em Andamento', cor: 'bg-blue-500', icone: ArrowRight },
  aguardando: { label: 'Aguardando', cor: 'bg-amber-500', icone: Clock },
  concluida: { label: 'Concluída', cor: 'bg-emerald-500', icone: CheckSquare },
  cancelada: { label: 'Cancelada', cor: 'bg-red-500', icone: X }
}

const PRIORIDADES: Record<PrioridadeTarefa, { label: string; cor: string; corBg: string }> = {
  baixa: { label: 'Baixa', cor: 'text-slate-400', corBg: 'bg-slate-500/20 border-slate-500/30' },
  media: { label: 'Média', cor: 'text-blue-400', corBg: 'bg-blue-500/20 border-blue-500/30' },
  alta: { label: 'Alta', cor: 'text-amber-400', corBg: 'bg-amber-500/20 border-amber-500/30' },
  critica: { label: 'Crítica', cor: 'text-red-400', corBg: 'bg-red-500/20 border-red-500/30' }
}

const ORIGENS: Record<OrigemTarefa, { label: string; icone: React.ElementType }> = {
  manual: { label: 'Manual', icone: User },
  playbook: { label: 'Playbook', icone: FileText },
  sugerida_por_ia: { label: 'Sugerida por IA', icone: Sparkles },
  automatica_prazo: { label: 'Automática (Prazo)', icone: Clock }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export function TarefaForm({
  casoId,
  tarefa,
  usuarios = [],
  prazos = [],
  onSucesso,
  onCancelar,
  modo = 'criar'
}: TarefaFormProps) {
  // Estado do formulário
  const [formData, setFormData] = useState<Partial<Tarefa>>({
    caso_id: casoId,
    titulo: '',
    descricao: '',
    status: 'aberta',
    prioridade: 'media',
    data_limite: '',
    atribuida_a: '',
    prazo_id: '',
    origem: 'manual'
  })
  
  const [erros, setErros] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [mostrarVinculoPrazo, setMostrarVinculoPrazo] = useState(false)
  
  const ehEdicao = modo === 'editar' || !!tarefa?.id
  
  // Carregar dados da tarefa se em modo edição
  useEffect(() => {
    if (tarefa) {
      setFormData({
        ...tarefa,
        data_limite: tarefa.data_limite 
          ? new Date(tarefa.data_limite).toISOString().split('T')[0] 
          : ''
      })
      if (tarefa.prazo_id) {
        setMostrarVinculoPrazo(true)
      }
    }
  }, [tarefa])
  
  // Handlers
  const handleChange = (campo: keyof Tarefa, valor: unknown) => {
    setFormData(prev => ({ ...prev, [campo]: valor }))
    if (erros[campo]) {
      setErros(prev => {
        const novos = { ...prev }
        delete novos[campo]
        return novos
      })
    }
  }
  
  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {}
    
    if (!formData.titulo?.trim()) {
      novosErros.titulo = 'Título é obrigatório'
    } else if (formData.titulo.length < 3) {
      novosErros.titulo = 'Título deve ter pelo menos 3 caracteres'
    }
    
    if (formData.data_limite) {
      const dataLimite = new Date(formData.data_limite)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      if (dataLimite < hoje && !ehEdicao) {
        novosErros.data_limite = 'Data limite não pode ser no passado'
      }
    }
    
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validarFormulario()) return
    
    setEnviando(true)
    
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const tarefaSalva: Tarefa = {
        id: tarefa?.id || Math.floor(Math.random() * 10000),
        organizacao_id: tarefa?.organizacao_id || 'org-123',
        caso_id: casoId,
        titulo: formData.titulo!,
        descricao: formData.descricao,
        status: formData.status as StatusTarefa,
        prioridade: formData.prioridade as PrioridadeTarefa,
        data_limite: formData.data_limite || undefined,
        atribuida_a: formData.atribuida_a || undefined,
        prazo_id: formData.prazo_id || undefined,
        origem: formData.origem as OrigemTarefa,
        criado_por: tarefa?.criado_por || 'user-123',
        criado_em: tarefa?.criado_em || new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }
      
      onSucesso?.(tarefaSalva)
    } catch (erro) {
      console.error('Erro ao salvar tarefa:', erro)
      setErros({ geral: 'Erro ao salvar tarefa. Tente novamente.' })
    } finally {
      setEnviando(false)
    }
  }
  
  // Vincular prazo automaticamente herda prioridade e data
  const handleVincularPrazo = (prazoId: string) => {
    handleChange('prazo_id', prazoId)
    
    const prazo = prazos.find(p => p.id === prazoId)
    if (prazo) {
      // Herdar prioridade do prazo
      if (prazo.prioridade && PRIORIDADES[prazo.prioridade as PrioridadeTarefa]) {
        handleChange('prioridade', prazo.prioridade)
      }
      
      // Herdar data do prazo (1 dia antes)
      if (prazo.data_ajustada) {
        const dataPrazo = new Date(prazo.data_ajustada)
        dataPrazo.setDate(dataPrazo.getDate() - 1)
        handleChange('data_limite', dataPrazo.toISOString().split('T')[0])
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Erro geral */}
      {erros.geral && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{erros.geral}</p>
        </div>
      )}
      
      {/* Título */}
      <div className="space-y-2">
        <label className="block text-sm font-normal text-slate-300">
          título da tarefa *
        </label>
        <input
          type="text"
          value={formData.titulo || ''}
          onChange={e => handleChange('titulo', e.target.value)}
          placeholder="Ex: Revisar contestação antes do protocolo"
          className={`
            w-full px-4 py-3 bg-slate-900 border rounded-lg
            text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
            transition-colors
            ${erros.titulo ? 'border-red-500' : 'border-slate-700'}
          `}
        />
        {erros.titulo && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {erros.titulo}
          </p>
        )}
      </div>
      
      {/* Descrição */}
      <div className="space-y-2">
        <label className="block text-sm font-normal text-slate-300">
          descrição
        </label>
        <textarea
          value={formData.descricao || ''}
          onChange={e => handleChange('descricao', e.target.value)}
          placeholder="Detalhes sobre o que precisa ser feito..."
          rows={3}
          className="
            w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg
            text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
            resize-none transition-colors
          "
        />
      </div>
      
      {/* Grid: Status + Prioridade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status */}
        {(ehEdicao || modo === 'completo') && (
          <div className="space-y-2">
            <label className="block text-sm font-normal text-slate-300">
              status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STATUS_TAREFA) as StatusTarefa[]).map(status => {
                const config = STATUS_TAREFA[status]
                const IconeStatus = config.icone
                const selecionado = formData.status === status
                
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleChange('status', status)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
                      transition-all
                      ${selecionado
                        ? `${config.cor} border-transparent text-white`
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                      }
                    `}
                  >
                    <IconeStatus className="w-4 h-4" />
                    <span>{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Prioridade */}
        <div className="space-y-2">
          <label className="block text-sm font-normal text-slate-300">
            prioridade
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PRIORIDADES) as PrioridadeTarefa[]).map(prioridade => {
              const config = PRIORIDADES[prioridade]
              const selecionado = formData.prioridade === prioridade
              
              return (
                <button
                  key={prioridade}
                  type="button"
                  onClick={() => handleChange('prioridade', prioridade)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
                    transition-all
                    ${selecionado
                      ? `${config.corBg} ${config.cor}`
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }
                  `}
                >
                  <Flag className="w-4 h-4" />
                  <span>{config.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Grid: Data Limite + Responsável */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data Limite */}
        <div className="space-y-2">
          <label className="block text-sm font-normal text-slate-300">
            data limite
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="date"
              value={formData.data_limite || ''}
              onChange={e => handleChange('data_limite', e.target.value)}
              className={`
                w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-lg
                text-slate-100
                focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
                transition-colors
                ${erros.data_limite ? 'border-red-500' : 'border-slate-700'}
              `}
            />
          </div>
          {erros.data_limite && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {erros.data_limite}
            </p>
          )}
        </div>
        
        {/* Responsável */}
        <div className="space-y-2">
          <label className="block text-sm font-normal text-slate-300">
            responsável
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <select
              value={formData.atribuida_a || ''}
              onChange={e => handleChange('atribuida_a', e.target.value)}
              className="
                w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg
                text-slate-100 appearance-none
                focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
                transition-colors
              "
            >
              <option value="">Selecione...</option>
              {usuarios.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome} {usuario.papel ? `(${usuario.papel})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Vínculo com Prazo */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setMostrarVinculoPrazo(!mostrarVinculoPrazo)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          <span>{mostrarVinculoPrazo ? 'ocultar vínculo com prazo' : 'vincular a um prazo'}</span>
        </button>
        
        {mostrarVinculoPrazo && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <p className="text-xs text-slate-400">
              Vincular a um prazo herda automaticamente prioridade e data limite
            </p>
            
            {prazos.length > 0 ? (
              <div className="space-y-2">
                {prazos
                  .filter(p => p.status !== 'concluido')
                  .map(prazo => {
                    const selecionado = formData.prazo_id === prazo.id
                    const prioridadeConfig = PRIORIDADES[prazo.prioridade as PrioridadeTarefa] || PRIORIDADES.media
                    
                    return (
                      <button
                        key={prazo.id}
                        type="button"
                        onClick={() => handleVincularPrazo(prazo.id)}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-lg border
                          transition-all text-left
                          ${selecionado
                            ? 'bg-amber-500/10 border-amber-500/50'
                            : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Target className={`w-4 h-4 ${selecionado ? 'text-amber-400' : 'text-slate-500'}`} />
                          <div>
                            <p className={`text-sm ${selecionado ? 'text-amber-300' : 'text-slate-300'}`}>
                              {prazo.tipo_prazo}
                            </p>
                            <p className="text-xs text-slate-500">{prazo.descricao}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${prioridadeConfig.corBg} ${prioridadeConfig.cor}`}>
                            {new Date(prazo.data_ajustada).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </button>
                    )
                  })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Nenhum prazo pendente neste caso
              </p>
            )}
            
            {formData.prazo_id && (
              <button
                type="button"
                onClick={() => handleChange('prazo_id', '')}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                × remover vínculo
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Origem (apenas visualização em modo edição) */}
      {ehEdicao && formData.origem && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {(() => {
            const config = ORIGENS[formData.origem as OrigemTarefa]
            const Icone = config?.icone || User
            return (
              <>
                <Icone className="w-4 h-4" />
                <span>Origem: {config?.label || formData.origem}</span>
              </>
            )
          })()}
        </div>
      )}
      
      {/* Ações */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="
            px-4 py-2 text-slate-400 hover:text-slate-300
            transition-colors disabled:opacity-50
          "
        >
          cancelar
        </button>
        
        <button
          type="submit"
          disabled={enviando}
          className="
            flex items-center gap-2 px-6 py-2 bg-amber-500 text-slate-900
            rounded-lg font-medium hover:bg-amber-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {enviando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>salvando...</span>
            </>
          ) : (
            <>
              <CheckSquare className="w-4 h-4" />
              <span>{ehEdicao ? 'atualizar tarefa' : 'criar tarefa'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default TarefaForm
