"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, RiscoBadge } from "@/components/ui/badge";
import type { Caso, NoGrafoEvidencias, TipoServico } from "@/types";
import {
  FileText,
  Users,
  Scale,
  Gavel,
  FileCheck,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Target,
  BookOpen,
} from "lucide-react";

// Estações do metrô por tipo de caso
const ESTACOES_POR_TIPO: Record<TipoServico, Array<{
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  descricao: string;
}>> = {
  contencioso: [
    { id: "fatos", label: "fatos", icon: FileText, descricao: "levantamento dos fatos relevantes" },
    { id: "partes", label: "partes", icon: Users, descricao: "identificação das partes envolvidas" },
    { id: "pedidos", label: "pedidos", icon: Target, descricao: "definição dos pedidos" },
    { id: "provas", label: "provas", icon: FileCheck, descricao: "mapeamento de provas" },
    { id: "base_legal", label: "base legal", icon: BookOpen, descricao: "fundamentação jurídica" },
    { id: "riscos", label: "riscos", icon: AlertTriangle, descricao: "análise de riscos" },
    { id: "estrategia", label: "estratégia", icon: Scale, descricao: "definição da estratégia" },
  ],
  consultivo: [
    { id: "consulta", label: "consulta", icon: FileText, descricao: "entendimento da consulta" },
    { id: "pesquisa", label: "pesquisa", icon: BookOpen, descricao: "pesquisa doutrinária e jurisprudencial" },
    { id: "analise", label: "análise", icon: Scale, descricao: "análise jurídica" },
    { id: "riscos", label: "riscos", icon: AlertTriangle, descricao: "mapeamento de riscos" },
    { id: "recomendacao", label: "recomendação", icon: Target, descricao: "recomendações finais" },
  ],
  administrativo: [
    { id: "fatos", label: "fatos", icon: FileText, descricao: "levantamento dos fatos" },
    { id: "partes", label: "partes", icon: Users, descricao: "identificação de partes e órgão" },
    { id: "documentos", label: "documentos", icon: FileCheck, descricao: "documentação necessária" },
    { id: "base_legal", label: "base legal", icon: BookOpen, descricao: "fundamentação legal" },
    { id: "prazos", label: "prazos", icon: Clock, descricao: "prazos administrativos" },
    { id: "estrategia", label: "estratégia", icon: Scale, descricao: "estratégia de atuação" },
  ],
  consensual: [
    { id: "contexto", label: "contexto", icon: FileText, descricao: "contexto da negociação" },
    { id: "partes", label: "partes", icon: Users, descricao: "partes envolvidas" },
    { id: "interesses", label: "interesses", icon: Target, descricao: "interesses em jogo" },
    { id: "limites", label: "limites", icon: Shield, descricao: "limites de negociação" },
    { id: "proposta", label: "proposta", icon: Scale, descricao: "proposta inicial" },
    { id: "acordo", label: "acordo", icon: Gavel, descricao: "termos do acordo" },
  ],
};

// Estação do metrô individual
interface EstacaoMetroProps {
  estacao: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    descricao: string;
  };
  status: "completo" | "em_andamento" | "pendente";
  achados?: NoGrafoEvidencias[];
  isLast?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

