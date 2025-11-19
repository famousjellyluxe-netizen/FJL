// WCAG Contrast Ratio Calculator
// Based on WCAG 2.1 specifications

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r, g, b) {
  // Convert RGB to sRGB
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

function checkWCAG(ratio) {
  return {
    'AA Normal (4.5:1)': ratio >= 4.5 ? 'PASS' : 'FAIL',
    'AA Large (3:1)': ratio >= 3.0 ? 'PASS' : 'FAIL',
    'AAA Normal (7:1)': ratio >= 7.0 ? 'PASS' : 'FAIL',
    'AAA Large (4.5:1)': ratio >= 4.5 ? 'PASS' : 'FAIL'
  };
}

// Color combinations to test
const combinations = [
  { name: 'Black text on white background', fg: '#000000', bg: '#FFFFFF' },
  { name: 'Neon green text on black background', fg: '#00FF00', bg: '#000000' },
  { name: 'Neon green text on white background', fg: '#00FF00', bg: '#FFFFFF' },
  { name: 'Gray text on white background', fg: '#666666', bg: '#FFFFFF' },
  { name: 'Gray text on black background', fg: '#666666', bg: '#000000' },
  { name: 'White text on black background', fg: '#FFFFFF', bg: '#000000' },
  { name: 'Black text on light gray background', fg: '#000000', bg: '#F5F5F5' }
];

console.log('='.repeat(80));
console.log('WCAG CONTRAST RATIO COMPLIANCE REPORT');
console.log('FJL Website Color Combinations');
console.log('='.repeat(80));
console.log();

combinations.forEach((combo, index) => {
  const ratio = getContrastRatio(combo.fg, combo.bg);
  const wcag = checkWCAG(ratio);

  console.log(`${index + 1}. ${combo.name}`);
  console.log(`   Foreground: ${combo.fg}`);
  console.log(`   Background: ${combo.bg}`);
  console.log(`   Contrast Ratio: ${ratio.toFixed(2)}:1`);
  console.log(`
   WCAG Compliance:`);
  console.log(`   - AA Normal Text (4.5:1):  ${wcag['AA Normal (4.5:1)']}`);
  console.log(`   - AA Large Text (3:1):     ${wcag['AA Large (3:1)']}`);
  console.log(`   - AAA Normal Text (7:1):   ${wcag['AAA Normal (7:1)']}`);
  console.log(`   - AAA Large Text (4.5:1):  ${wcag['AAA Large (4.5:1)']}`);
  console.log();
});

console.log('='.repeat(80));
console.log('NOTES:');
console.log('- Normal text: Regular body text (< 18pt or < 14pt bold)');
console.log('- Large text: Headings and large text (>= 18pt or >= 14pt bold)');
console.log('- WCAG AA is the minimum legal requirement in many jurisdictions');
console.log('- WCAG AAA is enhanced accessibility for maximum readability');
console.log('='.repeat(80));
