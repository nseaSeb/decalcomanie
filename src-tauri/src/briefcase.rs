use reqwest::{Client, header::{HeaderMap, HeaderValue}};
use serde_json::json;
use base64::Engine as _;
use reqwest::multipart::{Form, Part};

pub struct Briefcase {
    pub briefcase_id: Option<String>,
}

impl Briefcase {
    pub fn new() -> Self {
        Self {
            briefcase_id: None,
        }
    }
    

    
    pub async fn get_root_folder_id(&mut self, token: &str) -> Result<String, String> {
        // Si l'ID est déjà là, on évite l'appel réseau
        if let Some(ref id) = self.briefcase_id {
            return Ok(id.clone());
        }

        let client = Client::new();

        let mut headers = HeaderMap::new();
        headers.insert(
            "Authorization",
            HeaderValue::from_str(token).map_err(|e| format!("Token invalide: {}", e))?,
        );

        let form = Form::new()
            .text("request", "1")
            .text("io_mode", "json")
            .text(
                "do_in",
                json!({
                    "method": "Briefcases.getRootFolders",
                    "params": {}
                })
                .to_string(),
            );

        let response = client
            .post("https://apifeed.sellsy.com/0/")
            .headers(headers)
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("Erreur d'envoi: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Erreur API: {}", response.status()));
        }

        let json_response: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Erreur de parsing JSON: {}", e))?;

        let folder = json_response["response"]
            .as_array()
            .and_then(|arr| {
                arr.iter().find(|f| {
                    f.get("name") == Some(&serde_json::Value::String("Mes documents".to_string()))
                })
            })
            .ok_or_else(|| "Le dossier 'Mes documents' est introuvable".to_string())?;

        let id = folder["id"]
            .as_str()
            .ok_or_else(|| "ID manquant pour 'Mes documents'".to_string())?
            .to_string();

        self.briefcase_id = Some(id.clone());

        Ok(id)
    }
}


#[tauri::command]
pub async fn get_folder_id(token: String, current_id: Option<String>) -> Result<String, String> {
    let mut briefcase = Briefcase {
        briefcase_id: current_id,
    };

    briefcase.get_root_folder_id(&token).await
}

#[tauri::command]
pub async fn upload_base64_to_sellsy(token: String, folder_id: String, base64_data: String) -> Result<String, String> {
    println!("➡️ Début de upload_base64_to_sellsy");
    println!("📁 folder_id: {}", folder_id);
    println!("🔑 token prefix: {}", &token[..10.min(token.len())]); // éviter de tout logguer

    let client = Client::new();

    let base64_clean = base64_data
        .split(',')
        .nth(1)
        .ok_or("Base64 invalide : préfixe manquant")?;

    println!("🧼 Base64 nettoyé (longueur): {}", base64_clean.len());

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(base64_clean)
        .map_err(|e| {
            let msg = format!("❌ Erreur de décodage base64: {}", e);
            println!("{}", msg);
            msg
        })?;

    println!("🧾 Taille de l'image en bytes: {}", bytes.len());

    let part = Part::bytes(bytes)
        .file_name("image.png")
        .mime_str("image/png")
        .map_err(|e| {
            let msg = format!("❌ Erreur MIME: {}", e);
            println!("{}", msg);
            msg
        })?;

    let form = Form::new().part("file", part);

    let mut headers = HeaderMap::new();
    headers.insert(
        "Authorization",
        HeaderValue::from_str(&token)
            .map_err(|e| {
                let msg = format!("❌ Token invalide: {}", e);
                println!("{}", msg);
                msg
            })?,
    );

    let url = format!("https://api.sellsy.com/v2/directories/{}/files", folder_id);
    println!("🌍 URL de l’upload : {}", url);

    let response = client
        .post(&url)
        .headers(headers)
        .multipart(form)
        .send()
        .await
        .map_err(|e| {
            let msg = format!("❌ Erreur d'envoi: {}", e);
            println!("{}", msg);
            msg
        })?;

    let status = response.status();
    let text = response.text().await.unwrap_or_default();

    println!("📡 Statut HTTP: {}", status);
    println!("📦 Réponse brute: {}", text);

    if !status.is_success() {
        return Err(format!("❌ Erreur API: {}", status));
    }

    let json_response: serde_json::Value = serde_json::from_str(&text)
        .map_err(|e| format!("Erreur de parsing JSON: {}", e))?;

    println!("✅ JSON reçu: {:?}", json_response);


    let public_link = json_response["public_link"]
    .as_str()
    .ok_or("Le champ 'public_link' est manquant ou invalide")?;

Ok(public_link.to_string())
}



// let json_response: serde_json::Value = response
// .json()
// .await
// .map_err(|e| format!("Erreur de parsing JSON: {}", e))?;
// println!("Response: {}", json_response);
// // Extraction de l'ID du dossier
// let folders = json_response["response"]
// .as_array()
// .ok_or_else(|| "Champ 'response' invalide".to_string())?
// .to_owned(); // clone car on retourne le tableau
