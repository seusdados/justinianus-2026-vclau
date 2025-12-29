"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Search,
  Brain,
  Zap,
  CheckCircle,
  Scale,
  Settings,
  Users,
  FileText,
  Clock,
  Shield,
  ChevronRight,
  Bell,
} from "lucide-react";

// Fases do fluxo - ordem obrigatória
const FASES_FLUXO = [
  {
    id: "captacao",
    label: "captação",
    icon: Inbox,
    href: "/captacao",
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    description: "inbox + leads + criação guiada",
  },
  {
    id: "qualificacao",
    label: "qualificação",
    icon: Search,
    href: "/qualificacao",
    color: "text-violet-500",
    bgColor: "bg-violet-500",
    description: "triagem + semáforo de risco",
  },
  {
    id: "analise",
    label: "análise",
    icon: Brain,
    href: "/analise",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500",
    description: "metrô jurídico + achados + evidências",
  },
  {
    id: "acao",
    label: "ação",
    icon: Zap,
    href: "/acao",
    color: "text-amber-500",
    bgColor: "bg-amber-500",
    description: "playbooks + tarefas + minutas",
  },
  {
    id: "registro",
    label: "registro",
    icon: CheckCircle,
    href: "/registro",
    color: "text-green-500",
    bgColor: "bg-green-500",
    description: "auditoria + dossiê + métricas",
  },
];

// Links secundários
const LINKS_SECUNDARIOS = [
  { id: "casos", label: "casos", icon: FileText, href: "/casos" },
  { id: "prazos", label: "prazos", icon: Clock, href: "/prazos" },
  { id: "clientes", label: "clientes", icon: Users, href: "/clientes" },
  { id: "lgpd", label: "lgpd", icon: Shield, href: "/lgpd" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const getFaseAtual = () => {
    for (const fase of FASES_FLUXO) {
      if (isActive(fase.href)) return fase.id;
    }
    return null;
  };

  const faseAtual = getFaseAtual();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Scale className="h-6 w-6 text-primary" />
        <span className="text-lg font-medium text-foreground">justinianus</span>
      </div>

      {/* Navegação principal - Fluxo */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">fluxo operacional</p>
        </div>
        
        <div className="space-y-1 px-2">
          {FASES_FLUXO.map((fase, index) => {
            const Icon = fase.icon;
            const active = isActive(fase.href);
            const faseIndex = FASES_FLUXO.findIndex(f => f.id === faseAtual);
            const isPast = faseAtual && index < faseIndex;
            const isCurrent = fase.id === faseAtual;

            return (
              <Link
                key={fase.id}
                href={fase.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {/* Indicador de progresso */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                      active && fase.bgColor,
                      active ? "text-white" : "",
                      isPast && "ring-2 ring-green-500/30"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", !active && fase.color)} />
                  </div>
                  
                  {/* Linha conectora */}
                  {index < FASES_FLUXO.length - 1 && (
                    <div
                      className={cn(
                        "absolute top-full left-1/2 h-4 w-0.5 -translate-x-1/2",
                        isPast ? "bg-green-500/50" : "bg-border"
                      )}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium lowercase", active && "text-foreground")}>
                    {fase.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {fase.description}
                    </p>
                  )}
                </div>

                {active && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Separador */}
        <div className="my-4 mx-4 border-t border-border" />

        {/* Links secundários */}
        <div className="px-4 mb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">gestão</p>
        </div>

        <div className="space-y-1 px-2">
          {LINKS_SECUNDARIOS.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);

            return (
              <Link
                key={link.id}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="lowercase">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer da sidebar */}
      <div className="border-t border-border p-4">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <Settings className="h-4 w-4" />
          <span className="lowercase">configurações</span>
        </Link>
      </div>
    </aside>
  );
}

// Topbar para contexto do caso e busca global
export function Topbar() {
  return (
    <header className="fixed top-0 left-64 right-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Busca global */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="buscar casos, leads, documentos..."
              className="h-9 w-full rounded-md border border-border bg-muted/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="flex items-center gap-3">
          {/* Prazos urgentes */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              3
            </span>
          </button>

          {/* Notificações */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
              5
            </span>
          </button>

          {/* Avatar */}
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
            MA
          </button>
        </div>
      </div>
    </header>
  );
}

// Layout wrapper
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Topbar />
      <main className="pl-64 pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
