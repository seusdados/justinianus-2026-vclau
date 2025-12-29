'use client'

import { useState } from 'react'
import Link from 'next/link'

const leadsDemo = [
  { id: '1', nome: 'Maria Silva', email: 'maria@email.com', tipo: 'Trabalhista', urgencia: 'alta', status: 'novo', data: '29/12/2024' },
  { id: '2', nome: 'João Santos', email: 'joao@empresa.com', tipo: 'Cível', urgencia: 'media', status: 'em_analise', data: '28/12/2024' },
  { id: '3', nome: 'Empresa ABC Ltda', email: 'juridico@abc.com', tipo: 'Tributário', urgencia: 'baixa', status: 'qualificado', data: '27/12/2024' },
  { id: '4', nome: 'Ana Oliveira', email: 'ana@gmail.com', tipo: 'Família', urgencia: 'critica', status: 'novo', data: '29/12/2024' },
  { id: '5', nome: 'Tech Solutions SA', email: 'legal@tech.com', tipo: 'Empresarial', urgencia: 'media', status: 'em_analise', data: '26/12/2024' },
]

const statusColors: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-700',
  em_analise: 'bg-yellow-100 text-yellow-700',
  qualificado: 'bg-green-100 text-green-700',
  recusado: 'bg-red-100 text-red-700',
}

const urgenciaColors: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700',
  critica: 'bg-red-100 text-red-700',
}

export default function CaptacaoPage() {
  const [filtro, setFiltro] = useState('todos')
  const [showModal, setShowModal] = useState(false)

  const leadsFiltrados = filtro === 'todos' 
    ? leadsDemo 
    : leadsDemo.filter(l => l.status === filtro)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">← Voltar</Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">📥 Captação</h1>
                <p className="text-sm text-gray-500">Inbox de leads e documentos</p>
              </div>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              + Novo Lead
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{leadsDemo.filter(l => l.status === 'novo').length}</div>
            <div className="text-sm text-gray-500">Novos</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{leadsDemo.filter(l => l.status === 'em_analise').length}</div>
            <div className="text-sm text-gray-500">Em Análise</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{leadsDemo.filter(l => l.status === 'qualificado').length}</div>
            <div className="text-sm text-gray-500">Qualificados</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-red-600">{leadsDemo.filter(l => l.urgencia === 'critica' || l.urgencia === 'alta').length}</div>
            <div className="text-sm text-gray-500">Urgentes</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {['todos', 'novo', 'em_analise', 'qualificado'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtro === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'em_analise' ? 'Em Análise' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Lista de Leads */}
        <div className="space-y-3">
          {leadsFiltrados.map(lead => (
            <div key={lead.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{lead.nome}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[lead.status]}`}>
                      {lead.status === 'em_analise' ? 'Em Análise' : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${urgenciaColors[lead.urgencia]}`}>
                      {lead.urgencia.charAt(0).toUpperCase() + lead.urgencia.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{lead.email}</span>
                    <span>•</span>
                    <span>{lead.tipo}</span>
                    <span>•</span>
                    <span>{lead.data}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link 
                    href={`/qualificacao?lead=${lead.id}`}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition"
                  >
                    Qualificar
                  </Link>
                  <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal Novo Lead */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Novo Lead</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Trabalhista</option>
                  <option>Cível</option>
                  <option>Tributário</option>
                  <option>Família</option>
                  <option>Empresarial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Criar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
