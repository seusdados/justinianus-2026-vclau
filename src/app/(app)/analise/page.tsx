'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  ArrowRight,
  FileText,
  User,
  Building2,
  Scale,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  GitBranch,
  Target,
  Shield,
  Zap,
  BookOpen,
  Users,
  Calendar,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge, RiscoBadge, FaseBadge } from '@/components/ui/badge'
import { MetroTimeline, FindingCard } from '@/components/fluxo/metro-timeline'
import { NoGrafoForm } from '@/components/formularios/no-grafo-form'
import { ArestaGrafoForm } from '@/components/formularios/aresta-grafo-form'
import { useCaso, useGrafoEvidencias, TIPOS_NO, TIPOS_RELACAO } from '@/hooks'
import type { Caso, NoGrafoEvidencias, ArestaGrafoEvidencias } from '@/types'
import { formatarData, formatarMoeda, calcularDiasRestantes } from '@/lib/utils'

// Calcular força dos pedidos com base nas relações
function calcularForcaPedido(
  pedidoId: string, 
  nos: NoGrafoEvidencias[], 
  arestas: ArestaGrafoEvidencias[]
) {
  const pedido = nos.find(n => n.id === pedidoId)
  if (!pedido) return 0
  
  const arestasSuporte = arestas.filter(a => 
    a.no_origem === pedidoId && (a.relacao === 'depende_de' || a.relacao === 'fundamentado_por')
  )
  const arestasRisco = arestas.filter(a => 
    a.no_origem === pedidoId && a.relacao === 'enfraquecido_por'
  )
  
  const suporte = arestasSuporte.reduce((acc, a) => acc + a.peso, 0) / Math.max(arestasSuporte.length, 1)
  const risco = arestasRisco.reduce((acc, a) => acc + a.peso, 0) / Math.max(arestasRisco.length, 1)
  
  return Math.max(0, Math.min(1, suporte - (risco * 0.3)))
}

