'use client'

import { useState } from 'react'
import Link from 'next/link'

const prazos = [
  { id: 1, titulo: 'Contestação Trabalhista', caso: 'Maria Silva vs TechCorp', dataVencimento: '30/12/2024', diasRestantes: 1, tipo: 'judicial', prioridade: 'critica', status: 'pendente' },
  { id: 2, titulo: 'Recurso Ordinário', caso: 'João Santos - Indenização', dataVencimento: '02/01/2025', diasRestantes: 4, tipo: 'recursal', prioridade: 'alta', status: 'pendente' },
  { id: 3, titulo: 'Juntada de Documentos', caso: 'Maria Silva vs TechCorp', dataVencimento: '05/01/2025', diasRestantes: 7, tipo: 'judicial', prioridade: 'media', status: 'em_andamento' },
  { id: 4, titulo: 'Audiência de Conciliação', caso: 'Ana Oliveira - Guarda', dataVencimento: '10/01/2025', diasRestantes: 12, tipo: 'judicial', prioridade: 'alta', status: 'pendente' },
  { id: 5, titulo: 'Petição de Embargos', caso: 'Empresa ABC - Tributário', dataVencimento: '15/01/2025', diasRestantes: 17, tipo: 'recursal', prioridade: 'media', status: 'concluido' },
]

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700',
  critica: 'bg-red-100 text-red-700',
}

const statusColors: Record<string, string> = {
  pendente: 'bg-blue-100 text-blue-700',
  em_andamento: 'bg-yellow-100 text-yellow-700',
  concluido: 'bg-green-100 text-green-700',
}

export default function PrazosPage() {
  const [filtro, setFiltro] = useState('todos')
  const [showModal, setShowModal] = useState(false)

  const prazosFiltrados = filtro === 'todos' 
    ? prazos 
    : filtro === 'urgentes' 
      ? prazos.filter(p => p.diasRestantes <= 5 && p.status !== 'concluido')
      : prazos.filter(p => p.status === filtro)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">← Voltar</Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">⏰ Prazos</h1>
                <p className="text-sm text-gray-500">Controle de prazos processuais</p>
              </div>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              + Novo Prazo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Alerta de Prazos Críticos */}
        {prazos.filter(p => p.diasRestantes <= 2 && p.status !== 'concluido').length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <h3 className="font-semibold text-red-700">Atenção! Prazos Críticos</h3>
                <p className="text-sm text-red-600">
                  Existem {prazos.filter(p => p.diasRestantes <= 2 && p.status !== 'concluido').length} prazos vencendo nos próximos 2 dias
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{prazos.filter(p => p.status === 'pendente').length}</div>
            <div className="text-sm text-gray-500">Pendentes</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-red-600">{prazos.filter(p => p.diasRestantes <= 5 && p.status !== 'concluido').length}</div>
            <div className="text-sm text-gray-500">Urgentes (5 dias)</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{prazos.filter(p => p.status === 'em_andamento').length}</div>
            <div className="text-sm text-gray-500">Em Andamento</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{prazos.filter(p => p.status === 'concluido').length}</div>
            <div className="text-sm text-gray-500">Concluídos</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {['todos', 'urgentes', 'pendente', 'em_andamento', 'concluido'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtro === f 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'urgentes' ? '🚨 Urgentes' : f === 'em_andamento' ? 'Em Andamento' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Lista de Prazos */}
        <div className="space-y-3">
          {prazosFiltrados.map(prazo => (
            <div 
              key={prazo.id} 
              className={`bg-white rounded-xl border p-4 transition ${
                prazo.diasRestantes <= 2 && prazo.status !== 'concluido'
                  ? 'border-red-300 bg-red-50/50'
                  : prazo.diasRestantes <= 5 && prazo.status !== 'concluido'
                    ? 'border-orange-300 bg-orange-50/50'
                    : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{prazo.titulo}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${prioridadeColors[prazo.prioridade]}`}>
                      {prazo.prioridade.charAt(0).toUpperCase() + prazo.prioridade.slice(1)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[prazo.status]}`}>
                      {prazo.status === 'em_andamento' ? 'Em Andamento' : prazo.status.charAt(0).toUpperCase() + prazo.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📁 {prazo.caso}</span>
                    <span>•</span>
                    <span>📅 {prazo.dataVencimento}</span>
                    <span>•</span>
                    <span className={prazo.diasRestantes <= 2 ? 'text-red-600 font-medium' : prazo.diasRestantes <= 5 ? 'text-orange-600 font-medium' : ''}>
                      {prazo.status === 'concluido' ? '✓ Concluído' : `${prazo.diasRestantes} dias restantes`}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {prazo.status !== 'concluido' && (
                    <>
                      <button className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition">
                        ✓ Concluir
                      </button>
                      <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal Novo Prazo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Novo Prazo</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caso</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500">
                  <option>Maria Silva vs TechCorp</option>
                  <option>João Santos - Indenização</option>
                  <option>Empresa ABC - Tributário</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Criar Prazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
