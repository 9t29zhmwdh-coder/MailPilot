import { create } from 'zustand'
import { EmailEntry, EmailCategory, api } from '../lib/tauri'

interface EmailStore {
  emails: EmailEntry[]
  selectedId: string | null
  selected: EmailEntry | null
  filterCategory: EmailCategory | null
  filterAccount: string | null
  searchQuery: string
  loading: boolean
  setEmails: (emails: EmailEntry[]) => void
  selectEmail: (email: EmailEntry | null) => void
  setFilterCategory: (cat: EmailCategory | null) => void
  setFilterAccount: (id: string | null) => void
  setSearch: (q: string) => void
  loadEmails: (accountId?: string, category?: EmailCategory) => Promise<void>
  markAsRead: (id: string) => void
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  emails: [],
  selectedId: null,
  selected: null,
  filterCategory: null,
  filterAccount: null,
  searchQuery: '',
  loading: false,

  setEmails: emails => set({ emails }),
  selectEmail: email => set({ selected: email, selectedId: email?.id ?? null }),
  setFilterCategory: cat => set({ filterCategory: cat }),
  setFilterAccount: id => set({ filterAccount: id }),
  setSearch: q => set({ searchQuery: q }),

  loadEmails: async (accountId, category) => {
    set({ loading: true })
    try {
      const all = await api.listEmails(accountId, undefined, 500)
      const emails = category
        ? all.filter(e => e.classification?.category === category)
        : all
      set({ emails, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  markAsRead: id => {
    set(s => ({
      emails: s.emails.map(e => e.id === id ? { ...e, is_read: true } : e),
      selected: s.selected?.id === id ? { ...s.selected, is_read: true } : s.selected,
    }))
    api.markRead(id, true).catch(() => {})
  },
}))
