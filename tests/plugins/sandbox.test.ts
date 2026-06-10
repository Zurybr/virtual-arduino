import { describe, it, expect, vi } from "vitest";
import { PluginContainer, PluginState } from "../../src/plugins/sandbox";
import type { ComponentPlugin, PluginContext } from "../../src/types";

function createMockPlugin(overrides?: Partial<ComponentPlugin>): ComponentPlugin {
  return {
    id: "test-plugin",
    init: vi.fn().mockResolvedValue(undefined),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    onPinChange: vi.fn(),
    ...overrides,
  };
}

function createMockContext(): PluginContext {
  return {
    pluginId: "test-plugin",
    manifest: {} as PluginContext["manifest"],
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    emit: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    requestPinAccess: vi.fn().mockResolvedValue({ pins: {} }),
  };
}

describe("PluginContainer", () => {
  it("wrapping plugin with try/catch on all lifecycle methods", async () => {
    const plugin = createMockPlugin();
    const container = new PluginContainer(plugin);
    const ctx = createMockContext();

    expect(container.state).toBe(PluginState.LOADING);
    await container.init(ctx);
    expect(container.state).toBe(PluginState.INITIALIZED);
    await container.start();
    expect(container.state).toBe(PluginState.RUNNING);
    await container.stop();
    expect(container.state).toBe(PluginState.STOPPED);
    await container.destroy();
    expect(container.state).toBe(PluginState.DESTROYED);
  });

  it("crashing init enters error state", async () => {
    const plugin = createMockPlugin({
      init: vi.fn().mockRejectedValue(new Error("init crash")),
    });
    const container = new PluginContainer(plugin);
    await container.init(createMockContext());
    expect(container.state).toBe(PluginState.ERROR);
    expect(container.error).toBe("init crash");
    expect(container.isInError()).toBe(true);
  });

  it("crashing onPinChange enters error state", async () => {
    const plugin = createMockPlugin({
      onPinChange: vi.fn().mockImplementation(() => {
        throw new Error("pin change crash");
      }),
    });
    const container = new PluginContainer(plugin);
    await container.init(createMockContext());
    await container.start();
    container.onPinChange("pin1", { type: "digital", high: true });
    expect(container.state).toBe(PluginState.ERROR);
    expect(container.error).toBe("pin change crash");
  });

  it("other plugins continue running when one crashes", async () => {
    const crashingPlugin = createMockPlugin({
      onPinChange: vi.fn().mockImplementation(() => {
        throw new Error("crash");
      }),
    });
    const healthyPlugin = createMockPlugin();

    const crashingContainer = new PluginContainer(crashingPlugin);
    const healthyContainer = new PluginContainer(healthyPlugin);

    await crashingContainer.init(createMockContext());
    await crashingContainer.start();
    await healthyContainer.init(createMockContext());
    await healthyContainer.start();

    crashingContainer.onPinChange("pin1", { type: "digital", high: true });
    healthyContainer.onPinChange("pin1", { type: "digital", high: true });

    expect(crashingContainer.isInError()).toBe(true);
    expect(healthyContainer.isRunning()).toBe(true);
  });

  it("error notification is emitted on crash", async () => {
    const plugin = createMockPlugin({
      onPinChange: vi.fn().mockImplementation(() => {
        throw new Error("notify crash");
      }),
    });
    const container = new PluginContainer(plugin);
    const errorFn = vi.fn();
    container.onError(errorFn);

    await container.init(createMockContext());
    await container.start();
    container.onPinChange("pin1", { type: "digital", high: true });

    expect(errorFn).toHaveBeenCalledWith("notify crash", "test-plugin");
  });

  it("destroyed plugin cannot be called again", async () => {
    const plugin = createMockPlugin();
    const container = new PluginContainer(plugin);
    await container.init(createMockContext());
    await container.start();
    await container.stop();
    await container.destroy();

    expect(() =>
      container.onPinChange("pin1", { type: "digital", high: true })
    ).toThrow("Plugin is destroyed");
  });

  it("lifecycle state transitions: loading to initialized to running to stopped to destroyed", async () => {
    const plugin = createMockPlugin();
    const container = new PluginContainer(plugin);
    const ctx = createMockContext();

    expect(container.state).toBe(PluginState.LOADING);
    await container.init(ctx);
    expect(container.state).toBe(PluginState.INITIALIZED);
    await container.start();
    expect(container.state).toBe(PluginState.RUNNING);
    await container.stop();
    expect(container.state).toBe(PluginState.STOPPED);
    await container.destroy();
    expect(container.state).toBe(PluginState.DESTROYED);
  });

  it("error state from any state", async () => {
    const plugin = createMockPlugin({
      start: vi.fn().mockRejectedValue(new Error("start crash")),
    });
    const container = new PluginContainer(plugin);
    const ctx = createMockContext();

    await container.init(ctx);
    expect(container.state).toBe(PluginState.INITIALIZED);

    await container.start();
    expect(container.state).toBe(PluginState.ERROR);
    expect(container.isInError()).toBe(true);
  });

  it("cannot start if not initialized", async () => {
    const plugin = createMockPlugin();
    const container = new PluginContainer(plugin);
    await expect(container.start()).rejects.toThrow("Cannot start from state");
  });

  it("cannot stop if not running", async () => {
    const plugin = createMockPlugin();
    const container = new PluginContainer(plugin);
    await container.init(createMockContext());
    await expect(container.stop()).rejects.toThrow("Cannot stop from state");
  });

  it("isRunning returns correct boolean", async () => {
    const plugin = createMockPlugin();
    const container = new PluginContainer(plugin);
    expect(container.isRunning()).toBe(false);
    await container.init(createMockContext());
    await container.start();
    expect(container.isRunning()).toBe(true);
  });
});
