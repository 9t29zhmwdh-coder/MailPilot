import { useEffect, useState } from 'react'
import { api, actionFailureReason, type OrganizeAction } from '../../lib/tauri'
import { useT } from '../../lib/i18n'

/// The only place in the app where mailboxes are changed on the IMAP server.
///
/// Every row is a proposal that stays untouched until it is confirmed here, which
/// is the same review-before-effect principle the classification screen follows.
/// Failures are shown with the server's own reason rather than swallowed: an
/// action that reports success while the message never moved would be worse than
/// no action at all.
export function OrganizeTab() {
  const [actions, setActions] = useState<OrganizeAction[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const t = useT()

  const load = async () => {
    setLoading(true)
    try {
      setActions(await api.listActions())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const statusOf = (a: OrganizeAction) =>
    typeof a.status === 'string' ? a.status : 'Failed'

  const pending = actions.filter(a => statusOf(a) === 'Pending')
  const failed = actions.filter(a => statusOf(a) === 'Failed')
  const applied = actions.filter(a => statusOf(a) === 'Applied')

  const handlePropose = async () => {
    setBusy('propose')
    try {
      const n = await api.proposeActions()
      setNotice(`${n} ${t('actions.proposalsCreated')}`)
      await load()
    } finally {
      setBusy(null)
    }
  }

  const handleApply = async (id: string) => {
    setBusy(id)
    try {
      const status = await api.applyAction(id)
      const reason = actionFailureReason(status)
      if (reason) setNotice(`${t('actions.failedLabel')}: ${reason}`)
      await load()
    } finally {
      setBusy(null)
    }
  }

  const handleApplyAll = async () => {
    setBusy('all')
    try {
      const report = await api.applyAllActions()
      // Both numbers are shown even when nothing failed, so a run that silently
      // did nothing cannot be mistaken for a successful one.
      const parts = [`${report.applied} ${t('actions.appliedCount')}`]
      if (report.failed > 0) {
        parts.push(`${report.failed} ${t('actions.failedCount')}`)
        if (report.first_error) parts.push(report.first_error)
      }
      setNotice(parts.join(', '))
      await load()
    } finally {
      setBusy(null)
    }
  }

  const handleSkip = async (id: string) => {
    setBusy(id)
    try {
      await api.skipAction(id)
      await load()
    } finally {
      setBusy(null)
    }
  }

  const handleSkipAll = async () => {
    setBusy('skipall')
    try {
      await api.skipAllActions()
      await load()
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <div className="text-sm text-gh-muted">...</div>
  }

  return (
    <>
      <div className="mb-5 p-3 bg-gh-surface border border-gh-border rounded-lg text-xs text-gh-muted flex gap-3 items-start">
        <span className="text-lg mt-0.5">📮</span>
        <div>
          <div>{t('actions.organizeIntro')}</div>
          <div className="mt-1 text-gh-yellow">{t('actions.serverWarning')}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <button
          onClick={handlePropose}
          disabled={busy !== null}
          className="px-3 py-1.5 text-sm rounded-md bg-[#21262d] text-gh-text border border-gh-border hover:bg-gh-border disabled:opacity-50"
        >
          {t('actions.propose')}
        </button>
        <button
          onClick={handleApplyAll}
          disabled={busy !== null || pending.length === 0}
          className="px-3 py-1.5 text-sm rounded-md bg-[#1f6feb] text-white hover:bg-[#388bfd] disabled:opacity-50"
        >
          {t('actions.applyAll')} ({pending.length})
        </button>
        <button
          onClick={handleSkipAll}
          disabled={busy !== null || pending.length === 0}
          className="px-3 py-1.5 text-sm rounded-md bg-[#21262d] text-gh-muted border border-gh-border hover:text-gh-text disabled:opacity-50"
        >
          {t('actions.skipAll')}
        </button>
        {applied.length > 0 && (
          <span className="text-xs text-gh-green ml-1">
            {applied.length} {t('actions.appliedLabel')}
          </span>
        )}
      </div>

      {notice && (
        <div className="mb-4 p-3 bg-gh-surface border border-gh-border rounded-lg text-xs text-gh-text flex justify-between gap-3">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-gh-muted hover:text-gh-text">✕</button>
        </div>
      )}

      {failed.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gh-red mb-2">{t('actions.failedLabel')} ({failed.length})</div>
          {failed.map(a => (
            <div key={a.id} className="mb-2 p-3 bg-gh-surface border border-gh-red/40 rounded-lg">
              <div className="text-sm text-gh-text truncate">{a.email_subject}</div>
              <div className="text-xs text-gh-muted mt-0.5">{a.from_address}</div>
              <div className="text-xs text-gh-red mt-1">{actionFailureReason(a.status)}</div>
              <button
                onClick={() => handleApply(a.id)}
                disabled={busy !== null}
                className="mt-2 px-2.5 py-1 text-xs rounded-sm bg-[#21262d] text-gh-text border border-gh-border hover:bg-gh-border disabled:opacity-50"
              >
                {t('actions.apply')}
              </button>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && failed.length === 0 ? (
        <div className="text-sm text-gh-muted p-4 bg-gh-surface border border-gh-border rounded-lg">
          {t('actions.noProposals')}
        </div>
      ) : (
        pending.map(a => (
          <div key={a.id} className="mb-2 p-3 bg-gh-surface border border-gh-border rounded-lg flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-gh-text truncate">{a.email_subject}</div>
              <div className="text-xs text-gh-muted mt-0.5 truncate">{a.from_address}</div>
              <div className="text-xs text-gh-muted mt-1">
                {t('actions.moveTo')} <span className="text-gh-blue">{a.target_folder}</span>
                <span className="mx-1.5">·</span>
                {a.reason}
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => handleApply(a.id)}
                disabled={busy !== null}
                className="px-2.5 py-1 text-xs rounded-sm bg-[#1f6feb] text-white hover:bg-[#388bfd] disabled:opacity-50"
              >
                {t('actions.apply')}
              </button>
              <button
                onClick={() => handleSkip(a.id)}
                disabled={busy !== null}
                className="px-2.5 py-1 text-xs rounded-sm bg-[#21262d] text-gh-muted border border-gh-border hover:text-gh-text disabled:opacity-50"
              >
                {t('actions.skip')}
              </button>
            </div>
          </div>
        ))
      )}
    </>
  )
}
