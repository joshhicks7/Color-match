/* ---------- CONFIG ---------- */
const SIZE = 24;
const PIXELS = SIZE * SIZE;
const SHAKE_THRESHOLD = 50; // Lowered for better sensitivity
const SHAKE_COOLDOWN = 500; // Milliseconds between shake detections
const WIN_ACCURACY = 95; // Minimum accuracy to win

/* ---------- STORAGE ---------- */
const STORAGE_KEY = 'colorMatchLevel';

function saveLevel() {
  try {
    localStorage.setItem(STORAGE_KEY, level.toString());
  } catch (e) {
    console.warn('Failed to save level:', e);
  }
}

function loadLevel() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= LEVELS.length) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load level:', e);
  }
  return 1; // Default to level 1
}

/* ---------- STATE ---------- */
let level = loadLevel();
let pixels = Array(PIXELS).fill(null);
let fillIndex = 0;
let holding = null;

/* ---------- CANVAS ---------- */
const container = document.getElementById("container");
const ctx = container.getContext("2d");
const targetBox = document.getElementById("targetBox");
const mixPreview = document.getElementById("mixPreview");
const levelText = document.getElementById("level");
const message = document.getElementById("message");
const shakeHint = document.getElementById("shakeHint");

/* ---------- MODAL ---------- */
const levelCompleteModal = document.getElementById("levelCompleteModal");
const modalAccuracy = document.getElementById("modalAccuracy");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const nextLevelBtn = document.getElementById("nextLevelBtn");

/* ---------- COLORS ---------- */
const COLORS = {
  r: { r: 255, g: 0, b: 0 },
  g: { r: 0, g: 255, b: 0 },
  b: { r: 0, g: 0, b: 255 }
};

/* ---------- TARGET COLOR ---------- */
function getTarget(level) {
  // Use levels array (0-indexed, so level 1 = index 0)
  const levelIndex = level - 1;
  if (levelIndex >= 0 && levelIndex < LEVELS.length) {
    return LEVELS[levelIndex];
  }
  // If level exceeds available levels, cycle or return last level
  return LEVELS[LEVELS.length - 1];
}

/* ---------- FUNCTIONS ---------- */
function fillCanvas(canvas, color) {
  const c = canvas.getContext("2d");
  c.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
  c.fillRect(0, 0, canvas.width, canvas.height);
}

function drawContainer() {
  const px = container.width / SIZE;
  ctx.clearRect(0, 0, container.width, container.height);
  for (let i = 0; i < PIXELS; i++) {
    const x = (i % SIZE) * px;
    const y = Math.floor(i / SIZE) * px;
    const color = pixels[i];
    if (color) {
      ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
      ctx.fillRect(x, y, px, px);
    } else {
      ctx.fillStyle = "#1a202c";
      ctx.fillRect(x, y, px, px);
    }
  }
}

function updatePreview() {
  if (fillIndex === 0) {
    fillCanvas(mixPreview, { r: 0, g: 0, b: 0 });
    return;
  }
  
  // Count how many pixels of each primary color we have
  let redCount = 0, greenCount = 0, blueCount = 0;
  for (let i = 0; i < fillIndex; i++) {
    const c = pixels[i];
    if (c) {
      if (c.r === 255 && c.g === 0 && c.b === 0) redCount++;
      else if (c.r === 0 && c.g === 255 && c.b === 0) greenCount++;
      else if (c.r === 0 && c.g === 0 && c.b === 255) blueCount++;
    }
  }
  
  const total = fillIndex;
  const maxCount = Math.max(redCount, greenCount, blueCount, 1);
  
  // Calculate each channel as percentage of max count, scaled to 255
  const r = maxCount > 0 ? Math.round((redCount / maxCount) * 255) : 0;
  const g = maxCount > 0 ? Math.round((greenCount / maxCount) * 255) : 0;
  const b = maxCount > 0 ? Math.round((blueCount / maxCount) * 255) : 0;
  
  fillCanvas(mixPreview, { r, g, b });
}

