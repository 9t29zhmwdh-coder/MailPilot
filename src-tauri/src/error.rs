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