function AnalisePageContent() {
  const searchParams = useSearchParams()
  const casoIdParam = searchParams.get('caso')
  const casoId = casoIdParam ? parseInt(casoIdParam) : 1
  
  const [abaSelecionada, setAbaSelecionada] = useState<'metro' | 'grafo' | 'matriz'>('metro')
  const [noSelecionado, setNoSelecionado] = useState<string | null>(null)
  const [showNovoNo, setShowNovoNo] = useState(false)
  const [showNovaAresta, setShowNovaAresta] = useState(false)
  const [tipoNovoNo, setTipoNovoNo] = useState<'fato' | 'prova' | 'pedido' | 'base_legal' | 'risco'>('fato')
  
  // Hooks de dados
  const { caso, loading: loadingCaso, refetch: refetchCaso } = useCaso(casoId)
  const casoDados = caso as any
  const { 
    grafo, 
    loading: loadingGrafo, 
    refetch: refetchGrafo,
    criarNo,
    atualizarNo,
    deletarNo,
    criarAresta,
    deletarAresta
  } = useGrafoEvidencias(casoId)
  
  const nos = grafo.nos as unknown as NoGrafoEvidencias[]
  const arestas = grafo.arestas as unknown as ArestaGrafoEvidencias[]
  
  const fatos = nos.filter(n => n.tipo_no === 'fato')
  const provas = nos.filter(n => n.tipo_no === 'prova')
  const pedidos = nos.filter(n => n.tipo_no === 'pedido')
  const basesLegais = nos.filter(n => n.tipo_no === 'base_legal')
  const riscos = nos.filter(n => n.tipo_no === 'risco')

  // Calcular probabilidade geral de êxito
  const probabilidadeExito = pedidos.length > 0 
    ? pedidos.reduce((acc, p) => acc + calcularForcaPedido(p.id, nos, arestas), 0) / pedidos.length
    : 0

  const handleCriarNo = async (dados: Partial<NoGrafoEvidencias>) => {
    await criarNo(dados as any)
    setShowNovoNo(false)
  }

  const handleCriarAresta = async (dados: Partial<ArestaGrafoEvidencias>) => {
    await criarAresta(dados as any)
    setShowNovaAresta(false)
  }

  const handleRefresh = async () => {
    await refetchCaso()
    await refetchGrafo()
  }

  // Loading state
  if (loadingCaso || loadingGrafo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">carregando análise...</p>
      </div>
    )
  }

  // Empty state
  if (!caso) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-light">caso não encontrado</h2>
        <p className="text-muted-foreground text-center max-w-md">
          o caso solicitado não foi encontrado ou você não tem permissão para acessá-lo
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/casos'}>
          ver todos os casos
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            voltar
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{casoDados.numero_interno || `CASO-${casoDados.id}`}</Badge>
            <FaseBadge fase="analise" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loadingCaso || loadingGrafo}
          >
            {loadingCaso || loadingGrafo ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            reprocessar ia
          </Button>
          <Button size="sm" onClick={() => window.location.href = '/acao'}>
            <ArrowRight className="h-4 w-4 mr-2" />
            avançar para ação
          </Button>
        </div>
      </div>

      {/* modal de novo nó */}
      {showNovoNo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-normal">adicionar {tipoNovoNo}</h2>
              <button
                onClick={() => setShowNovoNo(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <NoGrafoForm
                casoId={casoId}
                tipoInicial={tipoNovoNo}
                documentos={[]}
                onSucesso={handleCriarNo as any}
                onCancelar={() => setShowNovoNo(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* modal de nova aresta */}
      {showNovaAresta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-normal">adicionar relação</h2>
              <button
                onClick={() => setShowNovaAresta(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <ArestaGrafoForm
                casoId={casoId}
                nos={nos as any}
                onSucesso={handleCriarAresta as any}
                onCancelar={() => setShowNovaAresta(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* título do caso */}
      <div>
        <h1 className="text-2xl font-extralight tracking-tight">{casoDados.titulo}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Scale className="h-4 w-4" />
            {casoDados.tipo_caso}
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            {casoDados.tribunal || 'não informado'}
          </span>
          <span className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            {formatarMoeda(casoDados.valor_causa || 0)}
          </span>
        </div>
      </div>

      {/* cards de resumo */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">probabilidade de êxito</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-light">{Math.round(probabilidadeExito * 100)}%</span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${probabilidadeExito * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">fatos mapeados</span>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-light">{fatos.length}</span>
              <span className="text-sm text-green-500">
                {fatos.filter(f => f.forca >= 0.7).length} fortes
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">provas</span>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-light">{provas.length}</span>
              <span className="text-sm text-muted-foreground">vinculadas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">pedidos</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-light">{pedidos.length}</span>
              <span className="text-sm text-muted-foreground">estruturados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-500">riscos</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-light text-amber-500">{riscos.length}</span>
              <span className="text-sm text-amber-500/70">identificados</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* tabs de visualização */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setAbaSelecionada('metro')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'metro' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          metrô jurídico
        </button>
        <button
          onClick={() => setAbaSelecionada('grafo')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'grafo' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="h-4 w-4" />
          grafo de evidências
        </button>
        <button
          onClick={() => setAbaSelecionada('matriz')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'matriz' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scale className="h-4 w-4" />
          matriz de viabilidade
        </button>
      </div>

      {/* conteúdo das abas */}
      {abaSelecionada === 'metro' && (
        <MetroTimeline
          caso={caso as any}
          achados={nos as any}
        />
      )}

      {abaSelecionada === 'grafo' && (
        <div className="grid grid-cols-12 gap-6">
          {/* lista de nós por tipo */}
          <div className="col-span-8">
            <div className="grid grid-cols-2 gap-4">
              {/* fatos e provas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-normal flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    fatos ({fatos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fatos.map(no => (
                    <FindingCard
                      key={no.id}
                      achado={no as any}
                      compact
                      onClick={() => setNoSelecionado(no.id)}
                      
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-normal flex items-center gap-2">
                    <Shield className="h-4 w-4 text-cyan-500" />
                    provas ({provas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {provas.map(no => (
                    <FindingCard
                      key={no.id}
                      achado={no as any}
                      compact
                      onClick={() => setNoSelecionado(no.id)}
                      
                    />
                  ))}
                </CardContent>
              </Card>

              {/* pedidos e base legal */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-normal flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    pedidos ({pedidos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pedidos.map(no => (
                    <FindingCard
                      key={no.id}
                      achado={no as any}
                      compact
                      onClick={() => setNoSelecionado(no.id)}
                      
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-normal flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-violet-500" />
                    base legal ({basesLegais.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {basesLegais.map(no => (
                    <FindingCard
                      key={no.id}
                      achado={no as any}
                      compact
                      onClick={() => setNoSelecionado(no.id)}
                      
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* riscos */}
            <Card className="mt-4 border-amber-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  riscos e fraquezas ({riscos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {riscos.map(no => (
                  <FindingCard
                    key={no.id}
                    achado={no as any}
                    compact
                    onClick={() => setNoSelecionado(no.id)}
                    
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* detalhes do nó selecionado */}
          <div className="col-span-4">
            {noSelecionado ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg font-normal">
                    {nos.find(n => n.id === noSelecionado)?.titulo}
                  </CardTitle>
                  <CardDescription>
                    {nos.find(n => n.id === noSelecionado)?.tipo_no}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">
                    {nos.find(n => n.id === noSelecionado)?.conteudo}
                  </p>
                  
                  {/* força */}
                  <div>
                    <span className="text-sm text-muted-foreground">força</span>
                    <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(nos.find(n => n.id === noSelecionado)?.forca || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((nos.find(n => n.id === noSelecionado)?.forca || 0) * 100)}%
                    </span>
                  </div>

                  {/* relações */}
                  <div>
                    <span className="text-sm text-muted-foreground">relações</span>
                    <div className="mt-2 space-y-1">
                      {arestas
                        .filter(a => a.no_origem === noSelecionado || a.no_destino === noSelecionado)
                        .map(aresta => {
                          const outroNoId = aresta.no_origem === noSelecionado ? aresta.no_destino : aresta.no_origem
                          const outroNo = nos.find(n => n.id === outroNoId)
                          return (
                            <div 
                              key={aresta.id}
                              className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30 cursor-pointer hover:bg-muted/50"
                              onClick={() => setNoSelecionado(outroNoId)}
                            >
                              <Badge variant="outline" className="text-xs">
                                {aresta.relacao.replace('_', ' ')}
                              </Badge>
                              <span className="truncate">{outroNo?.titulo}</span>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>

                  {/* indicador de IA */}
                  {nos.find(n => n.id === noSelecionado)?.gerado_por_ia && (
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>gerado por ia</span>
                        <span className="ml-auto">
                          {Math.round((nos.find(n => n.id === noSelecionado)?.confianca_ia || 0) * 100)}% confiança
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    vincular
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card className="sticky top-6">
                <CardContent className="p-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-normal mb-2">selecione um nó</h3>
                  <p className="text-sm text-muted-foreground">
                    clique em um fato, prova, pedido ou risco para ver detalhes e relações
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {abaSelecionada === 'matriz' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-normal">matriz de viabilidade dos pedidos</CardTitle>
            <CardDescription>
              análise cruzada de força probatória, fundamentação legal e riscos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-normal text-muted-foreground">pedido</th>
                    <th className="text-center py-3 px-4 font-normal text-muted-foreground">suporte fático</th>
                    <th className="text-center py-3 px-4 font-normal text-muted-foreground">base legal</th>
                    <th className="text-center py-3 px-4 font-normal text-muted-foreground">riscos</th>
                    <th className="text-center py-3 px-4 font-normal text-muted-foreground">viabilidade</th>
                    <th className="text-right py-3 px-4 font-normal text-muted-foreground">valor estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(pedido => {
                    const forcaPedido = calcularForcaPedido(pedido.id, nos, arestas)
                    const arestasSuporte = arestas.filter(a => 
                      a.no_origem === pedido.id && a.relacao === 'depende_de'
                    )
                    const arestasBase = arestas.filter(a => 
                      a.no_origem === pedido.id && a.relacao === 'fundamentado_por'
                    )
                    const arestasRisco = arestas.filter(a => 
                      a.no_origem === pedido.id && a.relacao === 'enfraquecido_por'
                    )
                    
                    return (
                      <tr key={pedido.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-amber-500" />
                            {pedido.titulo}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {arestasSuporte.map(a => {
                              const fato = nos.find(n => n.id === a.no_destino)
                              return (
                                <div 
                                  key={a.id}
                                  className="h-3 w-3 rounded-full bg-blue-500"
                                  style={{ opacity: a.peso }}
                                  title={fato?.titulo}
                                />
                              )
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {arestasBase.map(a => {
                              const base = nos.find(n => n.id === a.no_destino)
                              return (
                                <div 
                                  key={a.id}
                                  className="h-3 w-3 rounded-full bg-violet-500"
                                  style={{ opacity: a.peso }}
                                  title={base?.titulo}
                                />
                              )
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {arestasRisco.length > 0 ? (
                              arestasRisco.map(a => {
                                const risco = nos.find(n => n.id === a.no_destino)
                                return (
                                  <div 
                                    key={a.id}
                                    className="h-3 w-3 rounded-full bg-red-500"
                                    style={{ opacity: a.peso }}
                                    title={risco?.titulo}
                                  />
                                )
                              })
                            ) : (
                              <span className="text-green-500 text-xs">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <div 
                              className={`px-2 py-1 rounded-full text-xs ${
                                forcaPedido >= 0.7 ? 'bg-green-500/20 text-green-500' :
                                forcaPedido >= 0.5 ? 'bg-amber-500/20 text-amber-500' :
                                'bg-red-500/20 text-red-500'
                              }`}
                            >
                              {forcaPedido >= 0.7 ? 'alta' : forcaPedido >= 0.5 ? 'média' : 'baixa'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {pedido.id === 'pedido-1' ? 'R$ 85.000 - 95.000' :
                           pedido.id === 'pedido-2' ? 'R$ 30.000 - 50.000' :
                           'R$ 15.000 - 25.000'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td colSpan={5} className="py-3 px-4 font-normal">
                      valor total estimado da causa
                    </td>
                    <td className="py-3 px-4 text-right font-normal">
                      R$ 130.000 - 170.000
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ações rápidas */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setTipoNovoNo('fato'); setShowNovoNo(true); }}
          >
            <Plus className="h-4 w-4 mr-2" />
            adicionar fato
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setTipoNovoNo('prova'); setShowNovoNo(true); }}
          >
            <Plus className="h-4 w-4 mr-2" />
            adicionar prova
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setTipoNovoNo('pedido'); setShowNovoNo(true); }}
          >
            <Plus className="h-4 w-4 mr-2" />
            adicionar pedido
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowNovaAresta(true)}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            vincular nós
          </Button>
        </div>
        
        <Button size="sm" onClick={() => window.location.href = '/acao'}>
          avançar para ação
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

export default function AnalisePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <AnalisePageContent />
    </Suspense>
  )
}
