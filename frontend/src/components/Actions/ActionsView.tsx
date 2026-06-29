import { useEffect, useState } from 'react'
import { api, categoryEmoji, categoryLabel, type EmailEntry, type EmailCategory } from '../../lib/tauri'

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
  const [tab, setTab] = useState<'review' | 'regeln'>('review')

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
          <h2 className="text-xl font-semibold text-[#e6edf3]">Aktionen</h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            KI-Klassifizierungen prüfen und korrigieren
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#0d1117] p-1 rounded-lg w-fit border border-[#30363d]">
        <button
          onClick={() => setTab('review')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'review' ? 'bg-[#21262d] text-[#e6edf3]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
        >
          🔍 KI überprüfen
          {visible.length > 0 && <span className="ml-1.5 text-xs bg-[#1f6feb] text-white px-1.5 py-0.5 rounded-full">{visible.length}</span>}
        </button>
        <button
          onClick={() => setTab('regeln')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'regeln' ? 'bg-[#21262d] text-[#e6edf3]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
        >
          📋 Regeln
        </button>
      </div>

      {tab === 'review' && (
        <>
          {/* Info-Box */}
          <div className="mb-5 p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-[#8b949e] flex gap-3 items-start">
            <span className="text-lg mt-0.5">💡</span>
            <div>
              <div className="font-medium text-[#e6edf3] mb-0.5">So funktioniert die KI-Überprüfung</div>
              Die KI hat deine E-Mails automatisch kategorisiert. Hier kannst du prüfen ob das stimmt.
              <br />
              <span className="text-[#58a6ff]">✓ Stimmt</span> = Kategorie ist korrekt, E-Mail verschwindet aus der Liste.
              <br />
              <span className="text-[#d29922]">Kategorie ändern</span> = Du korrigierst die Einordnung.
            </div>
          </div>

          {loading ? (
            <div className="text-center text-[#8b949e] py-12">Lade…</div>
          ) : visible.length === 0 ? (
            <div className="text-center text-[#8b949e] py-16">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-sm text-[#e6edf3] mb-1">Alles überprüft!</div>
              <div className="text-xs text-[#484f58]">
                {dismissed.size > 0 ? `${dismissed.size} E-Mails bestätigt.` : 'Noch keine klassifizierten E-Mails — erst "KI klassifizieren" im Dashboard.'}
              </div>
            </div>
          ) : (
            <>
              {phishing.length > 0 && (
                <Section title="⚠️ Phishing-Verdacht" color="red" onAllOk={() => phishing.forEach(e => handleOk(e.id))}>
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
                <Section title="🤔 Unsichere Einordnung" color="yellow" onAllOk={() => lowConf.forEach(e => handleOk(e.id))}>
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
                <Section title="✅ Sicher eingeordnet" color="green" onAllOk={() => rest.forEach(e => handleOk(e.id))}>
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

      {tab === 'regeln' && <RegelnTab />}
    </div>
  )
}

function Section({ title, color, children, onAllOk }: {
  title: string; color: 'red' | 'yellow' | 'green'; children: React.ReactNode; onAllOk: () => void
}) {
  const borderColor = { red: '#f85149', yellow: '#d29922', green: '#3fb950' }[color]
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider"
          style={{ color: borderColor }}>{title}</div>
        <button onClick={onAllOk} className="text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors">
          Alle bestätigen
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
            <span className="text-sm font-medium text-[#e6edf3] truncate">{email.subject || '(kein Betreff)'}</span>
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
            <span className="text-xs text-[#484f58]">{conf}% Konfidenz</span>
            {cls.classified_by === 'user' && (
              <span className="text-xs text-[#3fb950]">vom Nutzer korrigiert</span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex-shrink-0 flex flex-col gap-1.5">
          <button
            onClick={onOk}
            className="px-3 py-1 text-xs bg-[#238636] hover:bg-[#2ea043] text-white rounded transition-colors whitespace-nowrap"
          >
            ✓ Stimmt
          </button>
          <button
            onClick={correcting ? onCancelCorrect : onCorrecting}
            className="px-3 py-1 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] rounded transition-colors whitespace-nowrap"
          >
            {correcting ? '✕ Abbrechen' : '✏️ Ändern'}
          </button>
        </div>
      </div>

      {/* Kategorie-Auswahl */}
      {correcting && (
        <div className="mt-3 pt-3 border-t border-[#30363d]">
          <div className="text-xs text-[#8b949e] mb-2">Richtige Kategorie wählen:</div>
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

const REGEL_VORLAGEN = [
  { emoji: '📰', label: 'Newsletter', desc: 'Newsletter automatisch archivieren' },
  { emoji: '🗑️', label: 'Werbung', desc: 'Werbemails direkt löschen' },
  { emoji: '🧾', label: 'Rechnungen', desc: 'In Ordner "Rechnungen" verschieben' },
  { emoji: '📦', label: 'Pakete', desc: 'In Ordner "Pakete" verschieben' },
  { emoji: '⚠️', label: 'Phishing', desc: 'Als Spam markieren und löschen' },
  { emoji: '🔄', label: 'Abos', desc: 'In Ordner "Abos" verschieben' },
]

function RegelnTab() {
  const [on, setOn] = useState<Record<string, boolean>>({})
  return (
    <div>
      <div className="mb-4 p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-[#8b949e] flex gap-3">
        <span className="text-lg">📋</span>
        <div>
          <div className="font-medium text-[#e6edf3] mb-0.5">Automatische Regeln (in Entwicklung)</div>
          Regeln werden nach jedem Sync automatisch angewendet. Aktiviere hier Vorlagen oder erstelle eigene.
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
        + Eigene Regel erstellen (kommt bald)
      </button>
    </div>
  )
}
