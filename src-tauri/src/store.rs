use tauri::{AppHandle, command};
use tauri_plugin_store::StoreExt;
use serde_json::json;

// Commande pour sauvegarder les clés API
#[command]
pub async fn save_api_keys(
    app: AppHandle,
    client_id: String,
    client_secret: String,
) -> Result<(), String> {
    let store = app.store("api-keys.dat").map_err(|e| e.to_string())?;
    
    // Les méthodes set() ne retournent pas de Result, donc pas besoin de map_err
    store.set("client_id", json!(client_id));
    store.set("client_secret", json!(client_secret));
    
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

// Commande pour récupérer une clé API
#[command]
pub async fn get_api_key(
    app: AppHandle,
    key_name: String,
) -> Result<Option<String>, String> {
    let store = app.store("api-keys.dat").map_err(|e| e.to_string())?;
    
    match store.get(&key_name) {
        Some(value) => {
            if let Some(s) = value.as_str() {
                Ok(Some(s.to_string()))
            } else {
                Err(format!("La valeur pour '{}' n'est pas une chaîne", key_name))
            }
        },
        None => Ok(None)
    }
}

// Commande pour utiliser les clés API pour une requête
#[command]
pub async fn make_api_request(
    app: AppHandle,
    endpoint: String,
) -> Result<String, String> {
    let store = app.store("api-keys.dat").map_err(|e| e.to_string())?;
    
    let client_id = store.get("client_id")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .ok_or("client_id non trouvé ou invalide")?;
    
    let client_secret = store.get("client_secret")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .ok_or("client_secret non trouvé ou invalide")?;
    
    Ok(format!(
        "Requête à {} avec client_id={} et client_secret={}",
        endpoint, client_id, client_secret
    ))
}