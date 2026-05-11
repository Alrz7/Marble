fn hash_password(password: &str) -> Vec<u8> {
    use blake2b_simd::Params;

    let salt = b"your-salt-here-change-this";
    let mut context = Params::new()
        .hash_length(32) // 256-bit key
        .key(salt)
        .to_state();

    context.update(password.as_bytes());
    let hash = context.finalize();

    hash.as_bytes().to_vec()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_keyring::init())
        .plugin(tauri_plugin_stronghold::Builder::new(hash_password).build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
