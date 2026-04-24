const fileInput = document.getElementById("fileInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const downloadPngBtn = document.getElementById("downloadPngBtn");
const downloadJpgBtn = document.getElementById("downloadJpgBtn");
const downloadGb7Btn = document.getElementById("downloadGb7Btn");
const maskCheckbox = document.getElementById("maskCheckbox");

const fileNameEl = document.getElementById("fileName");
const fileFormatEl = document.getElementById("fileFormat");
const imageSizeEl = document.getElementById("imageSize");
const colorDepthEl = document.getElementById("colorDepth");
const maskInfoEl = document.getElementById("maskInfo");
const statusTextEl = document.getElementById("statusText");

const state = {
  fileName: "",
  format: "",
  width: 0,
  height: 0,
  colorDepth: "",
  hasMask: false,
  imageData: null,
};

function updateInfoPanel() {
  fileNameEl.textContent = state.fileName || "—";
  fileFormatEl.textContent = state.format || "—";

  imageSizeEl.textContent =
    state.width && state.height ? `${state.width} × ${state.height}` : "—";

  colorDepthEl.textContent = state.colorDepth || "—";
  maskInfoEl.textContent = state.hasMask ? "есть" : "нет";

  if (state.width && state.height) {
    statusTextEl.textContent =
      `Ширина: ${state.width}px | Высота: ${state.height}px | Глубина цвета: ${state.colorDepth}`;
  } else {
    statusTextEl.textContent = "Нет загруженного изображения";
  }
}

function renderImageData(imageData) {
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  ctx.putImageData(imageData, 0, 0);

  state.width = imageData.width;
  state.height = imageData.height;
  state.imageData = imageData;

  updateInfoPanel();
}

updateInfoPanel();