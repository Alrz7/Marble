mod crypto;

#[tauri::command]
fn derive_raw_key_from_password(
    password: String,
    salt_buffer: Vec<u8>,
    hash_length: Option<usize>,
) -> Result<Vec<u8>, String> {
    let len = hash_length.unwrap_or(32);
    crypto::derive_raw_key_from_password(&password, &salt_buffer, len)
}

#[tauri::command]
fn derive_decoded_key_from_password(passphrase: String) -> Result<String, String> {
    crypto::derive_decoded_key_from_password(&passphrase)
}

#[tauri::command]
fn verify_daily_passphrase(
    saved_encoded_hash: String,
    input_passphrase: String,
) -> Result<bool, String> {
    crypto::verify_daily_passphrase(&saved_encoded_hash, &input_passphrase)
}

#[tauri::command]
fn bytes_to_hex(bytes: Vec<u8>) -> String {
    crypto::bytes_to_hex(&bytes)
}

#[tauri::command]
fn hex_to_bytes(hex: String) -> Result<Vec<u8>, String> {
    crypto::hex_to_bytes(&hex)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_keyring::init())
        .invoke_handler(tauri::generate_handler![
            derive_raw_key_from_password,
            derive_decoded_key_from_password,
            verify_daily_passphrase,
            bytes_to_hex,
            hex_to_bytes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