function EstacaoMetro({
  estacao,
  status,
  achados = [],
  isLast = false,
  isExpanded = false,
  onToggle,
}: EstacaoMetroProps) {
  const Icon = estacao.icon;

  const statusConfig = {
    completo: {
      bg: "bg-green-500",
      border: "border-green-500",
      text: "text-green-500",
      line: "bg-green-500",
    },
    em_andamento: {
      bg: "bg-amber-500",
      border: "border-amber-500",
      text: "text-amber-500",
      line: "bg-amber-500",
    },
    pendente: {
      bg: "bg-muted",
      border: "border-muted",
      text: "text-muted-foreground",
      line: "bg-border",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="relative">
      {/* Linha conectora */}
      {!isLast && (
        <div
          className={cn(
            "absolute left-5 top-10 w-0.5 h-full -translate-x-1/2",
            config.line
          )}
        />
      )}

      <div className="flex items-start gap-4">
        {/* Círculo da estação */}
        <div
          className={cn(
            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
            config.border,
            status === "completo" || status === "em_andamento" ? config.bg : "bg-background"
          )}
        >
          {status === "completo" ? (
            <CheckCircle2 className="h-5 w-5 text-white" />
          ) : (
            <Icon
              className={cn(
                "h-5 w-5",
                status === "em_andamento" ? "text-white" : config.text
              )}
            />
          )}
        </div>

        {/* Conteúdo da estação */}
        <div className="flex-1 pb-8">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 w-full text-left group"
          >
            <div className="flex-1">
              <h4 className={cn("font-medium lowercase", config.text)}>
                {estacao.label}
              </h4>
              <p className="text-xs text-muted-foreground">{estacao.descricao}</p>
            </div>

            {achados.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" size="sm">
                  {achados.length} achado{achados.length > 1 ? "s" : ""}
                </Badge>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </button>

          {/* Lista de achados expandida */}
          {isExpanded && achados.length > 0 && (
            <div className="mt-3 space-y-2 animate-in">
              {achados.map((achado) => (
                <FindingCard key={achado.id} achado={achado} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente principal do Metrô Jurídico
interface MetroTimelineProps {
  caso: Caso;
  achados?: NoGrafoEvidencias[];
  className?: string;
}

export function MetroTimeline({ caso, achados = [], className }: MetroTimelineProps) {
  const [expandedEstacoes, setExpandedEstacoes] = React.useState<string[]>([]);

  const estacoes = ESTACOES_POR_TIPO[caso.tipo_caso] || ESTACOES_POR_TIPO.contencioso;

  // Agrupa achados por estação
  const achadosPorEstacao = React.useMemo(() => {
    const mapa: Record<string, NoGrafoEvidencias[]> = {};
    
    estacoes.forEach((e) => {
      mapa[e.id] = [];
    });

    achados.forEach((achado) => {
      // Mapeia tipo do nó para estação
      const estacaoMap: Record<string, string> = {
        fato: "fatos",
        prova: "provas",
        alegacao: "pedidos",
        pedido: "pedidos",
        base_legal: "base_legal",
        risco: "riscos",
      };

      const estacaoId = estacaoMap[achado.tipo_no];
      if (estacaoId && mapa[estacaoId]) {
        mapa[estacaoId].push(achado);
      }
    });

    return mapa;
  }, [achados, estacoes]);

  // Determina status de cada estação
  const getStatusEstacao = (estacaoId: string): "completo" | "em_andamento" | "pendente" => {
    const achadosEstacao = achadosPorEstacao[estacaoId] || [];
    if (achadosEstacao.length === 0) return "pendente";
    
    // Se todos os achados têm força > 0.7, considera completo
    const todosFortes = achadosEstacao.every((a) => a.forca >= 0.7);
    if (todosFortes) return "completo";
    
    return "em_andamento";
  };

  const toggleEstacao = (id: string) => {
    setExpandedEstacoes((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <CardTitle>metrô jurídico</CardTitle>
          <Badge variant="outline" size="sm">
            {caso.tipo_caso}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {estacoes.map((estacao, index) => (
            <EstacaoMetro
              key={estacao.id}
              estacao={estacao}
              status={getStatusEstacao(estacao.id)}
              achados={achadosPorEstacao[estacao.id]}
              isLast={index === estacoes.length - 1}
              isExpanded={expandedEstacoes.includes(estacao.id)}
              onToggle={() => toggleEstacao(estacao.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Achado (Finding)
interface FindingCardProps {
  achado: NoGrafoEvidencias;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FindingCard({ achado, compact = false, onClick, className }: FindingCardProps) {
  const tipoConfig = {
    fato: { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    prova: { icon: FileCheck, color: "text-green-500", bg: "bg-green-500/10" },
    alegacao: { icon: Scale, color: "text-violet-500", bg: "bg-violet-500/10" },
    pedido: { icon: Target, color: "text-amber-500", bg: "bg-amber-500/10" },
    base_legal: { icon: BookOpen, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    risco: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  };

  const config = tipoConfig[achado.tipo_no];
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        <div className={cn("p-2 rounded-lg", config.bg)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate normal-case">
            {achado.titulo}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" size="sm">
              {achado.tipo_no}
            </Badge>
            {achado.gerado_por_ia && (
              <Sparkles className="h-3 w-3 text-primary" />
            )}
          </div>
        </div>
        <div className="shrink-0">
          <div className="text-xs text-muted-foreground">força</div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-12 rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", config.bg.replace("/10", ""))}
                style={{ width: `${achado.forca * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium">
              {Math.round(achado.forca * 100)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn("cursor-pointer hover:border-primary/30 transition-colors", className)}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-lg", config.bg)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" size="sm">
                {achado.tipo_no}
              </Badge>
              {achado.gerado_por_ia && (
                <Badge variant="info" size="sm" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  ia
                </Badge>
              )}
            </div>

            <h4 className="font-medium text-foreground normal-case">{achado.titulo}</h4>

            {achado.conteudo && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {achado.conteudo}
              </p>
            )}

            {/* Métricas */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">força:</span>
                <div className="h-1.5 w-16 rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", config.bg.replace("/10", ""))}
                    style={{ width: `${achado.forca * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{Math.round(achado.forca * 100)}%</span>
              </div>

              {achado.confianca_ia && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">confiança ia:</span>
                  <span className="text-xs font-medium">
                    {Math.round(achado.confianca_ia * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
