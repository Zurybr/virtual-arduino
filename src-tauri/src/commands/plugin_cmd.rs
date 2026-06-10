use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Serialize, Deserialize)]
pub struct PluginInstallResult {
    pub name: String,
    pub version: String,
    pub install_path: String,
}

#[tauri::command]
pub async fn install_plugin(
    app: tauri::AppHandle,
    zip_path: String,
) -> Result<PluginInstallResult, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let plugins_dir = data_dir.join("plugins");
    std::fs::create_dir_all(&plugins_dir).map_err(|e| e.to_string())?;

    let file = std::fs::File::open(&zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    let manifest_entry = archive
        .by_name("component.json")
        .map_err(|e| e.to_string())?;
    drop(manifest_entry);

    let name = "pending".to_string();
    let version = "0.0.0".to_string();
    let install_path = plugins_dir.to_string_lossy().to_string();

    Ok(PluginInstallResult {
        name,
        version,
        install_path,
    })
}

#[tauri::command]
pub async fn uninstall_plugin(app: tauri::AppHandle, plugin_name: String) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let plugin_dir = data_dir.join("plugins").join(&plugin_name);
    if plugin_dir.exists() {
        std::fs::remove_dir_all(&plugin_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn list_plugins(app: tauri::AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let plugins_dir = data_dir.join("plugins");
    if !plugins_dir.exists() {
        return Ok(vec![]);
    }
    let mut plugins = Vec::new();
    let entries = std::fs::read_dir(&plugins_dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let manifest_path = entry.path().join("component.json");
        if manifest_path.exists() {
            let content = std::fs::read_to_string(&manifest_path).map_err(|e| e.to_string())?;
            let json: serde_json::Value =
                serde_json::from_str(&content).map_err(|e| e.to_string())?;
            plugins.push(json);
        }
    }
    Ok(plugins)
}

#[tauri::command]
pub async fn load_plugin_bundle(
    app: tauri::AppHandle,
    plugin_name: String,
) -> Result<String, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let manifest_path = data_dir
        .join("plugins")
        .join(&plugin_name)
        .join("component.json");
    let manifest_str = std::fs::read_to_string(&manifest_path).map_err(|e| e.to_string())?;
    let manifest: serde_json::Value =
        serde_json::from_str(&manifest_str).map_err(|e| e.to_string())?;
    let main_entry = manifest["main"].as_str().unwrap_or("dist/index.js");
    let bundle_path = data_dir
        .join("plugins")
        .join(&plugin_name)
        .join(main_entry);
    std::fs::read_to_string(&bundle_path).map_err(|e| e.to_string())
}
