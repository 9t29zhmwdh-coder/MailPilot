import { create } from 'zustand'

export type Lang = 'en' | 'de'

const STORAGE_KEY = 'mailpilot_lang'

interface Dict {
  [key: string]: string | Dict
}

const translations: Record<Lang, Dict> = {
  en: {
    nav: {
      dashboard: 'Overview', emails: 'Emails', actions: 'Actions', settings: 'Settings',
      claudeOnline: 'Claude online', claudeOffline: 'Claude offline',
    },
    category: {
      Important: 'Important', Work: 'Work', Private: 'Private',
      Invoice: 'Invoice', Newsletter: 'Newsletter', Social: 'Social',
      Ads: 'Ads', Government: 'Government', Package: 'Package',
      Calendar: 'Calendar', Subscription: 'Subscription', Spam: 'Spam',
      Phishing: 'Phishing', FollowUp: 'Follow-up', Review: 'Review', Other: 'Other',
    },
    date: {
      today: 'Today', yesterday: 'Yesterday',
    },
    dashboard: {
      title: 'Dashboard',
      classifying: 'Classifying...', starting: 'Starting...', classifyAi: 'Classify with AI',
      totalEmails: 'Total emails', unread: 'Unread', classified: 'Classified', accounts: 'Accounts',
      phishingDetected: 'Phishing detected', check: 'Check!', safe: 'Safe',
      packages: 'Packages', subscriptions: 'Subscriptions', followUps: 'Follow-ups',
      byCategory: 'Distribution by category', noClassifiedYet: 'No classified emails yet',
      topCategories: 'Top categories', accountsSection: 'Accounts',
      autoSyncOn: 'on', autoSyncOff: 'off', addAccount: 'Add account',
      autoSyncNote: 'Syncs automatically every minute',
      noAccountsYet: 'No accounts configured yet.', addAccountNow: 'Add account now',
      syncing: 'syncing...', lastSync: 'Last sync', neverSynced: 'Not synced yet',
      error: 'Error', current: 'Up to date', sync: 'Sync', newCount: 'new',
    },
    emailList: {
      searchPlaceholder: 'Search...', loading: 'Loading...', noEmails: 'No emails',
      selectEmail: 'Select an email', noSubject: '(no subject)',
    },
    emailDetail: {
      summarize: 'Summarize', from: 'From', date: 'Date', to: 'To', attachments: 'Attachments',
      files: 'file(s)', phishingSuspicion: 'Phishing suspicion', subscription: 'Subscription',
      cancel: 'Cancel', due: 'Due', noBodyText: 'No text content available.',
      replySuggestion: 'Suggestion', confidence: 'confidence',
    },
    categorySidebar: {
      categories: 'Categories', all: 'All',
    },
    actions: {
      title: 'Actions', subtitle: 'Review and correct AI classifications',
      reviewTab: 'Review AI', foldersTab: 'Folders', rulesTab: 'Rules', organizeTab: 'Organize',
      organizeIntro: 'Proposals to move emails into their category folder on the IMAP server. Nothing moves until you confirm it here.',
      propose: 'Create proposals', applyAll: 'Apply all', skipAll: 'Skip all',
      apply: 'Apply', skip: 'Skip', noProposals: 'No open proposals. Classify emails first, then create proposals.',
      moveTo: 'Move to', failedLabel: 'Failed', appliedLabel: 'Applied', skippedLabel: 'Skipped', pendingLabel: 'Pending',
      proposalsCreated: 'proposals created', appliedCount: 'applied', failedCount: 'failed',
      serverWarning: 'These actions change your mailbox on the server.',
      howReviewWorks: 'How AI review works',
      reviewExplain: 'The AI automatically categorized your emails. Here you can check if that\'s correct.',
      correctChecks: 'Correct', correctChecksExplain: '= category is correct, email disappears from the list.',
      changeCategory: 'Change category', changeCategoryExplain: '= you correct the classification.',
      loading: 'Loading...', allReviewed: 'All reviewed!',
      confirmedCount: 'emails confirmed.', noClassifiedYetReview: 'No classified emails yet, run "Classify with AI" on the Dashboard first.',
      phishingSuspected: 'Phishing suspected', uncertain: 'Uncertain classification', confident: 'Confidently classified',
      confirmAll: 'Confirm all',
      matches: 'Matches', changed: 'Change', cancelBtn: 'Cancel',
      correctedByUser: 'corrected by user', chooseCorrectCategory: 'Choose the correct category:',
      folderIntroTitle: 'IMAP folders and AI reorganization',
      folderIntroText: 'See all your mailbox folders and let AI suggest simplifications.',
      loadFolders: 'Load folders', aiSuggestions: 'AI suggestions',
      loadingFolders: 'Loading...', aiAnalyzing: 'AI analyzing...',
      currentFolders: 'Current folders', suggestionsNotAutoExecuted: 'Suggestions are not executed automatically yet. IMAP actions are coming in a future version.',
      loadFoldersOrSuggestions: 'Load folders or request AI suggestions',
      folderLoadError: 'Error loading folders', aiAnalysisError: 'AI analysis failed',
    },
    rules: {
      title: 'Automatic rules',
      intro: 'A matching rule queues a move as a proposal. Nothing is carried out until you confirm it under Organize.',
      empty: 'No rules yet. Start from a template or write your own.',
      templates: 'Templates',
      createOwn: 'Create your own rule',
      run: 'Apply rules',
      queued: 'moves queued for confirmation',
      noMatches: 'No email matched an active rule.',
      enable: 'Enable rule', disable: 'Disable rule', delete: 'Delete',
      and: 'and', or: 'or', moveTo: 'Move to', noMove: 'no move',
      condFrom: 'Sender contains', condSubject: 'Subject contains',
      condBody: 'Body contains', condDomain: 'Sender domain',
      condCategory: 'Category', condHasAttachment: 'Has attachment',
      namePlaceholder: 'Rule name', valuePlaceholder: 'Text to look for',
      folderPlaceholder: 'Target folder',
      save: 'Save rule', cancel: 'Cancel', loading: 'Loading...',
    },
    settings: {
      title: 'Settings', emailAccounts: 'Email accounts', addAccount: 'Add account',
      claudeSection: 'AI, Claude', syncOptions: 'Sync options',
      maxEmailsPerSync: 'Max emails per sync', autoClassifyAfterSync: 'Classify automatically after sync',
      reviewBeforeDelete: 'Always use review folder before deleting',
      saved: 'Saved!', save: 'Save settings',
      providerCustom: 'Custom',
      addProviderTitle: 'Add', removeAccountConfirm: 'Really remove account',
      remove: 'Remove',
      apiKeyLabel: 'API key (Keychain):', keySet: 'Set', keyNotSet: 'Not set',
      saving: 'Saving...', save2: 'Save', replaceKey: 'Replace key',
      model: 'Model', modelFast: 'fast, cheap', modelBalanced: 'balanced', modelStrongest: 'strongest',
      testConnection: 'Test connection', testing: 'Testing...',
      claudeReachable: 'Claude reachable', claudeUnreachable: 'Claude unreachable, API key missing or invalid',
      apiKeySaved: 'API key saved', apiKeySaveError: 'Error saving API key',
      appPasswordNeeded: 'requires an app password, not a regular password.',
      emailAddress: 'Email address', continueGeneratePassword: 'Continue, generate app password',
      scanQr: 'Scan the QR code with your iPhone',
      orDirect: 'or directly:', haveAppPassword: 'I have the app password',
      pasteAppPassword: 'Paste the generated app password for', appPassword: 'App password',
      back: 'Back', connect: 'Connect', connecting: 'Connecting...',
      label: 'Label', email: 'Email', imapHost: 'IMAP host', port: 'Port',
      username: 'Username', password: 'Password', myAccount: 'My account',
      testingConnection: 'Testing connection...', saveAccount: 'Save account',
      folderLoadErrorGeneric: 'Error loading folders',
    },
  },
  de: {
    nav: {
      dashboard: 'Übersicht', emails: 'E-Mails', actions: 'Aktionen', settings: 'Einstellungen',
      claudeOnline: 'Claude online', claudeOffline: 'Claude offline',
    },
    category: {
      Important: 'Wichtig', Work: 'Arbeit', Private: 'Privat',
      Invoice: 'Rechnung', Newsletter: 'Newsletter', Social: 'Social',
      Ads: 'Werbung', Government: 'Behörde', Package: 'Paket',
      Calendar: 'Termin', Subscription: 'Abo', Spam: 'Spam',
      Phishing: 'Phishing', FollowUp: 'Follow-Up', Review: 'Review', Other: 'Sonstiges',
    },
    date: {
      today: 'Heute', yesterday: 'Gestern',
    },
    dashboard: {
      title: 'Dashboard',
      classifying: 'Klassifiziere...', starting: 'Starte...', classifyAi: 'KI klassifizieren',
      totalEmails: 'E-Mails gesamt', unread: 'Ungelesen', classified: 'Klassifiziert', accounts: 'Konten',
      phishingDetected: 'Phishing erkannt', check: 'Prüfen!', safe: 'Sicher',
      packages: 'Pakete', subscriptions: 'Abos', followUps: 'Follow-ups',
      byCategory: 'Verteilung nach Kategorie', noClassifiedYet: 'Noch keine klassifizierten E-Mails',
      topCategories: 'Top Kategorien', accountsSection: 'Konten',
      autoSyncOn: 'aktiv', autoSyncOff: 'aus', addAccount: 'Konto hinzufügen',
      autoSyncNote: 'Synchronisiert automatisch jede Minute',
      noAccountsYet: 'Noch keine Konten konfiguriert.', addAccountNow: 'Jetzt Konto hinzufügen',
      syncing: 'syncing...', lastSync: 'Letzter Sync', neverSynced: 'Noch nicht synchronisiert',
      error: 'Fehler', current: 'Aktuell', sync: 'Sync', newCount: 'neu',
    },
    emailList: {
      searchPlaceholder: 'Suchen...', loading: 'Lade...', noEmails: 'Keine E-Mails',
      selectEmail: 'E-Mail auswählen', noSubject: '(kein Betreff)',
    },
    emailDetail: {
      summarize: 'Zusammenfassen', from: 'Von', date: 'Datum', to: 'An', attachments: 'Anhänge',
      files: 'Datei(en)', phishingSuspicion: 'Phishing-Verdacht', subscription: 'Abo',
      cancel: 'Kündigen', due: 'Fällig', noBodyText: 'Kein Text-Inhalt verfügbar.',
      replySuggestion: 'Vorschlag', confidence: 'Konfidenz',
    },
    categorySidebar: {
      categories: 'Kategorien', all: 'Alle',
    },
    actions: {
      title: 'Aktionen', subtitle: 'KI-Klassifizierungen prüfen und korrigieren',
      reviewTab: 'KI überprüfen', foldersTab: 'Ordner', rulesTab: 'Regeln', organizeTab: 'Organisieren',
      organizeIntro: 'Vorschläge, E-Mails auf dem IMAP-Server in ihren Kategorie-Ordner zu verschieben. Es wird nichts verschoben, bevor du es hier bestätigst.',
      propose: 'Vorschläge erzeugen', applyAll: 'Alle anwenden', skipAll: 'Alle überspringen',
      apply: 'Anwenden', skip: 'Überspringen', noProposals: 'Keine offenen Vorschläge. Klassifiziere zuerst E-Mails, dann Vorschläge erzeugen.',
      moveTo: 'Verschieben nach', failedLabel: 'Fehlgeschlagen', appliedLabel: 'Angewendet', skippedLabel: 'Übersprungen', pendingLabel: 'Offen',
      proposalsCreated: 'Vorschläge erzeugt', appliedCount: 'angewendet', failedCount: 'fehlgeschlagen',
      serverWarning: 'Diese Aktionen verändern dein Postfach auf dem Server.',
      howReviewWorks: 'So funktioniert die KI-Überprüfung',
      reviewExplain: 'Die KI hat deine E-Mails automatisch kategorisiert. Hier kannst du prüfen ob das stimmt.',
      correctChecks: 'Stimmt', correctChecksExplain: '= Kategorie ist korrekt, E-Mail verschwindet aus der Liste.',
      changeCategory: 'Kategorie ändern', changeCategoryExplain: '= Du korrigierst die Einordnung.',
      loading: 'Lade…', allReviewed: 'Alles überprüft!',
      confirmedCount: 'E-Mails bestätigt.', noClassifiedYetReview: 'Noch keine klassifizierten E-Mails, erst "KI klassifizieren" im Dashboard.',
      phishingSuspected: 'Phishing-Verdacht', uncertain: 'Unsichere Einordnung', confident: 'Sicher eingeordnet',
      confirmAll: 'Alle bestätigen',
      matches: 'Stimmt', changed: 'Ändern', cancelBtn: 'Abbrechen',
      correctedByUser: 'vom Nutzer korrigiert', chooseCorrectCategory: 'Richtige Kategorie wählen:',
      folderIntroTitle: 'IMAP-Ordner und KI-Reorganisation',
      folderIntroText: 'Sieh alle Ordner deines Postfachs und lass die KI Vorschläge zur Vereinfachung machen.',
      loadFolders: 'Ordner laden', aiSuggestions: 'KI-Vorschläge',
      loadingFolders: 'Lade...', aiAnalyzing: 'KI analysiert...',
      currentFolders: 'Aktuelle Ordner', suggestionsNotAutoExecuted: 'Vorschläge werden noch nicht automatisch ausgeführt. IMAP-Aktionen kommen in einer zukünftigen Version.',
      loadFoldersOrSuggestions: 'Ordner laden oder KI-Vorschläge anfordern',
      folderLoadError: 'Fehler beim Laden der Ordner', aiAnalysisError: 'KI-Analyse fehlgeschlagen',
    },
    rules: {
      title: 'Automatische Regeln',
      intro: 'Eine passende Regel legt einen Verschiebe-Vorschlag an. Ausgeführt wird nichts, bis du es unter Organisieren bestätigst.',
      empty: 'Noch keine Regeln. Starte mit einer Vorlage oder schreib eine eigene.',
      templates: 'Vorlagen',
      createOwn: 'Eigene Regel erstellen',
      run: 'Regeln anwenden',
      queued: 'Verschiebungen zur Bestätigung angelegt',
      noMatches: 'Keine E-Mail passt auf eine aktive Regel.',
      enable: 'Regel aktivieren', disable: 'Regel deaktivieren', delete: 'Löschen',
      and: 'und', or: 'oder', moveTo: 'Verschieben nach', noMove: 'keine Verschiebung',
      condFrom: 'Absender enthält', condSubject: 'Betreff enthält',
      condBody: 'Text enthält', condDomain: 'Absender-Domain',
      condCategory: 'Kategorie', condHasAttachment: 'Hat Anhang',
      namePlaceholder: 'Name der Regel', valuePlaceholder: 'Gesuchter Text',
      folderPlaceholder: 'Zielordner',
      save: 'Regel speichern', cancel: 'Abbrechen', loading: 'Lade…',
    },
    settings: {
      title: 'Einstellungen', emailAccounts: 'E-Mail Konten', addAccount: 'Konto hinzufügen',
      claudeSection: 'KI, Claude', syncOptions: 'Sync-Optionen',
      maxEmailsPerSync: 'Maximale E-Mails pro Sync', autoClassifyAfterSync: 'Automatisch klassifizieren nach Sync',
      reviewBeforeDelete: 'Vor Löschen immer Review-Ordner',
      saved: 'Gespeichert!', save: 'Einstellungen speichern',
      providerCustom: 'Benutzerdefiniert',
      addProviderTitle: 'hinzufügen', removeAccountConfirm: 'wirklich entfernen?',
      remove: 'Entfernen',
      apiKeyLabel: 'API-Key (Keychain):', keySet: 'Gesetzt', keyNotSet: 'Nicht gesetzt',
      saving: 'Speichern…', save2: 'Speichern', replaceKey: 'Key ersetzen',
      model: 'Modell', modelFast: 'schnell, günstig', modelBalanced: 'ausgewogen', modelStrongest: 'am stärksten',
      testConnection: 'Verbindung testen', testing: 'Teste…',
      claudeReachable: 'Claude erreichbar', claudeUnreachable: 'Claude nicht erreichbar, API-Key fehlt oder ungültig',
      apiKeySaved: 'API-Key gespeichert', apiKeySaveError: 'Fehler beim Speichern des API-Keys',
      appPasswordNeeded: 'wird ein App-Passwort benötigt, kein normales Passwort.',
      emailAddress: 'E-Mail-Adresse', continueGeneratePassword: 'Weiter, App-Passwort generieren',
      scanQr: 'Scanne den QR-Code mit deinem iPhone',
      orDirect: 'oder direkt:', haveAppPassword: 'Ich habe das App-Passwort',
      pasteAppPassword: 'Füge das generierte App-Passwort ein für', appPassword: 'App-Passwort',
      back: 'Zurück', connect: 'Verbinden', connecting: 'Verbinde…',
      label: 'Bezeichnung', email: 'E-Mail', imapHost: 'IMAP Host', port: 'Port',
      username: 'Benutzername', password: 'Passwort', myAccount: 'Mein Konto',
      testingConnection: 'Verbindung testen…', saveAccount: 'Konto speichern',
      folderLoadErrorGeneric: 'Fehler beim Laden der Ordner',
    },
  },
}

interface LangState {
  lang: Lang
  setLang: (lang: Lang) => void
  toggle: () => void
}

export const useLangStore = create<LangState>((set) => ({
  lang: (localStorage.getItem(STORAGE_KEY) as Lang) || 'en',
  setLang: (lang) => {
    localStorage.setItem(STORAGE_KEY, lang)
    set({ lang })
  },
  toggle: () => set((s) => {
    const next: Lang = s.lang === 'en' ? 'de' : 'en'
    localStorage.setItem(STORAGE_KEY, next)
    return { lang: next }
  }),
}))

export function getLang(): Lang {
  return useLangStore.getState().lang
}

function resolve(dict: Dict, path: string): string {
  const parts = path.split('.')
  let node: string | Dict | undefined = dict
  for (const p of parts) {
    node = typeof node === 'object' ? node[p] : undefined
  }
  return typeof node === 'string' ? node : path
}

export function t(path: string): string {
  return resolve(translations[getLang()], path)
}

export function useT() {
  const lang = useLangStore((s) => s.lang)
  return (path: string) => resolve(translations[lang], path)
}

export function dateLocale(): string {
  return getLang() === 'de' ? 'de-CH' : 'en-US'
}
