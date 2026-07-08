import { useEffect, useState } from 'react'
import { api, categoryEmoji, categoryLabel, type EmailEntry, type EmailCategory, type FolderSuggestion } from '../../lib/tauri'
import { useEmailStore } from '../../stores/emailStore'
import { useT } from '../../lib/i18n'

const ALL_CATEGORIES: EmailCategory[] = [
  'Important', 'Work', 'Private', 'Invoice', 'Package', 'Calendar',
  'Subscription', 'Newsletter', 'Social', 'Ads', 'Government',
  'Spam', 'Phishing', 'FollowUp', 'Review', 'Other',
]

export function ActionsView() {
  const [emails, setEmails] = useState<EmailEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [correcting, setCorrecting] = useState<string | null>(null)
  const [tab, setTab] = useState<'review' | 'ordner' | 'regeln'>('review')
  const t = useT()

  const load = async () => {
    setLoading(true)
    try {
      const all = await api.listEmails(undefined, undefined, 500)
      // Nur E-Mails zeigen die noch nicht vom User bestätigt wurden
      setEmails(all.filter(e => e.classification && e.classification.classified_by !== 'user'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCorrect = async (id: string, newCat: EmailCategory) => {
    await api.updateCategory(id, newCat)
    setEmails(prev => prev.filter(e => e.id !== id))
    setCorrecting(null)
  }

  const handleOk = async (id: string) => {
    const email = emails.find(e => e.id === id)
    if (email?.classification) {
      // Dieselbe Kategorie speichern, aber classified_by = "user" → verschwindet beim nächsten Load
      await api.updateCategory(id, email.classification.category)
    }
    setDismissed(d => new Set([...d, id]))
  }

  const visible = emails.filter(e => !dismissed.has(e.id))

  // Kategorien mit Konfidenz < 0.75 zuerst (unsichere zuerst überprüfen)
  const sorted = [...visible].sort((a, b) => {
    const ca = a.classification?.confidence ?? 1
    const cb = b.classification?.confidence ?? 1
    return ca - cb
  })

  const phishing = sorted.filter(e => (e.classification?.phishing_score ?? 0) > 0.5)
  const lowConf = sorted.filter(e => (e.classification?.confidence ?? 1) < 0.7 && (e.classification?.phishing_score ?? 0) <= 0.5)
  const rest = sorted.filter(e => (e.classification?.confidence ?? 1) >= 0.7 && (e.classification?.phishing_score ?? 0) <= 0.5)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-[#e6edf3]">{t('actions.title')}</h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            {t('actions.subtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#0d1117] p-1 rounded-lg w-fit border border-[#30363d]">
        <button
          onClick={() => setTab('review')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'review' ? 'bg-[#21262d] text-[#e6edf3]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
        >
          🔍 {t('actions.reviewTab')}
          {visible.length > 0 && <span className="ml-1.5 text-xs bg-[#1f6feb] text-white px-1.5 py-0.5 rounded-full">{visible.length}</span>}
        </button>
        <button
          onClick={() => setTab('ordner')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'ordner' ? 'bg-[#21262d] text-[#e6edf3]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
        >
          📁 {t('actions.foldersTab')}
        </button>
        <button
          onClick={() => setTab('regeln')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'regeln' ? 'bg-[#21262d] text-[#e6edf3]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
        >
          📋 {t('actions.rulesTab')}
        </button>
      </div>

      {tab === 'review' && (
        <>
          {/* Info-Box */}
          <div className="mb-5 p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-[#8b949e] flex gap-3 items-start">
            <span className="text-lg mt-0.5">💡</span>
            <div>
              <div className="font-medium text-[#e6edf3] mb-0.5">{t('actions.howReviewWorks')}</div>
              {t('actions.reviewExplain')}
              <br />
              <span className="text-[#58a6ff]">✓ {t('actions.correctChecks')}</span> {t('actions.correctChecksExplain')}
              <br />
              <span className="text-[#d29922]">{t('actions.changeCategory')}</span> {t('actions.changeCategoryExplain')}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-[#8b949e] py-12">{t('actions.loading')}</div>
          ) : visible.length === 0 ? (
            <div className="text-center text-[#8b949e] py-16">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-sm text-[#e6edf3] mb-1">{t('actions.allReviewed')}</div>
              <div className="text-xs text-[#484f58]">
                {dismissed.size > 0 ? `${dismissed.size} ${t('actions.confirmedCount')}` : t('actions.noClassifiedYetReview')}
              </div>
            </div>
          ) : (
            <>
              {phishing.length > 0 && (
                <Section title={`⚠️ ${t('actions.phishingSuspected')}`} color="red" onAllOk={() => phishing.forEach(e => handleOk(e.id))}>
                  {phishing.map(e => (
                    <ReviewCard key={e.id} email={e} correcting={correcting === e.id}
                      onOk={() => handleOk(e.id)}
                      onCorrecting={() => setCorrecting(e.id)}
                      onCorrect={cat => handleCorrect(e.id, cat)}
                      onCancelCorrect={() => setCorrecting(null)}
                    />
                  ))}
                </Section>
              )}
              {lowConf.length > 0 && (
                <Section title={`🤔 ${t('actions.uncertain')}`} color="yellow" onAllOk={() => lowConf.forEach(e => handleOk(e.id))}>
                  {lowConf.map(e => (
                    <ReviewCard key={e.id} email={e} correcting={correcting === e.id}
                      onOk={() => handleOk(e.id)}
                      onCorrecting={() => setCorrecting(e.id)}
                      onCorrect={cat => handleCorrect(e.id, cat)}
                      onCancelCorrect={() => setCorrecting(null)}
                    />
                  ))}
                </Section>
              )}
              {rest.length > 0 && (
                <Section title={`✅ ${t('actions.confident')}`} color="green" onAllOk={() => rest.forEach(e => handleOk(e.id))}>
                  {rest.map(e => (
                    <ReviewCard key={e.id} email={e} correcting={correcting === e.id}
                      onOk={() => handleOk(e.id)}
                      onCorrecting={() => setCorrecting(e.id)}
                      onCorrect={cat => handleCorrect(e.id, cat)}
                      onCancelCorrect={() => setCorrecting(null)}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </>
      )}

      {tab === 'ordner' && <OrdnerTab />}
      {tab === 'regeln' && <RegelnTab />}
    </div>
  )
}

function Section({ title, color, children, onAllOk }: {
  title: string; color: 'red' | 'yellow' | 'green'; children: React.ReactNode; onAllOk: () => void
}) {
  const t = useT()
  const borderColor = { red: '#f85149', yellow: '#d29922', green: '#3fb950' }[color]
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider"
          style={{ color: borderColor }}>{title}</div>
        <button onClick={onAllOk} className="text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors">
          {t('actions.confirmAll')}
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ReviewCard({ email, correcting, onOk, onCorrecting, onCorrect, onCancelCorrect }: {
  email: EmailEntry
  correcting: boolean
  onOk: () => void
  onCorrecting: () => void
  onCorrect: (cat: EmailCategory) => void
  onCancelCorrect: () => void
}) {
  const t = useT()
  const cls = email.classification!
  const conf = Math.round((cls.confidence ?? 0) * 100)
  const preview = email.body_text?.slice(0, 120).trim().replace(/\s+/g, ' ')

  return (
    <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
      <div className="flex items-start gap-3">
        {/* Kategorie-Badge */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center text-xl">
            {categoryEmoji(cls.category)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-[#e6edf3] truncate">{email.subject || t('emailList.noSubject')}</span>
            {(cls.phishing_score ?? 0) > 0.5 && (
              <span className="text-xs text-[#f85149] bg-[#f8514920] px-1.5 py-0.5 rounded flex-shrink-0">⚠️ Phishing</span>
            )}
          </div>
          <div className="text-xs text-[#8b949e] mb-1">
            {email.from.name ?? email.from.address}
          </div>
          {preview && (
            <div className="text-xs text-[#484f58] mb-1.5 line-clamp-2">{preview}</div>
          )}
          {cls.summary && (
            <div className="text-xs text-[#8b949e] bg-[#21262d] rounded px-2 py-1 mb-1.5 italic">
              "{cls.summary}"
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#21262d] text-[#58a6ff]">
              {categoryEmoji(cls.category)} {categoryLabel(cls.category)}
            </span>
            <span className="text-xs text-[#484f58]">{conf}% {t('emailDetail.confidence')}</span>
            {cls.classified_by === 'user' && (
              <span className="text-xs text-[#3fb950]">{t('actions.correctedByUser')}</span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex-shrink-0 flex flex-col gap-1.5">
          <button
            onClick={onOk}
            className="px-3 py-1 text-xs bg-[#238636] hover:bg-[#2ea043] text-white rounded transition-colors whitespace-nowrap"
          >
            ✓ {t('actions.matches')}
          </button>
          <button
            onClick={correcting ? onCancelCorrect : onCorrecting}
            className="px-3 py-1 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] rounded transition-colors whitespace-nowrap"
          >
            {correcting ? `✕ ${t('actions.cancelBtn')}` : `✏️ ${t('actions.changed')}`}
          </button>
        </div>
      </div>

      {/* Kategorie-Auswahl */}
      {correcting && (
        <div className="mt-3 pt-3 border-t border-[#30363d]">
          <div className="text-xs text-[#8b949e] mb-2">{t('actions.chooseCorrectCategory')}</div>
          <div className="grid grid-cols-4 gap-1.5">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => onCorrect(cat)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors
                  ${cls.category === cat
                    ? 'bg-[#1f6feb] text-white'
                    : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]'}`}
              >
                <span>{categoryEmoji(cat)}</span>
                <span className="truncate">{categoryLabel(cat)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OrdnerTab() {
  const accounts = useEmailStore(s => s)
  const [accountId, setAccountId] = useState<string>('')
  const [accountList, setAccountList] = useState<{ id: string; label: string }[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<FolderSuggestion[]>([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useT()
  const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    merge:  { label: t('actions.actionMerge'),  color: '#58a6ff' },
    rename: { label: t('actions.actionRename'), color: '#d29922' },
    create: { label: t('actions.actionCreate'), color: '#3fb950' },
    delete: { label: t('actions.actionDelete'), color: '#f85149' },
  }

  useEffect(() => {
    api.listAccounts().then(accs => {
      setAccountList(accs.map(a => ({ id: a.id, label: a.label || a.email_address })))
      if (accs.length > 0) setAccountId(accs[0].id)
    })
  }, [])

  const loadFolders = async () => {
    if (!accountId) return
    setLoadingFolders(true)
    setError(null)
    try {
      const result = await api.listMailboxes(accountId)
      setFolders(result.sort())
    } catch (e: any) {
      setError(e?.message ?? t('actions.folderLoadError'))
    } finally {
      setLoadingFolders(false)
    }
  }

  const loadSuggestions = async () => {
    if (!accountId) return
    setLoadingSuggestions(true)
    setError(null)
    try {
      const result = await api.suggestFolderReorganization(accountId)
      setSuggestions(result)
    } catch (e: any) {
      setError(e?.message ?? t('actions.aiAnalysisError'))
    } finally {
      setLoadingSuggestions(false)
    }
  }

  return (
    <div>
      <div className="mb-4 p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-[#8b949e] flex gap-3">
        <span className="text-lg">📁</span>
        <div>
          <div className="font-medium text-[#e6edf3] mb-0.5">{t('actions.folderIntroTitle')}</div>
          {t('actions.folderIntroText')}
        </div>
      </div>

      {accountList.length > 1 && (
        <select
          value={accountId}
          onChange={e => { setAccountId(e.target.value); setFolders([]); setSuggestions([]) }}
          className="w-full mb-3 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
        >
          {accountList.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      )}

      {error && (
        <div className="mb-3 p-2 bg-[#f8514920] border border-[#f85149] rounded text-xs text-[#f85149]">{error}</div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={loadFolders}
          disabled={!accountId || loadingFolders}
          className="flex-1 py-2 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] rounded-md transition-colors disabled:opacity-50"
        >
          {loadingFolders ? t('actions.loadingFolders') : `📁 ${t('actions.loadFolders')}`}
        </button>
        <button
          onClick={loadSuggestions}
          disabled={!accountId || loadingSuggestions}
          className="flex-1 py-2 text-xs bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-md transition-colors disabled:opacity-50"
        >
          {loadingSuggestions ? t('actions.aiAnalyzing') : `✨ ${t('actions.aiSuggestions')}`}
        </button>
      </div>

      {folders.length > 0 && (
        <div className="mb-5">
          <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
            {t('actions.currentFolders')} ({folders.length})
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg divide-y divide-[#21262d]">
            {folders.map(f => (
              <div key={f} className="flex items-center gap-2 px-3 py-2 text-sm text-[#c9d1d9]">
                <span className="text-[#484f58]">📂</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
            {t('actions.aiSuggestions')}
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const meta = ACTION_LABELS[s.action] ?? { label: s.action, color: '#8b949e' }
              return (
                <div key={i} className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: meta.color + '20', color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <span className="text-sm text-[#e6edf3] font-medium truncate">{s.folder}</span>
                        {s.target && (
                          <>
                            <span className="text-[#484f58] text-xs">→</span>
                            <span className="text-sm text-[#8b949e] truncate">{s.target}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-[#8b949e]">{s.reason}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-[#484f58]">
            {t('actions.suggestionsNotAutoExecuted')}
          </p>
        </div>
      )}

      {folders.length === 0 && suggestions.length === 0 && !loadingFolders && !loadingSuggestions && (
        <div className="text-center text-[#484f58] text-sm py-8">
          {t('actions.loadFoldersOrSuggestions')}
        </div>
      )}
    </div>
  )
}

function RegelnTab() {
  const [on, setOn] = useState<Record<string, boolean>>({})
  const t = useT()
  const REGEL_VORLAGEN = [
    { emoji: '📰', label: t('actions.ruleNewsletterLabel'), desc: t('actions.ruleNewsletterDesc') },
    { emoji: '🗑️', label: t('actions.ruleAdsLabel'), desc: t('actions.ruleAdsDesc') },
    { emoji: '🧾', label: t('actions.ruleInvoiceLabel'), desc: t('actions.ruleInvoiceDesc') },
    { emoji: '📦', label: t('actions.rulePackageLabel'), desc: t('actions.rulePackageDesc') },
    { emoji: '⚠️', label: t('actions.rulePhishingLabel'), desc: t('actions.rulePhishingDesc') },
    { emoji: '🔄', label: t('actions.ruleSubscriptionLabel'), desc: t('actions.ruleSubscriptionDesc') },
  ]
  return (
    <div>
      <div className="mb-4 p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-[#8b949e] flex gap-3">
        <span className="text-lg">📋</span>
        <div>
          <div className="font-medium text-[#e6edf3] mb-0.5">{t('actions.rulesInDev')}</div>
          {t('actions.rulesIntroText')}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {REGEL_VORLAGEN.map(r => (
          <div key={r.label} className="flex items-center justify-between p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">{r.emoji}</span>
              <div>
                <div className="text-sm font-medium text-[#e6edf3]">{r.label}</div>
                <div className="text-xs text-[#8b949e]">{r.desc}</div>
              </div>
            </div>
            <button
              onClick={() => setOn(s => ({ ...s, [r.label]: !s[r.label] }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${on[r.label] ? 'bg-[#238636]' : 'bg-[#30363d]'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${on[r.label] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <button className="w-full p-3 border border-dashed border-[#30363d] rounded-lg text-xs text-[#8b949e] hover:border-[#58a6ff] hover:text-[#58a6ff] transition-colors">
        + {t('actions.createOwnRule')}
      </button>
    </div>
  )
}
