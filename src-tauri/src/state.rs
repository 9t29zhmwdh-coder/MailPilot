use mp_core::models::account::AppSettings;
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct AppState {
    pub pool: SqlitePool,
    pub settings: Arc<RwLock<AppSettings>>,
}

impl AppState {
    pub fn new(pool: SqlitePool, settings: AppSettings) -> Self {
        Self {
            pool,
            settings: Arc::new(RwLock::new(settings)),
        }
    }
}
