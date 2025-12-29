'use client'

import { useState } from 'react'
import Link from 'next/link'

const eventos = [
  { id: 1, data: '29/12/2024 14:32', tipo: 'ia', acao: 'Qualificação automática concluída', usuario: 'Sistema IA', caso: 'Maria Silva' },
  { id: 2, data: '29/12/2024 14:15', tipo: 'usuario', acao: 'Lead aprovado para caso', usuario: 'Dr. Carlos', caso: 'Maria Silva' },
  { id: 3, data: '29/12/2024 11:45', tipo: 'documento', acao: 'Documento anexado: Contrato de trabalho', usuario: 'Ana Santos', caso: 'Maria Silva' },
  { id: 4, data: '28/12/2024 16:20', tipo: 'prazo', acao: 'Prazo cadastrado: Contestação', usuario: 'Sistema', caso: 'João Santos' },
  { id: 5, data: '28/12/2024 10:00', tipo: 'ia', acao: 'Minuta gerada: Petição Inicial', usuario: 'Sistema IA', caso: 'Maria Silva' },
  { id: 6, data: '27/12/2024 09:30', tipo: 'usuario', acao: 'Novo lead registrado', usuario: 'Recepção', caso: 'Maria Silva' },
]

const tipoIcons: Record<string, { icon: string; color: string }> = {
  ia: { icon: '🤖', color: 'bg-purple-100 text-purple-700' },
  usuario: { icon: '👤', color: 'bg-blue-100 text-blue-700' },
  documento: { icon: '📄', color: 'bg-green-100 text-green-700' },
  prazo: { icon: '⏰', color: 'bg-red-100 text-red-700' },
}

export default function RegistroPage() {
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const eventosFiltrados = filtroTipo === 'todos' 
    ? eventos 
    : eventos.filter(e => e.tipo === filtroTipo)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">← Voltar</Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">📋 Registro</h1>
                <p className="text-sm text-gray-500">Auditoria e trilha de atividades</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">
              📥 Exportar Relatório
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{eventos.length}</div>
            <div className="text-sm text-gray-500">Total de Eventos</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{eventos.filter(e => e.tipo === 'ia').length}</div>
            <div className="text-sm text-gray-500">Ações da IA</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{eventos.filter(e => e.tipo === 'usuario').length}</div>
            <div className="text-sm text-gray-500">Ações Manuais</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{eventos.filter(e => e.tipo === 'documento').length}</div>
            <div className="text-sm text-gray-500">Documentos</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {['todos', 'ia', 'usuario', 'documento', 'prazo'].map(f => (
            <button
              key={f}
              onClick={() => setFiltroTipo(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroTipo === f 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'ia' ? '🤖 IA' : f === 'usuario' ? '👤 Usuário' : f === 'documento' ? '📄 Docs' : '⏰ Prazos'}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline de Eventos</h2>
          <div className="space-y-4">
            {eventosFiltrados.map((evento, index) => {
              const { icon, color } = tipoIcons[evento.tipo]
              return (
                <div key={evento.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                      {icon}
                    </div>
                    {index < eventosFiltrados.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{evento.acao}</h3>
                      <span className="text-xs text-gray-500">{evento.data}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>👤 {evento.usuario}</span>
                      <span>•</span>
                      <span>📁 {evento.caso}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
