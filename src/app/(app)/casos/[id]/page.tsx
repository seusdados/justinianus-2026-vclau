'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft,
  Inbox,
  ClipboardCheck,
  Brain,
  Zap,
  FileCheck2,
  Clock,
  AlertTriangle,
  User,
  Building2,
  Calendar,
  Scale,
  Target,
  ExternalLink,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Share2,
  Archive,
  Users,
  FileText,
  Shield,
  Bot,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  CircleDot,
  ChevronDown,
  ChevronUp,
  Plus,
  PlayCircle,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge, RiscoBadge, FaseBadge, StatusBadge } from '@/components/ui/badge'
import type { 
  Caso, 
  Cliente, 
  Prazo, 
  TarefaCaso, 
  Documento, 
  NoGrafoEvidencias,
  SugestaoIA,
  ExecucaoAgente,
  FaseCaso
} from '@/types'
import { formatarData, formatarMoeda, cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA COMPLETO
// ═══════════════════════════════════════════════════════════════════════════

const mockCliente: Cliente = {
  id: 1,
  organizacao_id: 'org-1',
  tipo_cliente: 'pessoa_fisica',
  nome: 'Maria da Silva Santos',
  cpf_cnpj: '123.456.789-00',
  email: 'maria.silva@email.com',
  telefone: '(11) 99999-8888',
  endereco: {
    logradouro: 'Rua das Flores, 123',
    bairro: 'Jardim América',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01234-567'
  },
  metadados: {},
  criado_em: new Date().toISOString(),
  atualizado_em: new Date().toISOString()
}

const mockCaso: Caso = {
  id: 1,
  organizacao_id: 'org-1',
  cliente_id: 1,
  lead_id: 'lead-1',
  titulo: 'Maria Silva Santos vs. XYZ Indústria e Comércio LTDA',
  numero_interno: 'CASO-2024-0042',
  numero_externo: '0001234-56.2024.5.02.0001',
  tipo_caso: 'contencioso',
  area_juridica: ['trabalhista', 'danos_morais'],
  status_caso: 'ativo',
  fase_atual: 'acao',
  usuario_responsavel_id: 'user-1',
  ids_usuarios_equipe: ['user-1', 'user-2'],
  portal_cliente_habilitado: true,
  valor_causa: 150000,
  tribunal: 'TRT-2',
  id_perfil_juiz: 'juiz-1',
  aberto_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  atualizado_em: new Date().toISOString(),
  cliente: mockCliente
}

const mockPrazos: Prazo[] = [
  {
    id: 'prazo-1',
    organizacao_id: 'org-1',
    caso_id: 1,
    tipo_prazo: 'contestacao',
    descricao: 'Apresentar contestação',
    origem: 'intimacao',
    data_original: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    data_ajustada: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    prioridade: 'critica',
    status: 'em_andamento',
    sala_guerra_ativada: true,
    sala_guerra_ativada_em: new Date().toISOString(),
    atribuido_a: 'user-1',
    minuta_automatica_gerada: true,
    config_alertas: { d10: true, d7: true, d5: true, d3: true, d1: true, d0: true },
    alertas_enviados: [{ tipo: 'd10', enviado_em: new Date().toISOString() }],
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    dias_restantes: 2
  },
  {
    id: 'prazo-2',
    organizacao_id: 'org-1',
    caso_id: 1,
    tipo_prazo: 'audiencia',
    descricao: 'Audiência de conciliação',
    origem: 'publicacao',
    data_original: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    data_ajustada: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    prioridade: 'alta',
    status: 'pendente',
    sala_guerra_ativada: false,
    atribuido_a: 'user-1',
    minuta_automatica_gerada: false,
    config_alertas: { d10: true, d7: true, d5: true, d3: true, d1: true, d0: true },
    alertas_enviados: [],
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    dias_restantes: 12
  }
]

const mockTarefas: TarefaCaso[] = [
  {
    id: 1,
    organizacao_id: 'org-1',
    caso_id: 1,
    prazo_id: 'prazo-1',
    titulo: 'Revisar minuta de contestação',
    descricao: 'Minuta gerada pela IA precisa de revisão final',
    status: 'em_andamento',
    prioridade: 'critica',
    data_limite: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
    atribuida_a: 'user-1',
    origem: 'automatica_prazo',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 2,
    organizacao_id: 'org-1',
    caso_id: 1,
    titulo: 'Solicitar documentos complementares ao cliente',
    descricao: 'Holerites dos últimos 6 meses',
    status: 'aberta',
    prioridade: 'media',
    data_limite: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    atribuida_a: 'user-2',
    origem: 'sugerida_por_ia',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 3,
    organizacao_id: 'org-1',
    caso_id: 1,
    titulo: 'Preparar briefing para audiência',
    status: 'aberta',
    prioridade: 'alta',
    data_limite: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    atribuida_a: 'user-1',
    origem: 'manual',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  }
]

const mockDocumentos: Documento[] = [
  {
    id: 'doc-1',
    organizacao_id: 'org-1',
    caso_id: 1,
    titulo: 'CTPS Digital',
    tipo_documento: 'prova',
    caminho_storage: '/storage/doc-1.pdf',
    nome_arquivo: 'ctps_maria.pdf',
    tamanho_arquivo: 2500000,
    tipo_mime: 'application/pdf',
    ocr_processado: true,
    visibilidade: 'interno',
    contem_dados_pessoais: true,
    dados_pessoais_anonimizados: false,
    resumo_ia: 'CTPS com registro de vínculo de 15/01/2020 a 30/11/2024',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 'doc-2',
    organizacao_id: 'org-1',
    caso_id: 1,
    titulo: 'Termo de Rescisão (TRCT)',
    tipo_documento: 'prova',
    caminho_storage: '/storage/doc-2.pdf',
    nome_arquivo: 'trct.pdf',
    tamanho_arquivo: 450000,
    tipo_mime: 'application/pdf',
    ocr_processado: true,
    visibilidade: 'cliente',
    contem_dados_pessoais: true,
    dados_pessoais_anonimizados: false,
    resumo_ia: 'TRCT indicando dispensa sem justa causa em 30/11/2024',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 'doc-3',
    organizacao_id: 'org-1',
    caso_id: 1,
    titulo: 'Holerites (jan-nov 2024)',
    tipo_documento: 'prova',
    caminho_storage: '/storage/doc-3.pdf',
    nome_arquivo: 'holerites_2024.pdf',
    tamanho_arquivo: 3200000,
    tipo_mime: 'application/pdf',
    ocr_processado: true,
    visibilidade: 'interno',
    contem_dados_pessoais: true,
    dados_pessoais_anonimizados: false,
    resumo_ia: 'Holerites demonstrando salário base de R$ 3.500,00 + HE habituais',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 'doc-4',
    organizacao_id: 'org-1',
    caso_id: 1,
    titulo: 'Contestação (minuta IA)',
    tipo_documento: 'minuta',
    caminho_storage: '/storage/doc-4.docx',
    nome_arquivo: 'contestacao_v1.docx',
    tamanho_arquivo: 85000,
    tipo_mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ocr_processado: false,
    visibilidade: 'interno',
    contem_dados_pessoais: false,
    dados_pessoais_anonimizados: false,
    resumo_ia: 'Minuta de contestação gerada automaticamente baseada nos fatos e pedidos',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  }
]

const mockNoGrafo: NoGrafoEvidencias[] = [
  { id: 'no-1', organizacao_id: 'org-1', caso_id: 1, tipo_no: 'fato', titulo: 'Vínculo empregatício de 15/01/2020 a 30/11/2024', forca: 0.95, gerado_por_ia: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'no-2', organizacao_id: 'org-1', caso_id: 1, tipo_no: 'fato', titulo: 'Horas extras habituais não pagas', forca: 0.85, gerado_por_ia: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'no-3', organizacao_id: 'org-1', caso_id: 1, tipo_no: 'fato', titulo: 'Dispensa sem justa causa', forca: 0.98, gerado_por_ia: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'no-4', organizacao_id: 'org-1', caso_id: 1, tipo_no: 'prova', titulo: 'CTPS Digital', forca: 0.95, gerado_por_ia: false, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'no-5', organizacao_id: 'org-1', caso_id: 1, tipo_no: 'prova', titulo: 'TRCT', forca: 0.98, gerado_por_ia: false, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'no-6', organizacao_id: 'org-1', caso_id: 1, tipo_no: 'pedido', titulo: 'Horas extras + reflexos', forca: 0.85, gerado_por_ia: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'no-7', organizacao_id: 'org-1', caso_id: 1, tipo_no: 'pedido', titulo: 'Multa do art. 477 CLT', forca: 0.75, gerado_por_ia: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'no-8', organizacao_id: 'org-1', caso_id: 1, tipo_no: 'base_legal', titulo: 'Art. 7º, XIII e XVI, CF', forca: 0.95, gerado_por_ia: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() },
  { id: 'no-9', organizacao_id: 'org-1', caso_id: 1, tipo_no: 'risco', titulo: 'Controles de ponto podem contradizer alegação', forca: 0.6, gerado_por_ia: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() }
]

const mockSugestoesIA: SugestaoIA[] = [
  {
    id: 'sug-1',
    organizacao_id: 'org-1',
    id_execucao_ia: 'exec-1',
    tipo_sugestao: 'acao',
    titulo: 'Solicitar controles de ponto da reclamada',
    resumo: 'Para fortalecer a tese de horas extras habituais, é recomendável solicitar os controles de ponto',
    razao: 'A ausência de controles de ponto beneficia a reclamante por inversão do ônus da prova (Súmula 338 TST)',
    confianca: 0.92,
    pontuacao_fundamentacao: 0.88,
    pontuacao_acionabilidade: 0.95,
    pontuacao_risco: 0.15,
    status: 'pendente',
    criado_em: new Date().toISOString()
  },
  {
    id: 'sug-2',
    organizacao_id: 'org-1',
    id_execucao_ia: 'exec-1',
    tipo_sugestao: 'acao',
    titulo: 'Incluir pedido de danos morais por assédio',
    resumo: 'Baseado nos relatos do cliente, há indicativos de assédio moral que poderiam fundamentar pedido adicional',
    razao: 'Depoimento da cliente menciona humilhações públicas frequentes - investigar com testemunhas',
    confianca: 0.65,
    pontuacao_fundamentacao: 0.55,
    pontuacao_acionabilidade: 0.7,
    pontuacao_risco: 0.45,
    status: 'pendente',
    criado_em: new Date().toISOString()
  }
]

const mockExecucoesIA: ExecucaoAgente[] = [
  {
    id: 'exec-1',
    organizacao_id: 'org-1',
    tipo_agente: 'extrator_entidades',
    versao_agente: '1.0.0',
    nivel_autonomia: 'A1',
    nivel_risco: 'baixo',
    tipo_gatilho: 'evento',
    tipo_entidade_gatilho: 'documento',
    id_entidade_gatilho: 'doc-1',
    pontuacao_confianca: 0.94,
    pontuacao_fundamentacao: 0.91,
    iniciado_em: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    finalizado_em: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
    duracao_ms: 45000,
    status: 'concluido',
    feedback_humano: 'aceito',
    nome_modelo: 'claude-3-sonnet',
    base_legal: 'Art. 7º, V - Execução de contrato',
    finalidade: 'Extração de entidades para qualificação do caso',
    criado_em: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'exec-2',
    organizacao_id: 'org-1',
    tipo_agente: 'gerador_minuta',
    versao_agente: '1.0.0',
    nivel_autonomia: 'A2',
    nivel_risco: 'medio',
    tipo_gatilho: 'evento',
    tipo_entidade_gatilho: 'prazo',
    id_entidade_gatilho: 'prazo-1',
    pontuacao_confianca: 0.89,
    pontuacao_fundamentacao: 0.92,
    iniciado_em: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    finalizado_em: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    duracao_ms: 180000,
    status: 'concluido',
    feedback_humano: undefined,
    nome_modelo: 'claude-3-opus',
    base_legal: 'Art. 7º, V - Execução de contrato',
    finalidade: 'Geração de minuta de contestação',
    criado_em: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  }
]

// Eventos da linha do tempo
const mockEventosTimeline = [
  { id: 'evt-1', tipo: 'documento_processado', titulo: 'CTPS processada e entidades extraídas', data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), ator_tipo: 'agente' },
  { id: 'evt-2', tipo: 'qualificacao_concluida', titulo: 'Lead qualificado e convertido em caso', data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(), ator_tipo: 'usuario' },
  { id: 'evt-3', tipo: 'caso_aberto', titulo: 'Caso aberto e atribuído a Dr. Marcelo Fattori', data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), ator_tipo: 'sistema' },
  { id: 'evt-4', tipo: 'documento_enviado', titulo: 'Holerites recebidos do cliente', data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), ator_tipo: 'usuario' },
  { id: 'evt-5', tipo: 'grafo_atualizado', titulo: 'Grafo de evidências atualizado com 9 nós', data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), ator_tipo: 'agente' },
  { id: 'evt-6', tipo: 'prazo_detectado', titulo: 'Prazo de contestação detectado: D-15', data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), ator_tipo: 'agente' },
  { id: 'evt-7', tipo: 'minuta_gerada', titulo: 'Minuta de contestação gerada automaticamente', data: new Date(Date.now() - 1000 * 60 * 60).toISOString(), ator_tipo: 'agente' },
  { id: 'evt-8', tipo: 'sala_guerra_ativada', titulo: 'Sala de guerra ativada: prazo em D-2', data: new Date().toISOString(), ator_tipo: 'sistema' }
]

