import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

// ─── Types ──────────────────────────────────────────────────────────────────

export type Protocol = 'Imap' | 'Pop3'

export interface EmailAddress { name?: string; address: string }

export interface Attachment { filename: string; mime_type: string; size: number; content_id?: string }

export type EmailCategory =
  | 'Important' | 'Work' | 'Private' | 'Invoice' | 'Newsletter'
  | 'Social' | 'Ads' | 'Government' | 'Package' | 'Calendar'
  | 'Subscription' | 'Spam' | 'Phishing' | 'FollowUp' | 'Review' | 'Other'

export interface Classification {
  category: EmailCategory
  confidence: number
  tags: string[]
  summary?: string
  extracted_amount?: number
  extracted_currency?: string
  extracted_due_date?: string
  extracted_event_date?: string
  extracted_sender_name?: string
  tracking_number?: string
  tracking_carrier?: string
  is_subscription: boolean
  subscription_service?: string
  renewal_date?: string
  cancel_link?: string
  phishing_score: number
  phishing_reasons: string[]
  follow_up_hint?: string
  reply_suggestion?: string
  classified_by: string
}

export interface EmailEntry {
  id: string
  account_id: string
  message_id: string
  uid: number
  mailbox: string
  subject: string
  from: EmailAddress
  to: EmailAddress[]
  cc: EmailAddress[]
  date: string
  body_text?: string
  body_html?: string
  attachments: Attachment[]
  is_read: boolean
  is_flagged: boolean
  size: number
  hash?: string
  thread_id?: string
  classification?: Classification
  fetched_at: string
}

export interface EmailAccount {
  id: string
  label: string
  email_address: string
  imap_host: string
  imap_port: number
  protocol: Protocol
  username: string
  use_tls: boolean
  mailboxes: string[]
  last_sync?: string
  enabled: boolean
}

export interface AppSettings {
  ollama_url: string
  text_model: string
  vision_model: string
  claude_model: string
  auto_classify: boolean
  auto_sync: boolean
  sync_interval_minutes: number
  default_view: string
  review_before_delete: boolean
  max_emails_per_sync: number
}

export interface OrganizeAction {
  id: string
  email_id: string
  email_subject: string
  from_address: string
  kind: string
  target_folder?: string
  reason: string
  status: string
  undoable: boolean
  created_at: string
}

export interface EmailStats {
  total_emails: number
  unread_count: number
  classified_count: number
  accounts_count: number
  by_category: Record<string, number>
  invoices_total: number
  packages_count: number
  phishing_count: number
  subscriptions_count: number
  follow_up_count: number
}

// ─── API ────────────────────────────────────────────────────────────────────

export const api = {
  // accounts
  listAccounts: ()                               => invoke<EmailAccount[]>('list_accounts'),
  addAccount: (account: EmailAccount, password: string) => invoke<EmailAccount>('add_account', { account, password }),
  updateAccount: (account: EmailAccount)         => invoke<void>('update_account', { account }),
  deleteAccount: (id: string)                    => invoke<void>('delete_account', { id }),
  testConnection: (account: EmailAccount, password: string) => invoke<string[]>('test_connection', { account, password }),
  syncAccount: (accountId: string)               => invoke<number>('sync_account', { accountId }),

  // emails
  listEmails: (accountId?: string, category?: string, limit?: number, offset?: number) =>
    invoke<EmailEntry[]>('list_emails', { accountId, category, limit, offset }),
  getEmail: (id: string)                         => invoke<EmailEntry | null>('get_email', { id }),
  searchEmails: (query: string, limit?: number)  => invoke<EmailEntry[]>('search_emails', { query, limit }),
  markRead: (id: string, read: boolean)          => invoke<void>('mark_read', { id, read }),
  markFlagged: (id: string, flagged: boolean)    => invoke<void>('mark_flagged', { id, flagged }),

  // classify
  classifyEmail: (emailId: string)               => invoke<void>('classify_email', { emailId }),
  classifyBatch: (limit?: number)                => invoke<number>('classify_batch', { limit }),
  checkClaude: ()                                => invoke<boolean>('check_ollama'),
  generateSummary: (emailId: string)             => invoke<string>('generate_summary', { emailId }),

  // claude key
  setClaudeKey: (key: string)                    => invoke<void>('set_claude_key', { key }),
  getClaudeKeyStatus: ()                         => invoke<boolean>('get_claude_key_status'),

  // actions
  updateCategory: (id: string, category: string) => invoke<void>('update_category', { id, category }),

  listActions: ()                                => invoke<OrganizeAction[]>('list_actions'),
  proposeActions: ()                             => invoke<number>('propose_actions'),
  applyAction: (actionId: string)                => invoke<void>('apply_action', { actionId }),
  applyAllActions: ()                            => invoke<number>('apply_all_actions'),
  skipAction: (actionId: string)                 => invoke<void>('skip_action', { actionId }),
  skipAllActions: ()                             => invoke<number>('skip_all_actions'),

  // stats
  getStats: ()                                   => invoke<EmailStats>('get_stats'),

  // settings
  getSettings: ()                                => invoke<AppSettings>('get_settings'),
  saveSettings: (settings: AppSettings)          => invoke<void>('save_settings', { settings }),
}

// ─── Events ─────────────────────────────────────────────────────────────────

export const events = {
  onSyncProgress: (cb: (emailId: string) => void) =>
    listen<string>('sync://progress', e => cb(e.payload)),
  onSyncDone: (cb: (count: number) => void) =>
    listen<number>('sync://done', e => cb(e.payload)),
  onClassifyProgress: (cb: (data: { done: number; total: number; email_id: string }) => void) =>
    listen('classify://progress', e => cb(e.payload as any)),
  onClassifyDone: (cb: (count: number) => void) =>
    listen<number>('classify://done', e => cb(e.payload)),
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function categoryLabel(cat: EmailCategory): string {
  const labels: Record<EmailCategory, string> = {
    Important: 'Wichtig', Work: 'Arbeit', Private: 'Privat',
    Invoice: 'Rechnung', Newsletter: 'Newsletter', Social: 'Social',
    Ads: 'Werbung', Government: 'Behörde', Package: 'Paket',
    Calendar: 'Termin', Subscription: 'Abo', Spam: 'Spam',
    Phishing: 'Phishing', FollowUp: 'Follow-Up', Review: 'Review', Other: 'Sonstiges',
  }
  return labels[cat] ?? cat
}

export function categoryEmoji(cat: EmailCategory): string {
  const emojis: Record<EmailCategory, string> = {
    Important: '⭐', Work: '💼', Private: '🏠', Invoice: '🧾',
    Newsletter: '📰', Social: '💬', Ads: '📢', Government: '🏛️',
    Package: '📦', Calendar: '📅', Subscription: '🔄', Spam: '🗑️',
    Phishing: '⚠️', FollowUp: '↩️', Review: '👁️', Other: '📧',
  }
  return emojis[cat] ?? '📧'
}

export function categoryColor(cat: EmailCategory): string {
  const colors: Partial<Record<EmailCategory, string>> = {
    Important: '#f0883e', Work: '#58a6ff', Invoice: '#d29922',
    Phishing: '#f85149', Package: '#3fb950', Calendar: '#bc8cff',
    Spam: '#8b949e', Newsletter: '#79c0ff',
  }
  return colors[cat] ?? '#8b949e'
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'Gestern'
  if (days < 7) return d.toLocaleDateString('de-CH', { weekday: 'short' })
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })
}
