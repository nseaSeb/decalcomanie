use reqwest::{Client, header::{HeaderMap, HeaderValue}};
use reqwest::multipart::Form;
use serde_json::json;

#[tauri::command]
pub async fn get_folder_id(token: String) -> Result<String, String> {
    println!("inside get folder call");
    let client = Client::new();

    // Création des headers
    let mut headers = HeaderMap::new();
    headers.insert(
        "Authorization",
        HeaderValue::from_str(&token).map_err(|e| format!("Token invalide: {}", e))?
    );

    // Création du formulaire multipart
    let form = Form::new()
        .text("request", "1")
        .text("io_mode", "json")
        .text(
            "do_in",
            json!({
                "method": "Briefcases.getRootFolders",
                "params": {}
            }).to_string()
        );

    // Envoi de la requête POST
    let response = client
        .post("https://apifeed.sellsy.com/0/")
        .headers(headers)
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Erreur d'envoi: {}", e))?;

    // Vérification du statut HTTP
    if !response.status().is_success() {
        return Err(format!("Erreur API: {}", response.status()));
    }
    let json_response: serde_json::Value = response
    .json()
    .await
    .map_err(|e| format!("Erreur de parsing JSON: {}", e))?;
    // Parsing de la réponse JSON
    let folder = json_response["response"]
    .as_array()
    .and_then(|arr| {
        arr.iter()
            .find(|f| f.get("name") == Some(&serde_json::Value::String("Mes documents".to_string())))
    })
    .ok_or_else(|| "Le dossier 'Mes documents' est introuvable".to_string())?;

    Ok(folder["id"]
        .as_str()
        .ok_or("ID manquant pour 'Mes documents'")?
        .to_string())

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
