# Design: Tinkercad UI Clone — Slice 1

## Technical Approach

Incremental enhancement of the existing React + Konva codebase. No rewrite. The current `app.tsx` flat layout is restructured into a Tinkercad-style layout (top bar, collapsible left palette, center canvas, right tabbed panel). New capabilities — property editor, undo/redo, context menu, hover highlights, palette improvements — are composed as separate modules under `src/ui/`, integrating with the existing `Workspace` props interface. All mutations flow through a new `CommandManager` (CAP-003) so every action is undoable.

## Architecture Decisions

### Decision: Layout Strategy

**Choice**: CSS Flexbox for overall layout with fixed sidebar widths and flex-grow center
**Alternatives**: CSS Grid (full grid template), absolute positioning
**Rationale**: The existing `app.tsx` already uses Flexbox (`display: flex`). Grid adds no value for a 3-column + top bar layout — Flexbox is simpler, matches existing patterns, and handles the collapsible sidebar naturally via `width` toggling.

### Decision: State Management

**Choice**: Lift state higher in `app.tsx` with `selectedComponentId` + `circuitName`; pass `CommandManager` via React context
**Alternatives**: Zustand, Jotai, Redux, pure prop drilling
**Rationale**: Current app uses `useState` exclusively. Adding a state library is overkill for this scope. The `CommandManager` is a singleton-like object — React context (`useContext`) avoids prop drilling through 4+ levels without introducing a dependency.

### Decision: CommandManager Integration

**Choice**: Plain TypeScript class instantiated in `app.tsx`, exposed via `useContext`. Commands call `setComponents`/`setWires` setters directly
**Alternatives**: `useReducer` + dispatch actions; external store (Zustand)
**Rationale**: Commands need to mutate both `components` and `wires` state atomically. Using the existing `useState` setters keeps the integration minimal. The class approach is trivially testable in Vitest without React.

### Decision: Context Menu Rendering

**Choice**: React portal to `document.body`
**Alternatives**: Konva HTML overlay, absolutely positioned div inside workspace container
**Rationale**: Konva Stage captures pointer events. A portal to `body` bypasses z-index conflicts entirely. Event coordinates from Konva's `contextmenu` event map directly to viewport coordinates.

### Decision: Hover Effects Performance

**Choice**: Konva `mouseenter`/`mouseleave` events setting `shadowBlur`/`shadowEnabled` directly on Konva nodes. No React state changes.
**Alternatives**: React state-driven hover (causes full component re-render), `requestAnimationFrame` polling
**Rationale**: Spec REQ-005-05 explicitly forbids polling. React state changes for hover would re-render every `ComponentItem` — catastrophic at 30+ components. Direct Konva node manipulation is O(1) per hover event.

### Decision: Property Schema Location

**Choice**: Co-located in `src/ui/properties/schemas.ts` — single file mapping `component.type` → `PropertySchema[]`
**Alternatives**: Inline in `ComponentItem.tsx`, separate file per component type
**Rationale**: `ComponentItem.tsx` is already 1361 lines. Adding schemas there is unmaintainable. One schema file is easy to scan; splitting per-type adds import overhead for no gain at this scale.

## Data Flow

### Component Selection → Property Editor Update

```
Workspace.onComponentSelect(id)
  → app.tsx setSelectedComponentId(id)
    → RightPanel receives selectedComponentId + components
      → PropertyPanel looks up component.type in SCHEMA_MAP
        → Renders PropertyField per schema entry
```

### Property Change → Undo/Redo → Re-render

```
PropertyField.onChange(newValue)
  → ChangePropertyCommand(componentId, key, oldValue, newValue)
    → CommandManager.execute(command)
      → command.execute() calls setComponents(...)
        → React re-renders ComponentItem with new state
```

### Right-click → Context Menu → Action → Undo/Redo

```
Konva contextmenu event
  → Workspace sets contextMenu state {x, y, target, targetType}
    → ContextMenu portal renders at {x, y}
      → User clicks "Delete"
        → RemoveComponentCommand(component, relatedWires)
          → CommandManager.execute(command)
            → setComponents + setWires update
```

