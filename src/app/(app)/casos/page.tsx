'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Search,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  Scale,
  Building2,
  User,
  Clock,
  Calendar,
  Target,
  CheckCircle2,
  Pause,
  Loader2,
  RefreshCw,
  X,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge, FaseBadge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/input'
import { CasoForm } from '@/components/formularios/caso-form'
import { useCasos, useCasosCounters } from '@/hooks'
import type { Caso } from '@/types'
import { formatarData, formatarMoeda } from '@/lib/utils'

// Mapa de responsáveis (em produção virá do banco)
const responsaveisMap: Record<string, string> = {
  'user-1': 'Dr. Marcelo Fattori',
  'user-2': 'Dra. Ana Paula Silva',
  'user-3': 'Dr. Carlos Eduardo',
}

export default function CasosPage() {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'antigos' | 'valor'>('recentes')
  const [showNovoCaso, setShowNovoCaso] = useState(false)

  // Hooks de dados
  const { 
    casos, 
    loading, 
    criar,
    refetch
  } = useCasos()
  
  const { counters } = useCasosCounters()

  // Filtrar e ordenar casos
  const casosFiltrados = useMemo(() => {
    return casos.filter((caso: any) => {
      if (filtroStatus !== 'todos' && caso.status_caso !== filtroStatus) return false
      if (filtroTipo !== 'todos' && caso.tipo_caso !== filtroTipo) return false
      if (busca) {
        const termos = [caso.titulo, caso.numero_interno, caso.numero_externo].join(' ').toLowerCase()
        if (!termos.includes(busca.toLowerCase())) return false
      }
      return true
    }).sort((a: any, b: any) => {
      if (ordenacao === 'recentes') return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      if (ordenacao === 'antigos') return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
      if (ordenacao === 'valor') return (b.valor_causa || 0) - (a.valor_causa || 0)
      return 0
    })
  }, [casos, filtroStatus, filtroTipo, busca, ordenacao])

  // Estatísticas
  const stats = useMemo(() => ({
    ativos: counters?.ativo || casos.filter((c: any) => c.status_caso === 'ativo').length,
    suspensos: counters?.suspenso || casos.filter((c: any) => c.status_caso === 'suspenso').length,
    encerrados: counters?.encerrado || casos.filter((c: any) => c.status_caso === 'encerrado').length,
    valorTotal: counters?.valorTotal || casos.reduce((acc, c: any) => acc + (c.valor_causa || 0), 0),
  }), [casos, counters])

  // Handlers
  const handleCriarCaso = async (dados: Partial<Caso>) => {
    await criar(dados as any)
    setShowNovoCaso(false)
    await refetch()
  }

  const handleRefresh = useCallback(async () => {
    await refetch()
  }, [refetch])

  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'contencioso': return <Scale className="h-4 w-4" />
      case 'consultivo': return <Target className="h-4 w-4" />
      case 'administrativo': return <Building2 className="h-4 w-4" />
      case 'consensual': return <User className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getCorStatus = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-500/20 text-green-500'
      case 'suspenso': return 'bg-amber-500/20 text-amber-500'
      case 'encerrado': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light">casos</h1>
          <p className="text-muted-foreground">gerencie todos os casos do escritório</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            atualizar
          </Button>
          <Button size="sm" onClick={() => setShowNovoCaso(true)}>
            <Plus className="h-4 w-4 mr-2" />
            novo caso
          </Button>
        </div>
      </div>

      {/* modal novo caso */}
      {showNovoCaso && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-normal">novo caso</h2>
              <button
                onClick={() => setShowNovoCaso(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <CasoForm
                organizacaoId="org_temp"
                onSucesso={handleCriarCaso as any}
                onCancelar={() => setShowNovoCaso(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* loading state */}
      {loading && casos.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">carregando casos...</p>
        </div>
      )}

      {/* content */}
      {(!loading || casos.length > 0) && (
        <>
          {/* stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card 
              className={`cursor-pointer hover:bg-muted/30 transition-colors ${filtroStatus === 'ativo' ? 'ring-2 ring-primary' : ''}`} 
              onClick={() => setFiltroStatus(filtroStatus === 'ativo' ? 'todos' : 'ativo')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ativos</span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-light">{stats.ativos}</span>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer hover:bg-muted/30 transition-colors ${filtroStatus === 'suspenso' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFiltroStatus(filtroStatus === 'suspenso' ? 'todos' : 'suspenso')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">suspensos</span>
                  <Pause className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-light">{stats.suspensos}</span>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer hover:bg-muted/30 transition-colors ${filtroStatus === 'encerrado' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFiltroStatus(filtroStatus === 'encerrado' ? 'todos' : 'encerrado')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">encerrados</span>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-light">{stats.encerrados}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">valor total em casos</span>
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-light">{formatarMoeda(stats.valorTotal)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* filtros */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* filtro de status */}
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                {[
                  { value: 'todos', label: 'todos' },
                  { value: 'ativo', label: 'ativos' },
                  { value: 'suspenso', label: 'suspensos' },
                  { value: 'encerrado', label: 'encerrados' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFiltroStatus(value)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      filtroStatus === value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* filtro de tipo */}
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                {[
                  { value: 'todos', label: 'todos' },
                  { value: 'contencioso', label: 'contencioso' },
                  { value: 'consultivo', label: 'consultivo' },
                  { value: 'administrativo', label: 'administrativo' },
                  { value: 'consensual', label: 'consensual' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFiltroTipo(value)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      filtroTipo === value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <SearchInput
                placeholder="buscar caso..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" size="sm" onClick={() => {
                setOrdenacao(o => o === 'recentes' ? 'antigos' : o === 'antigos' ? 'valor' : 'recentes')
              }}>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {ordenacao === 'recentes' ? 'mais recentes' : ordenacao === 'antigos' ? 'mais antigos' : 'maior valor'}
              </Button>
            </div>
          </div>

          {/* lista de casos */}
          <div className="space-y-3">
            {casosFiltrados.length > 0 ? (
              casosFiltrados.map((caso: any) => (
                <Card 
                  key={caso.id} 
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/analise?caso=${caso.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* ícone do tipo */}
                        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          {getIconeTipo(caso.tipo_caso)}
                        </div>

                        {/* info principal */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-normal">{caso.titulo}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {caso.numero_interno}
                            </Badge>
                            {caso.numero_externo && (
                              <Badge variant="outline" className="text-xs">
                                {caso.numero_externo}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {responsaveisMap[caso.usuario_responsavel_id || ''] || 'Não atribuído'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatarData(caso.aberto_em, 'curta')}
                            </span>
                            {caso.tribunal && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {caso.tribunal}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* info direita */}
                      <div className="flex items-center gap-4">
                        {/* fase */}
                        {caso.fase_atual && (
                          <FaseBadge fase={caso.fase_atual} />
                        )}

                        {/* valor */}
                        {caso.valor_causa && caso.valor_causa > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {formatarMoeda(caso.valor_causa)}
                          </span>
                        )}

                        {/* status */}
                        <span className={`px-2 py-1 rounded-full text-xs ${getCorStatus(caso.status_caso)}`}>
                          {caso.status_caso}
                        </span>

                        {/* ações */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: menu de ações
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* tags de área jurídica */}
                    {caso.area_juridica && caso.area_juridica.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                        {caso.area_juridica.map((area: string) => (
                          <Badge key={area} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {caso.portal_cliente_habilitado && (
                          <Badge className="text-xs bg-primary/20 text-primary">
                            portal ativo
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-12">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Scale className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-normal mb-2">
                    {casos.length === 0 ? 'nenhum caso cadastrado' : 'nenhum caso encontrado'}
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    {casos.length === 0 
                      ? 'clique em "novo caso" para começar'
                      : 'não há casos correspondentes aos filtros selecionados'
                    }
                  </p>
                  {casos.length === 0 && (
                    <Button 
                      className="mt-4" 
                      size="sm"
                      onClick={() => setShowNovoCaso(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      criar primeiro caso
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
