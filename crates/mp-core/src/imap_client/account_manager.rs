use anyhow::{bail, Result};
use std::process::Command;
use crate::models::account::EmailAccount;

const SERVICE: &str = "com.raystudio.mailpilot";

pub fn store_password(account_id: &str, password: &str) -> Result<()> {
    // Bestehenden Eintrag zuerst löschen (add schlägt fehl wenn er schon existiert)
    let _ = delete_password(account_id);
    let status = Command::new("security")
        .args(["add-generic-password", "-s", SERVICE, "-a", account_id, "-w", password])
        .status()?;
    if !status.success() {
        bail!("security add-generic-password schlug fehl");
    }
    Ok(())
}

pub fn get_password(account_id: &str) -> Result<String> {
    let out = Command::new("security")
        .args(["find-generic-password", "-s", SERVICE, "-a", account_id, "-w"])
        .output()?;
    if !out.status.success() {
        bail!("Kein Eintrag gefunden für '{}'", account_id);
    }
    Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

pub fn delete_password(account_id: &str) -> Result<()> {
    Command::new("security")
        .args(["delete-generic-password", "-s", SERVICE, "-a", account_id])
        .status()?;
    Ok(())
}

pub fn test_connection(account: &EmailAccount, password: &str) -> Result<Vec<String>> {
    let mut session = super::connect_tls(account, password)?;
    let mailboxes: Vec<String> = session
        .list(None, Some("*"))?
        .iter()
        .map(|mb| mb.name().to_string())
        .collect();
    let _ = session.logout();
    Ok(mailboxes)
}