### Palette Drag → Canvas Drop → Command Creation

```
PaletteItem dragStart → dataTransfer.setData("component-type", type)
  → Workspace container drop handler
    → onComponentPlaced(type, x, y) in app.tsx
      → AddComponentCommand(newComponent)
        → CommandManager.execute(command)
          → setComponents([..., newComponent])
  → addToRecentlyUsed(type) → localStorage update
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/ui/undo/Command.ts` | Create | `Command` interface + 7 command classes (AddComponent, RemoveComponent, MoveComponent, RotateComponent, AddWire, RemoveWire, ChangeProperty) |
| `src/ui/undo/CommandManager.ts` | Create | Stack-based undo/redo manager, max depth 50, FIFO eviction |
| `src/ui/undo/UndoContext.tsx` | Create | React context provider exposing `commandManager`, `canUndo`, `canRedo`, `undo()`, `redo()` |
| `src/ui/undo/index.ts` | Create | Barrel export |
| `src/ui/properties/schemas.ts` | Create | `PropertySchema` type + `SCHEMA_MAP` mapping component types to editable property definitions |
| `src/ui/properties/PropertyPanel.tsx` | Create | Right-panel section: shows property editor when component selected, placeholder otherwise |
| `src/ui/properties/PropertyField.tsx` | Create | Polymorphic field renderer (dropdown, color, slider, text, number) |
| `src/ui/properties/CustomValueInput.tsx` | Create | Numeric input with unit suffix parsing and inline validation |
| `src/ui/properties/index.ts` | Create | Barrel export |
| `src/ui/context-menu/ContextMenu.tsx` | Create | Portal-based context menu component with viewport clamping |
| `src/ui/context-menu/menuConfigs.ts` | Create | Menu item definitions per context type (canvas, component, wire, pin) |
| `src/ui/context-menu/index.ts` | Create | Barrel export |
| `src/ui/palette/TinkercadPalette.tsx` | Create | New palette with collapsible categories, search, recently used, thumbnails |
| `src/ui/palette/recentlyUsed.ts` | Create | localStorage persistence for recently used components (max 5) |
| `src/ui/layout/TopBar.tsx` | Create | Circuit name input + sim controls + undo/redo buttons + export placeholder |
| `src/ui/layout/RightPanel.tsx` | Create | Tabbed panel (Code Editor / Serial Monitor) + property editor when component selected |
| `src/ui/layout/ResizablePanel.tsx` | Create | Drag-to-resize sidebar wrapper (min/max width constraint) |
| `src/ui/app.tsx` | Modify | Full layout restructure: import new layout components, add `selectedComponentId` + `circuitName` state, wire CommandManager, remove inline palette + bottom panel |
| `src/ui/workspace/Workspace.tsx` | Modify | Add context menu state + `onContextMenu` handler, pass `wireDrawing` state for hover highlighting, wire undo/redo into keyboard handlers |
| `src/ui/workspace/ComponentItem.tsx` | Modify | Add hover glow via `mouseenter`/`mouseleave` on Group, pass `wireDrawing` to PinPoint for wire-mode highlighting |
| `src/ui/workspace/types.ts` | Modify | Add `ContextMenuState`, `WireDrawingState` types |
| `src/ui/toolbar/sim-controls.tsx` | Modify | Remove internal layout; become content-only for embedding in TopBar |
| `src/ui/palette/component-palette.tsx` | Modify | Keep as fallback; primary use is `TinkercadPalette` |
| `src/ui/debugger/pin-inspector.tsx` | Modify | Removed from right panel (replaced by PropertyPanel). Keep file for potential reuse. |

## Interfaces / Contracts

### Command Interface

```typescript
export interface Command {
  readonly id: string;
  readonly type: string;
  readonly description: string;
  execute(): void;
  undo(): void;
}
```

### CommandManager

