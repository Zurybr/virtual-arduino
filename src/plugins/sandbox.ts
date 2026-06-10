import type { ComponentPlugin, PluginContext, PinValue } from "../types";

export enum PluginState {
  LOADING = "LOADING",
  INITIALIZED = "INITIALIZED",
  RUNNING = "RUNNING",
  STOPPED = "STOPPED",
  DESTROYED = "DESTROYED",
  ERROR = "ERROR",
}

export class PluginContainer {
  private plugin: ComponentPlugin;
  private _state: PluginState = PluginState.LOADING;
  private _error: string | null = null;
  private errorListeners: Array<(error: string, pluginId: string) => void> = [];

  constructor(plugin: ComponentPlugin) {
    this.plugin = plugin;
  }

  get state(): PluginState {
    return this._state;
  }

  get error(): string | null {
    return this._error;
  }

  onError(callback: (error: string, pluginId: string) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== callback);
    };
  }

  isInError(): boolean {
    return this._state === PluginState.ERROR;
  }

  isRunning(): boolean {
    return this._state === PluginState.RUNNING;
  }

  async init(context: PluginContext): Promise<void> {
    if (this._state !== PluginState.LOADING) {
      throw new Error(`Cannot init from state ${this._state}`);
    }
    try {
      await this.plugin.init(context);
      this._state = PluginState.INITIALIZED;
    } catch (e) {
      this.enterError(e);
    }
  }

  async start(): Promise<void> {
    if (this._state !== PluginState.INITIALIZED) {
      throw new Error(`Cannot start from state ${this._state}`);
    }
    try {
      await this.plugin.start();
      this._state = PluginState.RUNNING;
    } catch (e) {
      this.enterError(e);
    }
  }

  async stop(): Promise<void> {
    if (this._state !== PluginState.RUNNING) {
      throw new Error(`Cannot stop from state ${this._state}`);
    }
    try {
      await this.plugin.stop();
      this._state = PluginState.STOPPED;
    } catch (e) {
      this.enterError(e);
    }
  }

  async destroy(): Promise<void> {
    if (
      this._state === PluginState.DESTROYED
    ) {
      throw new Error(`Cannot destroy from state ${this._state}`);
    }
    try {
      await this.plugin.destroy();
      this._state = PluginState.DESTROYED;
    } catch (e) {
      this.enterError(e);
    }
  }

  onPinChange(pinId: string, value: PinValue): void {
    if (this._state === PluginState.DESTROYED) {
      throw new Error("Plugin is destroyed");
    }
    try {
      this.plugin.onPinChange(pinId, value);
    } catch (e) {
      this.enterError(e);
      this.notifyError(e instanceof Error ? e.message : String(e));
    }
  }

  private enterError(e: unknown): void {
    this._error = e instanceof Error ? e.message : String(e);
    this._state = PluginState.ERROR;
  }

  private notifyError(error: string): void {
    for (const listener of this.errorListeners) {
      listener(error, this.plugin.id);
    }
  }
}
