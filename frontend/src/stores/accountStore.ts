import { create } from 'zustand'
import { EmailAccount, EmailStats, api } from '../lib/tauri'

interface AccountStore {
  accounts: EmailAccount[]
  stats: EmailStats | null
  ollamaOnline: boolean
  syncing: string | null
  setAccounts: (accounts: EmailAccount[]) => void
  setStats: (stats: EmailStats) => void
  setOllamaOnline: (v: boolean) => void
  setSyncing: (id: string | null) => void
  loadAccounts: () => Promise<void>
  loadStats: () => Promise<void>
}

export const useAccountStore = create<AccountStore>((set) => ({
  accounts: [],
  stats: null,
  ollamaOnline: false,
  syncing: null,
  setAccounts: accounts => set({ accounts }),
  setStats: stats => set({ stats }),
  setOllamaOnline: v => set({ ollamaOnline: v }),
  setSyncing: id => set({ syncing: id }),

  loadAccounts: async () => {
    try {
      const accounts = await api.listAccounts()
      set({ accounts })
    } catch {}
  },

  loadStats: async () => {
    try {
      const stats = await api.getStats()
      set({ stats })
    } catch {}
  },
}))
