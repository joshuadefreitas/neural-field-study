import { createField, stepField, summarize } from "./neural-field.js";

const canvas = document.querySelector("#field");
const context = canvas.getContext("2d");
const toggle = document.querySelector("#toggle");
const stepButton = document.querySelector("#step");
const resetButton = document.querySelector("#reset");
const interventionButton = document.querySelector("#intervention");
const runState = document.querySelector("#run-state");
const interventionLabel = interventionButton.querySelector("b");
const config = { width: 72, height: 48, seed: 17 };
let state = createField(config);
let running = false;
let intervention = null;
let lastFrame = 0;

function colorFor(value) {
  const low = Math.max(0, Math.min(1, value));
  const dark = [5, 9, 9];
  const teal = [61, 163, 151];
  const orange = [244, 124, 69];
  const start = low < 0.55 ? dark : teal;
  const end = low < 0.55 ? teal : orange;
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
  const buffer = document.createElement("canvas");
  buffer.width = config.width;
  buffer.height = config.height;
  buffer.getContext("2d").putImageData(image, 0, 0);
  context.imageSmoothingEnabled = false;
  context.drawImage(buffer, 0, 0, canvas.width, canvas.height);
  if (intervention) {
    const scaleX = canvas.width / config.width;
    const scaleY = canvas.height / config.height;
    context.beginPath();
    context.arc((intervention.x + 0.5) * scaleX, (intervention.y + 0.5) * scaleY, intervention.radius * scaleX, 0, Math.PI * 2);
    context.strokeStyle = "rgba(244, 124, 69, 0.88)";
    context.lineWidth = 2;
    context.stroke();
  }
  const metrics = summarize(state);
  document.querySelector("#mass").textContent = metrics.activeMass.toFixed(2);
  document.querySelector("#mean").textContent = metrics.mean.toFixed(3);
  document.querySelector("#peak").textContent = metrics.peak.toFixed(3);
  document.querySelector("#tick-label").textContent = `TICK ${String(state.tick).padStart(3, "0")}`;
  document.querySelector("#live-status").textContent = `Tick ${state.tick}. Mean activity ${metrics.mean.toFixed(3)}. Peak activity ${metrics.peak.toFixed(3)}.`;
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
  requestAnimationFrame(frame);
}

toggle.addEventListener("click", () => {
  running = !running;
  toggle.textContent = running ? "Ⅱ" : "▶";
  runState.textContent = running ? "RUNNING" : "PAUSED";
});
stepButton.addEventListener("click", advance);
resetButton.addEventListener("click", () => {
  state = createField(config);
  render();
});
interventionButton.addEventListener("click", () => {
  intervention = intervention ? null : { x: 49, y: 24, radius: 3, strength: 0.8 };
  interventionLabel.textContent = intervention ? "ON" : "OFF";
  interventionButton.classList.toggle("active", Boolean(intervention));
  render();
});
canvas.addEventListener("click", (event) => {
  if (!intervention) return;
  const bounds = canvas.getBoundingClientRect();
  intervention.x = Math.max(0, Math.min(config.width - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * config.width)));
  intervention.y = Math.max(0, Math.min(config.height - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * config.height)));
  render();
});

render();
requestAnimationFrame(frame);
