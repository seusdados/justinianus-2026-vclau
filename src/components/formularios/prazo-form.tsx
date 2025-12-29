'use client'

import { useState, useMemo } from 'react'
import { criarPrazo, atualizarPrazo } from '@/app/actions'
import type { Prazo } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const TIPOS_PRAZO = [
  { valor: 'contestacao', rotulo: 'contestação', icone: '📝', diasPadrao: 15 },
  { valor: 'recurso', rotulo: 'recurso', icone: '📤', diasPadrao: 15 },
  { valor: 'manifestacao', rotulo: 'manifestação', icone: '💬', diasPadrao: 5 },
  { valor: 'audiencia', rotulo: 'audiência', icone: '⚖️', diasPadrao: null },
  { valor: 'pericia', rotulo: 'perícia', icone: '🔬', diasPadrao: 30 },
  { valor: 'cumprimento_sentenca', rotulo: 'cumprimento de sentença', icone: '✅', diasPadrao: 15 },
  { valor: 'impugnacao', rotulo: 'impugnação', icone: '❌', diasPadrao: 15 },
  { valor: 'embargos', rotulo: 'embargos', icone: '⛔', diasPadrao: 5 },
  { valor: 'pagamento', rotulo: 'pagamento', icone: '💰', diasPadrao: 3 },
  { valor: 'contratual', rotulo: 'contratual', icone: '📋', diasPadrao: null },
  { valor: 'prescricao', rotulo: 'prescrição', icone: '⏰', diasPadrao: null },
  { valor: 'outro', rotulo: 'outro', icone: '📌', diasPadrao: null },
] as const

const ORIGENS = [
  { valor: 'publicacao', rotulo: 'publicação no diário' },
  { valor: 'intimacao', rotulo: 'intimação' },
  { valor: 'contrato', rotulo: 'cláusula contratual' },
  { valor: 'manual', rotulo: 'inserção manual' },
  { valor: 'detectado_por_ia', rotulo: 'detectado por IA' },
] as const

const PRIORIDADES = [
  { valor: 'baixa', rotulo: 'baixa', cor: 'bg-zinc-600', icone: '🟢' },
  { valor: 'media', rotulo: 'média', cor: 'bg-blue-600', icone: '🔵' },
  { valor: 'alta', rotulo: 'alta', cor: 'bg-amber-600', icone: '🟠' },
  { valor: 'critica', rotulo: 'crítica', cor: 'bg-red-600', icone: '🔴' },
] as const

