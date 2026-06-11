import React, { useState, useCallback } from "react";
import type { PropertySchema } from "./schemas";

export interface CustomValueInputProps {
  schema: PropertySchema;
  previousValue: string;
  onSubmit: (value: unknown) => void;
  onCancel: () => void;
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  padding: "8px 12px",
  backgroundColor: "#252526",
  borderBottom: "1px solid #2e2e2e",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "4px 8px",
  fontSize: "12px",
  backgroundColor: "#2a2a2a",
  color: "#e0e0e0",
  border: "1px solid #444",
  borderRadius: "3px",
  outline: "none",
};

const buttonBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "26px",
  height: "26px",
  border: "1px solid #555",
  borderRadius: "3px",
  cursor: "pointer",
  fontSize: "14px",
  padding: 0,
};

const errorStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#ff4444",
  padding: "2px 0",
};

/**
 * Custom value input shown when the user selects "Custom..." from a dropdown.
 * Parses input using the schema's parseValue function.
 * Shows validation errors inline.
 */
export function CustomValueInput({
  schema,
  previousValue: _previousValue,
  onSubmit,
  onCancel,
}: CustomValueInputProps) {
  const [rawValue, setRawValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRawValue(e.target.value);
      // Clear error when user starts typing
      if (error !== null) {
        setError(null);
      }
    },
    [error],
  );

  const handleSubmit = useCallback(() => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      setError("Invalid value");
      return;
    }

    if (schema.parseValue) {
      const parsed = schema.parseValue(trimmed);
      if (parsed === null) {
        setError("Invalid value");
        return;
      }

      // Run validate if present
      if (schema.validate && !schema.validate(parsed)) {
        setError("Invalid value");
        return;
      }

      onSubmit(parsed);
    } else {
      // No parser — submit raw string
      onSubmit(trimmed);
    }
  }, [rawValue, schema, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel],
  );

  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        <input
          type="text"
          placeholder="Enter custom value..."
          value={rawValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          autoFocus
        />
        <button
          type="button"
          title="Confirm"
          onClick={handleSubmit}
          style={{
            ...buttonBase,
            backgroundColor: "#2a6e2a",
            color: "#fff",
          }}
        >
          ✓
        </button>
        <button
          type="button"
          title="Cancel"
          onClick={onCancel}
          style={{
            ...buttonBase,
            backgroundColor: "#6e2a2a",
            color: "#fff",
          }}
        >
          ✕
        </button>
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}