// Responsáveis
const mockResponsaveis = [
  { id: 'user-1', nome: 'Dr. Marcelo Fattori', papel: 'Advogado Responsável', avatar: 'MF' },
  { id: 'user-2', nome: 'Dra. Ana Paula Silva', papel: 'Advogado Associado', avatar: 'AS' }
]

// Perfil do juiz
const mockPerfilJuiz = {
  nome: 'Dr. João Carlos Oliveira',
  vara: '5ª Vara do Trabalho de São Paulo',
  tribunal: 'TRT-2',
  taxaProcedencia: 0.67,
  tempoMedioMeses: 8.5,
  taxaAcordo: 0.72,
  tendencia: 'equilibrado' as const,
  preferencias: ['valoriza prova documental', 'aceita acordos com frequência', 'decisões objetivas']
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

const fases: { id: FaseCaso; label: string; icon: React.ComponentType<{className?: string}> }[] = [
  { id: 'captacao', label: 'captação', icon: Inbox },
  { id: 'qualificacao', label: 'qualificação', icon: ClipboardCheck },
  { id: 'analise', label: 'análise', icon: Brain },
  { id: 'acao', label: 'ação', icon: Zap },
  { id: 'registro', label: 'registro', icon: FileCheck2 }
]

function FaseProgress({ faseAtual }: { faseAtual: FaseCaso }) {
  const indexAtual = fases.findIndex(f => f.id === faseAtual)
  
  return (
    <div className="flex items-center gap-1">
      {fases.map((fase, index) => {
        const isCompleta = index < indexAtual
        const isAtual = index === indexAtual
        const Icon = fase.icon
        
        return (
          <div key={fase.id} className="flex items-center">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              isCompleta && "bg-green-500/20 text-green-400",
              isAtual && "bg-primary/20 text-primary ring-1 ring-primary/50",
              !isCompleta && !isAtual && "bg-muted/50 text-muted-foreground/50"
            )}>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{fase.label}</span>
            </div>
            {index < fases.length - 1 && (
              <ChevronRight className={cn(
                "h-4 w-4 mx-0.5",
                index < indexAtual ? "text-green-500" : "text-muted-foreground/30"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PrazoCard({ prazo }: { prazo: Prazo }) {
  const diasRestantes = prazo.dias_restantes ?? 0
  const isCritico = diasRestantes <= 3
  
  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all",
      isCritico ? "border-red-500/50 bg-red-500/5" : "border-border/50 bg-muted/30"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {prazo.sala_guerra_ativada && (
              <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                sala de guerra
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {prazo.tipo_prazo}
            </Badge>
          </div>
          <p className="text-sm font-medium truncate">{prazo.descricao}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatarData(prazo.data_ajustada, 'longa')}
          </p>
        </div>
        <div className={cn(
          "flex flex-col items-center justify-center min-w-[50px] py-1 px-2 rounded-md",
          isCritico ? "bg-red-500/20 text-red-400" : diasRestantes <= 7 ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"
        )}>
          <span className="text-lg font-bold leading-none">{diasRestantes}</span>
          <span className="text-[10px] uppercase">dias</span>
        </div>
      </div>
    </div>
  )
}

function TarefaItem({ tarefa }: { tarefa: TarefaCaso }) {
  const statusColors = {
    aberta: 'bg-blue-500/20 text-blue-400',
    em_andamento: 'bg-amber-500/20 text-amber-400',
    aguardando: 'bg-purple-500/20 text-purple-400',
    concluida: 'bg-green-500/20 text-green-400',
    cancelada: 'bg-muted text-muted-foreground'
  }
  
  const prioridadeColors = {
    baixa: 'border-l-blue-400',
    media: 'border-l-amber-400',
    alta: 'border-l-orange-500',
    critica: 'border-l-red-500'
  }
  
  return (
    <div className={cn(
      "p-3 rounded-lg border border-border/50 bg-muted/30 border-l-2",
      prioridadeColors[tarefa.prioridade]
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{tarefa.titulo}</p>
          {tarefa.descricao && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tarefa.descricao}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge className={cn("text-[10px]", statusColors[tarefa.status])}>
              {tarefa.status.replace('_', ' ')}
            </Badge>
            {tarefa.origem === 'sugerida_por_ia' && (
              <Badge variant="outline" className="text-[10px]">
                <Bot className="h-2.5 w-2.5 mr-1" />
                ia
              </Badge>
            )}
          </div>
        </div>
        {tarefa.data_limite && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatarData(tarefa.data_limite, 'relativa')}
          </span>
        )}
      </div>
    </div>
  )
}

function DocumentoItem({ documento }: { documento: Documento }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{documento.titulo}</p>
        <p className="text-xs text-muted-foreground">
          {documento.tipo_documento} • {Math.round((documento.tamanho_arquivo || 0) / 1024)} KB
        </p>
      </div>
      <div className="flex items-center gap-1">
        {documento.visibilidade === 'cliente' && (
          <Badge variant="outline" className="text-[10px]">cliente</Badge>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function SugestaoCard({ sugestao }: { sugestao: SugestaoIA }) {
  return (
    <div className="p-3 rounded-lg border border-border/50 bg-muted/30 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{sugestao.titulo}</p>
          <p className="text-xs text-muted-foreground mt-1">{sugestao.resumo}</p>
          
          <div className="mt-2 p-2 rounded-md bg-background/50 border border-border/30">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">por quê:</span> {sugestao.razao}
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">confiança</span>
              <span className="text-xs font-medium text-primary">{Math.round((sugestao.confianca || 0) * 100)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">risco</span>
              <span className={cn(
                "text-xs font-medium",
                (sugestao.pontuacao_risco || 0) < 0.3 ? "text-green-400" : (sugestao.pontuacao_risco || 0) < 0.6 ? "text-amber-400" : "text-red-400"
              )}>
                {Math.round((sugestao.pontuacao_risco || 0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
        <Button size="sm" className="flex-1 h-7 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          aceitar
        </Button>
        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          rejeitar
        </Button>
      </div>
    </div>
  )
}

function PerfilJuizCard({ perfil }: { perfil: typeof mockPerfilJuiz }) {
  return (
    <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Scale className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{perfil.nome}</p>
          <p className="text-xs text-muted-foreground">{perfil.vara}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {perfil.tendencia}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center p-2 rounded-md bg-background/50">
          <p className="text-lg font-bold text-green-400">{Math.round(perfil.taxaProcedencia * 100)}%</p>
          <p className="text-[10px] text-muted-foreground">procedência</p>
        </div>
        <div className="text-center p-2 rounded-md bg-background/50">
          <p className="text-lg font-bold text-primary">{Math.round(perfil.taxaAcordo * 100)}%</p>
          <p className="text-[10px] text-muted-foreground">acordos</p>
        </div>
        <div className="text-center p-2 rounded-md bg-background/50">
          <p className="text-lg font-bold text-amber-400">{perfil.tempoMedioMeses}m</p>
          <p className="text-[10px] text-muted-foreground">tempo médio</p>
        </div>
      </div>
      
      <div className="mt-4 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">preferências identificadas</p>
        <ul className="space-y-1">
          {perfil.preferencias.map((pref, i) => (
            <li key={i} className="text-xs flex items-start gap-2">
              <CircleDot className="h-2.5 w-2.5 mt-1 text-primary shrink-0" />
              {pref}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function TimelineEvent({ evento }: { evento: typeof mockEventosTimeline[0] }) {
  const iconColors = {
    usuario: 'bg-blue-500/20 text-blue-400',
    agente: 'bg-purple-500/20 text-purple-400',
    sistema: 'bg-green-500/20 text-green-400'
  }
  
  const Icon = evento.ator_tipo === 'usuario' ? User : evento.ator_tipo === 'agente' ? Bot : Shield
  
  return (
    <div className="flex gap-3 relative">
      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border/50" />
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10",
        iconColors[evento.ator_tipo as keyof typeof iconColors]
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm">{evento.titulo}</p>
        <p className="text-xs text-muted-foreground">
          {formatarData(evento.data, 'relativa')}
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function CasoPage() {
  const params = useParams()
  const id = params.id as string
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    cliente: true,
    prazos: true,
    tarefas: true,
    documentos: false,
    grafo: false,
    sugestoes: true,
    juiz: false,
    timeline: false
  })
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }
  
  // Dados do caso (em produção viria de hook/API)
  const caso = mockCaso
  const cliente = mockCliente
  const prazos = mockPrazos
  const tarefas = mockTarefas
  const documentos = mockDocumentos
  const nosGrafo = mockNoGrafo
  const sugestoes = mockSugestoesIA
  const perfilJuiz = mockPerfilJuiz
  const eventos = mockEventosTimeline
  
  // Métricas calculadas
  const prazosCriticos = prazos.filter(p => (p.dias_restantes ?? 0) <= 3).length
  const tarefasPendentes = tarefas.filter(t => t.status !== 'concluida' && t.status !== 'cancelada').length
  const forcaMedia = nosGrafo.reduce((acc, n) => acc + n.forca, 0) / nosGrafo.length
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link href="/casos">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-medium">{caso.titulo}</h1>
                  <StatusBadge status={caso.status_caso} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{caso.numero_interno}</span>
                  {caso.numero_externo && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {caso.numero_externo}
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{caso.tribunal}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8">
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                compartilhar
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                editar
              </Button>
              <Button size="sm" className="h-8">
                <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
                executar playbook
              </Button>
            </div>
          </div>
          
          {/* Fase Progress */}
          <FaseProgress faseAtual={caso.fase_atual || 'captacao'} />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">valor da causa</p>
                  <p className="text-xl font-bold text-primary">{formatarMoeda(caso.valor_causa || 0)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "border-border/50",
            prazosCriticos > 0 ? "bg-red-500/10 border-red-500/30" : "bg-muted/30"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">prazos críticos</p>
                  <p className={cn(
                    "text-xl font-bold",
                    prazosCriticos > 0 ? "text-red-400" : "text-green-400"
                  )}>{prazosCriticos}</p>
                </div>
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  prazosCriticos > 0 ? "bg-red-500/20" : "bg-green-500/20"
                )}>
                  <AlertTriangle className={cn(
                    "h-5 w-5",
                    prazosCriticos > 0 ? "text-red-400" : "text-green-400"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">tarefas pendentes</p>
                  <p className="text-xl font-bold text-amber-400">{tarefasPendentes}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">força do caso</p>
                  <p className="text-xl font-bold text-green-400">{Math.round(forcaMedia * 100)}%</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Layout principal */}
        <div className="grid grid-cols-12 gap-6">
          {/* Coluna esquerda - Detalhes */}
          <div className="col-span-8 space-y-4">
            {/* Prazos */}
            <Card className="bg-background/50 border-border/50">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
                onClick={() => toggleSection('prazos')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">prazos</CardTitle>
                    <Badge variant="outline" className="text-xs">{prazos.length}</Badge>
                  </div>
                  {expandedSections.prazos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
              {expandedSections.prazos && (
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="space-y-2">
                    {prazos.map(prazo => (
                      <PrazoCard key={prazo.id} prazo={prazo} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
            
            {/* Tarefas */}
            <Card className="bg-background/50 border-border/50">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
                onClick={() => toggleSection('tarefas')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">tarefas</CardTitle>
                    <Badge variant="outline" className="text-xs">{tarefasPendentes} pendentes</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                      <Plus className="h-3 w-3 mr-1" />
                      nova
                    </Button>
                    {expandedSections.tarefas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
              {expandedSections.tarefas && (
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="space-y-2">
                    {tarefas.map(tarefa => (
                      <TarefaItem key={tarefa.id} tarefa={tarefa} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
            
            {/* Sugestões IA */}
            <Card className="bg-background/50 border-border/50">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
                onClick={() => toggleSection('sugestoes')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">sugestões da ia</CardTitle>
                    <Badge className="text-xs bg-primary/20 text-primary">{sugestoes.length} novas</Badge>
                  </div>
                  {expandedSections.sugestoes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
              {expandedSections.sugestoes && (
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="space-y-3">
                    {sugestoes.map(sugestao => (
                      <SugestaoCard key={sugestao.id} sugestao={sugestao} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
            
            {/* Documentos */}
            <Card className="bg-background/50 border-border/50">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
                onClick={() => toggleSection('documentos')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">documentos</CardTitle>
                    <Badge variant="outline" className="text-xs">{documentos.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                      <Plus className="h-3 w-3 mr-1" />
                      upload
                    </Button>
                    {expandedSections.documentos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
              {expandedSections.documentos && (
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="space-y-1">
                    {documentos.map(doc => (
                      <DocumentoItem key={doc.id} documento={doc} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
            
            {/* Grafo de Evidências (preview) */}
            <Card className="bg-background/50 border-border/50">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
                onClick={() => toggleSection('grafo')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">grafo de evidências</CardTitle>
                    <Badge variant="outline" className="text-xs">{nosGrafo.length} nós</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/analise?caso=${id}`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        ver completo
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                    {expandedSections.grafo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
              {expandedSections.grafo && (
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="grid grid-cols-5 gap-2">
                    {['fato', 'prova', 'pedido', 'base_legal', 'risco'].map(tipo => {
                      const nos = nosGrafo.filter(n => n.tipo_no === tipo)
                      const cores = {
                        fato: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                        prova: 'bg-green-500/20 text-green-400 border-green-500/30',
                        pedido: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                        base_legal: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                        risco: 'bg-red-500/20 text-red-400 border-red-500/30'
                      }
                      return (
                        <div key={tipo} className={cn(
                          "p-3 rounded-lg border text-center",
                          cores[tipo as keyof typeof cores]
                        )}>
                          <p className="text-2xl font-bold">{nos.length}</p>
                          <p className="text-xs">{tipo.replace('_', ' ')}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
          
          {/* Coluna direita - Sidebar */}
          <div className="col-span-4 space-y-4">
            {/* Cliente */}
            <Card className="bg-background/50 border-border/50">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
                onClick={() => toggleSection('cliente')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">cliente</CardTitle>
                  </div>
                  {expandedSections.cliente ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
              {expandedSections.cliente && (
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{cliente.nome}</p>
                        <p className="text-xs text-muted-foreground">{cliente.cpf_cnpj}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{cliente.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{cliente.telefone}</span>
                      </div>
                      {cliente.endereco && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mt-0.5" />
                          <span>
                            {(cliente.endereco as Record<string, string>).logradouro}, {(cliente.endereco as Record<string, string>).bairro} - {(cliente.endereco as Record<string, string>).cidade}/{(cliente.endereco as Record<string, string>).uf}
                          </span>
                        </div>
                      )}
                    </div>
                    {caso.portal_cliente_habilitado && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        portal ativo
                      </Badge>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
            
            {/* Equipe */}
            <Card className="bg-background/50 border-border/50">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">equipe</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="space-y-2">
                  {mockResponsaveis.map(resp => (
                    <div key={resp.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {resp.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{resp.nome}</p>
                        <p className="text-xs text-muted-foreground">{resp.papel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Perfil do Juiz */}
            <Card className="bg-background/50 border-border/50">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
                onClick={() => toggleSection('juiz')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">perfil do juiz</CardTitle>
                  </div>
                  {expandedSections.juiz ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
              {expandedSections.juiz && (
                <CardContent className="pt-0 px-4 pb-4">
                  <PerfilJuizCard perfil={perfilJuiz} />
                </CardContent>
              )}
            </Card>
            
            {/* Timeline */}
            <Card className="bg-background/50 border-border/50">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
                onClick={() => toggleSection('timeline')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">linha do tempo</CardTitle>
                    <Badge variant="outline" className="text-xs">{eventos.length}</Badge>
                  </div>
                  {expandedSections.timeline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
              {expandedSections.timeline && (
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="space-y-0">
                    {eventos.slice().reverse().map((evento, i) => (
                      <TimelineEvent key={evento.id} evento={evento} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
