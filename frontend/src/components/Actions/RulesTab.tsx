import { useEffect, useState } from 'react'
import { api, categoryEmoji, type EmailCategory, type FilterRule, type RuleCondition } from '../../lib/tauri'
import { useT } from '../../lib/i18n'

/// Folder names must match `EmailCategory::folder_name()` in mp-core, otherwise
/// a template would queue a move into a folder the rest of the app never uses.
const CATEGORY_FOLDER: Partial<Record<EmailCategory, string>> = {
  Newsletter: 'Newsletter',
  Ads: 'Werbung',
  Invoice: 'Rechnungen',
  Package: 'Pakete',
  Phishing: 'Review/Phishing',
  Subscription: 'Abos',
}

const TEMPLATE_CATEGORIES: EmailCategory[] = [
  'Newsletter', 'Ads', 'Invoice', 'Package', 'Phishing', 'Subscription',
]

/// Renders a condition in a form a person can read back.
///
/// The raw serde shape (`{"SubjectContains": "Rechnung"}`) is an implementation
/// detail, and a rule the user cannot read is a rule they cannot trust.
function describeCondition(c: RuleCondition, t: (k: string) => string): string {
  if (c === 'HasAttachment') return t('rules.condHasAttachment')
  if ('FromContains' in c) return `${t('rules.condFrom')}: ${c.FromContains}`
  if ('SubjectContains' in c) return `${t('rules.condSubject')}: ${c.SubjectContains}`
  if ('BodyContains' in c) return `${t('rules.condBody')}: ${c.BodyContains}`
  if ('SenderDomain' in c) return `${t('rules.condDomain')}: ${c.SenderDomain}`
  if ('HasCategory' in c) return `${t('rules.condCategory')}: ${c.HasCategory}`
  return ''
}

function describeActions(rule: FilterRule, t: (k: string) => string): string {
  const folders = rule.actions
    .map(a => (typeof a === 'object' && 'MoveToFolder' in a ? a.MoveToFolder : null))
    .filter((f): f is string => f !== null)
  return folders.length > 0 ? `${t('rules.moveTo')} ${folders.join(', ')}` : t('rules.noMove')
}

export default function RulesTab() {
  const t = useT()
  const [rules, setRules] = useState<FilterRule[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function reload() {
    try {
      setRules(await api.listRules())
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void reload() }, [])

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  const addTemplate = (cat: EmailCategory) => withBusy(async () => {
    const folder = CATEGORY_FOLDER[cat]
    if (!folder) return
    await api.saveRule({
      name: `${t(`category.${cat}`)} ${String.fromCharCode(8594)} ${folder}`,
      conditions: [{ HasCategory: cat }],
      match_all: true,
      actions: [{ MoveToFolder: folder }],
      enabled: true,
    })
    await reload()
  })

  const toggle = (rule: FilterRule) => withBusy(async () => {
    await api.setRuleEnabled(rule.id, !rule.enabled)
    await reload()
  })

  const remove = (rule: FilterRule) => withBusy(async () => {
    await api.deleteRule(rule.id)
    await reload()
  })

  const run = () => withBusy(async () => {
    const created = await api.runRules()
    // The count is what makes this honest: rules queue proposals, they do not
    // move anything by themselves, and the user still confirms in Organize.
    setNotice(created === 0 ? t('rules.noMatches') : `${created} ${t('rules.queued')}`)
    await reload()
  })

  const activeCount = rules.filter(r => r.enabled).length

  return (
    <div>
      <div className="mb-4 p-3 bg-gh-surface border border-gh-border rounded-lg text-xs text-gh-muted flex gap-3">
        <span className="text-lg">📋</span>
        <div>
          <div className="font-medium text-gh-text mb-0.5">{t('rules.title')}</div>
          {t('rules.intro')}
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-[#f8514922] border border-gh-red rounded-lg text-xs text-gh-red">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-3 p-3 bg-[#23863622] border border-[#238636] rounded-lg text-xs text-gh-green">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="text-center text-[#484f58] text-sm py-8">{t('rules.loading')}</div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {rules.length === 0 && (
              <div className="text-center text-[#484f58] text-sm py-6">{t('rules.empty')}</div>
            )}
            {rules.map(rule => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 bg-gh-surface border border-gh-border rounded-lg"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="text-sm font-medium text-gh-text truncate">{rule.name}</div>
                  <div className="text-xs text-gh-muted truncate">
                    {rule.conditions.map(c => describeCondition(c, t)).join(
                      rule.match_all ? ` ${t('rules.and')} ` : ` ${t('rules.or')} `,
                    )}
                    {' · '}
                    {describeActions(rule, t)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => void toggle(rule)}
                    disabled={busy}
                    aria-label={rule.enabled ? t('rules.disable') : t('rules.enable')}
                    className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${rule.enabled ? 'bg-[#238636]' : 'bg-gh-border'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <button
                    onClick={() => void remove(rule)}
                    disabled={busy}
                    className="text-xs text-gh-muted hover:text-gh-red transition-colors disabled:opacity-50 px-1"
                  >
                    {t('rules.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => void run()}
            disabled={busy || activeCount === 0}
            className="w-full mb-4 p-3 bg-[#238636] hover:bg-[#2ea043] disabled:bg-gh-border disabled:text-[#484f58] rounded-lg text-sm font-medium text-white transition-colors"
          >
            {busy ? t('rules.loading') : `${t('rules.run')} (${activeCount})`}
          </button>

          <div className="mb-3">
            <div className="text-xs text-gh-muted mb-2">{t('rules.templates')}</div>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => void addTemplate(cat)}
                  disabled={busy}
                  className="px-3 py-1.5 bg-gh-surface border border-gh-border rounded-lg text-xs text-gh-muted hover:border-gh-blue hover:text-gh-blue transition-colors disabled:opacity-50"
                >
                  {categoryEmoji(cat)} {t(`category.${cat}`)}
                </button>
              ))}
            </div>
          </div>

          {showForm ? (
            <CustomRuleForm
              busy={busy}
              onCancel={() => setShowForm(false)}
              onSaved={async () => { setShowForm(false); await reload() }}
              onError={setError}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full p-3 border border-dashed border-gh-border rounded-lg text-xs text-gh-muted hover:border-gh-blue hover:text-gh-blue transition-colors"
            >
              + {t('rules.createOwn')}
            </button>
          )}
        </>
      )}
    </div>
  )
}