```typescript
export class CommandManager {
  private undoStack: Command[];
  private redoStack: Command[];
  private readonly maxDepth: number;
  // Mutator references — setComponents, setWires from app.tsx
  execute(command: Command): void;
  undo(): void;
  redo(): void;
  get canUndo(): boolean;
  get canRedo(): boolean;
  get undoStackSize(): number;
  get redoStackSize(): number;
}
```

### PropertySchema

```typescript
export type PropertyFieldType = "dropdown" | "number" | "color" | "slider" | "text";

export interface PropertySchema {
  key: string;
  label: string;
  type: PropertyFieldType;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue: string | number;
  parseValue?: (raw: string) => number | null;
  formatDisplay?: (value: unknown) => string;
  validate?: (value: unknown) => boolean;
}

export const SCHEMA_MAP: Record<string, PropertySchema[]>;
```

### Context Menu

```typescript
export interface ContextMenuState {
  x: number;
  y: number;
  targetType: "canvas" | "component" | "wire" | "pin";
  targetId?: string;
  componentType?: string;
}

export interface MenuItem {
  label: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
}
```

### Hover Highlight Constants

```typescript
export const HOVER_SHADOW: Konva.ShadowConfig = {
  color: "#00BFFF",
  blur: 15,
  offset: { x: 0, y: 0 },
  opacity: 0.6,
};

export const WIRE_MODE_VALID_COLOR = "#00ff00";
export const WIRE_MODE_INVALID_COLOR = "#ff0000";
export const HOVER_TRANSITION_MS = 150;
```

### UndoContext

```typescript
export interface UndoContextValue {
  commandManager: CommandManager;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export const UndoContext = React.createContext<UndoContextValue>(...);
export const UndoProvider: React.FC<{ children: React.ReactNode }>;
export const useUndo: () => UndoContextValue;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `CommandManager` — execute, undo, redo, stack depth, redo-clear, FIFO eviction | Instantiate directly in Vitest, call methods, assert stack state |
| Unit | Each `Command` class — `execute()` and `undo()` produce correct mutations | Pass mock `setComponents`/`setWires`, verify call args |
| Unit | `PropertySchema` parsing — `parseValue` for resistor (Ω, kΩ, MΩ), capacitor (pF, nF, μF) | Import `SCHEMA_MAP`, call `parseValue` with valid/invalid strings |
| Unit | `recentlyUsed` — add, dedup, cap at 5, localStorage round-trip | Mock `localStorage`, test all edge cases |
| Unit | `ContextMenu` viewport clamping — reposition when overflowing | Render with jsdom, test `calculateMenuPosition(x, y, menuW, menuH, vpW, vpH)` |
| Unit | `CommandManager` keyboard shortcut guard — skip when active element is text input | Dispatch keyboard events with `document.activeElement` set to `<input>` |
| Integration | Layout renders TopBar + LeftPanel + Center + RightPanel | React Testing Library render `App`, query by role/text |
| Integration | Property change flow — select component → edit value → verify state update | Render `PropertyPanel` with test state, fire change event, assert callback |
| Integration | Context menu action dispatches command | Render context menu, click item, verify `CommandManager.execute` called |
| Integration | Palette drag → drop creates `AddComponentCommand` | Simulate `dragstart` + `drop` events on workspace container |

## Migration / Rollout

No migration required. All changes are additive (new files) or CSS-level layout changes to `app.tsx`. The existing `Workspace` props interface is preserved — only new optional props are added (`onContextMenu`, `wireDrawing` pass-through). Feature is not behind a flag — the entire layout switches in one release.

## Open Questions

- [ ] Should `ResistorBody` and other component bodies read `state.resistance` to render value labels on canvas? Currently bodies are stateless except LED/RGB LED. This affects the "property change re-renders canvas visual" requirement (REQ-002-15).
- [ ] The `component-palette.tsx` plugin-based system vs `app.tsx` inline `PALETTE_CATEGORIES` — which is canonical? The design uses the inline categories (matching `app.tsx`) but the file `component-palette.tsx` has a separate plugin interface. Need alignment.
