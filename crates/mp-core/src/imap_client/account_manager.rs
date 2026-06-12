use anyhow::Result;
use crate::models::account::EmailAccount;

pub fn keyring_service() -> &'static str {
    "com.raystudio.mailpilot"
}

pub fn store_password(account_id: &str, password: &str) -> Result<()> {
    let entry = keyring::Entry::new(keyring_service(), account_id)?;
    entry.set_password(password)?;
    Ok(())
}

pub fn get_password(account_id: &str) -> Result<String> {
    let entry = keyring::Entry::new(keyring_service(), account_id)?;
    let pw = entry.get_password()?;
    Ok(pw)
}

pub fn delete_password(account_id: &str) -> Result<()> {
    let entry = keyring::Entry::new(keyring_service(), account_id)?;
    entry.delete_password()?;
    Ok(())
}

pub fn test_connection(account: &EmailAccount, password: &str) -> Result<Vec<String>> {
    let mut session = super::connect_tls(account, password)?;
    let mailboxes: Vec<String> = session
        .list(None, Some("*"))?
        .iter()
        .filter_map(|mb| mb.name().ok().map(|s| s.to_string()))
        .collect();
    let _ = session.logout();
    Ok(mailboxes)
}
