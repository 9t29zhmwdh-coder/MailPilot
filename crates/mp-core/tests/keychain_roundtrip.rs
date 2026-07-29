//! Proves the keychain path actually stores and returns a secret.
//!
//! The previous implementation shelled out to `/usr/bin/security` and passed the
//! password as a command-line argument, which `security add-generic-password -h`
//! itself calls insecure because arguments are readable from the process table.
//! A test that only checked "no error returned" would have passed for that
//! version too, so this one reads the value back.

use mp_core::imap_client::account_manager;

#[test]
fn a_stored_password_comes_back_unchanged() {
    let id = format!("mailpilot-test-{}", std::process::id());
    let secret = "correct horse battery staple";

    account_manager::store_password(&id, secret).expect("store");
    let got = account_manager::get_password(&id).expect("read back");
    assert_eq!(got, secret, "keychain returned a different value");

    account_manager::delete_password(&id).expect("delete");
    assert!(
        account_manager::get_password(&id).is_err(),
        "entry still readable after deletion"
    );

    // Deleting twice is what account removal after a failed setup does.
    account_manager::delete_password(&id).expect("second delete must be a no-op");
}
