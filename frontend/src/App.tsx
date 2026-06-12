import { useEffect, useState } from 'react'
import { useAccountStore } from './stores/accountStore'
import { useSettingsStore } from './stores/settingsStore'
import { useEmailStore } from './stores/emailStore'
import { api, events } from './lib/tauri'
import { Dashboard } from './components/Dashboard/Dashboard'
import { EmailList } from './components/EmailList/EmailList'
import { CategorySidebar } from './components/Categories/CategorySidebar'
import { ActionsView } from './components/Actions/ActionsView'
import { SettingsView } from './components/Settings/SettingsView'

type Tab = 'dashboard' | 'emails' | 'actions' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { ollamaOnline, setOllamaOnline, loadAccounts, loadStats } = useAccountStore()
  const { loadSettings } = useSettingsStore()
  const { loadEmails, filterCategory } = useEmailStore()

  useEffect(() => {
    loadAccounts()
    loadStats()
    loadSettings()
    api.checkOllama().then(setOllamaOnline).catch(() => {})

    const cleanup: Array<() => void> = []
    events.onSyncDone(count => {
      loadEmails()
      loadStats()
    }).then(u => cleanup.push(u))
    events.onClassifyDone(() => {
      loadStats()
      loadEmails()
    }).then(u => cleanup.push(u))

    return () => cleanup.forEach(u => u())
  }, [])

  useEffect(() => {
    if (tab === 'emails') loadEmails(undefined, filterCategory ?? undefined)
  }, [tab, filterCategory])

  const navItem = (id: Tab, icon: string, label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors
        ${tab === id
          ? 'bg-[#21262d] text-[#e6edf3]'
          : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]'}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Left Nav */}
      <div className="w-52 flex-shrink-0 border-r border-[#30363d] flex flex-col">
        <div className="p-4 border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <span className="text-lg">✉️</span>
            <span className="font-semibold text-[#e6edf3]">MailPilot</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${ollamaOnline ? 'bg-[#3fb950]' : 'bg-[#f85149]'}`} />
            <span className="text-xs text-[#8b949e]">{ollamaOnline ? 'Ollama online' : 'Ollama offline'}</span>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {navItem('dashboard', '📊', 'Übersicht')}
          {navItem('emails', '📧', 'E-Mails')}
          {navItem('actions', '⚡', 'Aktionen')}
          {navItem('settings', '⚙️', 'Einstellungen')}
        </nav>

        {tab === 'emails' && (
          <div className="border-t border-[#30363d]">
            <CategorySidebar />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'emails'    && <EmailList />}
        {tab === 'actions'   && <ActionsView />}
        {tab === 'settings'  && <SettingsView />}
      </div>
    </div>
  )
}
