import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarData(data: string | Date, formato: 'curta' | 'longa' | 'relativa' = 'curta'): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  
  if (formato === 'relativa') {
    const agora = new Date();
    const diff = agora.getTime() - d.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return 'hoje';
    if (dias === 1) return 'ontem';
    if (dias < 7) return `${dias} dias atrás`;
    if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
    if (dias < 365) return `${Math.floor(dias / 30)} meses atrás`;
    return `${Math.floor(dias / 365)} anos atrás`;
  }
  
  if (formato === 'longa') {
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  return d.toLocaleDateString('pt-BR');
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function calcularDiasRestantes(dataLimite: string | Date): number {
  const limite = typeof dataLimite === 'string' ? new Date(dataLimite) : dataLimite;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  limite.setHours(0, 0, 0, 0);
  const diff = limite.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function truncarTexto(texto: string, maxLength: number): string {
  if (texto.length <= maxLength) return texto;
  return texto.slice(0, maxLength - 3) + '...';
}

export function gerarCorPorNivel(nivel: string): string {
  const cores: Record<string, string> = {
    baixo: 'text-green-500',
    baixa: 'text-green-500',
    medio: 'text-amber-500',
    media: 'text-amber-500',
    alto: 'text-red-500',
    alta: 'text-red-500',
    critico: 'text-red-600',
    critica: 'text-red-600',
  };
  return cores[nivel.toLowerCase()] || 'text-gray-500';
}

export function gerarBgPorNivel(nivel: string): string {
  const cores: Record<string, string> = {
    baixo: 'bg-green-500/10 text-green-500',
    baixa: 'bg-green-500/10 text-green-500',
    medio: 'bg-amber-500/10 text-amber-500',
    media: 'bg-amber-500/10 text-amber-500',
    alto: 'bg-red-500/10 text-red-500',
    alta: 'bg-red-500/10 text-red-500',
    critico: 'bg-red-600/10 text-red-600',
    critica: 'bg-red-600/10 text-red-600',
  };
  return cores[nivel.toLowerCase()] || 'bg-gray-500/10 text-gray-500';
}

export function gerarCorFase(fase: string): string {
  const cores: Record<string, string> = {
    captacao: 'text-blue-500',
    qualificacao: 'text-violet-500',
    analise: 'text-cyan-500',
    acao: 'text-amber-500',
    registro: 'text-green-500',
  };
  return cores[fase] || 'text-gray-500';
}

export function gerarBgFase(fase: string): string {
  const cores: Record<string, string> = {
    captacao: 'bg-blue-500',
    qualificacao: 'bg-violet-500',
    analise: 'bg-cyan-500',
    acao: 'bg-amber-500',
    registro: 'bg-green-500',
  };
  return cores[fase] || 'bg-gray-500';
}