function mixContainer() {
  if (fillIndex === 0) {
    showMessage("Add some colors first!", "error");
    return;
  }
  
  // Count how many pixels of each primary color we have
  let redCount = 0, greenCount = 0, blueCount = 0;
  for (let i = 0; i < fillIndex; i++) {
    const c = pixels[i];
    if (c) {
      if (c.r === 255 && c.g === 0 && c.b === 0) redCount++;
      else if (c.r === 0 && c.g === 255 && c.b === 0) greenCount++;
      else if (c.r === 0 && c.g === 0 && c.b === 255) blueCount++;
    }
  }
  
  const maxCount = Math.max(redCount, greenCount, blueCount, 1);
  
  // Calculate each channel as percentage of max count, scaled to 255
  const mixed = {
    r: maxCount > 0 ? Math.round((redCount / maxCount) * 255) : 0,
    g: maxCount > 0 ? Math.round((greenCount / maxCount) * 255) : 0,
    b: maxCount > 0 ? Math.round((blueCount / maxCount) * 255) : 0
  };
  
  for (let i = 0; i < fillIndex; i++) {
    pixels[i] = { ...mixed };
  }
  drawContainer();
  updatePreview();
  
  // Visual feedback
  container.style.transform = 'scale(1.05)';
  setTimeout(() => {
    container.style.transform = 'scale(1)';
  }, 200);
}

function resetContainer() {
  pixels = Array(PIXELS).fill(null);
  fillIndex = 0;
  drawContainer();
  updatePreview();
  message.textContent = "";
  message.className = "message";
}

function showLevelCompleteModal(accuracy) {
  modalAccuracy.textContent = `${accuracy.toFixed(1)}%`;
  levelCompleteModal.classList.add("show");
  
  // Hide next level button if all levels are complete
  if (level >= LEVELS.length) {
    nextLevelBtn.style.display = 'none';
  } else {
    nextLevelBtn.style.display = 'block';
  }
}

function hideLevelCompleteModal() {
  levelCompleteModal.classList.remove("show");
}

function goToNextLevel() {
  if (level >= LEVELS.length) {
    // All levels complete
    hideLevelCompleteModal();
    showMessage(`🎉🎉🎉 ALL LEVELS COMPLETE! 🎉🎉🎉`, "success");
    saveLevel();
    return;
  }
  
  level++;
  target = getTarget(level);
  fillCanvas(targetBox, target);
  resetContainer();
  updateLevel();
  saveLevel();
  hideLevelCompleteModal();
}

function tryAgain() {
  resetContainer();
  hideLevelCompleteModal();
}

function checkMatch() {
  const mix = mixPreview.getContext("2d").getImageData(0, 0, 1, 1).data;
  const diff = Math.abs(mix[0] - target.r) + 
               Math.abs(mix[1] - target.g) + 
               Math.abs(mix[2] - target.b);

  console.log(mix, target, diff);
  const accuracy = 100 - (diff / (255 * 3) * 100);
  
  if (accuracy >= WIN_ACCURACY) {
    showLevelCompleteModal(accuracy);
  } else {
    showMessage(`❌ ${accuracy.toFixed(1)}% — Keep Mixing`, "error");
  }
}

function updateLevel() {
  levelText.textContent = `Level ${level}`;
}

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
}

/* ---------- SHAKE DETECTION ---------- */
let lastShake = 0;
let lastAcceleration = { x: 0, y: 0, z: 0 };

// Request permission for device motion (iOS 13+)
if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
  DeviceMotionEvent.requestPermission()
    .then(response => {
      if (response === 'granted') {
        setupShakeDetection();
        shakeHint.style.display = 'block';
      } else {
        shakeHint.textContent = 'Shake permission denied. Use buttons to mix.';
      }
    })
    .catch(console.error);
} else {
  // Android and older iOS
  setupShakeDetection();
}

