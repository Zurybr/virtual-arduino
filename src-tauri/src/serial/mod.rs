pub mod monitor;
pub mod stk500;

#[cfg(target_os = "linux")]
pub mod platform_linux;

#[cfg(target_os = "macos")]
pub mod platform_macos;

#[cfg(target_os = "windows")]
pub mod platform_windows;

use std::sync::Mutex;
use tauri::Emitter;

pub struct PortEntry {
    pub slave_path: String,
    pub master_fd: std::fs::File,
    pub label: String,
}

pub struct SerialManager {
    ports: Vec<PortEntry>,
}

impl SerialManager {
    pub fn new() -> Self {
        Self {
            ports: Vec::new(),
        }
    }

    pub fn create_port(&mut self, label: &str) -> Result<String, String> {
        let port = Self::create_platform_port(label)?;
        let path = port.slave_path.clone();
        self.ports.push(port);
        Ok(path)
    }

    pub fn destroy_port(&mut self, port_path: &str) -> Result<(), String> {
        if let Some(pos) = self.ports.iter().position(|p| p.slave_path == port_path) {
            self.ports.remove(pos);
            Ok(())
        } else {
            Err(format!("Port not found: {}", port_path))
        }
    }

    pub fn list_ports(&self) -> Vec<(String, String)> {
        self.ports
            .iter()
            .map(|p| (p.slave_path.clone(), p.label.clone()))
            .collect()
    }

    pub fn write_to_port(&self, port_path: &str, data: &[u8]) -> Result<(), String> {
        let port = self
            .ports
            .iter()
            .find(|p| p.slave_path == port_path)
            .ok_or_else(|| format!("Port not found: {}", port_path))?;
        use std::io::Write;
        port.master_fd
            .try_clone()
            .map_err(|e| e.to_string())?
            .write_all(data)
            .map_err(|e| e.to_string())
    }
}

#[cfg(target_os = "linux")]
impl SerialManager {
    fn create_platform_port(label: &str) -> Result<PortEntry, String> {
        platform_linux::create_pty_pair(label)
    }
}

#[cfg(target_os = "macos")]
impl SerialManager {
    fn create_platform_port(label: &str) -> Result<PortEntry, String> {
        platform_macos::create_pty_pair(label)
    }
}

#[cfg(target_os = "windows")]
impl SerialManager {
    fn create_platform_port(label: &str) -> Result<PortEntry, String> {
        platform_windows::create_com_pair(label)
    }
}

pub struct SerialState {
    pub manager: Mutex<SerialManager>,
}

impl SerialState {
    pub fn new() -> Self {
        Self {
            manager: Mutex::new(SerialManager::new()),
        }
    }
}
