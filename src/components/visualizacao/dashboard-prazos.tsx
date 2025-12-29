'use client'

import { useState, useMemo } from 'react'
import { 
  Calendar,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Target,
  User,
  FileText,
  Bell,
  Filter,
  BarChart3,
  Zap
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface Prazo {
  id: string
  organizacao_id: string
  caso_id: number
  caso_titulo?: string
  tipo_prazo: string
  descricao: string
  origem: 'publicacao' | 'intimacao' | 'contrato' | 'manual' | 'detectado_por_ia'
  data_original: string
  data_ajustada: string
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'pendente' | 'em_andamento' | 'minuta_pronta' | 'concluido' | 'perdido'
  sala_guerra_ativada: boolean
  atribuido_a?: string
  nome_responsavel?: string
  minuta_automatica_gerada: boolean
  concluido_em?: string
}

interface DashboardPrazosProps {
  prazos: Prazo[]
  onPrazoClick?: (prazo: Prazo) => void
  onAtivarSalaGuerra?: (prazoId: string) => void
  onMarcarConcluido?: (prazoId: string) => void
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const PRIORIDADES_CONFIG = {
  baixa: { 
    label: 'Baixa', 
    cor: 'text-slate-400', 
    corBg: 'bg-slate-500/20 border-slate-500/30',
    corPonto: 'bg-slate-400'
  },
  media: { 
    label: 'Média', 
    cor: 'text-blue-400', 
    corBg: 'bg-blue-500/20 border-blue-500/30',
    corPonto: 'bg-blue-400'
  },
  alta: { 
    label: 'Alta', 
    cor: 'text-amber-400', 
    corBg: 'bg-amber-500/20 border-amber-500/30',
    corPonto: 'bg-amber-400'
  },
  critica: { 
    label: 'Crítica', 
    cor: 'text-red-400', 
    corBg: 'bg-red-500/20 border-red-500/30',
    corPonto: 'bg-red-400'
  }
}

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', cor: 'text-slate-400', icone: Clock },
  em_andamento: { label: 'Em Andamento', cor: 'text-blue-400', icone: Target },
  minuta_pronta: { label: 'Minuta Pronta', cor: 'text-purple-400', icone: FileText },
  concluido: { label: 'Concluído', cor: 'text-emerald-400', icone: CheckCircle },
  perdido: { label: 'Perdido', cor: 'text-red-400', icone: XCircle }
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function calcularDiasRestantes(dataAjustada: string): number {
  const data = new Date(dataAjustada)
  data.setHours(0, 0, 0, 0)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function obterDiasDoMes(ano: number, mes: number): Date[] {
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)
  
  const dias: Date[] = []
  
  // Dias do mês anterior para completar a semana
  const diaSemanaInicio = primeiroDia.getDay()
  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    dias.push(new Date(ano, mes, -i))
  }
  
  // Dias do mês atual
  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    dias.push(new Date(ano, mes, dia))
  }
  
  // Dias do próximo mês para completar a semana
  const diasRestantes = 42 - dias.length // 6 semanas
  for (let i = 1; i <= diasRestantes; i++) {
    dias.push(new Date(ano, mes + 1, i))
  }
  
  return dias
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export function DashboardPrazos({
  prazos,
  onPrazoClick,
  onAtivarSalaGuerra,
  onMarcarConcluido
}: DashboardPrazosProps) {
  // Estado
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date()
    return { ano: hoje.getFullYear(), mes: hoje.getMonth() }
  })
  const [filtroStatus, setFiltroStatus] = useState<string>('ativos')
  const [visualizacao, setVisualizacao] = useState<'calendario' | 'lista'>('calendario')
  
  // Filtrar prazos
  const prazosFiltrados = useMemo(() => {
    return prazos.filter(prazo => {
      if (filtroStatus === 'ativos') {
        return prazo.status !== 'concluido' && prazo.status !== 'perdido'
      }
      if (filtroStatus === 'concluidos') {
        return prazo.status === 'concluido'
      }
      return true
    })
  }, [prazos, filtroStatus])
  
  // Prazos críticos (próximos 3 dias)
  const prazosCriticos = useMemo(() => {
    return prazosFiltrados
      .filter(p => {
        const dias = calcularDiasRestantes(p.data_ajustada)
        return dias >= 0 && dias <= 3 && p.status !== 'concluido'
      })
      .sort((a, b) => new Date(a.data_ajustada).getTime() - new Date(b.data_ajustada).getTime())
  }, [prazosFiltrados])
  
  // Prazos por data para o calendário
  const prazosPorData = useMemo(() => {
    const mapa: Record<string, Prazo[]> = {}
    prazosFiltrados.forEach(prazo => {
      const dataKey = prazo.data_ajustada.split('T')[0]
      if (!mapa[dataKey]) mapa[dataKey] = []
      mapa[dataKey].push(prazo)
    })
    return mapa
  }, [prazosFiltrados])
  
  // Dias do mês atual
  const diasMes = useMemo(() => {
    return obterDiasDoMes(mesAtual.ano, mesAtual.mes)
  }, [mesAtual])
  
  // Estatísticas
  const estatisticas = useMemo(() => {
    const ativos = prazos.filter(p => p.status !== 'concluido' && p.status !== 'perdido')
    const criticos = ativos.filter(p => calcularDiasRestantes(p.data_ajustada) <= 3)
    const salaGuerra = ativos.filter(p => p.sala_guerra_ativada)
    const concluidos = prazos.filter(p => p.status === 'concluido')
    
    return {
      total: ativos.length,
      criticos: criticos.length,
      salaGuerra: salaGuerra.length,
      concluidos: concluidos.length
    }
  }, [prazos])
  
  // Navegar meses
  const navegarMes = (direcao: number) => {
    setMesAtual(prev => {
      let novoMes = prev.mes + direcao
      let novoAno = prev.ano
      
      if (novoMes > 11) {
        novoMes = 0
        novoAno++
      } else if (novoMes < 0) {
        novoMes = 11
        novoAno--
      }
      
      return { ano: novoAno, mes: novoMes }
    })
  }
  
  // Renderizar card de prazo crítico
  const renderPrazoCritico = (prazo: Prazo) => {
    const diasRestantes = calcularDiasRestantes(prazo.data_ajustada)
    const prioridadeConfig = PRIORIDADES_CONFIG[prazo.prioridade]
    
    return (
      <div
        key={prazo.id}
        onClick={() => onPrazoClick?.(prazo)}
        className={`
          p-4 rounded-lg border cursor-pointer transition-all
          ${prazo.sala_guerra_ativada 
            ? 'bg-red-500/10 border-red-500/50 animate-pulse'
            : `${prioridadeConfig.corBg}`
          }
          hover:scale-[1.02]
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {prazo.sala_guerra_ativada && (
              <Flame className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${prioridadeConfig.corBg} ${prioridadeConfig.cor}`}>
              {prioridadeConfig.label}
            </span>
          </div>
          <span className={`
            text-lg font-bold
            ${diasRestantes === 0 ? 'text-red-400' : 
              diasRestantes === 1 ? 'text-amber-400' : 'text-slate-300'}
          `}>
            {diasRestantes === 0 ? 'HOJE' : 
             diasRestantes === 1 ? 'Amanhã' : 
             `${diasRestantes} dias`}
          </span>
        </div>
        
        <h4 className="text-sm font-medium text-slate-200 mb-1">{prazo.tipo_prazo}</h4>
        <p className="text-xs text-slate-400 line-clamp-2 mb-2">{prazo.descricao}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {prazo.nome_responsavel && (
              <>
                <User className="w-3 h-3" />
                <span>{prazo.nome_responsavel}</span>
              </>
            )}
          </div>
          
          {!prazo.sala_guerra_ativada && diasRestantes <= 3 && onAtivarSalaGuerra && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAtivarSalaGuerra(prazo.id)
              }}
              className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
            >
              <Flame className="w-3 h-3" />
              Sala de Guerra
            </button>
          )}
        </div>
      </div>
    )
  }
  
  // Renderizar dia do calendário
  const renderDiaCalendario = (dia: Date, index: number) => {
    const dataKey = dia.toISOString().split('T')[0]
    const prazosNoDia = prazosPorData[dataKey] || []
    const ehMesAtual = dia.getMonth() === mesAtual.mes
    const ehHoje = dia.toDateString() === new Date().toDateString()
    
    return (
      <div
        key={index}
        className={`
          min-h-[100px] p-1 border-r border-b border-slate-700
          ${ehMesAtual ? 'bg-slate-800/30' : 'bg-slate-900/50'}
          ${ehHoje ? 'ring-2 ring-amber-500/50 ring-inset' : ''}
        `}
      >
        <div className={`
          text-xs mb-1 px-1
          ${ehHoje ? 'text-amber-400 font-bold' : 
            ehMesAtual ? 'text-slate-300' : 'text-slate-600'}
        `}>
          {dia.getDate()}
        </div>
        
        <div className="space-y-1">
          {prazosNoDia.slice(0, 3).map(prazo => {
            const prioridadeConfig = PRIORIDADES_CONFIG[prazo.prioridade]
            return (
              <button
                key={prazo.id}
                onClick={() => onPrazoClick?.(prazo)}
                className={`
                  w-full text-left px-1 py-0.5 rounded text-xs truncate
                  ${prioridadeConfig.corBg} ${prioridadeConfig.cor}
                  hover:opacity-80 transition-opacity
                  ${prazo.sala_guerra_ativada ? 'animate-pulse' : ''}
                `}
              >
                {prazo.tipo_prazo}
              </button>
            )
          })}
          {prazosNoDia.length > 3 && (
            <span className="text-xs text-slate-500 px-1">
              +{prazosNoDia.length - 3} mais
            </span>
          )}
        </div>
      </div>
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Clock className="w-4 h-4" />
            <span>Prazos Ativos</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{estatisticas.total}</p>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>Críticos (≤3d)</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{estatisticas.criticos}</p>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
            <Flame className="w-4 h-4" />
            <span>Sala de Guerra</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{estatisticas.salaGuerra}</p>
        </div>
        
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            <span>Concluídos</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{estatisticas.concluidos}</p>
        </div>
      </div>
      
      {/* Prazos Críticos */}
      {prazosCriticos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-normal text-slate-100">prazos críticos</h3>
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
              {prazosCriticos.length}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prazosCriticos.map(renderPrazoCritico)}
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisualizacao('calendario')}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${visualizacao === 'calendario'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }
            `}
          >
            <Calendar className="w-4 h-4" />
            calendário
          </button>
          <button
            onClick={() => setVisualizacao('lista')}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${visualizacao === 'lista'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }
            `}
          >
            <BarChart3 className="w-4 h-4" />
            lista
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="ativos">Ativos</option>
            <option value="concluidos">Concluídos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>
      
      {/* Calendário */}
      {visualizacao === 'calendario' && (
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
          {/* Header do calendário */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <button
              onClick={() => navegarMes(-1)}
              className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-normal text-slate-100">
              {MESES[mesAtual.mes]} {mesAtual.ano}
            </h3>
            
            <button
              onClick={() => navegarMes(1)}
              className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b border-slate-700">
            {DIAS_SEMANA.map(dia => (
              <div key={dia} className="p-2 text-center text-xs text-slate-500 font-medium">
                {dia}
              </div>
            ))}
          </div>
          
          {/* Grid de dias */}
          <div className="grid grid-cols-7">
            {diasMes.map((dia, index) => renderDiaCalendario(dia, index))}
          </div>
        </div>
      )}
      
      {/* Lista */}
      {visualizacao === 'lista' && (
        <div className="space-y-2">
          {prazosFiltrados
            .sort((a, b) => new Date(a.data_ajustada).getTime() - new Date(b.data_ajustada).getTime())
            .map(prazo => {
              const diasRestantes = calcularDiasRestantes(prazo.data_ajustada)
              const prioridadeConfig = PRIORIDADES_CONFIG[prazo.prioridade]
              const statusConfig = STATUS_CONFIG[prazo.status]
              const StatusIcone = statusConfig.icone
              
              return (
                <div
                  key={prazo.id}
                  onClick={() => onPrazoClick?.(prazo)}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border cursor-pointer
                    transition-all hover:scale-[1.01]
                    ${prazo.sala_guerra_ativada 
                      ? 'bg-red-500/10 border-red-500/50'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${prioridadeConfig.corBg}`}>
                      <Calendar className={`w-5 h-5 ${prioridadeConfig.cor}`} />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-slate-200">{prazo.tipo_prazo}</h4>
                        {prazo.sala_guerra_ativada && (
                          <Flame className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{prazo.caso_titulo || `Caso #${prazo.caso_id}`}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-300">
                        {new Date(prazo.data_ajustada).toLocaleDateString('pt-BR')}
                      </p>
                      <p className={`
                        text-xs
                        ${diasRestantes <= 0 ? 'text-red-400' :
                          diasRestantes <= 3 ? 'text-amber-400' : 'text-slate-500'}
                      `}>
                        {diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias atrás` :
                         diasRestantes === 0 ? 'Hoje' :
                         diasRestantes === 1 ? 'Amanhã' :
                         `${diasRestantes} dias`}
                      </p>
                    </div>
                    
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${statusConfig.cor}`}>
                      <StatusIcone className="w-3 h-3" />
                      {statusConfig.label}
                    </div>
                  </div>
                </div>
              )
            })}
          
          {prazosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nenhum prazo encontrado</p>
            </div>
          )}
        </div>
      )}
      
      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
        {(Object.entries(PRIORIDADES_CONFIG) as [string, typeof PRIORIDADES_CONFIG.baixa][]).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.corPonto}`} />
            <span>{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPrazos
