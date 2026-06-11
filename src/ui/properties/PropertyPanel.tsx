import React, { useCallback, useState } from "react";
import type { PlacedComponent } from "../workspace/types";
import { SCHEMA_MAP } from "./schemas";
import { PropertyField } from "./PropertyField";
import { CustomValueInput } from "./CustomValueInput";

export interface PropertyPanelProps {
  selectedComponent: PlacedComponent | null;
  onPropertyChange: (componentId: string, key: string, value: unknown) => void;
  onClose?: () => void;
}

const CUSTOM_SENTINEL = "__custom__";

/**
 * Friendly display names for component types.
 */
const TYPE_LABELS: Record<string, string> = {
  resistor: "Resistor",
  capacitor: "Capacitor",
  led: "LED",
  potentiometer: "Potentiometer",
  buzzer: "Buzzer",
  "rgb-led": "RGB LED",
  servo: "Servo",
  "dc-motor": "DC Motor",
  photoresistor: "Photoresistor",
  "temperature-sensor": "Temperature Sensor",
  "lcd-display": "LCD Display",
  "power-supply": "Power Supply",
};

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  backgroundColor: "#1e1e1e",
  color: "#e0e0e0",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px",
  backgroundColor: "#252526",
  borderBottom: "1px solid #444",
  fontSize: "13px",
  fontWeight: 600,
};

const closeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#888",
  cursor: "pointer",
  fontSize: "16px",
  padding: "2px 6px",
  borderRadius: "3px",
};

const placeholderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "#666",
  fontSize: "13px",
  fontStyle: "italic",
  padding: "20px",
  textAlign: "center",
};

const fieldsStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
};

const noPropertiesStyle: React.CSSProperties = {
  padding: "16px 12px",
  color: "#666",
  fontSize: "12px",
  fontStyle: "italic",
  textAlign: "center",
};

/**
 * Property editor panel that displays when a component is selected.
 * Shows placeholder when nothing is selected.
 */
export function PropertyPanel({
  selectedComponent,
  onPropertyChange,
  onClose,
}: PropertyPanelProps) {
  const [customFieldKey, setCustomFieldKey] = useState<string | null>(null);

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      if (!selectedComponent) return;

      if (value === CUSTOM_SENTINEL) {
        // Open custom input for this field
        setCustomFieldKey(key);
        return;
      }

      onPropertyChange(selectedComponent.id, key, value);
    },
    [selectedComponent, onPropertyChange],
  );

  const handleCustomSubmit = useCallback(
    (key: string, value: unknown) => {
      if (!selectedComponent) return;

      onPropertyChange(selectedComponent.id, key, value);
      setCustomFieldKey(null);
    },
    [selectedComponent, onPropertyChange],
  );

  const handleCustomCancel = useCallback(() => {
    setCustomFieldKey(null);
  }, []);

  if (!selectedComponent) {
    return (
      <div style={panelStyle}>
        <div style={placeholderStyle}>
          Select a component to edit properties
        </div>
      </div>
    );
  }

  const { type, state } = selectedComponent;
  const schemas = SCHEMA_MAP[type];
  const label = TYPE_LABELS[type] ?? type;

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span>{label}</span>
        {onClose && (
          <button
            type="button"
            title="Close"
            onClick={onClose}
            style={closeButtonStyle}
          >
            ✕
          </button>
        )}
      </div>

      <div style={fieldsStyle}>
        {schemas && schemas.length > 0 ? (
          schemas.map((schema) => (
            <React.Fragment key={schema.key}>
              {customFieldKey === schema.key ? (
                <CustomValueInput
                  schema={schema}
                  previousValue={String(state[schema.key] ?? schema.defaultValue)}
                  onSubmit={(value) => handleCustomSubmit(schema.key, value)}
                  onCancel={handleCustomCancel}
                />
              ) : (
                <PropertyField
                  schema={schema}
                  value={state[schema.key] ?? schema.defaultValue}
                  onChange={(value) => handleFieldChange(schema.key, value)}
                />
              )}
            </React.Fragment>
          ))
        ) : (
          <div style={noPropertiesStyle}>No editable properties</div>
        )}
      </div>
    </div>
  );
}
