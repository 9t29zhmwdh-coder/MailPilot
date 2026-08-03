import { useEmailStore } from '../../stores/emailStore'
import { useAccountStore } from '../../stores/accountStore'
import { categoryLabel, categoryEmoji, type EmailCategory } from '../../lib/tauri'
import { useT } from '../../lib/i18n'

const CATEGORIES: EmailCategory[] = [
  'Important', 'Work', 'Private', 'Invoice', 'Package', 'Calendar',
  'Subscription', 'Newsletter', 'Social', 'Ads', 'Government',
  'Spam', 'Phishing', 'FollowUp', 'Review', 'Other',
]

export function CategorySidebar() {
  const { filterCategory, setFilterCategory, loadEmails } = useEmailStore()
  const { stats } = useAccountStore()
  const t = useT()

  const select = (cat: EmailCategory | null) => {
    setFilterCategory(cat)
    loadEmails(undefined, cat ?? undefined)
  }

  return (
    <div className="p-2">
      <div className="text-xs font-semibold text-gh-muted uppercase tracking-wider px-2 mb-1">
        {t('categorySidebar.categories')}
      </div>
      <button
        onClick={() => select(null)}
        className={`flex items-center justify-between w-full px-2 py-1.5 rounded-sm text-sm transition-colors
          ${!filterCategory ? 'bg-[#21262d] text-gh-text' : 'text-gh-muted hover:bg-gh-surface'}`}
      >
        <div className="flex items-center gap-1.5">
          <span>📥</span>
          <span>{t('categorySidebar.all')}</span>
        </div>
        {stats && (
          <span className="text-xs text-gh-muted">{stats.total_emails}</span>
        )}
      </button>
      {CATEGORIES.map(cat => {
        const count = stats?.by_category[cat]
        return (
          <button
            key={cat}
            onClick={() => select(cat)}
            className={`flex items-center justify-between w-full px-2 py-1.5 rounded-sm text-sm transition-colors
              ${filterCategory === cat ? 'bg-[#21262d] text-gh-text' : 'text-gh-muted hover:bg-gh-surface'}`}
          >
            <div className="flex items-center gap-1.5">
              <span>{categoryEmoji(cat)}</span>
              <span>{categoryLabel(cat)}</span>
            </div>
            {count != null && count > 0 && (
              <span className="text-xs text-gh-muted">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
