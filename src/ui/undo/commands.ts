import type { Command, CommandType } from "./types";
import type { PlacedComponent, Wire } from "../workspace/types";

/**
 * Generates a unique command ID.
 */
function commandId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// AddComponentCommand
// ---------------------------------------------------------------------------

export class AddComponentCommand implements Command {
  readonly id: string;
  readonly type: CommandType = "ADD_COMPONENT";
  readonly description: string;

  constructor(
    private readonly component: PlacedComponent,
    private readonly setComponents: (updater: (prev: PlacedComponent[]) => PlacedComponent[]) => void,
    private readonly setWires: (updater: (prev: Wire[]) => Wire[]) => void,
  ) {
    this.id = commandId();
    this.description = `Add ${component.type} "${component.id}"`;
  }

  execute(): void {
    this.setComponents((prev) => [...prev, this.component]);
  }

  undo(): void {
    this.setComponents((prev) => prev.filter((c) => c.id !== this.component.id));
    this.setWires((prev) =>
      prev.filter(
        (w) =>
          w.startPin.componentId !== this.component.id &&
          w.endPin.componentId !== this.component.id,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// RemoveComponentCommand
// ---------------------------------------------------------------------------

export class RemoveComponentCommand implements Command {
  readonly id: string;
  readonly type: CommandType = "REMOVE_COMPONENT";
  readonly description: string;

  constructor(
    private readonly component: PlacedComponent,
    private readonly connectedWires: Wire[],
    private readonly setComponents: (updater: (prev: PlacedComponent[]) => PlacedComponent[]) => void,
    private readonly setWires: (updater: (prev: Wire[]) => Wire[]) => void,
  ) {
    this.id = commandId();
    this.description = `Remove ${component.type} "${component.id}"`;
  }

  execute(): void {
    this.setComponents((prev) => prev.filter((c) => c.id !== this.component.id));
    this.setWires((prev) =>
      prev.filter(
        (w) =>
          w.startPin.componentId !== this.component.id &&
          w.endPin.componentId !== this.component.id,
      ),
    );
  }

  undo(): void {
    this.setComponents((prev) => [...prev, this.component]);
    this.setWires((prev) => [...prev, ...this.connectedWires]);
  }
}

// ---------------------------------------------------------------------------
// MoveComponentCommand
// ---------------------------------------------------------------------------

export class MoveComponentCommand implements Command {
  readonly id: string;
  readonly type: CommandType = "MOVE_COMPONENT";
  readonly description: string;

  constructor(
    private readonly componentId: string,
    private readonly oldPosition: { x: number; y: number },
    private readonly newPosition: { x: number; y: number },
    private readonly setComponents: (updater: (prev: PlacedComponent[]) => PlacedComponent[]) => void,
  ) {
    this.id = commandId();
    this.description = `Move "${componentId}" to (${newPosition.x}, ${newPosition.y})`;
  }

  execute(): void {
    this.setComponents((prev) =>
      prev.map((c) =>
        c.id === this.componentId ? { ...c, x: this.newPosition.x, y: this.newPosition.y } : c,
      ),
    );
  }

  undo(): void {
    this.setComponents((prev) =>
      prev.map((c) =>
        c.id === this.componentId ? { ...c, x: this.oldPosition.x, y: this.oldPosition.y } : c,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// RotateComponentCommand
// ---------------------------------------------------------------------------

export class RotateComponentCommand implements Command {
  readonly id: string;
  readonly type: CommandType = "ROTATE_COMPONENT";
  readonly description: string;

  constructor(
    private readonly componentId: string,
    private readonly oldRotation: number,
    private readonly newRotation: number,
    private readonly setComponents: (updater: (prev: PlacedComponent[]) => PlacedComponent[]) => void,
  ) {
    this.id = commandId();
    this.description = `Rotate "${componentId}" from ${oldRotation}° to ${newRotation}°`;
  }

  execute(): void {
    this.setComponents((prev) =>
      prev.map((c) =>
        c.id === this.componentId ? { ...c, rotation: this.newRotation } : c,
      ),
    );
  }

  undo(): void {
    this.setComponents((prev) =>
      prev.map((c) =>
        c.id === this.componentId ? { ...c, rotation: this.oldRotation } : c,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// AddWireCommand
// ---------------------------------------------------------------------------

export class AddWireCommand implements Command {
  readonly id: string;
  readonly type: CommandType = "ADD_WIRE";
  readonly description: string;

  constructor(
    private readonly wire: Wire,
    private readonly setWires: (updater: (prev: Wire[]) => Wire[]) => void,
  ) {
    this.id = commandId();
    this.description = `Add wire "${wire.id}"`;
  }

  execute(): void {
    this.setWires((prev) => [...prev, this.wire]);
  }

  undo(): void {
    this.setWires((prev) => prev.filter((w) => w.id !== this.wire.id));
  }
}

// ---------------------------------------------------------------------------
// RemoveWireCommand
// ---------------------------------------------------------------------------

export class RemoveWireCommand implements Command {
  readonly id: string;
  readonly type: CommandType = "REMOVE_WIRE";
  readonly description: string;

  constructor(
    private readonly wire: Wire,
    private readonly setWires: (updater: (prev: Wire[]) => Wire[]) => void,
  ) {
    this.id = commandId();
    this.description = `Remove wire "${wire.id}"`;
  }

  execute(): void {
    this.setWires((prev) => prev.filter((w) => w.id !== this.wire.id));
  }

  undo(): void {
    this.setWires((prev) => [...prev, this.wire]);
  }
}

// ---------------------------------------------------------------------------
// ChangePropertyCommand
// ---------------------------------------------------------------------------

export class ChangePropertyCommand implements Command {
  readonly id: string;
  readonly type: CommandType = "CHANGE_PROPERTY";
  readonly description: string;

  constructor(
    private readonly componentId: string,
    private readonly propertyKey: string,
    private readonly oldValue: unknown,
    private readonly newValue: unknown,
    private readonly setComponents: (updater: (prev: PlacedComponent[]) => PlacedComponent[]) => void,
  ) {
    this.id = commandId();
    this.description = `Change "${componentId}.${propertyKey}" from ${JSON.stringify(oldValue)} to ${JSON.stringify(newValue)}`;
  }

  execute(): void {
    this.setComponents((prev) =>
      prev.map((c) =>
        c.id === this.componentId
          ? { ...c, state: { ...c.state, [this.propertyKey]: this.newValue } }
          : c,
      ),
    );
  }

  undo(): void {
    this.setComponents((prev) =>
      prev.map((c) =>
        c.id === this.componentId
          ? { ...c, state: { ...c.state, [this.propertyKey]: this.oldValue } }
          : c,
      ),
    );
  }
}
