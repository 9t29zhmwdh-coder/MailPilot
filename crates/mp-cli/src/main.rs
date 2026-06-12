use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().collect();
    let cmd = args.get(1).map(|s| s.as_str()).unwrap_or("help");

    match cmd {
        "sync" => {
            let account_id = args.get(2).map(|s| s.as_str()).unwrap_or("");
            println!("Syncing account: {}", account_id);
        }
        "classify" => {
            println!("Classifying unclassified emails…");
        }
        "stats" => {
            println!("MailPilot statistics");
        }
        _ => {
            println!("MailPilot CLI");
            println!();
            println!("Usage: mailpilot <command>");
            println!();
            println!("Commands:");
            println!("  sync [account_id]   Sync emails from IMAP");
            println!("  classify            Classify unclassified emails");
            println!("  stats               Show email statistics");
        }
    }

    Ok(())
}
