import { useEffect, useRef, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useAccountStore } from '../../stores/accountStore'
import { api, categoryLabel, categoryEmoji, categoryColor, type EmailCategory } from '../../lib/tauri'

interface Props { onNavigate: (tab: 'emails' | 'actions' | 'settings') => void }

const AUTO_SYNC_INTERVAL_MS = 60_000

function relativeTime(raw: number | string | undefined): string {
  if (!raw) return ''
  // ISO-String ("2026-06-29T10:54:32Z") oder Unix-Timestamp (Zahl oder Zahl-String)
  let ms: number
  if (typeof raw === 'string' && raw.includes('T')) {
    ms = new Date(raw).getTime()
  } else {
    const n = typeof raw === 'string' ? parseFloat(raw) : raw
    // Rust speichert als Unix-Sekunden; Millisekunden sind >1e11
    ms = n < 1e11 ? n * 1000 : n
  }
  if (isNaN(ms)) return ''
  const diff = Math.floor((Date.now() - ms) / 1000)
  if (diff < 10) return 'gerade eben'
  if (diff < 60) return `vor ${diff} Sek.`
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`
  return `vor ${Math.floor(diff / 86400)} Tagen`
}

export function Dashboard({ onNavigate }: Props) {
  const { accounts, stats, loadStats, loadAccounts, setSyncing, syncing } = useAccountStore()
  const [classifying, setClassifying] = useState(false)
  const [classifyProgress, setClassifyProgress] = useState<{ done: number; total: number } | null>(null)
  const [syncResults, setSyncResults] = useState<Record<string, { count: number; error?: string }>>({})
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem('autoSync') === 'true')
  const [, setTick] = useState(0)
  const autoSyncTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Relative-Zeit jede Minute neu berechnen
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 10_000)
    return () => clearInterval(t)
  }, [])

  const syncAll = async () => {
    for (const acc of accounts) {
      if (!acc.enabled) continue
      setSyncing(acc.id)
      try {
        const count = await api.syncAccount(acc.id)
        setSyncResults(r => ({ ...r, [acc.id]: { count } }))
      } catch (e: any) {
        setSyncResults(r => ({ ...r, [acc.id]: { count: 0, error: String(e) } }))
      } finally {
        setSyncing(null)
      }
    }
    await loadAccounts()
    await loadStats()
  }

  const handleSync = async (accountId: string) => {
    setSyncing(accountId)
    setSyncResults(r => ({ ...r, [accountId]: { count: 0 } }))
    try {
      const count = await api.syncAccount(accountId)
      setSyncResults(r => ({ ...r, [accountId]: { count } }))
    } catch (e: any) {
      setSyncResults(r => ({ ...r, [accountId]: { count: 0, error: String(e) } }))
    } finally {
      setSyncing(null)
      await loadAccounts()
      await loadStats()
    }
  }

  // Auto-Sync ein/ausschalten
  useEffect(() => {
    localStorage.setItem('autoSync', String(autoSync))
    if (autoSync) {
      autoSyncTimer.current = setInterval(syncAll, AUTO_SYNC_INTERVAL_MS)
    } else {
      if (autoSyncTimer.current) clearInterval(autoSyncTimer.current)
    }
    return () => { if (autoSyncTimer.current) clearInterval(autoSyncTimer.current) }
  }, [autoSync, accounts])

  const handleClassify = async () => {
    setClassifying(true)
    setClassifyProgress({ done: 0, total: 0 })
    try {
      const total = await api.classifyBatch(500)
      setClassifyProgress(p => p ? { ...p, total } : { done: 0, total })
    } catch {
      setClassifying(false)
    }
  }

  const chartData = stats ? Object.entries(stats.by_category).map(([cat, count]) => ({
    name: categoryLabel(cat as EmailCategory),
    value: count,
    fill: categoryColor(cat as EmailCategory),
  })) : []

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <div className="text-xs text-[#8b949e] mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color ?? 'text-[#e6edf3]'}`}>{value}</div>
      {sub && <div className="text-xs text-[#8b949e] mt-0.5">{sub}</div>}
    </div>
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#e6edf3]">Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={handleClassify}
            disabled={classifying}
            className="px-3 py-1.5 text-xs bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-md transition-colors disabled:opacity-50"
          >
            {classifying
              ? classifyProgress
                ? `Klassifiziere... ${classifyProgress.done}/${classifyProgress.total}`
                : 'Starte...'
              : '🤖 KI klassifizieren'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        <StatCard label="E-Mails gesamt" value={stats?.total_emails ?? 0} />
        <StatCard label="Ungelesen" value={stats?.unread_count ?? 0} color="text-[#58a6ff]" />
        <StatCard label="Klassifiziert" value={stats?.classified_count ?? 0} color="text-[#3fb950]" />
        <StatCard label="Konten" value={stats?.accounts_count ?? 0} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        <StatCard label="Phishing erkannt" value={stats?.phishing_count ?? 0} color="text-[#f85149]"
          sub={stats?.phishing_count ? '⚠️ Pruefen!' : '✓ Sicher'} />
        <StatCard label="Pakete" value={stats?.packages_count ?? 0} color="text-[#3fb950]" />
        <StatCard label="Abos" value={stats?.subscriptions_count ?? 0} color="text-[#d29922]" />
        <StatCard label="Follow-ups" value={stats?.follow_up_count ?? 0} color="text-[#f0883e]" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Pie Chart */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[#e6edf3] mb-3">Verteilung nach Kategorie</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={80}
                  dataKey="value" nameKey="name">
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px' }}
                  labelStyle={{ color: '#e6edf3' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[#8b949e] text-sm">
              Noch keine klassifizierten E-Mails
            </div>
          )}
        </div>

        {/* Category List */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[#e6edf3] mb-3">Top Kategorien</h3>
          <div className="space-y-1.5 overflow-y-auto max-h-[200px]">
            {Object.entries(stats?.by_category ?? {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([cat, count]) => (
                <button
                  key={cat}
                  onClick={() => onNavigate('emails')}
                  className="flex items-center justify-between w-full px-2 py-1 rounded hover:bg-[#21262d] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span>{categoryEmoji(cat as EmailCategory)}</span>
                    <span className="text-sm text-[#c9d1d9] group-hover:text-[#e6edf3]">
                      {categoryLabel(cat as EmailCategory)}
                    </span>
                  </div>
                  <span className="text-xs text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Accounts */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#e6edf3]">Konten</h3>
          <div className="flex items-center gap-3">
            {/* Auto-Sync Toggle */}
            <button
              onClick={() => setAutoSync(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                autoSync
                  ? 'border-[#3fb950] text-[#3fb950] bg-[#3fb95015]'
                  : 'border-[#30363d] text-[#8b949e] hover:border-[#484f58]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoSync ? 'bg-[#3fb950] animate-pulse' : 'bg-[#484f58]'}`} />
              Auto-Sync {autoSync ? 'aktiv' : 'aus'}
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs text-[#58a6ff] hover:underline"
            >
              + Konto hinzufuegen
            </button>
          </div>
        </div>

        {autoSync && (
          <div className="mb-3 text-xs text-[#484f58] flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#3fb950] animate-pulse" />
            Synchronisiert automatisch jede Minute
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="text-sm text-[#8b949e] text-center py-4">
            Noch keine Konten konfiguriert.<br />
            <button onClick={() => onNavigate('settings')} className="text-[#58a6ff] hover:underline mt-1">
              Jetzt Konto hinzufuegen →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map(acc => {
              const result = syncResults[acc.id]
              const isSyncing = syncing === acc.id
              return (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-[#0d1117] rounded-md">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="text-sm text-[#e6edf3] font-medium truncate">{acc.label}</div>
                      {isSyncing && (
                        <span className="text-xs text-[#58a6ff] animate-pulse flex-shrink-0">syncing...</span>
                      )}
                    </div>
                    <div className="text-xs text-[#8b949e] truncate">{acc.email_address}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {acc.last_sync ? (
                        <span className="text-xs text-[#484f58]">
                          Letzter Sync: {relativeTime(acc.last_sync)}
                        </span>
                      ) : (
                        <span className="text-xs text-[#484f58]">Noch nicht synchronisiert</span>
                      )}
                      {result && !isSyncing && (
                        result.error ? (
                          <span className="text-xs text-[#f85149]">Fehler</span>
                        ) : (
                          <span className="text-xs text-[#3fb950]">
                            {result.count > 0 ? `+${result.count} neu` : 'Aktuell'}
                          </span>
                        )
                      )}
                    </div>
                    {result?.error && !isSyncing && (
                      <div className="text-xs text-[#f85149] mt-0.5 truncate">{result.error}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleSync(acc.id)}
                    disabled={!!syncing}
                    className={`ml-3 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors disabled:opacity-50
                      ${isSyncing
                        ? 'bg-[#1f6feb] text-white'
                        : 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3]'}`}
                  >
                    <span className={isSyncing ? 'animate-spin inline-block' : ''}>⟳</span>
                    {isSyncing ? 'Sync...' : 'Sync'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
