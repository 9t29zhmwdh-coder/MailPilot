import { useState } from 'react'
import { useEmailStore } from '../../stores/emailStore'
import { EmailDetail } from '../EmailDetail/EmailDetail'
import { api, formatDate, categoryEmoji, categoryLabel, formatBytes, type EmailEntry } from '../../lib/tauri'

export function EmailList() {
  const { emails, selected, selectEmail, markAsRead, loading, searchQuery, setSearch, loadEmails } = useEmailStore()
  const [searchFocused, setSearchFocused] = useState(false)

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (q.length >= 2) {
      const results = await api.searchEmails(q).catch(() => [] as EmailEntry[])
      useEmailStore.setState({ emails: results })
    } else if (q.length === 0) {
      loadEmails()
    }
  }

  const handleSelect = (email: EmailEntry) => {
    selectEmail(email)
    if (!email.is_read) markAsRead(email.id)
  }

  const filtered = emails

  return (
    <div className="flex h-full">
      {/* Email List Panel */}
      <div className="w-80 flex-shrink-0 border-r border-[#30363d] flex flex-col">
        {/* Search */}
        <div className="p-2 border-b border-[#30363d]">
          <input
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Suchen…"
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
          />
        </div>

        {/* Email rows */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[#8b949e] text-sm">Lade…</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[#8b949e] text-sm">Keine E-Mails</div>
          ) : (
            filtered.map(email => (
              <EmailRow
                key={email.id}
                email={email}
                selected={selected?.id === email.id}
                onClick={() => handleSelect(email)}
              />
            ))
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <EmailDetail email={selected} />
        ) : (
          <div className="flex items-center justify-center h-full text-[#8b949e]">
            <div className="text-center">
              <div className="text-4xl mb-2">📭</div>
              <div>E-Mail auswählen</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmailRow({ email, selected, onClick }: { email: EmailEntry; selected: boolean; onClick: () => void }) {
  const cat = email.classification?.category
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-b border-[#21262d] transition-colors
        ${selected ? 'bg-[#21262d]' : 'hover:bg-[#161b22]'}`}
    >
      <div className="flex items-start justify-between gap-1 mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {!email.is_read && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] flex-shrink-0 mt-1" />
          )}
          <span className="text-xs text-[#8b949e] truncate">
            {email.from.name ?? email.from.address}
          </span>
        </div>
        <span className="text-xs text-[#484f58] flex-shrink-0">{formatDate(email.date)}</span>
      </div>
      <div className={`text-sm truncate mb-0.5 ${email.is_read ? 'text-[#8b949e]' : 'text-[#e6edf3] font-medium'}`}>
        {email.subject || '(kein Betreff)'}
      </div>
      <div className="flex items-center gap-1.5">
        {cat && (
          <span className="text-xs text-[#484f58]">
            {categoryEmoji(cat)} {categoryLabel(cat)}
          </span>
        )}
        {email.attachments.length > 0 && (
          <span className="text-xs text-[#484f58]">📎 {email.attachments.length}</span>
        )}
        {email.is_flagged && <span className="text-xs">⭐</span>}
        {(email.classification?.phishing_score ?? 0) > 0.5 && (
          <span className="text-xs text-[#f85149]">⚠️</span>
        )}
      </div>
    </button>
  )
}
