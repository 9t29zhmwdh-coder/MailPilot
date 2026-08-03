use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum MpError {
    #[error("DB error: {0}")]
    Db(#[from] sqlx::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("IMAP error: {0}")]
    Imap(String),
    #[error("Keyring error: {0}")]
    Keyring(String),
    #[error("{0}")]
    Other(String),
}

impl From<anyhow::Error> for MpError {
    fn from(e: anyhow::Error) -> Self { MpError::Other(e.to_string()) }
}

impl Serialize for MpError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

pub type MpResult<T> = Result<T, MpError>;

#[cfg(test)]
mod tests {
    use super::*;

    /// Haelt die Fehlertexte fest. Sie sind nicht intern: `Serialize` reicht
    /// genau diesen String an das Frontend weiter, wo er im Fenster landet.
    /// Ein Versionssprung von `thiserror` darf die Formatierung deshalb nicht
    /// stillschweigend veraendern.
    #[test]
    fn fehlertexte_bleiben_wie_sie_sind() {
        let io = MpError::Io(std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            "Verbindung abgelehnt",
        ));
        assert_eq!(io.to_string(), "IO error: Verbindung abgelehnt");

        let db = MpError::Db(sqlx::Error::RowNotFound);
        assert_eq!(
            db.to_string(),
            "DB error: no rows returned by a query that expected to return at least one row"
        );

        assert_eq!(
            MpError::Imap("LOGIN fehlgeschlagen".into()).to_string(),
            "IMAP error: LOGIN fehlgeschlagen"
        );
        assert_eq!(
            MpError::Keyring("kein Eintrag".into()).to_string(),
            "Keyring error: kein Eintrag"
        );
        assert_eq!(MpError::Other("nur der Text".into()).to_string(), "nur der Text");
    }

    /// anyhow kommt nicht ueber #[from], sondern ueber ein eigenes From, das
    /// die Meldung flach uebernimmt.
    #[test]
    fn anyhow_wird_flach_uebernommen() {
        let fehler: MpError = anyhow::anyhow!("etwas ging schief").into();
        assert_eq!(fehler.to_string(), "etwas ging schief");
    }

    #[test]
    fn serialisierung_liefert_denselben_text() {
        let fehler = MpError::Imap("sichtbar im Fenster".into());
        assert_eq!(
            serde_json::to_string(&fehler).unwrap(),
            "\"IMAP error: sichtbar im Fenster\""
        );
    }
}
