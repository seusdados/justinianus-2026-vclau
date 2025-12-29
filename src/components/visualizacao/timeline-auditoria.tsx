'use client'

import { useState, useMemo } from 'react'
import { 
  Clock,
  User,
  Bot,
  Shield,
  FileText,
  Folder,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface EventoAuditoria {
  id: string
  organizacao_id: string
  tipo_ator: 'usuario' | 'agente' | 'sistema'
  id_usuario_ator?: string
  nome_usuario_ator?: string
  tipo_agente_ator?: string
  evento: string
  categoria_evento: CategoriaEvento
  tipo_entidade?: string
  id_entidade?: string
  nome_entidade?: string
  dados_antes?: Record<string, unknown>
  dados_depois?: Record<string, unknown>
  dados_diff?: Record<string, { antes: unknown; depois: unknown }>
  id_execucao_ia?: string
  id_acao?: string
  endereco_ip?: string
  criado_em: string
}

export type CategoriaEvento = 
  | 'autenticacao'
  | 'lead'
  | 'caso'
  | 'documento'
  | 'prazo'
  | 'tarefa'
  | 'ia'
  | 'oportunidade'
  | 'configuracao'
  | 'seguranca'

interface TimelineAuditoriaProps {
  eventos: EventoAuditoria[]
  titulo?: string
  mostrarFiltros?: boolean
  mostrarExportar?: boolean
  onRefresh?: () => void
  onExportar?: (formato: 'json' | 'csv') => void
  carregando?: boolean
  compacto?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORIAS_CONFIG: Record<CategoriaEvento, {
  label: string
  cor: string
  corBg: string
  icone: React.ElementType
}> = {
  autenticacao: {
    label: 'Autenticação',
    cor: 'text-purple-400',
    corBg: 'bg-purple-500/20',
    icone: LogIn
  },
  lead: {
    label: 'Lead',
    cor: 'text-blue-400',
    corBg: 'bg-blue-500/20',
    icone: User
  },
  caso: {
    label: 'Caso',
    cor: 'text-amber-400',
    corBg: 'bg-amber-500/20',
    icone: Folder
  },
  documento: {
    label: 'Documento',
    cor: 'text-emerald-400',
    corBg: 'bg-emerald-500/20',
    icone: FileText
  },
  prazo: {
    label: 'Prazo',
    cor: 'text-red-400',
    corBg: 'bg-red-500/20',
    icone: Calendar
  },
  tarefa: {
    label: 'Tarefa',
    cor: 'text-cyan-400',
    corBg: 'bg-cyan-500/20',
    icone: CheckCircle
  },
  ia: {
    label: 'IA',
    cor: 'text-pink-400',
    corBg: 'bg-pink-500/20',
    icone: Sparkles
  },
  oportunidade: {
    label: 'Oportunidade',
    cor: 'text-yellow-400',
    corBg: 'bg-yellow-500/20',
    icone: AlertTriangle
  },
  configuracao: {
    label: 'Configuração',
    cor: 'text-slate-400',
    corBg: 'bg-slate-500/20',
    icone: Settings
  },
  seguranca: {
    label: 'Segurança',
    cor: 'text-orange-400',
    corBg: 'bg-orange-500/20',
    icone: Shield
  }
}

const ACOES_ICONES: Record<string, React.ElementType> = {
  criar: CheckCircle,
  atualizar: Edit,
  excluir: Trash2,
  visualizar: Eye,
  login: LogIn,
  logout: LogOut,
  erro: XCircle,
  alerta: AlertTriangle
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatarDataHora(dataISO: string): { data: string; hora: string; relativo: string } {
  const data = new Date(dataISO)
  const agora = new Date()
  const diff = agora.getTime() - data.getTime()
  
  const minutos = Math.floor(diff / 60000)
  const horas = Math.floor(diff / 3600000)
  const dias = Math.floor(diff / 86400000)
  
  let relativo: string
  if (minutos < 1) relativo = 'agora'
  else if (minutos < 60) relativo = `há ${minutos}min`
  else if (horas < 24) relativo = `há ${horas}h`
  else if (dias < 7) relativo = `há ${dias}d`
  else relativo = data.toLocaleDateString('pt-BR')
  
  return {
    data: data.toLocaleDateString('pt-BR'),
    hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    relativo
  }
}

function agruparPorData(eventos: EventoAuditoria[]): Record<string, EventoAuditoria[]> {
  return eventos.reduce((acc, evento) => {
    const data = new Date(evento.criado_em).toLocaleDateString('pt-BR')
    if (!acc[data]) acc[data] = []
    acc[data].push(evento)
    return acc
  }, {} as Record<string, EventoAuditoria[]>)
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export function TimelineAuditoria({
  eventos,
  titulo = 'trilha de auditoria',
  mostrarFiltros = true,
  mostrarExportar = true,
  onRefresh,
  onExportar,
  carregando = false,
  compacto = false
}: TimelineAuditoriaProps) {
  // Estado
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaEvento | 'todas'>('todas')
  const [filtroAtor, setFiltroAtor] = useState<'todos' | 'usuario' | 'agente' | 'sistema'>('todos')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [mostrarFiltrosPanel, setMostrarFiltrosPanel] = useState(false)
  
  // Filtrar eventos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter(evento => {
      if (filtroCategoria !== 'todas' && evento.categoria_evento !== filtroCategoria) return false
      if (filtroAtor !== 'todos' && evento.tipo_ator !== filtroAtor) return false
      return true
    })
  }, [eventos, filtroCategoria, filtroAtor])
  
  // Agrupar por data
  const eventosAgrupados = useMemo(() => {
    return agruparPorData(eventosFiltrados)
  }, [eventosFiltrados])
  
  // Toggle expansão
  const toggleExpansao = (id: string) => {
    setExpandidos(prev => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }
  
  // Renderizar ícone do ator
  const renderIconeAtor = (evento: EventoAuditoria) => {
    if (evento.tipo_ator === 'agente') {
      return <Bot className="w-4 h-4 text-pink-400" />
    } else if (evento.tipo_ator === 'sistema') {
      return <Settings className="w-4 h-4 text-slate-400" />
    }
    return <User className="w-4 h-4 text-blue-400" />
  }
  
  // Renderizar evento
  const renderEvento = (evento: EventoAuditoria) => {
    const categoriaConfig = CATEGORIAS_CONFIG[evento.categoria_evento] || CATEGORIAS_CONFIG.configuracao
    const CategoriaIcone = categoriaConfig.icone
    const { hora, relativo } = formatarDataHora(evento.criado_em)
    const expandido = expandidos.has(evento.id)
    
    // Determinar ícone da ação
    const acaoBase = evento.evento.split('_')[0]
    const AcaoIcone = ACOES_ICONES[acaoBase] || CheckCircle
    
    return (
      <div
        key={evento.id}
        className={`
          relative pl-6 pb-6 last:pb-0
          before:absolute before:left-[7px] before:top-6 before:bottom-0 before:w-px
          before:bg-slate-700 last:before:hidden
        `}
      >
        {/* Marcador */}
        <div className={`
          absolute left-0 top-1 w-4 h-4 rounded-full flex items-center justify-center
          ${categoriaConfig.corBg} ring-2 ring-slate-900
        `}>
          <div className={`w-2 h-2 rounded-full ${categoriaConfig.cor.replace('text-', 'bg-')}`} />
        </div>
        
        {/* Conteúdo */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
          {/* Header */}
          <button
            onClick={() => toggleExpansao(evento.id)}
            className="w-full flex items-start justify-between p-3 hover:bg-slate-700/30 transition-colors text-left"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${categoriaConfig.corBg}`}>
                <CategoriaIcone className={`w-4 h-4 ${categoriaConfig.cor}`} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-200">{evento.evento.replace(/_/g, ' ')}</span>
                  {evento.id_execucao_ia && (
                    <span title="Gerado por IA"><Sparkles className="w-3 h-3 text-pink-400" /></span>
                  )}
                </div>
                
                {evento.nome_entidade && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {evento.tipo_entidade}: {evento.nome_entidade}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-1">
                  {renderIconeAtor(evento)}
                  <span className="text-xs text-slate-500">
                    {evento.tipo_ator === 'agente' 
                      ? evento.tipo_agente_ator || 'Agente IA'
                      : evento.tipo_ator === 'sistema'
                        ? 'Sistema'
                        : evento.nome_usuario_ator || 'Usuário'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-slate-400">{hora}</p>
                <p className="text-xs text-slate-500">{relativo}</p>
              </div>
              {expandido ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </div>
          </button>
          
          {/* Detalhes expandidos */}
          {expandido && (
            <div className="border-t border-slate-700 p-3 space-y-3">
              {/* Diff de dados */}
              {evento.dados_diff && Object.keys(evento.dados_diff).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-medium">Alterações:</p>
                  <div className="space-y-1">
                    {Object.entries(evento.dados_diff).map(([campo, { antes, depois }]) => (
                      <div key={campo} className="flex items-start gap-2 text-xs">
                        <span className="text-slate-500 w-24 flex-shrink-0">{campo}:</span>
                        <div className="flex-1">
                          {antes !== undefined && (
                            <span className="text-red-400 line-through mr-2">
                              {JSON.stringify(antes)}
                            </span>
                          )}
                          <span className="text-emerald-400">
                            {JSON.stringify(depois)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Metadados */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {evento.endereco_ip && (
                  <div>
                    <span className="text-slate-500">IP:</span>
                    <span className="text-slate-300 ml-1">{evento.endereco_ip}</span>
                  </div>
                )}
                {evento.id_entidade && (
                  <div>
                    <span className="text-slate-500">ID:</span>
                    <span className="text-slate-300 ml-1 font-mono">{evento.id_entidade}</span>
                  </div>
                )}
                {evento.id_execucao_ia && (
                  <div>
                    <span className="text-slate-500">Execução IA:</span>
                    <span className="text-slate-300 ml-1 font-mono">{evento.id_execucao_ia.substring(0, 8)}...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-normal text-slate-100">{titulo}</h3>
            <p className="text-xs text-slate-500">
              {eventosFiltrados.length} eventos
              {filtroCategoria !== 'todas' && ` em ${CATEGORIAS_CONFIG[filtroCategoria]?.label}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {mostrarFiltros && (
            <button
              onClick={() => setMostrarFiltrosPanel(!mostrarFiltrosPanel)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                ${mostrarFiltrosPanel 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              filtros
            </button>
          )}
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={carregando}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {mostrarExportar && onExportar && (
            <div className="relative group">
              <button className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-300 transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => onExportar('json')}
                  className="block w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 text-left"
                >
                  Exportar JSON
                </button>
                <button
                  onClick={() => onExportar('csv')}
                  className="block w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 text-left"
                >
                  Exportar CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Painel de filtros */}
      {mostrarFiltrosPanel && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
          {/* Filtro por categoria */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Categoria:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroCategoria('todas')}
                className={`
                  px-3 py-1 rounded-full text-xs transition-colors
                  ${filtroCategoria === 'todas'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
                  }
                `}
              >
                Todas
              </button>
              {(Object.keys(CATEGORIAS_CONFIG) as CategoriaEvento[]).map(cat => {
                const config = CATEGORIAS_CONFIG[cat]
                return (
                  <button
                    key={cat}
                    onClick={() => setFiltroCategoria(cat)}
                    className={`
                      flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors
                      ${filtroCategoria === cat
                        ? `${config.corBg} ${config.cor} border border-current`
                        : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
                      }
                    `}
                  >
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Filtro por ator */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Tipo de ator:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'todos', label: 'Todos', icone: null },
                { value: 'usuario', label: 'Usuário', icone: User },
                { value: 'agente', label: 'Agente IA', icone: Bot },
                { value: 'sistema', label: 'Sistema', icone: Settings }
              ].map(({ value, label, icone: Icone }) => (
                <button
                  key={value}
                  onClick={() => setFiltroAtor(value as typeof filtroAtor)}
                  className={`
                    flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors
                    ${filtroAtor === value
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                      : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
                    }
                  `}
                >
                  {Icone && <Icone className="w-3 h-3" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(eventosAgrupados).map(([data, eventosData]) => (
          <div key={data}>
            {/* Separador de data */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-xs text-slate-500 font-medium">{data}</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>
            
            {/* Eventos do dia */}
            <div className="space-y-0">
              {eventosData.map(evento => renderEvento(evento))}
            </div>
          </div>
        ))}
        
        {eventosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum evento encontrado</p>
            <p className="text-sm text-slate-500">
              {filtroCategoria !== 'todas' || filtroAtor !== 'todos'
                ? 'Tente ajustar os filtros'
                : 'Os eventos de auditoria aparecerão aqui'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TimelineAuditoria
