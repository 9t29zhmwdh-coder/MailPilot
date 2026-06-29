pub mod queries;

use anyhow::Result;
use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions},
    SqlitePool,
};
use std::str::FromStr;

pub async fn open_db(path: &str) -> Result<SqlitePool> {
    // Uebergeordnetes Verzeichnis anlegen; SQLite legt nur die Datei an, nicht den Ordner.
    let fs_path = path.trim_start_matches("sqlite://").trim_start_matches("sqlite:");
    if let Some(parent) = std::path::Path::new(fs_path).parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent)?;
        }
    }

    let opts = SqliteConnectOptions::from_str(path)?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(opts)
        .await?;

    sqlx::migrate!("./src/db/migrations").run(&pool).await?;
    Ok(pool)
}
