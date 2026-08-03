import { useState } from 'react'
import { api, formatBytes, categoryLabel, categoryEmoji, type EmailEntry } from '../../lib/tauri'
import { useT, dateLocale } from '../../lib/i18n'

interface Props { email: EmailEntry }

export function EmailDetail({ email }: Props) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [flagged, setFlagged] = useState(email.is_flagged)
  const t = useT()

  const cls = email.classification

  const handleSummarize = async () => {
    setLoadingSummary(true)
    try {
      const s = await api.generateSummary(email.id)
      setSummary(s)
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleFlag = async () => {
    const newFlagged = !flagged
    setFlagged(newFlagged)
    await api.markFlagged(email.id, newFlagged).catch(() => setFlagged(flagged))
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gh-border bg-gh-surface">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-base font-medium text-gh-text flex-1">
            {email.subject || t('emailList.noSubject')}
          </h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleSummarize}
              disabled={loadingSummary}
              className="px-2.5 py-1 text-xs bg-[#21262d] hover:bg-gh-border text-gh-muted hover:text-gh-text rounded-sm transition-colors disabled:opacity-50"
            >
              {loadingSummary ? '…' : `🤖 ${t('emailDetail.summarize')}`}
            </button>
            <button
              onClick={handleFlag}
              className={`px-2 py-1 text-xs rounded-sm transition-colors ${flagged
                ? 'bg-gh-yellow text-black'
                : 'bg-[#21262d] text-gh-muted hover:text-gh-text'}`}
            >
              ⭐
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-gh-muted">{t('emailDetail.from')}: </span>
            <span className="text-[#c9d1d9]">{email.from.name ? `${email.from.name} <${email.from.address}>` : email.from.address}</span>
          </div>
          <div>
            <span className="text-gh-muted">{t('emailDetail.date')}: </span>
            <span className="text-[#c9d1d9]">{new Date(email.date).toLocaleString(dateLocale())}</span>
          </div>
          {email.to.length > 0 && (
            <div>
              <span className="text-gh-muted">{t('emailDetail.to')}: </span>
              <span className="text-[#c9d1d9]">{email.to.map(a => a.address).join(', ')}</span>
            </div>
          )}
          {email.attachments.length > 0 && (
            <div>
              <span className="text-gh-muted">{t('emailDetail.attachments')}: </span>
              <span className="text-[#c9d1d9]">{email.attachments.length} {t('emailDetail.files')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Classification Badge */}
      {cls && (
        <div className="px-4 py-2 border-b border-gh-border bg-gh-bg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#21262d] rounded-full text-xs text-gh-text">
              {categoryEmoji(cls.category)} {categoryLabel(cls.category)}
              <span className="text-gh-muted ml-1">{Math.round(cls.confidence * 100)}%</span>
            </span>
            {cls.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gh-surface border border-gh-border rounded-full text-xs text-gh-muted">
                {tag}
              </span>
            ))}
            {cls.phishing_score > 0.5 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3d1a1a] border border-gh-red rounded-full text-xs text-gh-red">
                ⚠️ {t('emailDetail.phishingSuspicion')} ({Math.round(cls.phishing_score * 100)}%)
              </span>
            )}
            {cls.is_subscription && cls.cancel_link && (
              <span className="px-2 py-0.5 bg-gh-surface border border-gh-yellow rounded-full text-xs text-gh-yellow">
                🔄 {t('emailDetail.subscription')} · {t('emailDetail.cancel')}: {cls.cancel_link.substring(0, 40)}…
              </span>
            )}
          </div>

          {/* Extracted data */}
          {(cls.extracted_amount || cls.tracking_number || cls.extracted_due_date) && (
            <div className="flex flex-wrap gap-3 mt-2 text-xs">
              {cls.extracted_amount != null && (
                <span className="text-gh-green">
                  💰 {cls.extracted_amount.toFixed(2)} {cls.extracted_currency ?? ''}
                  {cls.extracted_due_date && ` · ${t('emailDetail.due')}: ${cls.extracted_due_date}`}
                </span>
              )}
              {cls.tracking_number && (
                <span className="text-gh-green">
                  📦 {cls.tracking_carrier ? `${cls.tracking_carrier}: ` : ''}{cls.tracking_number}
                </span>
              )}
            </div>
          )}

          {/* AI Summary */}
          {(summary ?? cls.summary) && (
            <div className="mt-2 text-xs text-gh-muted italic bg-gh-surface px-3 py-2 rounded-md">
              🤖 {summary ?? cls.summary}
            </div>
          )}

          {/* Reply suggestion */}
          {cls.reply_suggestion && (
            <div className="mt-2 text-xs text-gh-blue bg-[#0d2044] px-3 py-2 rounded-md">
              ↩️ {t('emailDetail.replySuggestion')}: <em>{cls.reply_suggestion}</em>
            </div>
          )}

          {/* Follow-up */}
          {cls.follow_up_hint && (
            <div className="mt-2 text-xs text-gh-orange bg-[#2d1a0a] px-3 py-2 rounded-md">
              🔔 {cls.follow_up_hint}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 p-4">
        {email.body_text ? (
          <pre className="text-sm text-[#c9d1d9] whitespace-pre-wrap font-sans leading-relaxed">
            {email.body_text}
          </pre>
        ) : (
          <div className="text-sm text-gh-muted italic">{t('emailDetail.noBodyText')}</div>
        )}
      </div>

      {/* Attachments */}
      {email.attachments.length > 0 && (
        <div className="p-4 border-t border-gh-border">
          <div className="text-xs font-semibold text-gh-muted uppercase tracking-wider mb-2">{t('emailDetail.attachments')}</div>
          <div className="flex flex-wrap gap-2">
            {email.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 bg-gh-surface border border-gh-border rounded-md px-3 py-1.5">
                <span className="text-sm">📎</span>
                <div>
                  <div className="text-xs text-gh-text">{att.filename}</div>
                  <div className="text-xs text-[#484f58]">{formatBytes(att.size)} · {att.mime_type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
