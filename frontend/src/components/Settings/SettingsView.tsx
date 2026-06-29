import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { api, type AppSettings, type EmailAccount } from '../../lib/tauri'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAccountStore } from '../../stores/accountStore'

// ─── Provider-Definitionen ───────────────────────────────────────────────────

type ProviderKey = 'icloud' | 'm365' | 'gmail' | 'fastmail' | 'custom'

interface Provider {
  label: string
  icon: string
  host: string
  port: string
  appPasswordUrl?: string
  appPasswordSteps?: string[]
}

const PROVIDERS: Record<ProviderKey, Provider> = {
  icloud: {
    label: 'iCloud',
    icon: '☁️',
    host: 'imap.mail.me.com',
    port: '993',
    appPasswordUrl: 'https://appleid.apple.com/account/manage',
    appPasswordSteps: [
      'Melde dich auf appleid.apple.com an',
      'Sicherheit → App-Passwörter',
      'Klick (+) → Name: MailPilot',
      'Kopieres das generierte Passwort',
    ],
  },
  m365: {
    label: 'Microsoft 365',
    icon: '🪟',
    host: 'outlook.office365.com',
    port: '993',
    appPasswordUrl: 'https://mysignins.microsoft.com/security-info',
    appPasswordSteps: [
      'Öffne mysignins.microsoft.com',
      'Sicherheitsinformationen → Methode hinzufügen',
      'App-Passwort → Name: MailPilot',
      'Kopieres das generierte Passwort',
    ],
  },
  gmail: {
    label: 'Gmail',
    icon: '✉️',
    host: 'imap.gmail.com',
    port: '993',
    appPasswordUrl: 'https://myaccount.google.com/apppasswords',
    appPasswordSteps: [
      'Öffne myaccount.google.com',
      'Sicherheit → App-Passwörter',
      'App: MailPilot → Erstellen',
      'Kopieres das 16-stellige Passwort',
    ],
  },
  fastmail: {
    label: 'Fastmail',
    icon: '⚡',
    host: 'imap.fastmail.com',
    port: '993',
  },
  custom: {
    label: 'Benutzerdefiniert',
    icon: '⚙️',
    host: '',
    port: '993',
  },
}

function detectProvider(email: string): ProviderKey | null {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  if (['icloud.com', 'me.com', 'mac.com'].includes(domain)) return 'icloud'
  if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) return 'm365'
  if (['gmail.com', 'googlemail.com'].includes(domain)) return 'gmail'
  if (['fastmail.com', 'fastmail.fm'].includes(domain)) return 'fastmail'
  return null
}

// ─── Main View ──────────────────────────────────────────────────────────────