const CONFIG_ALERTAS_PADRAO = {
  d10: true,
  d7: true,
  d5: true,
  d3: true,
  d1: true,
  d0: true
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface PrazoFormProps {
  casoId: number
  prazoExistente?: Prazo
  usuariosEquipe?: Array<{ id: string; nome: string }>
  onSucesso?: (prazo: Prazo) => void
  onCancelar?: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function calcularDataAjustada(data: Date): Date {
  // TODO: Considerar feriados forenses e finais de semana
  // Por enquanto, retorna a mesma data
  const dataAjustada = new Date(data)
  
  // Se cair no fim de semana, move para segunda
  const diaSemana = dataAjustada.getDay()
  if (diaSemana === 0) dataAjustada.setDate(dataAjustada.getDate() + 1)
  if (diaSemana === 6) dataAjustada.setDate(dataAjustada.getDate() + 2)
  
  return dataAjustada
}

function adicionarDiasUteis(data: Date, dias: number): Date {
  const resultado = new Date(data)
  let diasAdicionados = 0
  
  while (diasAdicionados < dias) {
    resultado.setDate(resultado.getDate() + 1)
    const diaSemana = resultado.getDay()
    // Pular fins de semana
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAdicionados++
    }
  }
  
  return resultado
}

function formatarDataParaInput(data: Date): string {
  return data.toISOString().split('T')[0]
}

function calcularDiasRestantes(data: Date): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataAlvo = new Date(data)
  dataAlvo.setHours(0, 0, 0, 0)
  return Math.ceil((dataAlvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function PrazoForm({
  casoId,
  prazoExistente,
  usuariosEquipe = [],
  onSucesso,
  onCancelar
}: PrazoFormProps) {
  const modoEdicao = !!prazoExistente
  
  // Estado do formulário
  const [tipoPrazo, setTipoPrazo] = useState(prazoExistente?.tipo_prazo || '')
  const [descricao, setDescricao] = useState(prazoExistente?.descricao || '')
  const [origem, setOrigem] = useState<string>(prazoExistente?.origem || 'manual')
  const [referenciaOrigem, setReferenciaOrigem] = useState(prazoExistente?.referencia_origem || '')
  
  // Datas
  const [dataOriginal, setDataOriginal] = useState<string>(
    prazoExistente?.data_original 
      ? new Date(prazoExistente.data_original).toISOString().split('T')[0]
      : ''
  )
  const [dataAjustada, setDataAjustada] = useState<string>(
    prazoExistente?.data_ajustada
      ? new Date(prazoExistente.data_ajustada).toISOString().split('T')[0]
      : ''
  )
  const [ajusteManual, setAjusteManual] = useState(false)
  
  // Prioridade e responsáveis
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta' | 'critica'>(
    (prazoExistente?.prioridade as 'baixa' | 'media' | 'alta' | 'critica') || 'media'
  )
  const [atribuidoA, setAtribuidoA] = useState(prazoExistente?.atribuido_a || '')
  const [backupAtribuidoA, setBackupAtribuidoA] = useState(prazoExistente?.backup_atribuido_a || '')
  
  // Alertas
  const [configAlertas, setConfigAlertas] = useState<Record<string, boolean>>(
    prazoExistente?.config_alertas as Record<string, boolean> || CONFIG_ALERTAS_PADRAO
  )
  
  // Sala de guerra
  const [ativarSalaGuerra, setAtivarSalaGuerra] = useState(false)
  
  // UI
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  // ─────────────────────────────────────────────────────────────────────────
  // CÁLCULOS
  // ─────────────────────────────────────────────────────────────────────────
  
  // Auto-calcular data ajustada
  useMemo(() => {
    if (dataOriginal && !ajusteManual) {
      const data = new Date(dataOriginal + 'T12:00:00')
      const ajustada = calcularDataAjustada(data)
      setDataAjustada(formatarDataParaInput(ajustada))
    }
  }, [dataOriginal, ajusteManual])
  
  // Dias restantes
  const diasRestantes = useMemo(() => {
    if (!dataAjustada) return null
    return calcularDiasRestantes(new Date(dataAjustada + 'T12:00:00'))
  }, [dataAjustada])
  
  // Auto-sugerir prioridade baseada em dias restantes
  useMemo(() => {
    if (diasRestantes === null || modoEdicao) return
    
    if (diasRestantes <= 1) setPrioridade('critica')
    else if (diasRestantes <= 3) setPrioridade('alta')
    else if (diasRestantes <= 7) setPrioridade('media')
    else setPrioridade('baixa')
  }, [diasRestantes, modoEdicao])
  
  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleTipoPrazoChange = (tipo: string) => {
    setTipoPrazo(tipo)
    
    // Auto-preencher descrição se vazia
    if (!descricao) {
      const tipoInfo = TIPOS_PRAZO.find(t => t.valor === tipo)
      if (tipoInfo) {
        setDescricao(`prazo para ${tipoInfo.rotulo}`)
      }
    }
    
    // Se o tipo tem dias padrão e não há data, sugerir
    if (!dataOriginal) {
      const tipoInfo = TIPOS_PRAZO.find(t => t.valor === tipo)
      if (tipoInfo?.diasPadrao) {
        const dataSugerida = adicionarDiasUteis(new Date(), tipoInfo.diasPadrao)
        setDataOriginal(formatarDataParaInput(dataSugerida))
      }
    }
  }
  
  const toggleAlerta = (chave: string) => {
    setConfigAlertas(prev => ({
      ...prev,
      [chave]: !prev[chave]
    }))
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    
    // Validações
    if (!tipoPrazo) {
      setErro('selecione o tipo de prazo')
      return
    }
    
    if (!descricao.trim()) {
      setErro('descrição é obrigatória')
      return
    }
    
    if (!dataOriginal) {
      setErro('data do prazo é obrigatória')
      return
    }
    
    setSalvando(true)
    
    try {
      const dadosSnake = {
        caso_id: casoId,
        tipo_prazo: tipoPrazo,
        descricao: descricao.trim(),
        origem: origem as 'publicacao' | 'intimacao' | 'contrato' | 'manual' | 'detectado_por_ia',
        referencia_origem: referenciaOrigem.trim() || undefined,
        data_original: dataOriginal,
        data_ajustada: dataAjustada || dataOriginal,
        prioridade,
        atribuido_a: atribuidoA || undefined,
        backup_atribuido_a: backupAtribuidoA || undefined,
        config_alertas: configAlertas,
        sala_guerra_ativada: ativarSalaGuerra || diasRestantes !== null && diasRestantes <= 3
      }

      // Para criar, precisamos usar camelCase
      const dadosCriar = {
        organizacaoId: '', // será preenchido pelo server action
        casoId: casoId,
        tipoPrazo: tipoPrazo,
        descricao: descricao.trim(),
        origem: origem as 'publicacao' | 'intimacao' | 'contrato' | 'manual' | 'detectado_por_ia',
        referenciaOrigem: referenciaOrigem.trim() || undefined,
        dataOriginal: dataOriginal,
        dataAjustada: dataAjustada || dataOriginal,
        prioridade,
        atribuidoA: atribuidoA || undefined,
        backupAtribuidoA: backupAtribuidoA || undefined,
        configAlertas: configAlertas,
      }
      
      if (modoEdicao && prazoExistente) {
        const resultado = await atualizarPrazo(prazoExistente.id, dadosSnake as any)
        
        if (resultado.success && resultado.data) {
          onSucesso?.(resultado.data)
        } else {
          setErro(resultado.error || 'erro ao atualizar prazo')
        }
      } else {
        const resultado = await criarPrazo(dadosCriar)
        
        if (resultado.success && resultado.data) {
          onSucesso?.(resultado.data)
        } else {
          setErro(resultado.error || 'erro ao criar prazo')
        }
      }
    } catch (err) {
      setErro('erro ao salvar prazo')
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-light text-zinc-100">
          {modoEdicao ? 'editar prazo' : 'novo prazo'}
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          cadastre o prazo processual ou contratual
        </p>
      </div>
      
      {/* Alerta de prazo crítico */}
      {diasRestantes !== null && diasRestantes <= 3 && (
        <div className={`
          rounded-lg p-4 border
          ${diasRestantes <= 0 
            ? 'bg-red-500/10 border-red-500/30' 
            : diasRestantes <= 1
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }
        `}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {diasRestantes <= 0 ? '🚨' : diasRestantes <= 1 ? '⚠️' : '⏰'}
            </span>
            <div>
              <p className={`font-medium ${diasRestantes <= 1 ? 'text-red-400' : 'text-amber-400'}`}>
                {diasRestantes <= 0 
                  ? 'prazo vencido!' 
                  : diasRestantes === 1 
                    ? 'prazo vence amanhã!'
                    : `prazo vence em ${diasRestantes} dias`
                }
              </p>
              <p className="text-sm text-zinc-400">
                sala de guerra será ativada automaticamente
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tipo de prazo */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          tipo de prazo *
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TIPOS_PRAZO.map((tipo) => (
            <button
              key={tipo.valor}
              type="button"
              onClick={() => handleTipoPrazoChange(tipo.valor)}
              className={`
                p-3 rounded-lg border text-left transition-all
                ${tipoPrazo === tipo.valor
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
                }
              `}
            >
              <span className="text-lg">{tipo.icone}</span>
              <p className="text-sm text-zinc-200 mt-1">{tipo.rotulo}</p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          descrição *
        </label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="descreva o prazo..."
          rows={2}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg
            text-zinc-100 placeholder:text-zinc-600 resize-none
            focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25"
        />
      </div>
      
      {/* Origem e Referência */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            origem
          </label>
          <select
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg
              text-zinc-100 focus:outline-none focus:border-amber-500/50"
          >
            {ORIGENS.map((o) => (
              <option key={o.valor} value={o.valor}>{o.rotulo}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            referência
          </label>
          <input
            type="text"
            value={referenciaOrigem}
            onChange={(e) => setReferenciaOrigem(e.target.value)}
            placeholder="nº da publicação, cláusula..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg
              text-zinc-100 placeholder:text-zinc-600
              focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25"
          />
        </div>
      </div>
      
      {/* Datas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            data original *
          </label>
          <input
            type="date"
            value={dataOriginal}
            onChange={(e) => setDataOriginal(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg
              text-zinc-100 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            data ajustada
            <span className="text-zinc-500 font-normal ml-2">
              (considera feriados)
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dataAjustada}
              onChange={(e) => {
                setDataAjustada(e.target.value)
                setAjusteManual(true)
              }}
              disabled={!ajusteManual}
              className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg
                text-zinc-100 focus:outline-none focus:border-amber-500/50
                disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setAjusteManual(!ajusteManual)}
              className={`px-3 rounded-lg border transition-colors
                ${ajusteManual 
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }
              `}
              title={ajusteManual ? 'usar cálculo automático' : 'ajustar manualmente'}
            >
              ✏️
            </button>
          </div>
        </div>
      </div>
      
      {/* Prioridade */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          prioridade
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRIORIDADES.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => setPrioridade(p.valor)}
              className={`
                p-3 rounded-lg border text-center transition-all
                ${prioridade === p.valor
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
                }
              `}
            >
              <span className="text-lg">{p.icone}</span>
              <p className="text-sm text-zinc-200 mt-1">{p.rotulo}</p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Responsáveis */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            responsável
          </label>
          <select
            value={atribuidoA}
            onChange={(e) => setAtribuidoA(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg
              text-zinc-100 focus:outline-none focus:border-amber-500/50"
          >
            <option value="">selecione...</option>
            {usuariosEquipe.map((u) => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            backup
          </label>
          <select
            value={backupAtribuidoA}
            onChange={(e) => setBackupAtribuidoA(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg
              text-zinc-100 focus:outline-none focus:border-amber-500/50"
          >
            <option value="">selecione...</option>
            {usuariosEquipe.filter(u => u.id !== atribuidoA).map((u) => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Configuração de Alertas */}
      <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-400 mb-3">
          <span>🔔</span>
          <span className="text-sm font-medium">alertas automáticos</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { chave: 'd10', rotulo: 'D-10' },
            { chave: 'd7', rotulo: 'D-7' },
            { chave: 'd5', rotulo: 'D-5' },
            { chave: 'd3', rotulo: 'D-3' },
            { chave: 'd1', rotulo: 'D-1' },
            { chave: 'd0', rotulo: 'D-0' },
          ].map((alerta) => (
            <button
              key={alerta.chave}
              type="button"
              onClick={() => toggleAlerta(alerta.chave)}
              className={`
                px-3 py-1.5 rounded-full text-sm transition-all
                ${configAlertas[alerta.chave]
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }
              `}
            >
              {alerta.rotulo}
            </button>
          ))}
        </div>
      </div>
      
      {/* Sala de Guerra */}
      {(diasRestantes === null || diasRestantes > 3) && (
        <label className="flex items-start gap-3 cursor-pointer bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
          <input
            type="checkbox"
            checked={ativarSalaGuerra}
            onChange={(e) => setAtivarSalaGuerra(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 
              text-red-500 focus:ring-red-500/25"
          />
          <div>
            <p className="text-zinc-200 text-sm">🚨 ativar sala de guerra agora</p>
            <p className="text-xs text-zinc-500">
              prioridade máxima, notificações constantes, minuta automática
            </p>
          </div>
        </label>
      )}
      
      {/* Erro */}
      {erro && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">⚠️ {erro}</p>
        </div>
      )}
      
      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={salvando}
            className="px-6 py-2.5 text-zinc-400 hover:text-zinc-200 
              transition-colors disabled:opacity-50"
          >
            cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={salvando}
          className="px-6 py-2.5 bg-amber-500 text-zinc-900 font-medium rounded-lg
            hover:bg-amber-400 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-2"
        >
          {salvando ? (
            <>
              <span className="animate-spin">⏳</span>
              salvando...
            </>
          ) : (
            <>
              💾 {modoEdicao ? 'salvar' : 'criar prazo'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