function setupShakeDetection() {
  window.addEventListener("devicemotion", handleDeviceMotion);
  
  // Also listen for orientation changes as fallback
  window.addEventListener("deviceorientation", handleOrientation);
}

function handleDeviceMotion(e) {
  const acceleration = e.accelerationIncludingGravity || e.acceleration;
  
  if (!acceleration) return;
  
  const now = Date.now();
  
  // Calculate change in acceleration
  const deltaX = Math.abs(acceleration.x - lastAcceleration.x);
  const deltaY = Math.abs(acceleration.y - lastAcceleration.y);
  const deltaZ = Math.abs(acceleration.z - lastAcceleration.z);
  
  const totalDelta = deltaX + deltaY + deltaZ;
  
  // Update last acceleration
  lastAcceleration = {
    x: acceleration.x || 0,
    y: acceleration.y || 0,
    z: acceleration.z || 0
  };
  
  // Check if shake detected
  if (totalDelta > SHAKE_THRESHOLD && now - lastShake > SHAKE_COOLDOWN) {
    mixContainer();
    lastShake = now;
    
    // Hide hint after first shake
    if (shakeHint.style.display !== 'none') {
      shakeHint.style.opacity = '0';
      setTimeout(() => {
        shakeHint.style.display = 'none';
      }, 500);
    }
  }
}

function handleOrientation(e) {
  // Fallback shake detection using orientation
  const now = Date.now();
  const beta = Math.abs(e.beta || 0);
  const gamma = Math.abs(e.gamma || 0);
  const alpha = Math.abs(e.alpha || 0);
  
  const totalRotation = beta + gamma + alpha;
  
  if (totalRotation > SHAKE_THRESHOLD * 2 && now - lastShake > SHAKE_COOLDOWN) {
    mixContainer();
    lastShake = now;
  }
}

/* ---------- ADD PIXEL FUNCTION ---------- */
function addPixel(colorKey) {
  if (fillIndex >= PIXELS) {
    showMessage("Canvas is full! Shake to mix or reset.", "error");
    return;
  }
  
  pixels[fillIndex++] = { ...COLORS[colorKey] };
  drawContainer();
  updatePreview();
}

/* ---------- FILL LOOP (for holding) ---------- */
setInterval(() => {
  if (!holding || fillIndex >= PIXELS) return;
  addPixel(holding);
}, 40);

/* ---------- BUTTON HANDLERS ---------- */
["red", "green", "blue"].forEach(color => {
  const btn = document.getElementById(color + "Btn");
  const colorKey = color[0]; // 'r', 'g', or 'b'
  
  // Click handler - adds one pixel per click
  btn.addEventListener("click", () => {
    addPixel(colorKey);
    
    // Visual feedback
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 150);
  });
  
  // Hold handler - starts continuous filling
  btn.addEventListener("pointerdown", (e) => {
    holding = colorKey;
    btn.style.transform = 'scale(0.95)';
    e.preventDefault(); // Prevent default to avoid conflicts
  });
  
  btn.addEventListener("pointerup", () => {
    holding = null;
    btn.style.transform = '';
  });
  
  btn.addEventListener("pointerleave", () => {
    holding = null;
    btn.style.transform = '';
  });
  
  // Prevent context menu on long press
  btn.addEventListener("contextmenu", e => e.preventDefault());
});

document.getElementById("resetBtn").onclick = resetContainer;
document.getElementById("checkBtn").onclick = checkMatch;

/* ---------- MODAL BUTTON HANDLERS ---------- */
tryAgainBtn.onclick = tryAgain;
nextLevelBtn.onclick = goToNextLevel;

// Close modal when clicking outside of it
levelCompleteModal.addEventListener("click", (e) => {
  if (e.target === levelCompleteModal) {
    hideLevelCompleteModal();
  }
});

/* ---------- INIT ---------- */
let target = getTarget(level);
fillCanvas(targetBox, target);
updatePreview();
drawContainer();
updateLevel();

// Hide shake hint initially if not on mobile
if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  shakeHint.style.display = 'none';
}

