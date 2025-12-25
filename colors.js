/* ---------- SEEDED RANDOM ---------- */
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/* ---------- GENERATE LEVELS ---------- */
function generateLevels() {
  const levels = [];
  
  // Levels 1-6: Pure colors (1 color only)
  const pureColors = [
    { r: 255, g: 0, b: 0 },   // Pure Red
    { r: 255, g: 0, b: 0 },   // Pure Red (duplicate for variety)
    { r: 0, g: 255, b: 0 },   // Pure Green
    { r: 0, g: 255, b: 0 },   // Pure Green (duplicate)
    { r: 0, g: 0, b: 255 },   // Pure Blue
    { r: 0, g: 0, b: 255 }    // Pure Blue (duplicate)
  ];
  
  for (let i = 0; i < 6; i++) {
    levels.push(pureColors[i]);
  }
  
  // Levels 7-12: Two colors mixed (equal parts)
  const twoColorMixes = [
    { r: 255, g: 255, b: 0 },   // Red + Green (Yellow)
    { r: 255, g: 255, b: 0 },   // Red + Green
    { r: 255, g: 0, b: 255 },   // Red + Blue (Magenta)
    { r: 255, g: 0, b: 255 },   // Red + Blue
    { r: 0, g: 255, b: 255 },   // Green + Blue (Cyan)
    { r: 0, g: 255, b: 255 }    // Green + Blue
  ];
  
  for (let i = 0; i < 6; i++) {
    levels.push(twoColorMixes[i]);
  }
  
  // Levels 13-30: One full color with little mix of another (gradual introduction)
  for (let level = 13; level <= 30; level++) {
    const rand = mulberry32(level);
    const primaryColors = ['r', 'g', 'b'];
    const primaryIndex = Math.floor(rand() * 3);
    const primary = primaryColors[primaryIndex];
    
    // Small amount of secondary color (10-30% of 255)
    const secondaryAmount = Math.floor(10 + rand() * 20);
    const others = primaryColors.filter(c => c !== primary);
    const secondaryIndex = Math.floor(rand() * 2);
    
    let target = { r: 0, g: 0, b: 0 };
    target[primary] = 255;
    target[others[secondaryIndex]] = secondaryAmount;
    
    levels.push(target);
  }
  
  // Levels 31-60: One full color with moderate mix (30-60% of secondary)
  for (let level = 31; level <= 60; level++) {
    const rand = mulberry32(level);
    const primaryColors = ['r', 'g', 'b'];
    const primaryIndex = Math.floor(rand() * 3);
    const primary = primaryColors[primaryIndex];
    
    const secondaryAmount = Math.floor(30 + rand() * 30);
    const others = primaryColors.filter(c => c !== primary);
    const secondaryIndex = Math.floor(rand() * 2);
    
    let target = { r: 0, g: 0, b: 0 };
    target[primary] = 255;
    target[others[secondaryIndex]] = secondaryAmount;
    
    levels.push(target);
  }
  
  // Levels 61-100: One dominant color with two secondaries (increasing variance)
  for (let level = 61; level <= 100; level++) {
    const rand = mulberry32(level);
    const primaryColors = ['r', 'g', 'b'];
    const primaryIndex = Math.floor(rand() * 3);
    const primary = primaryColors[primaryIndex];
    
    const difficulty = (level - 60) / 40; // 0 to 1 over 40 levels
    const secondary1Amount = Math.floor(40 + rand() * (40 + difficulty * 80));
    const secondary2Amount = Math.floor(20 + rand() * (30 + difficulty * 60));
    
    const others = primaryColors.filter(c => c !== primary);
    
    let target = { r: 0, g: 0, b: 0 };
    target[primary] = 255;
    target[others[0]] = Math.min(255, secondary1Amount);
    target[others[1]] = Math.min(255, secondary2Amount);
    
    levels.push(target);
  }
  
  // Levels 101-150: More balanced mixes with all three colors
  for (let level = 101; level <= 150; level++) {
    const rand = mulberry32(level);
    const difficulty = (level - 100) / 50; // 0 to 1
    
    // One color still dominant but less so
    const primaryColors = ['r', 'g', 'b'];
    const primaryIndex = Math.floor(rand() * 3);
    const primary = primaryColors[primaryIndex];
    
    const primaryAmount = Math.floor(200 + rand() * 55); // 200-255
    const secondary1Amount = Math.floor(50 + rand() * (100 + difficulty * 100));
    const secondary2Amount = Math.floor(30 + rand() * (70 + difficulty * 100));
    
    const others = primaryColors.filter(c => c !== primary);
    
    let target = { r: 0, g: 0, b: 0 };
    target[primary] = primaryAmount;
    target[others[0]] = Math.min(255, secondary1Amount);
    target[others[1]] = Math.min(255, secondary2Amount);
    
    levels.push(target);
  }
  
  // Levels 151-200: Even more balanced, all colors significant
  for (let level = 151; level <= 200; level++) {
    const rand = mulberry32(level);
    const difficulty = (level - 150) / 50;
    
    // All three colors can be significant
    const r = Math.floor(80 + rand() * (100 + difficulty * 75));
    const g = Math.floor(80 + rand() * (100 + difficulty * 75));
    const b = Math.floor(80 + rand() * (100 + difficulty * 75));
    
    // Ensure at least one color is somewhat dominant
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    if (maxVal - minVal < 50) {
      // Make one color more dominant
      const dominantIndex = Math.floor(rand() * 3);
      const colors = [r, g, b];
      colors[dominantIndex] = Math.min(255, colors[dominantIndex] + 50);
      levels.push({ r: colors[0], g: colors[1], b: colors[2] });
    } else {
      levels.push({ r, g, b });
    }
  }
  
  // Levels 201-250: Complex mixes with high variance
  for (let level = 201; level <= 250; level++) {
    const rand = mulberry32(level);
    const difficulty = (level - 200) / 50;
    
    // Full range of colors, any combination
    const r = Math.floor(rand() * 256);
    const g = Math.floor(rand() * 256);
    const b = Math.floor(rand() * 256);
    
    // Ensure some minimum brightness for visibility
    const minBrightness = 30;
    const brightness = (r + g + b) / 3;
    if (brightness < minBrightness) {
      const boost = minBrightness - brightness;
      levels.push({
        r: Math.min(255, r + boost),
        g: Math.min(255, g + boost),
        b: Math.min(255, b + boost)
      });
    } else {
      levels.push({ r, g, b });
    }
  }
  
  return levels;
}

/* ---------- EXPORT LEVELS ---------- */
const LEVELS = generateLevels();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LEVELS;
}

