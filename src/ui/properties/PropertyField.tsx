import React, { useCallback } from "react";
import type { PropertySchema } from "./schemas";

export interface PropertyFieldProps {
  schema: PropertySchema;
  value: unknown;
  onChange: (value: unknown) => void;
}

const CUSTOM_SENTINEL = "__custom__";

const fieldContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  padding: "8px 12px",
  borderBottom: "1px solid #2e2e2e",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#888",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: "4px 8px",
  fontSize: "12px",
  backgroundColor: "#2a2a2a",
  color: "#e0e0e0",
  border: "1px solid #444",
  borderRadius: "3px",
  outline: "none",
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

const unitStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#888",
  minWidth: "28px",
};

const valueDisplayStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#ccc",
  minWidth: "40px",
  textAlign: "right",
};

const swatchStyle = (active: boolean): React.CSSProperties => ({
  width: "22px",
  height: "22px",
  borderRadius: "3px",
  border: active ? "2px solid #fff" : "2px solid #555",
  cursor: "pointer",
  transition: "border-color 0.15s",
});

/**
 * Polymorphic property field renderer.
 * Renders different input controls based on PropertySchema.type.
 */
export function PropertyField({ schema, value, onChange }: PropertyFieldProps) {
  const { key: _key, label, type, options, min, max, step, unit } = schema;

  const handleChange = useCallback(
    (newValue: unknown) => {
      onChange(newValue);
    },
    [onChange],
  );

  return (
    <div style={fieldContainerStyle} data-property-key={_key}>
      <label style={labelStyle}>{label}</label>
      <div style={rowStyle}>
        {type === "dropdown" && (
          <DropdownControl
            options={options}
            value={value}
            onChange={handleChange}
            label={label}
          />
        )}
        {type === "number" && (
          <NumberControl
            value={value}
            min={min}
            max={max}
            step={step}
            unit={unit}
            onChange={handleChange}
            label={label}
          />
        )}
        {type === "color" && (
          <ColorControl
            options={options}
            value={value}
            onChange={handleChange}
          />
        )}
        {type === "slider" && (
          <SliderControl
            value={value}
            min={min}
            max={max}
            step={step}
            unit={unit}
            onChange={handleChange}
            label={label}
          />
        )}
        {type === "text" && (
          <TextControl
            value={value}
            onChange={handleChange}
            label={label}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dropdown
// ---------------------------------------------------------------------------

function DropdownControl({
  options,
  value,
  onChange,
  label,
}: {
  options?: PropertySchema["options"];
  value: unknown;
  onChange: (v: unknown) => void;
  label: string;
}) {
  const strValue = String(value ?? "");
  const opts = options ?? [];

  const hasMatch = opts.some((o) => o.value === strValue);

  return (
    <select
      aria-label={label}
      value={hasMatch ? strValue : CUSTOM_SENTINEL}
      onChange={(e) => onChange(e.target.value)}
      style={selectStyle}
    >
      {opts.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
      <option value={CUSTOM_SENTINEL}>Custom...</option>
    </select>
  );
}

// ---------------------------------------------------------------------------
// Number
// ---------------------------------------------------------------------------

function NumberControl({
  value,
  min,
  max,
  step,
  unit,
  onChange,
  label,
}: {
  value: unknown;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (v: unknown) => void;
  label: string;
}) {
  const numValue = typeof value === "number" ? value : Number(value) || 0;

  return (
    <>
      <input
        type="number"
        aria-label={label}
        value={numValue}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={inputStyle}
      />
      {unit && <span style={unitStyle}>{unit}</span>}
    </>
  );
}

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

function ColorControl({
  options,
  value,
  onChange,
}: {
  options?: PropertySchema["options"];
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const strValue = String(value ?? "#000000");
  const opts = options ?? [];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
      {opts.map((opt) => (
        <button
          key={opt.value}
          title={opt.label}
          style={{
            ...swatchStyle(strValue === opt.value),
            backgroundColor: opt.value,
          }}
          onClick={() => onChange(opt.value)}
          type="button"
        />
      ))}
      <input
        type="color"
        aria-label="Custom color"
        value={strValue}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "26px",
          height: "22px",
          padding: 0,
          border: "1px solid #555",
          borderRadius: "3px",
          cursor: "pointer",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

function SliderControl({
  value,
  min,
  max,
  step,
  unit,
  onChange,
  label,
}: {
  value: unknown;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (v: unknown) => void;
  label: string;
}) {
  const numValue = typeof value === "number" ? value : Number(value) || 0;

  return (
    <>
      <input
        type="range"
        aria-label={label}
        value={numValue}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={valueDisplayStyle}>
        {numValue}
        {unit ?? ""}
      </span>
    </>
  );
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

function TextControl({
  value,
  onChange,
  label,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  label: string;
}) {
  const strValue = typeof value === "string" ? value : String(value ?? "");

  return (
    <input
      type="text"
      aria-label={label}
      value={strValue}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}
