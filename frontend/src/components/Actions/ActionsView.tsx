import { useEffect, useState } from 'react'
import { api, type OrganizeAction } from '../../lib/tauri'

export function ActionsView() {
  const [actions, setActions] = useState<OrganizeAction[]>([])
  const [loading, setLoading] = useState(false)
  const [proposing, setProposing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await api.listActions()
      setActions(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handlePropose = async () => {
    setProposing(true)
    try {
      await api.proposeActions()
      await load()
    } finally {
      setProposing(false)
    }
  }

  const handleSkip = async (id: string) => {
    await api.skipAction(id)
    setActions(a => a.map(x => x.id === id ? { ...x, status: '"Skipped"' } : x))
  }

  const handleSkipAll = async () => {
    await api.skipAllActions()
    setActions(a => a.map(x => x.status === '"Pending"' ? { ...x, status: '"Skipped"' } : x))
  }

  const pending = actions.filter(a => a.status === '"Pending"')
  const applied = actions.filter(a => a.status === '"Applied"')

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#e6edf3]">Sortier-Aktionen</h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            KI-Vorschläge werden erst nach Ihrer Bestätigung ausgeführt
          </p>
        </div>
        <div className="flex gap-2">
          {pending.length > 0 && (
            <button
              onClick={handleSkipAll}
              className="px-3 py-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] rounded-md transition-colors"
            >
              Alle überspringen
            </button>
          )}
          <button
            onClick={handlePropose}
            disabled={proposing}
            className="px-3 py-1.5 text-xs bg-[#238636] hover:bg-[#2ea043] text-white rounded-md transition-colors disabled:opacity-50"
          >
            {proposing ? 'Analysiere…' : '⚡ Vorschläge erstellen'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-[#8b949e] py-12">Lade…</div>
      ) : actions.length === 0 ? (
        <div className="text-center text-[#8b949e] py-12">
          <div className="text-4xl mb-3">⚡</div>
          <div className="text-sm mb-1">Noch keine Vorschläge</div>
          <div className="text-xs text-[#484f58]">Erst E-Mails klassifizieren, dann Vorschläge erstellen</div>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">
                Ausstehend ({pending.length})
              </div>
              <div className="space-y-2">
                {pending.map(action => (
                  <ActionRow key={action.id} action={action} onSkip={() => handleSkip(action.id)} />
                ))}
              </div>
            </div>
          )}

          {applied.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">
                Ausgeführt ({applied.length})
              </div>
              <div className="space-y-2 opacity-60">
                {applied.slice(0, 20).map(action => (
                  <ActionRow key={action.id} action={action} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ActionRow({ action, onSkip }: { action: OrganizeAction; onSkip?: () => void }) {
  const isPending = action.status === '"Pending"'
  return (
    <div className={`flex items-center gap-3 p-3 bg-[#161b22] border border-[#30363d] rounded-lg
      ${!isPending ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[#e6edf3] truncate">{action.email_subject}</div>
        <div className="text-xs text-[#8b949e] mt-0.5 truncate">
          {action.from_address} · {action.reason}
        </div>
        {action.target_folder && (
          <div className="text-xs text-[#58a6ff] mt-0.5">
            → {action.target_folder}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={action.status} />
        {isPending && onSkip && (
          <button
            onClick={onSkip}
            className="px-2 py-1 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] rounded transition-colors"
          >
            Überspringen
          </button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === '"Pending"') return <span className="text-xs text-[#d29922] bg-[#2d2100] px-2 py-0.5 rounded-full">Ausstehend</span>
  if (status === '"Applied"') return <span className="text-xs text-[#3fb950] bg-[#0a2d10] px-2 py-0.5 rounded-full">Ausgeführt</span>
  if (status === '"Skipped"') return <span className="text-xs text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded-full">Übersprungen</span>
  return <span className="text-xs text-[#f85149]">Fehler</span>
}