type FieldKind = 'FromContains' | 'SubjectContains' | 'BodyContains' | 'SenderDomain'

function CustomRuleForm(props: {
  busy: boolean
  onCancel: () => void
  onSaved: () => Promise<void>
  onError: (message: string) => void
}) {
  const t = useT()
  const [name, setName] = useState('')
  const [field, setField] = useState<FieldKind>('SubjectContains')
  const [value, setValue] = useState('')
  const [folder, setFolder] = useState('')
  const [saving, setSaving] = useState(false)

  const ready = name.trim() !== '' && value.trim() !== '' && folder.trim() !== ''

  async function save() {
    setSaving(true)
    try {
      await api.saveRule({
        name: name.trim(),
        conditions: [{ [field]: value.trim() } as RuleCondition],
        match_all: true,
        actions: [{ MoveToFolder: folder.trim() }],
        enabled: true,
      })
      await props.onSaved()
    } catch (e) {
      props.onError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 bg-gh-bg border border-gh-border rounded-lg text-sm text-gh-text focus:border-gh-blue outline-hidden'

  return (
    <div className="p-4 bg-gh-surface border border-gh-border rounded-lg space-y-3">
      <input
        className={inputClass}
        placeholder={t('rules.namePlaceholder')}
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <div className="flex gap-2">
        <select
          className={`${inputClass} w-44`}
          value={field}
          onChange={e => setField(e.target.value as FieldKind)}
        >
          <option value="SubjectContains">{t('rules.condSubject')}</option>
          <option value="FromContains">{t('rules.condFrom')}</option>
          <option value="BodyContains">{t('rules.condBody')}</option>
          <option value="SenderDomain">{t('rules.condDomain')}</option>
        </select>
        <input
          className={inputClass}
          placeholder={t('rules.valuePlaceholder')}
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      </div>
      <input
        className={inputClass}
        placeholder={t('rules.folderPlaceholder')}
        value={folder}
        onChange={e => setFolder(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={() => void save()}
          disabled={!ready || saving || props.busy}
          className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:bg-gh-border disabled:text-[#484f58] rounded-lg text-sm text-white transition-colors"
        >
          {t('rules.save')}
        </button>
        <button
          onClick={props.onCancel}
          className="px-4 py-2 bg-[#21262d] hover:bg-gh-border rounded-lg text-sm text-gh-text transition-colors"
        >
          {t('rules.cancel')}
        </button>
      </div>
    </div>
  )
}
