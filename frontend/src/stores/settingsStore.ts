import { create } from 'zustand'
import { AppSettings, api } from '../lib/tauri'

const DEFAULT_SETTINGS: AppSettings = {
  ollama_url: 'http://localhost:11434',
  text_model: 'llama3',
  vision_model: 'llava',
  auto_classify: true,
  auto_sync: false,
  sync_interval_minutes: 30,
  default_view: 'today',
  review_before_delete: true,
  max_emails_per_sync: 500,
}

interface SettingsStore {
  settings: AppSettings
  setSettings: (s: AppSettings) => void
  loadSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  setSettings: s => set({ settings: s }),
  loadSettings: async () => {
    try {
      const settings = await api.getSettings()
      set({ settings })
    } catch {}
  },
}))
