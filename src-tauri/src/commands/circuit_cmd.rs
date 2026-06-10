use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct FileFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

#[tauri::command]
pub async fn save_circuit(data: String, filename: String) -> Result<String, String> {
    std::fs::write(&filename, &data).map_err(|e| e.to_string())?;
    Ok(filename)
}

#[tauri::command]
pub async fn load_circuit(filename: String) -> Result<String, String> {
    std::fs::read_to_string(&filename).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn show_save_dialog(
    default_name: String,
    _filters: Vec<FileFilter>,
) -> Result<Option<String>, String> {
    Ok(Some(default_name))
}

#[tauri::command]
pub async fn show_open_dialog(
    _filters: Vec<FileFilter>,
) -> Result<Option<String>, String> {
    Ok(None)
}
