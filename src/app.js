import { createField, stepField, summarize } from "./neural-field.js";

const canvas = document.querySelector("#field");
const context = canvas.getContext("2d");
const buffer = document.createElement("canvas");
const bufferContext = buffer.getContext("2d");
const toggle = document.querySelector("#toggle");
const stepButton = document.querySelector("#step");
const resetButton = document.querySelector("#reset");
const interventionButton = document.querySelector("#intervention");
const runState = document.querySelector("#run-state");
const liveStatus = document.querySelector("#live-status");
const interventionLabel = interventionButton.querySelector("b");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const config = { width: 72, height: 48, seed: 17 };
buffer.width = config.width;
buffer.height = config.height;
let state = createField(config);
let running = false;
let intervention = null;
let lastFrame = 0;

function colorFor(value) {
  const low = Math.max(0, Math.min(1, value));
  const dark = [8, 9, 11];
  const silver = [106, 113, 123];
  const light = [235, 238, 242];
  const start = low < 0.55 ? dark : silver;
  const end = low < 0.55 ? silver : light;
  const mix = low < 0.55 ? low / 0.55 : (low - 0.55) / 0.45;
  const r = Math.round(start[0] + (end[0] - start[0]) * mix);
  const g = Math.round(start[1] + (end[1] - start[1]) * mix);
  const b = Math.round(start[2] + (end[2] - start[2]) * mix);
  return [r, g, b, 255];
}

function render() {
  const image = context.createImageData(config.width, config.height);
  for (let index = 0; index < state.values.length; index += 1) {
    const color = colorFor(state.values[index]);
    image.data.set(color, index * 4);
  }
  bufferContext.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = false;
  context.drawImage(buffer, 0, 0, canvas.width, canvas.height);
  if (intervention) {
    const scaleX = canvas.width / config.width;
    const scaleY = canvas.height / config.height;
    context.beginPath();
    context.arc((intervention.x + 0.5) * scaleX, (intervention.y + 0.5) * scaleY, intervention.radius * scaleX, 0, Math.PI * 2);
    context.strokeStyle = "rgba(235, 238, 242, 0.92)";
    context.lineWidth = 2;
    context.stroke();
  }
  const metrics = summarize(state);
  document.querySelector("#mass").textContent = metrics.activeMass.toFixed(2);
  document.querySelector("#mean").textContent = metrics.mean.toFixed(3);
  document.querySelector("#peak").textContent = metrics.peak.toFixed(3);
  document.querySelector("#tick-label").textContent = `TICK ${String(state.tick).padStart(3, "0")}`;
  return metrics;
}

function announceState(action) {
  const metrics = summarize(state);
  liveStatus.textContent = `${action} Tick ${state.tick}. Mean activity ${metrics.mean.toFixed(3)}. Peak activity ${metrics.peak.toFixed(3)}.`;
}

function advance() {
  state = stepField(state, config, intervention);
  render();
}

function frame(timestamp) {
  if (running && timestamp - lastFrame > 45) {
    advance();
    lastFrame = timestamp;
  }
  if (!reduceMotion.matches) requestAnimationFrame(frame);
}

toggle.addEventListener("click", () => {
  if (reduceMotion.matches) {
    advance();
    announceState("Reduced motion is on; advanced one step.");
    return;
  }
  running = !running;
  toggle.textContent = running ? "Pause" : "Play";
  toggle.setAttribute("aria-label", running ? "Pause simulation" : "Play simulation");
  runState.textContent = running ? "Running" : "Paused";
  announceState(running ? "Simulation playing." : "Simulation paused.");
});
stepButton.addEventListener("click", () => {
  advance();
  announceState("Advanced one step.");
});
resetButton.addEventListener("click", () => {
  state = createField(config);
  render();
  announceState("Simulation reset.");
});
interventionButton.addEventListener("click", () => {
  intervention = intervention ? null : { x: 49, y: 24, radius: 3, strength: 0.8 };
  interventionLabel.textContent = intervention ? "On" : "Off";
  interventionButton.classList.toggle("active", Boolean(intervention));
  render();
  announceState(intervention ? "Local inhibition enabled." : "Local inhibition disabled.");
});
canvas.addEventListener("click", (event) => {
  if (!intervention) return;
  const bounds = canvas.getBoundingClientRect();
  intervention.x = Math.max(0, Math.min(config.width - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * config.width)));
  intervention.y = Math.max(0, Math.min(config.height - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * config.height)));
  render();
  announceState("Local inhibition moved.");
});

render();
if (reduceMotion.matches) {
  toggle.setAttribute("aria-label", "Advance one step while reduced motion is on");
} else {
  requestAnimationFrame(frame);
}
reduceMotion.addEventListener("change", (event) => {
  if (event.matches) {
    running = false;
    toggle.textContent = "Play";
    toggle.setAttribute("aria-label", "Advance one step while reduced motion is on");
    runState.textContent = "Paused";
    announceState("Reduced motion enabled; continuous playback paused.");
  } else {
    toggle.setAttribute("aria-label", "Play simulation");
    requestAnimationFrame(frame);
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();

(function setupTheme() {
  const root = document.documentElement;
  const button = document.querySelector("#theme-toggle");
  const label = button.querySelector("[data-theme-label]");
  const themeMeta = document.querySelector("#theme-color");
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function sync() {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    label.textContent = next === "dark" ? "Dark" : "Light";
    button.setAttribute("aria-label", `Switch to ${next} theme`);
    themeMeta.setAttribute("content", current === "dark" ? "#0c0d0f" : "#fafafb");
  }

  function setTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (persist) {
      try { localStorage.setItem("theme", theme); } catch (error) {}
    }
    sync();
  }

  sync();
  button.addEventListener("click", () => {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
  });
  media.addEventListener("change", (event) => {
    let stored = null;
    try { stored = localStorage.getItem("theme"); } catch (error) {}
    if (!stored) setTheme(event.matches ? "dark" : "light", false);
  });
})();
