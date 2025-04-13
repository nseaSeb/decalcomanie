use reqwest::Client;
use serde_json::json;

#[tauri::command]
pub async fn get_sellsy_token(client_id: String, client_secret: String) -> Result<String, String> {
    let client = Client::new();
    let response = client
        .post("https://login.sellsy.com/oauth2/access-tokens")
        .json(&json!({
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Erreur API: {}", response.status()));
    }

    let token_data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    
    token_data["access_token"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or("Token non trouvé".into())
}
