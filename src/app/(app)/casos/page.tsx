'use client'

import { useState } from 'react'
import Link from 'next/link'

const casos = [
  { id: 1, titulo: 'Maria Silva vs TechCorp', numero: '1234567-89.2024.8.26.0100', tipo: 'Trabalhista', status: 'ativo', fase: 'analise', valor: 350000, cliente: 'Maria Silva', responsavel: 'Dr. Carlos' },
  { id: 2, titulo: 'João Santos - Indenização', numero: '9876543-21.2024.8.26.0050', tipo: 'Cível', status: 'ativo', fase: 'acao', valor: 150000, cliente: 'João Santos', responsavel: 'Dra. Ana' },
  { id: 3, titulo: 'Empresa ABC - Tributário', numero: '5555555-00.2024.8.26.0001', tipo: 'Tributário', status: 'suspenso', fase: 'registro', valor: 2500000, cliente: 'Empresa ABC', responsavel: 'Dr. Pedro' },
  { id: 4, titulo: 'Ana Oliveira - Guarda', numero: '1111111-11.2024.8.26.0100', tipo: 'Família', status: 'ativo', fase: 'qualificacao', valor: 0, cliente: 'Ana Oliveira', responsavel: 'Dra. Julia' },
]

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  suspenso: 'bg-yellow-100 text-yellow-700',
  encerrado: 'bg-gray-100 text-gray-600',
}

const faseColors: Record<string, string> = {
  captacao: 'bg-blue-100 text-blue-700',
  qualificacao: 'bg-purple-100 text-purple-700',
  analise: 'bg-cyan-100 text-cyan-700',
  acao: 'bg-amber-100 text-amber-700',
  registro: 'bg-emerald-100 text-emerald-700',
}

export default function CasosPage() {
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')

  const casosFiltrados = casos.filter(c => {
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false
    if (busca && !c.titulo.toLowerCase().includes(busca.toLowerCase()) && !c.numero.includes(busca)) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">← Voltar</Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">📁 Casos</h1>
                <p className="text-sm text-gray-500">Gestão de processos e casos</p>
              </div>
            </div>
            <Link 
              href="/captacao"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Novo Caso
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{casos.length}</div>
            <div className="text-sm text-gray-500">Total de Casos</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{casos.filter(c => c.status === 'ativo').length}</div>
            <div className="text-sm text-gray-500">Casos Ativos</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{casos.filter(c => c.status === 'suspenso').length}</div>
            <div className="text-sm text-gray-500">Suspensos</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-600">R$ {(casos.reduce((a, c) => a + c.valor, 0) / 1000000).toFixed(1)}M</div>
            <div className="text-sm text-gray-500">Valor Total</div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {['todos', 'ativo', 'suspenso', 'encerrado'].map(f => (
              <button
                key={f}
                onClick={() => setFiltroStatus(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtroStatus === f 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Buscar por título ou número..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-64 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Lista de Casos */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Caso</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fase</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Responsável</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Valor</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {casosFiltrados.map(caso => (
                <tr key={caso.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{caso.titulo}</div>
                      <div className="text-xs text-gray-500">{caso.numero}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{caso.tipo}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[caso.status]}`}>
                      {caso.status.charAt(0).toUpperCase() + caso.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${faseColors[caso.fase]}`}>
                      {caso.fase.charAt(0).toUpperCase() + caso.fase.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{caso.responsavel}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {caso.valor > 0 ? `R$ ${(caso.valor / 1000).toFixed(0)}k` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link 
                      href={`/casos/${caso.id}`}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition"
                    >
                      Ver Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