export function SettingsView() {
  const { settings, setSettings } = useSettingsStore()
  const { accounts, loadAccounts } = useAccountStore()
  const [draft, setDraft] = useState<AppSettings>({ ...settings })
  const [saved, setSaved] = useState(false)
  const [activeModal, setActiveModal] = useState<ProviderKey | null>(null)

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setDraft(d => ({ ...d, [k]: v }))

  const handleSave = async () => {
    await api.saveSettings(draft)
    setSettings(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-[#e6edf3] mb-6">Einstellungen</h2>

      {/* Accounts */}
      <Section title="E-Mail Konten">
        {accounts.length > 0 && (
          <div className="space-y-2 mb-4">
            {accounts.map(acc => (
              <AccountRow key={acc.id} account={acc} onDelete={() => loadAccounts()} />
            ))}
          </div>
        )}
        <div className="text-xs text-[#8b949e] mb-2">Konto hinzufügen</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.entries(PROVIDERS) as [ProviderKey, Provider][]).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setActiveModal(key)}
              className="flex items-center gap-2 px-3 py-2.5 bg-[#0d1117] hover:bg-[#1c2128] border border-[#30363d] hover:border-[#58a6ff] rounded-lg text-left transition-colors group"
            >
              <span className="text-lg leading-none">{p.icon}</span>
              <span className="text-sm text-[#c9d1d9] group-hover:text-[#e6edf3]">{p.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Claude */}
      <ClaudeSection draft={draft} set={set} />

      {/* Sync */}
      <Section title="Sync-Optionen">
        <Label>Maximale E-Mails pro Sync</Label>
        <Input
          value={String(draft.max_emails_per_sync)}
          onChange={v => set('max_emails_per_sync', parseInt(v) || 500)}
          placeholder="500"
        />
        <Toggle
          label="Automatisch klassifizieren nach Sync"
          value={draft.auto_classify}
          onChange={v => set('auto_classify', v)}
        />
        <Toggle
          label="Vor Löschen immer Review-Ordner"
          value={draft.review_before_delete}
          onChange={v => set('review_before_delete', v)}
        />
      </Section>

      <button
        onClick={handleSave}
        className="w-full py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white text-sm rounded-lg transition-colors"
      >
        {saved ? 'Gespeichert!' : 'Einstellungen speichern'}
      </button>

      {activeModal && (
        <AccountModal
          providerKey={activeModal}
          onDone={() => { setActiveModal(null); loadAccounts() }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  )
}

// ─── Account Modal ───────────────────────────────────────────────────────────

function AccountModal({
  providerKey,
  onDone,
  onClose,
}: {
  providerKey: ProviderKey
  onDone: () => void
  onClose: () => void
}) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const provider = PROVIDERS[providerKey]
  const needsAppPassword = !!provider.appPasswordUrl

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-lg mx-4 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <span className="text-xl">{provider.icon}</span>
            <h3 className="text-sm font-semibold text-[#e6edf3]">{provider.label} hinzufügen</h3>
          </div>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3] transition-colors text-lg">
            ✕
          </button>
        </div>
        <div className="p-5">
          {needsAppPassword ? (
            <AppPasswordFlow providerKey={providerKey} onDone={onDone} />
          ) : (
            <GenericAccountForm
              initialHost={provider.host}
              initialPort={provider.port}
              initialLabel={provider.label}
              onDone={onDone}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── App-Passwort Flow (iCloud, M365, Gmail) ──────────────────────────────────

function AppPasswordFlow({ providerKey, onDone }: { providerKey: ProviderKey; onDone: () => void }) {
  const provider = PROVIDERS[providerKey]
  const [step, setStep] = useState<'email' | 'qr' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (provider.appPasswordUrl) {
      QRCode.toDataURL(provider.appPasswordUrl, {
        width: 220,
        margin: 2,
        color: { dark: '#ffffff', light: '#161b22' },
      }).then(setQrDataUrl).catch(() => {})
    }
  }, [provider.appPasswordUrl])

  const handleConnect = async () => {
    setTesting(true); setError('')
    const account: EmailAccount = {
      id: crypto.randomUUID(),
      label: providerKey === 'icloud' ? 'iCloud' : providerKey === 'm365' ? 'Microsoft 365' : 'Gmail',
      email_address: email,
      imap_host: provider.host,
      imap_port: parseInt(provider.port),
      protocol: 'Imap',
      username: email,
      use_tls: true,
      mailboxes: ['INBOX'],
      enabled: true,
    }
    try {
      await api.testConnection(account, appPassword)
      await api.addAccount(account, appPassword)
      onDone()
    } catch (e: any) {
      setError(String(e))
    } finally {
      setTesting(false)
    }
  }

  if (step === 'email') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#8b949e]">
          Für {provider.label} wird ein App-Passwort benötigt, kein normales Passwort.
        </p>
        <div>
          <Label>E-Mail-Adresse</Label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={`user@${providerKey === 'icloud' ? 'icloud.com' : providerKey === 'm365' ? 'outlook.com' : 'gmail.com'}`}
            autoFocus
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] font-mono focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]"
          />
        </div>
        <button
          onClick={() => setStep('qr')}
          disabled={!email.includes('@')}
          className="w-full py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-sm rounded-lg transition-colors disabled:opacity-40"
        >
          Weiter → App-Passwort generieren
        </button>
      </div>
    )
  }

  if (step === 'qr') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#e6edf3] font-medium">
          Scanne den QR-Code mit deinem iPhone
        </p>
        <div className="flex gap-4 items-start">
          {qrDataUrl && (
            <div className="flex-shrink-0 rounded-lg overflow-hidden border border-[#30363d]">
              <img src={qrDataUrl} alt="QR-Code" width={120} height={120} />
            </div>
          )}
          <ol className="space-y-1.5 text-xs text-[#8b949e]">
            {provider.appPasswordSteps?.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#58a6ff] font-bold flex-shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="text-xs text-[#484f58]">
          oder direkt:{' '}
          <span className="text-[#58a6ff] font-mono">{provider.appPasswordUrl}</span>
        </div>
        <button
          onClick={() => setStep('password')}
          className="w-full py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm rounded-lg transition-colors"
        >
          Ich habe das App-Passwort →
        </button>
      </div>
    )
  }

  // step === 'password'
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#8b949e]">
        Füge das generierte App-Passwort für <span className="text-[#e6edf3]">{email}</span> ein.
      </p>
      <div>
        <Label>App-Passwort</Label>
        <input
          type="password"
          value={appPassword}
          onChange={e => setAppPassword(e.target.value)}
          placeholder="xxxx-xxxx-xxxx-xxxx"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && appPassword) handleConnect() }}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] font-mono focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]"
        />
      </div>
      {error && <div className="text-xs text-[#f85149]">{error}</div>}
      <div className="flex gap-2">
        <button
          onClick={() => setStep('qr')}
          className="px-4 py-2 text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        >
          Zurück
        </button>
        <button
          onClick={handleConnect}
          disabled={testing || !appPassword}
          className="flex-1 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-sm rounded-lg transition-colors disabled:opacity-40"
        >
          {testing ? 'Verbinde…' : 'Verbinden'}
        </button>
      </div>
    </div>
  )
}

