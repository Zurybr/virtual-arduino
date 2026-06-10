import { createRoot } from "react-dom/client";
import { App } from "./ui/app";

async function initTauri(): Promise<void> {}

async function bootstrap(): Promise<void> {
  await initTauri();

  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(<App />);
  }
}

bootstrap();
