use std::process::Command;
use std::fs;

pub fn create_com_pair(label: &str) -> Result<crate::serial::PortEntry, String> {
    let output = Command::new("setupc")
        .args(["install", "PortName=COM", "PortName=COM"])
        .output()
        .map_err(|e| format!("Failed to run com0com setupc: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "com0com setupc failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let com_port = parse_com_port(&stdout)
        .ok_or_else(|| "Could not parse COM port from com0com output".to_string())?;

    let master_fd = fs::File::open(&com_port)
        .map_err(|e| format!("Failed to open COM port {}: {}", com_port, e))?;

    Ok(crate::serial::PortEntry {
        slave_path: com_port,
        master_fd,
        label: label.to_string(),
    })
}

fn parse_com_port(output: &str) -> Option<String> {
    for line in output.lines() {
        if line.contains("COM") {
            let start = line.find("COM")?;
            let end = line[start..].find(|c: char| c.is_whitespace())?;
            return Some(line[start..start + end].to_string());
        }
    }
    None
}
