# Contract: Simulation Worker API

**Version**: 1.0.0
**Description**: Message protocol between the main thread and the simulation Web Worker.

## Main Thread → Worker Messages

### load-hex

Load an Intel HEX file into simulated flash and prepare for execution.

```typescript
{
  type: "load-hex";
  hex: string;           // Raw Intel HEX content
  sourceMap?: Record<string, SourceLocation>;  // Optional PC→source mapping
}
// Response: { type: "hex-loaded", flashSize: number }
```

### start

Begin or resume simulation execution.

```typescript
{
  type: "start";
  instructionsPerTick: number;  // Batch size (default: 100000)
}
// No immediate response. Worker begins executing and posting state updates.
```

### stop

Halt simulation and reset to initial state.

```typescript
{
  type: "stop";
}
// Response: { type: "stopped", cycleCount: number }
```

### pause

Pause execution at the next instruction boundary.

```typescript
{
  type: "pause";
}
// Response: { type: "paused", reason: "user", pc: number, cycleCount: number }
```

### resume

Resume from paused state.

```typescript
{
  type: "resume";
}
// No immediate response. Worker resumes execution.
```

### step

Execute a single instruction, then pause.

```typescript
{
  type: "step";
  mode: "instruction" | "source-line";  // Step one instruction or to next source line
}
// Response: { type: "paused", reason: "step", pc: number, cycleCount: number }
```

### set-breakpoint

Add a breakpoint at a program counter address.

```typescript
{
  type: "set-breakpoint";
  address: number;
}
// Response: { type: "breakpoint-set", address: number }
```

### remove-breakpoint

Remove a breakpoint.

```typescript
{
  type: "remove-breakpoint";
  address: number;
}
// Response: { type: "breakpoint-removed", address: number }
```

### serial-input

Send serial data to the simulated UART (from Arduino IDE Serial Monitor).

```typescript
{
  type: "serial-input";
  data: Uint8Array;
}
```

### set-pin-external

Force an external pin value (from UI interaction like button press).

```typescript
{
  type: "set-pin-external";
  pinId: string;
  value: PinValue;
}
```

### register-component

Register a component plugin instance with the simulation.

```typescript
{
  type: "register-component";
  componentId: string;
  pluginName: string;
  pinMapping: Record<string, string>;  // manifest pin ID → board pin ID
}
```

### unregister-component

Remove a component from the simulation.

```typescript
{
  type: "unregister-component";
  componentId: string;
}
```

### inspect-state

Request a full state dump (for debugger).

```typescript
{
  type: "inspect-state";
  includeMemory: boolean;   // Include full SRAM dump
  includeFlash: boolean;    // Include full flash dump
}
// Response: { type: "state-dump", registers: Uint8Array, sram?: Uint8Array, flash?: Uint8Array, ... }
```

## Worker → Main Thread Messages

### pin-update

Pin state changed (sent at ~60fps via SharedArrayBuffer, this message for individual changes).

```typescript
{
  type: "pin-update";
  changes: Array<{
    pinId: string;
    value: PinValue;
    timestamp: number;  // Virtual cycle count
  }>;
}
```

### serial-output

Data transmitted by the simulated UART (Serial.print output).

```typescript
{
  type: "serial-output";
  data: Uint8Array;
}
```

### paused

Simulation paused (breakpoint hit, user pause, step complete).

```typescript
{
  type: "paused";
  reason: "user" | "breakpoint" | "step" | "error";
  pc: number;
  cycleCount: number;
  sourceLocation?: SourceLocation;
  error?: string;
}
```

### simulation-error

Warning or error during simulation (edge case dual behavior).

```typescript
{
  type: "simulation-error";
  error: {
    type: "memory" | "power" | "short-circuit" | "protocol-mismatch" | "plugin-crash";
    message: string;
    affectedPins?: string[];
    severity: "warning" | "error";
  };
}
```

### plugin-error

A plugin component crashed or misbehaved.

```typescript
{
  type: "plugin-error";
  componentId: string;
  pluginName: string;
  error: string;
  state: "unhealthy";  // Plugin is now in error state
}
```
