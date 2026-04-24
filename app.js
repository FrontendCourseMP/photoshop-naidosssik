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

function hasAnyTransparency(imageData) {
  const data = imageData.data;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) {
      return true;
    }
  }

  return false;
}

async function loadStandardImage(file) {
  const bitmap = await createImageBitmap(file);

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  state.fileName = file.name;
  state.format = file.type.includes("png") ? "PNG" : "JPG";
  state.colorDepth = "24 бит / 32 бит RGBA";
  state.hasMask = hasAnyTransparency(imageData);

  renderImageData(imageData);
}

function decodeGB7(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);

  if (bytes.length < 12) {
    throw new Error("Файл слишком короткий для формата GB7.");
  }

  if (
    bytes[0] !== 0x47 ||
    bytes[1] !== 0x42 ||
    bytes[2] !== 0x37 ||
    bytes[3] !== 0x1d
  ) {
    throw new Error("Неверная сигнатура GB7.");
  }

  const version = bytes[4];

  if (version !== 0x01) {
    throw new Error(`Неподдерживаемая версия GB7: ${version}`);
  }

  const flags = bytes[5];
  const hasMask = (flags & 0b00000001) !== 0;

  if ((flags & 0b11111110) !== 0) {
    throw new Error("Некорректные флаги GB7.");
  }

  const width = (bytes[6] << 8) | bytes[7];
  const height = (bytes[8] << 8) | bytes[9];

  const pixelCount = width * height;
  const expectedLength = 12 + pixelCount;

  if (bytes.length !== expectedLength) {
    throw new Error(
      `Некорректный размер файла. Ожидалось ${expectedLength} байт, получено ${bytes.length}.`
    );
  }

  const rgba = new Uint8ClampedArray(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const byte = bytes[12 + i];

    const gray7 = byte & 0b01111111;
    const maskBit = (byte & 0b10000000) >>> 7;

    const gray8 = Math.round((gray7 / 127) * 255);

    const index = i * 4;

    rgba[index] = gray8;
    rgba[index + 1] = gray8;
    rgba[index + 2] = gray8;
    rgba[index + 3] = hasMask ? (maskBit === 1 ? 255 : 0) : 255;
  }

  return {
    imageData: new ImageData(rgba, width, height),
    width,
    height,
    hasMask,
  };
}

async function loadGB7(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = decodeGB7(arrayBuffer);

  state.fileName = file.name;
  state.format = "GB7";
  state.colorDepth = result.hasMask ? "7 бит Gray + 1 бит mask" : "7 бит Gray";
  state.hasMask = result.hasMask;

  renderImageData(result.imageData);
}

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  try {
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".gb7")) {
      await loadGB7(file);
    } else if (
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg")
    ) {
      await loadStandardImage(file);
    } else {
      alert("Поддерживаются только PNG, JPG, JPEG и GB7.");
    }
  } catch (error) {
    console.error(error);
    alert(`Ошибка загрузки файла: ${error.message}`);
  } finally {
    fileInput.value = "";
  }
});

updateInfoPanel();