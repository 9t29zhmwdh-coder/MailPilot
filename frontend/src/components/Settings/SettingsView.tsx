import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { api, type AppSettings, type EmailAccount } from '../../lib/tauri'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAccountStore } from '../../stores/accountStore'
import { uuid } from '../_utils'

export function SettingsView() {
  const { settings, setSettings } = useSettingsStore()
  const { accounts, loadAccounts } = useAccountStore()
  const [draft, setDraft] = useState<AppSettings>({ ...settings })
  const [saved, setSaved] = useState(false)
  const [checking, setChecking] = useState(false)
  const [ollamaMsg, setOllamaMsg] = useState('')
  const [showAddAccount, setShowAddAccount] = useState(false)

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setDraft(d => ({ ...d, [k]: v }))

  const handleSave = async () => {
    await api.saveSettings(draft)
    setSettings(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleCheckOllama = async () => {
    setChecking(true); setOllamaMsg('')
    const ok = await api.checkOllama().catch(() => false)
    setOllamaMsg(ok ? 'Ollama erreichbar ✓' : 'Ollama nicht erreichbar')
    setChecking(false)
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-[#e6edf3] mb-6">Einstellungen</h2>

      {/* Accounts */}
      <Section title="E-Mail Konten">
        {accounts.length === 0 ? (
          <div className="text-sm text-[#8b949e] mb-3">Noch keine Konten konfiguriert.</div>
        ) : (
          <div className="space-y-2 mb-3">
            {accounts.map(acc => (
              <AccountRow key={acc.id} account={acc} onDelete={() => loadAccounts()} />
            ))}
          </div>
        )}
        <button
          onClick={() => setShowAddAccount(!showAddAccount)}
          className="px-3 py-1.5 text-xs bg-[#238636] hover:bg-[#2ea043] text-white rounded transition-colors"
        >
          + Konto hinzufügen
        </button>
        {showAddAccount && <AddAccountForm onDone={() => { setShowAddAccount(false); loadAccounts() }} />}
      </Section>

      {/* Ollama */}
      <Section title="KI — Ollama">
        <Label>Ollama URL</Label>
        <Input value={draft.ollama_url} onChange={v => set('ollama_url', v)} />
        <Label>Text-Modell</Label>
        <Input value={draft.text_model} onChange={v => set('text_model', v)} placeholder="llama3" />
        <Label>Vision-Modell</Label>
        <Input value={draft.vision_model} onChange={v => set('vision_model', v)} placeholder="llava" />
        <button
          onClick={handleCheckOllama}
          disabled={checking}
          className="mt-1 px-3 py-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] rounded transition-colors"
        >
          {checking ? 'Teste…' : 'Verbindung testen'}
        </button>
        {ollamaMsg && (
          <div className={`mt-1 text-xs ${ollamaMsg.includes('✓') ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
            {ollamaMsg}
          </div>
        )}
      </Section>

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
    </div>
  )
}

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
        <div className="text-xs text-[#8b949e]">{account.email_address} · {account.imap_host}:{account.imap_port}</div>
      </div>
      <button onClick={handleDelete} className="text-xs text-[#f85149] hover:underline">Entfernen</button>
    </div>
  )
}

function AddAccountForm({ onDone }: { onDone: () => void }) {
  const [label, setLabel] = useState('')
  const [email, setEmail] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('993')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    setTesting(true); setError('')
    const account: EmailAccount = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      label, email_address: email, imap_host: host,
      imap_port: parseInt(port) || 993, protocol: 'Imap',
      username, use_tls: true, mailboxes: ['INBOX'],
      enabled: true,
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
    <div className="mt-3 p-3 bg-[#0d1117] border border-[#30363d] rounded-md space-y-2">
      <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Neues Konto</div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Bezeichnung</Label><Input value={label} onChange={setLabel} placeholder="Mein Gmail" /></div>
        <div><Label>E-Mail</Label><Input value={email} onChange={setEmail} placeholder="user@gmail.com" /></div>
        <div><Label>IMAP Host</Label><Input value={host} onChange={setHost} placeholder="imap.gmail.com" /></div>
        <div><Label>Port</Label><Input value={port} onChange={setPort} placeholder="993" /></div>
        <div><Label>Benutzername</Label><Input value={username} onChange={setUsername} placeholder="user@gmail.com" /></div>
        <div><Label>Passwort / App-Passwort</Label><PasswordInput value={password} onChange={setPassword} /></div>
      </div>
      {error && <div className="text-xs text-[#f85149]">{error}</div>}
      <button
        onClick={handleAdd}
        disabled={testing || !host || !email || !password}
        className="px-3 py-1.5 text-xs bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded transition-colors disabled:opacity-50"
      >
        {testing ? 'Verbindung testen…' : 'Konto speichern'}
      </button>
    </div>
  )
}

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
