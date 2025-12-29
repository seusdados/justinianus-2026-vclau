'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  AlertTriangle,
  Calendar,
  Filter,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Bell,
  BellRing,
  Sparkles,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/input'
import { DeadlineCard, DeadlineList, WarRoom, DeadlineCounter } from '@/components/fluxo/deadline-panel'
import { PrazoForm } from '@/components/formularios/prazo-form'
import { usePrazos, useCasos } from '@/hooks'
import type { Prazo, Caso } from '@/types'
import { formatarData, calcularDiasRestantes } from '@/lib/utils'

export default function PrazosPage() {
  const [filtro, setFiltro] = useState<'todos' | 'criticos' | 'urgentes' | 'normais'>('todos')
  const [busca, setBusca] = useState('')
  const [visualizacao, setVisualizacao] = useState<'lista' | 'calendario'>('lista')
  const [showNovoPrazo, setShowNovoPrazo] = useState(false)

  // hooks de dados
  const { 
    prazos, 
    loading: loadingPrazos, 
    refetch: refetchPrazos,
    criar,
    atualizar,
    marcarConcluido,
    ativarSalaGuerra
  } = usePrazos()
  
  const { casos, refetch: refetchCasos } = useCasos()

  // buscar dados ao montar - hooks já carregam automaticamente

  // criar mapa de casos para referência rápida
  const casosMap: Record<number, { titulo: string; numero_interno: string }> = {}
  casos.forEach((caso: any) => {
    casosMap[caso.id as number] = {
      titulo: caso.titulo,
      numero_interno: caso.numero_interno || `CASO-${caso.id}`
    }
  })

  // Separar prazos por criticidade
  const prazosAtivos = (prazos as any[]).filter(p => p.status !== 'concluido')
  
  const prazosCriticos = prazosAtivos.filter((p: any) => {
    const dias = calcularDiasRestantes(p.data_ajustada)
    return dias <= 3
  })

  const prazosUrgentes = prazosAtivos.filter((p: any) => {
    const dias = calcularDiasRestantes(p.data_ajustada)
    return dias > 3 && dias <= 7
  })

  const prazosNormais = prazosAtivos.filter((p: any) => {
    const dias = calcularDiasRestantes(p.data_ajustada)
    return dias > 7
  })

  const prazosFiltrados = prazosAtivos.filter((p: any) => {
    // Filtro de criticidade
    if (filtro === 'criticos') {
      const dias = calcularDiasRestantes(p.data_ajustada)
      if (dias > 3) return false
    } else if (filtro === 'urgentes') {
      const dias = calcularDiasRestantes(p.data_ajustada)
      if (dias <= 3 || dias > 7) return false
    } else if (filtro === 'normais') {
      const dias = calcularDiasRestantes(p.data_ajustada)
      if (dias <= 7) return false
    }
    
    // Filtro de busca
    if (busca) {
      const caso = casosMap[p.caso_id]
      const termos = [p.descricao, p.tipo_prazo, caso?.titulo, caso?.numero_interno].join(' ').toLowerCase()
      if (!termos.includes(busca.toLowerCase())) return false
    }
    
    return true
  })

  // Prazo em sala de guerra
  const prazoSalaGuerra = (prazos as any[]).find(p => p.sala_guerra_ativada)

  const handleConcluir = async (prazoId: string) => {
    await marcarConcluido(prazoId)
  }

  const handleGerarMinuta = (prazoId: string) => {
    console.log('Gerar minuta para prazo:', prazoId)
    // TODO: integrar com IA
  }

  const handleAtribuir = (prazoId: string) => {
    console.log('Atribuir prazo:', prazoId)
  }

  const handleCriarPrazo = async (dados: Partial<Prazo>) => {
    await criar(dados as any)
    setShowNovoPrazo(false)
  }

  const handleRefresh = async () => {
    await refetchPrazos()
    await refetchCasos()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extralight tracking-tight">prazos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            controle de prazos e sala de guerra
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loadingPrazos}
          >
            {loadingPrazos ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            sincronizar tribunais
          </Button>
          <Button size="sm" onClick={() => setShowNovoPrazo(true)}>
            <Plus className="h-4 w-4 mr-2" />
            novo prazo
          </Button>
        </div>
      </div>

      {/* modal de novo prazo */}
      {showNovoPrazo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-normal">novo prazo</h2>
              <button
                onClick={() => setShowNovoPrazo(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <PrazoForm
                casoId={(casos[0] as any)?.id as number || 1}
                onSucesso={handleCriarPrazo as any}
                onCancelar={() => setShowNovoPrazo(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* sala de guerra ativa */}
      {prazoSalaGuerra && casosMap[prazoSalaGuerra.caso_id] && (
        <WarRoom
          prazo={prazoSalaGuerra as any}
          onGerarMinuta={() => handleGerarMinuta(prazoSalaGuerra.id)}
          onAtribuir={(userId) => handleAtribuir(prazoSalaGuerra.id)}
        />
      )}

      {/* resumo */}
      <div className="grid grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${
            filtro === 'criticos' ? 'ring-2 ring-red-500' : ''
          } ${prazosCriticos.length > 0 ? 'border-red-500/30 bg-red-500/5' : ''}`}
          onClick={() => setFiltro(filtro === 'criticos' ? 'todos' : 'criticos')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-500">críticos (≤3 dias)</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-light text-red-500">{prazosCriticos.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            filtro === 'urgentes' ? 'ring-2 ring-amber-500' : ''
          } ${prazosUrgentes.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}`}
          onClick={() => setFiltro(filtro === 'urgentes' ? 'todos' : 'urgentes')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-500">urgentes (4-7 dias)</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-light text-amber-500">{prazosUrgentes.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            filtro === 'normais' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setFiltro(filtro === 'normais' ? 'todos' : 'normais')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">normais (&gt;7 dias)</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-light">{prazosNormais.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">total ativos</span>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-light">{prazosAtivos.length}</span>
              <span className="text-sm text-green-500">0 vencidos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* filtros e busca */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { value: 'todos', label: 'todos' },
            { value: 'criticos', label: 'críticos', count: prazosCriticos.length },
            { value: 'urgentes', label: 'urgentes', count: prazosUrgentes.length },
            { value: 'normais', label: 'normais', count: prazosNormais.length },
          ].map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setFiltro(value as typeof filtro)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-2 ${
                filtro === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {label}
              {count !== undefined && (
                <span className={`text-xs ${filtro === value ? 'opacity-80' : ''}`}>
                  ({count})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            placeholder="buscar prazo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            filtros
          </Button>
        </div>
      </div>

      {/* lista de prazos */}
      <div className="space-y-4">
        {/* prazos críticos */}
        {(filtro === 'todos' || filtro === 'criticos') && prazosCriticos.length > 0 && (
          <div>
            <h2 className="text-lg font-light text-red-500 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              prazos críticos
            </h2>
            <div className="grid gap-3">
              {prazosCriticos.map(prazo => (
                <DeadlineCard
                  key={prazo.id}
                  prazo={prazo as any}
                  onConcluir={() => handleConcluir(prazo.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* prazos urgentes */}
        {(filtro === 'todos' || filtro === 'urgentes') && prazosUrgentes.length > 0 && (
          <div>
            <h2 className="text-lg font-light text-amber-500 mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              prazos urgentes
            </h2>
            <div className="grid gap-3">
              {prazosUrgentes.map(prazo => (
                <DeadlineCard
                  key={prazo.id}
                  prazo={prazo as any}
                  onConcluir={() => handleConcluir(prazo.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* prazos normais */}
        {(filtro === 'todos' || filtro === 'normais') && prazosNormais.length > 0 && (
          <div>
            <h2 className="text-lg font-light mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              outros prazos
            </h2>
            <div className="grid gap-3">
              {prazosNormais.map(prazo => (
                <DeadlineCard
                  key={prazo.id}
                  prazo={prazo as any}
                  onConcluir={() => handleConcluir(prazo.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* estado vazio */}
        {prazosFiltrados.length === 0 && (
          <Card className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-normal mb-2">nenhum prazo encontrado</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                não há prazos correspondentes aos filtros selecionados
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* configurações de alerta */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base font-normal flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            configuração de alertas
          </CardTitle>
          <CardDescription>
            defina quando receber alertas sobre prazos próximos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {['D-10', 'D-7', 'D-5', 'D-3', 'D-1', 'D-0'].map((alerta, i) => (
              <div key={alerta} className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id={alerta}
                  defaultChecked
                  className="rounded border-border"
                />
                <label htmlFor={alerta} className="text-sm">{alerta}</label>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            você receberá notificações por e-mail e no app nos dias selecionados antes do vencimento
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
