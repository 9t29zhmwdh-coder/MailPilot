pub mod claude;
pub mod ollama;
pub mod prompts;

use anyhow::Result;
use async_trait::async_trait;
use crate::models::classification::Classification;

#[async_trait]
pub trait AiBackend: Send + Sync {
    async fn classify_email(&self, context: &str) -> Result<Classification>;
    async fn summarize(&self, body: &str) -> Result<String>;
    async fn suggest_reply(&self, context: &str) -> Result<String>;
    async fn is_available(&self) -> bool;
}

/// Waehlt das Backend anhand der Einstellungen.
///
/// Bis hierher erzeugte jeder Aufrufer direkt einen `ClaudeBackend`, und der
/// vollstaendig implementierte `OllamaBackend` wurde nirgends instanziiert.
/// Die Anwendung sprach damit ausnahmslos einen Cloud-Dienst an, waehrend
/// README und Datenschutzerklaerung lokale Verarbeitung zusagten.
///
/// `None` heisst: das gewaehlte Backend ist nicht benutzbar, etwa weil der
/// Cloud-Pfad gewaehlt ist und kein Schluessel hinterlegt wurde. Der Aufrufer
/// meldet das, statt still auf das andere Backend auszuweichen: ein
/// stillschweigender Wechsel in die Cloud ist genau das, was hier zu
/// korrigieren war.
pub fn backend_from_settings(
    choice: &str,
    ollama_url: &str,
    text_model: &str,
    claude_key: Option<&str>,
    claude_model: &str,
) -> Option<Box<dyn AiBackend>> {
    match choice {
        "claude" => claude_key
            .filter(|k| !k.is_empty())
            .map(|k| Box::new(claude::ClaudeBackend::new(k, claude_model)) as Box<dyn AiBackend>),
        // Alles andere, einschliesslich eines unbekannten Werts aus einer
        // aelteren Konfiguration, laeuft lokal. Ein Tippfehler darf keine
        // E-Mail an einen Cloud-Dienst schicken.
        _ => Some(Box::new(ollama::OllamaBackend::new(ollama_url, text_model)) as Box<dyn AiBackend>),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Der Kern der Regel: ohne ausdrueckliche Wahl darf nichts in die Cloud.
    #[test]
    fn the_default_choice_stays_local() {
        let b = backend_from_settings("ollama", "http://localhost:11434", "llama3", Some("key"), "m");
        assert!(b.is_some());
    }

    #[test]
    fn an_unknown_choice_stays_local_rather_than_reaching_out() {
        // Ein Tippfehler oder ein Wert aus einer aelteren Konfiguration darf
        // keine E-Mail an einen fremden Dienst schicken.
        let b = backend_from_settings("gpt5-turbo", "http://localhost:11434", "llama3", Some("key"), "m");
        assert!(b.is_some(), "unbekannte Wahl muss auf das lokale Backend fallen");
    }

    #[test]
    fn the_cloud_choice_needs_a_key() {
        assert!(backend_from_settings("claude", "u", "t", None, "m").is_none());
        assert!(backend_from_settings("claude", "u", "t", Some(""), "m").is_none());
        assert!(backend_from_settings("claude", "u", "t", Some("k"), "m").is_some());
    }

    #[test]
    fn a_missing_key_does_not_silently_fall_back_to_local() {
        // Waere hier Some, wuerde die Anwendung lokal klassifizieren, obwohl der
        // Nutzer die Cloud gewaehlt hat, und das stillschweigend.
        assert!(backend_from_settings("claude", "u", "t", None, "m").is_none());
    }
}
