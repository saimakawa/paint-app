const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const preview = document.getElementById("brushPreview");

canvas.width = window.innerWidth - 260;
canvas.height = window.innerHeight;

let tool = "brush";
let drawing = false;
let startX = 0,
  startY = 0;
let color = "#000000";
let size = 4;

let undoStack = [];
let redoStack = [];
let snapshot = null;

function saveState() {
  undoStack.push(canvas.toDataURL());
  if (undoStack.length > 20) undoStack.shift();
  redoStack = [];
}

function restore(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!state) return;

  const img = new Image();
  img.src = state;
  img.onload = () => ctx.drawImage(img, 0, 0);
}

document.getElementById("tool").onchange = (e) => (tool = e.target.value);
document.getElementById("size").oninput = (e) => (size = e.target.value);

const palette = document.getElementById("colorHistory");
let colorHistory = [];

document.getElementById("colorPicker").oninput = (e) => {
  color = e.target.value;
  if (!colorHistory.includes(color)) {
    colorHistory.unshift(color);
    if (colorHistory.length > 8) colorHistory.pop();
    renderPalette();
  }
};

function renderPalette() {
  palette.innerHTML = "";
  colorHistory.forEach((c) => {
    const d = document.createElement("div");
    d.style.background = c;
    d.onclick = () => (color = c);
    palette.appendChild(d);
  });
}

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  startX = e.offsetX;
  startY = e.offsetY;

  saveState();
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.moveTo(startX, startY);
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;

  preview.style.display =
    tool === "brush" || tool === "eraser" ? "block" : "none";
  preview.style.width = size + "px";
  preview.style.height = size + "px";
  preview.style.left = e.pageX + "px";
  preview.style.top = e.pageY + "px";

  ctx.putImageData(snapshot, 0, 0);
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;

  if (tool === "brush") {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }

  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

  if (tool === "line") {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }

  if (tool === "rect") {
    ctx.strokeRect(startX, startY, e.offsetX - startX, e.offsetY - startY);
  }

  if (tool === "circle") {
    const r = Math.hypot(e.offsetX - startX, e.offsetY - startY);
    ctx.beginPath();
    ctx.arc(startX, startY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  preview.style.display = "none";
});

document.getElementById("undo").onclick = () => {
  if (undoStack.length <= 1) return;
  redoStack.push(undoStack.pop());
  restore(undoStack[undoStack.length - 1]);
};

document.getElementById("redo").onclick = () => {
  if (!redoStack.length) return;
  const state = redoStack.pop();
  undoStack.push(state);
  restore(state);
};

document.getElementById("clear").onclick = () => {
  saveState();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

document.getElementById("save").onclick = () => {
  const a = document.createElement("a");
  a.download = "paint.png";
  a.href = canvas.toDataURL();
  a.click();
};

document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("light");
};

document.getElementById("toggleSidebar").onclick = () => {
  document.querySelector(".sidebar").classList.toggle("collapsed");
};

window.onload = () => {
  saveState();
  const saved = localStorage.getItem("autosave");
  if (saved) restore(saved);
};

setInterval(() => {
  localStorage.setItem("autosave", canvas.toDataURL());
}, 3000);
