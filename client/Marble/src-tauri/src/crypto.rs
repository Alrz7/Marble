use argon2::{
    password_hash::{
        rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString,
    },
    Argon2, Params,
};

pub fn derive_raw_key_from_password(
    password: &str,
    salt: &[u8],
    hash_length: usize,
) -> Result<Vec<u8>, String> {
    let params = Params::new(65536, 3, 1, Some(hash_length))
        .map_err(|e| format!("unexpected parameters for Argon2: {}", e))?;

    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
    let mut output_key = vec![0u8; hash_length];

    argon2
        .hash_password_into(password.as_bytes(), salt, &mut output_key)
        .map_err(|e| format!("error while hashing key: {}", e))?;

    Ok(output_key)
}

pub fn derive_decoded_key_from_password(passphrase: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let params = Params::new(65536, 3, 1, Some(32))
        .map_err(|e| format!("unexpected parameters for Argon2: {}", e))?;

    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
    let password_hash = argon2
        .hash_password(passphrase.as_bytes(), &salt)
        .map_err(|e| format!("error while hashing key: {}", e))?;

    Ok(password_hash.to_string())
}

pub fn verify_daily_passphrase(
    saved_encoded_hash: &str,
    input_passphrase: &str,
) -> Result<bool, String> {
    let parsed_hash = PasswordHash::new(saved_encoded_hash)
        .map_err(|e| format!("existing hash is not valid: {}", e))?;

    let argon2 = Argon2::default();
    Ok(argon2
        .verify_password(input_passphrase.as_bytes(), &parsed_hash)
        .is_ok())
}

pub fn bytes_to_hex(bytes: &[u8]) -> String {
    hex::encode(bytes)
}

pub fn hex_to_bytes(hex_str: &str) -> Result<Vec<u8>, String> {
    hex::decode(hex_str).map_err(|e| format!("invalid hex string: {}", e))
}