'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Upload, 
  Mail, 
  Filter, 
  RefreshCw,
  Sparkles,
  Clock,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchInput } from '@/components/ui/input'
import { Badge, UrgenciaBadge } from '@/components/ui/badge'
import { InboxCard, DocumentoInboxCard, InboxStats } from '@/components/fluxo/inbox-card'
import { LeadForm } from '@/components/formularios/lead-form'
import { useLeads, useDocumentos } from '@/hooks'
import type { Lead, Documento } from '@/types'

// tipos para qualificação IA (será substituído quando implementar)
type QualificacaoIA = {
  nivelRisco: 'baixo' | 'medio' | 'alto' | 'critico'
  confianca: number
}

export default function CaptacaoPage() {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'leads' | 'documentos'>('leads')
  const [showNovoLead, setShowNovoLead] = useState(false)
  const [showFiltros, setShowFiltros] = useState(false)

  // hooks de dados
  const { 
    leads, 
    loading: loadingLeads, 
    error: errorLeads,
    refetch: refetchLeads,
    criar: criarLead,
    atualizar: atualizarLead
  } = useLeads()

  const {
    documentos,
    loading: loadingDocs,
    refetch: refetchDocumentos
  } = useDocumentos({ casoId: undefined })

  // buscar dados ao montar
  useEffect(() => {
    refetchLeads()
    refetchDocumentos()
  }, [refetchLeads, refetchDocumentos])

  // filtrar leads
  const leadsFiltrados = leads.filter(lead => {
    if (filtroStatus !== 'todos' && lead.status !== filtroStatus) return false
    if (busca && !lead.nome.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  // estatísticas
  const stats = {
    novos: leads.filter(l => l.status === 'novo').length,
    emAnalise: leads.filter(l => l.status === 'em_analise').length,
    qualificados: leads.filter(l => l.status === 'qualificado').length,
    urgentes: leads.filter(l => l.nivel_urgencia === 'alta' || l.nivel_urgencia === 'critica').length,
  }

  // contar documentos por lead
  const contarDocumentosPorLead = (leadId: string) => {
    return documentos.filter(d => d.lead_id === leadId).length
  }

  // callback para criar lead
  const handleCriarLead = async (dados: Partial<Lead>) => {
    await criarLead(dados as any)
    setShowNovoLead(false)
  }

  // callback para atualizar
  const handleRefresh = async () => {
    await refetchLeads()
    await refetchDocumentos()
  }

  const loading = loadingLeads || loadingDocs

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extralight tracking-tight">captação</h1>
          <p className="text-muted-foreground text-sm mt-1">
            inbox de leads, documentos e solicitações
          </p>
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
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            upload
          </Button>
          <Button size="sm" onClick={() => setShowNovoLead(true)}>
            <Plus className="h-4 w-4 mr-2" />
            novo lead
          </Button>
        </div>
      </div>

      {/* modal de novo lead */}
      {showNovoLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-normal">novo lead</h2>
              <button
                onClick={() => setShowNovoLead(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <LeadForm
                organizacaoId="org_placeholder"
                onSucesso={handleCriarLead as any}
                onCancelar={() => setShowNovoLead(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* estatísticas */}
      <InboxStats {...stats} />

      {/* tabs e filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
          <button
            onClick={() => setAbaAtiva('leads')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              abaAtiva === 'leads' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            leads ({leads.length})
          </button>
          <button
            onClick={() => setAbaAtiva('documentos')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              abaAtiva === 'documentos' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            documentos ({documentos.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            placeholder="buscar..."
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

      {/* filtros de status */}
      {abaAtiva === 'leads' && (
        <div className="flex items-center gap-2">
          {[
            { value: 'todos', label: 'todos' },
            { value: 'novo', label: 'novos' },
            { value: 'em_analise', label: 'em análise' },
            { value: 'qualificado', label: 'qualificados' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFiltroStatus(value)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                filtroStatus === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* lista de leads ou documentos */}
      <div className="grid gap-4">
        {loading ? (
          <Card variant="outline" className="p-12">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
              <p className="text-muted-foreground text-sm">carregando...</p>
            </div>
          </Card>
        ) : abaAtiva === 'leads' ? (
          leadsFiltrados.length > 0 ? (
            leadsFiltrados.map(lead => (
              <InboxCard
                key={lead.id}
                lead={lead as any}
                onQualificar={() => {
                  window.location.href = `/qualificacao?lead=${lead.id}`
                }}
              />
            ))
          ) : (
            <Card variant="outline" className="p-12">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-normal mb-2">nenhum lead encontrado</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  não há leads correspondentes aos filtros selecionados. 
                  tente ajustar os filtros ou aguarde novos leads.
                </p>
              </div>
            </Card>
          )
        ) : (
          documentos.length > 0 ? (
            documentos.map(doc => (
              <DocumentoInboxCard
                key={doc.id}
                documento={doc as any}
                onClick={() => console.log('Ver documento:', doc.id)}
              />
            ))
          ) : (
            <Card variant="outline" className="p-12">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-normal mb-2">nenhum documento encontrado</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  não há documentos disponíveis no momento.
                </p>
              </div>
            </Card>
          )
        )}
      </div>

      {/* alerta de itens urgentes */}
      {stats.urgentes > 0 && (
        <Card variant="outline" className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-normal text-amber-500">
                  {stats.urgentes} {stats.urgentes === 1 ? 'lead urgente' : 'leads urgentes'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  existem leads com alta urgência aguardando qualificação
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                ver urgentes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