// ─── Generisches Formular (Fastmail, Benutzerdefiniert) ──────────────────────

function GenericAccountForm({
  initialHost,
  initialPort,
  initialLabel,
  onDone,
}: {
  initialHost: string
  initialPort: string
  initialLabel: string
  onDone: () => void
}) {
  const [label, setLabel] = useState(initialLabel)
  const [email, setEmail] = useState('')
  const [host, setHost] = useState(initialHost)
  const [port, setPort] = useState(initialPort)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')

  const handleEmailChange = (v: string) => {
    setEmail(v)
    if (!username) setUsername(v)
    const detected = detectProvider(v)
    if (detected && PROVIDERS[detected]) {
      setHost(PROVIDERS[detected].host)
      setPort(PROVIDERS[detected].port)
    }
  }

  const handleAdd = async () => {
    setTesting(true); setError('')
    const account: EmailAccount = {
      id: crypto.randomUUID(),
      label, email_address: email, imap_host: host,
      imap_port: parseInt(port) || 993, protocol: 'Imap',
      username: username || email, use_tls: true,
      mailboxes: ['INBOX'], enabled: true,
    }
    try {
      await api.testConnection(account, password)
      await api.addAccount(account, password)
      onDone()
    } catch (e: any) {
      setError(String(e))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Bezeichnung</Label><Input value={label} onChange={setLabel} placeholder="Mein Konto" /></div>
        <div><Label>E-Mail</Label><Input value={email} onChange={handleEmailChange} placeholder="user@example.com" /></div>
        <div><Label>IMAP Host</Label><Input value={host} onChange={setHost} placeholder="imap.example.com" /></div>
        <div><Label>Port</Label><Input value={port} onChange={setPort} placeholder="993" /></div>
        <div><Label>Benutzername</Label><Input value={username} onChange={setUsername} placeholder="user@example.com" /></div>
        <div><Label>Passwort</Label><PasswordInput value={password} onChange={setPassword} /></div>
      </div>
      {error && <div className="text-xs text-[#f85149]">{error}</div>}
      <button
        onClick={handleAdd}
        disabled={testing || !host || !email || !password}
        className="w-full py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-sm rounded-lg transition-colors disabled:opacity-40"
      >
        {testing ? 'Verbindung testen…' : 'Konto speichern'}
      </button>
    </div>
  )
}

// ─── Account Row ────────────────────────────────────────────────────────────

function AccountRow({ account, onDelete }: { account: EmailAccount; onDelete: () => void }) {
  const handleDelete = async () => {
    if (confirm(`Konto "${account.label}" wirklich entfernen?`)) {
      await api.deleteAccount(account.id)
      onDelete()
    }
  }
  return (
    <div className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-md p-3">
      <div>
        <div className="text-sm text-[#e6edf3] font-medium">{account.label}</div>
        <div className="text-xs text-[#8b949e]">
          {account.email_address} · {account.imap_host}:{account.imap_port}
        </div>
      </div>
      <button onClick={handleDelete} className="text-xs text-[#f85149] hover:underline">
        Entfernen
      </button>
    </div>
  )
}

// ─── Claude Section ──────────────────────────────────────────────────────────

function ClaudeSection({
  draft,
  set,
}: {
  draft: AppSettings
  set: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void
}) {
  const [checking, setChecking] = useState(false)
  const [claudeMsg, setClaudeMsg] = useState('')
  const [keyStatus, setKeyStatus] = useState<boolean | null>(null)
  const [pendingKey, setPendingKey] = useState('')
  const [savingKey, setSavingKey] = useState(false)

  useEffect(() => {
    api.getClaudeKeyStatus().then(ok => setKeyStatus(ok)).catch(() => setKeyStatus(false))
  }, [])

  const handleCheck = async () => {
    setChecking(true); setClaudeMsg('')
    const ok = await api.checkClaude().catch(() => false)
    setClaudeMsg(ok ? 'Claude erreichbar ✓' : 'Claude nicht erreichbar — API-Key fehlt oder ungültig')
    setChecking(false)
  }

  const handleSaveKey = async () => {
    if (!pendingKey.trim()) return
    setSavingKey(true)
    try {
      await api.setClaudeKey(pendingKey.trim())
      setKeyStatus(true)
      setPendingKey('')
      setClaudeMsg('API-Key gespeichert ✓')
    } catch {
      setClaudeMsg('Fehler beim Speichern des API-Keys')
    }
    setSavingKey(false)
  }

  return (
    <Section title="KI — Claude">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs text-[#8b949e]">API-Key (Keychain):</span>
        {keyStatus === true && <span className="text-xs text-[#3fb950] font-medium">Gesetzt ✓</span>}
        {keyStatus === false && <span className="text-xs text-[#f85149]">Nicht gesetzt</span>}
      </div>
      {(keyStatus === false || keyStatus === null) && (
        <div className="flex gap-2 mb-3">
          <input
            type="password"
            value={pendingKey}
            onChange={e => setPendingKey(e.target.value)}
            placeholder="sk-ant-..."
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#e6edf3] font-mono focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]"
          />
          <button
            onClick={handleSaveKey}
            disabled={savingKey || !pendingKey.trim()}
            className="px-3 py-1.5 text-xs bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded transition-colors disabled:opacity-50"
          >
            {savingKey ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      )}
      {keyStatus === true && (
        <button onClick={() => setKeyStatus(false)} className="text-xs text-[#8b949e] hover:text-[#e6edf3] mb-3">
          Key ersetzen
        </button>
      )}
      <Label>Modell</Label>
      <select
        value={draft.claude_model ?? 'claude-haiku-4-5-20251001'}
        onChange={e => set('claude_model', e.target.value)}
        className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#e6edf3] font-mono focus:outline-none focus:border-[#58a6ff] mb-3"
      >
        <option value="claude-haiku-4-5-20251001">claude-haiku-4-5 (schnell, günstig)</option>
        <option value="claude-sonnet-4-6">claude-sonnet-4-6 (ausgewogen)</option>
        <option value="claude-opus-4-8">claude-opus-4-8 (am stärksten)</option>
      </select>
      <button
        onClick={handleCheck}
        disabled={checking}
        className="mt-1 px-3 py-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] rounded transition-colors"
      >
        {checking ? 'Teste…' : 'Verbindung testen'}
      </button>
      {claudeMsg && (
        <div className={`mt-1 text-xs ${claudeMsg.includes('✓') ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
          {claudeMsg}
        </div>
      )}
    </Section>
  )
}

// ─── Shared Primitives ───────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-[#8b949e] mb-1">{children}</div>
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#e6edf3] font-mono focus:outline-none focus:border-[#58a6ff] mb-3 placeholder-[#484f58]"
    />
  )
}

function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="password"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#e6edf3] font-mono focus:outline-none focus:border-[#58a6ff] mb-3"
    />
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-[#c9d1d9]">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-[#238636]' : 'bg-[#30363d]'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
