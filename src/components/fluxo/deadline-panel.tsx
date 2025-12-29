"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Prazo, StatusPrazo, PrioridadeTarefa } from "@/types";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  Calendar,
  ChevronRight,
  Shield,
  Zap,
  Bell,
  Timer,
  Target,
  Flame,
} from "lucide-react";
import { calcularDiasRestantes, formatarData } from "@/lib/utils";

// Card de Prazo Individual
interface DeadlineCardProps {
  prazo: Prazo;
  onClick?: () => void;
  onConcluir?: () => void;
  className?: string;
}

export function DeadlineCard({
  prazo,
  onClick,
  onConcluir,
  className,
}: DeadlineCardProps) {
  const diasRestantes = calcularDiasRestantes(prazo.data_ajustada);
  
  const getPrioridadeConfig = () => {
    if (diasRestantes <= 0) {
      return { color: "text-red-600", bg: "bg-red-600/10", border: "border-red-600/30", label: "vencido!" };
    }
    if (diasRestantes <= 1) {
      return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", label: "hoje/amanhã" };
    }
    if (diasRestantes <= 3) {
      return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", label: "crítico" };
    }
    if (diasRestantes <= 7) {
      return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "urgente" };
    }
    if (diasRestantes <= 15) {
      return { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "atenção" };
    }
    return { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", label: "tranquilo" };
  };

  const config = getPrioridadeConfig();
  const isCritico = diasRestantes <= 3;

  return (
    <Card
      variant={isCritico ? "elevated" : "default"}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:border-primary/30",
        isCritico && config.border,
        prazo.sala_guerra_ativada && "ring-2 ring-red-500/30",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Indicador de dias */}
          <div className={cn("flex flex-col items-center justify-center p-3 rounded-lg min-w-[4rem]", config.bg)}>
            {diasRestantes <= 0 ? (
              <AlertTriangle className={cn("h-6 w-6", config.color)} />
            ) : (
              <>
                <span className={cn("text-2xl font-medium", config.color)}>
                  {diasRestantes}
                </span>
                <span className={cn("text-xs", config.color)}>
                  {diasRestantes === 1 ? "dia" : "dias"}
                </span>
              </>
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" size="sm">
                {prazo.tipo_prazo}
              </Badge>
              <Badge
                variant={isCritico ? "danger" : "secondary"}
                size="sm"
              >
                {config.label}
              </Badge>
              {prazo.sala_guerra_ativada && (
                <Badge variant="danger" size="sm" className="gap-1">
                  <Flame className="h-3 w-3" />
                  sala de guerra
                </Badge>
              )}
            </div>

            <h4 className="font-medium text-foreground normal-case line-clamp-1">
              {prazo.descricao}
            </h4>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatarData(prazo.data_ajustada)}
              </span>
              {prazo.atribuido_a && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  responsável
                </span>
              )}
              {prazo.minuta_automatica_gerada && (
                <span className="flex items-center gap-1 text-primary">
                  <FileText className="h-3 w-3" />
                  minuta pronta
                </span>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 shrink-0">
            {prazo.status !== "concluido" && onConcluir && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onConcluir();
                }}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Barra de alertas enviados */}
        {prazo.config_alertas && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
            <Bell className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mr-2">alertas:</span>
            {Object.entries(prazo.config_alertas).map(([dia, ativo]) => {
              const enviado = prazo.alertas_enviados?.some(
                (a) => typeof a === 'object' && 'dia' in a && a.dia === dia
              );
              return (
                <span
                  key={dia}
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    ativo
                      ? enviado
                        ? "bg-green-500/10 text-green-500"
                        : "bg-muted text-muted-foreground"
                      : "bg-muted/50 text-muted-foreground/50 line-through"
                  )}
                >
                  {dia.toUpperCase()}
                </span>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Lista de prazos
interface DeadlineListProps {
  prazos: Prazo[];
  onPrazoClick?: (prazo: Prazo) => void;
  onPrazoConcluir?: (prazoId: string) => void;
  showCompleted?: boolean;
  className?: string;
}

export function DeadlineList({
  prazos,
  onPrazoClick,
  onPrazoConcluir,
  showCompleted = false,
  className,
}: DeadlineListProps) {
  const prazosFiltrados = showCompleted
    ? prazos
    : prazos.filter((p) => p.status !== "concluido");

  const prazosOrdenados = [...prazosFiltrados].sort((a, b) => {
    const diasA = calcularDiasRestantes(a.data_ajustada);
    const diasB = calcularDiasRestantes(b.data_ajustada);
    return diasA - diasB;
  });

  // Agrupa por urgência
  const criticos = prazosOrdenados.filter(
    (p) => calcularDiasRestantes(p.data_ajustada) <= 3
  );
  const urgentes = prazosOrdenados.filter((p) => {
    const dias = calcularDiasRestantes(p.data_ajustada);
    return dias > 3 && dias <= 7;
  });
  const normais = prazosOrdenados.filter(
    (p) => calcularDiasRestantes(p.data_ajustada) > 7
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Críticos */}
      {criticos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-500">
              críticos ({criticos.length})
            </span>
          </div>
          <div className="space-y-3">
            {criticos.map((prazo) => (
              <DeadlineCard
                key={prazo.id}
                prazo={prazo}
                onClick={() => onPrazoClick?.(prazo)}
                onConcluir={() => onPrazoConcluir?.(prazo.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Urgentes */}
      {urgentes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-500">
              urgentes ({urgentes.length})
            </span>
          </div>
          <div className="space-y-3">
            {urgentes.map((prazo) => (
              <DeadlineCard
                key={prazo.id}
                prazo={prazo}
                onClick={() => onPrazoClick?.(prazo)}
                onConcluir={() => onPrazoConcluir?.(prazo.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Normais */}
      {normais.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              próximos ({normais.length})
            </span>
          </div>
          <div className="space-y-3">
            {normais.map((prazo) => (
              <DeadlineCard
                key={prazo.id}
                prazo={prazo}
                onClick={() => onPrazoClick?.(prazo)}
                onConcluir={() => onPrazoConcluir?.(prazo.id)}
              />
            ))}
          </div>
        </div>
      )}

      {prazosOrdenados.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            nenhum prazo pendente
          </p>
        </div>
      )}
    </div>
  );
}

// Sala de Guerra - Para prazos críticos
interface WarRoomProps {
  prazo: Prazo;
  onGerarMinuta?: () => void;
  onAtribuir?: (userId: string) => void;
  onNotificarEquipe?: () => void;
  className?: string;
}

export function WarRoom({
  prazo,
  onGerarMinuta,
  onAtribuir,
  onNotificarEquipe,
  className,
}: WarRoomProps) {
  const diasRestantes = calcularDiasRestantes(prazo.data_ajustada);

  return (
    <Card variant="elevated" className={cn("border-red-500/30 bg-red-500/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Flame className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-red-500">sala de guerra</CardTitle>
              <p className="text-xs text-muted-foreground">modo de crise ativado</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-medium text-red-500">
              {diasRestantes <= 0 ? "VENCIDO" : `${diasRestantes}d`}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatarData(prazo.data_ajustada)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações do prazo */}
        <div className="p-3 rounded-lg bg-background border border-border">
          <h4 className="font-medium text-foreground normal-case">
            {prazo.descricao}
          </h4>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <Badge variant="outline">{prazo.tipo_prazo}</Badge>
            {prazo.origem && (
              <span>origem: {prazo.origem}</span>
            )}
          </div>
        </div>

        {/* Checklist de emergência */}
        <div>
          <p className="text-xs font-medium text-red-500 mb-2">checklist de emergência</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {prazo.atribuido_a ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Timer className="h-4 w-4 text-red-500" />
              )}
              <span className={cn("text-sm", prazo.atribuido_a ? "text-muted-foreground line-through" : "text-foreground")}>
                atribuir responsável
              </span>
            </div>
            <div className="flex items-center gap-2">
              {prazo.minuta_automatica_gerada ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Timer className="h-4 w-4 text-amber-500" />
              )}
              <span className={cn("text-sm", prazo.minuta_automatica_gerada ? "text-muted-foreground line-through" : "text-foreground")}>
                gerar minuta base
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-foreground">
                revisar e aprovar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-foreground">
                protocolar
              </span>
            </div>
          </div>
        </div>

        {/* Ações de emergência */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
          {!prazo.minuta_automatica_gerada && (
            <Button
              variant="outline"
              onClick={onGerarMinuta}
              className="gap-1"
            >
              <FileText className="h-4 w-4" />
              minuta ia
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onAtribuir?.("")}
            className="gap-1"
          >
            <User className="h-4 w-4" />
            atribuir
          </Button>
          <Button
            variant="outline"
            onClick={onNotificarEquipe}
            className="gap-1"
          >
            <Bell className="h-4 w-4" />
            alertar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Contador de prazos para header/sidebar
interface DeadlineCounterProps {
  criticos: number;
  urgentes: number;
  className?: string;
}

export function DeadlineCounter({ criticos, urgentes, className }: DeadlineCounterProps) {
  const total = criticos + urgentes;
  
  if (total === 0) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {criticos > 0 && (
        <span className="flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-red-500 text-white text-xs font-medium">
          {criticos}
        </span>
      )}
      {urgentes > 0 && (
        <span className="flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-amber-500 text-white text-xs font-medium">
          {urgentes}
        </span>
      )}
    </div>
  );
}
