// Simple test for PEPE formatting
function getSmartPrecision(value) {
  if (value === 0) return { precision: 2, useScientific: false, displayFormat: 'normal' };
  
  const absValue = Math.abs(value);
  
  if (absValue < 0.000001) {
    return { precision: 2, useScientific: true, displayFormat: 'scientific' };
  } else if (absValue < 0.01) {
    return { precision: 8, useScientific: false, displayFormat: 'normal' };
  } else if (absValue < 1) {
    return { precision: 6, useScientific: false, displayFormat: 'normal' };
  } else if (absValue >= 1000) {
    return { precision: 2, useScientific: false, displayFormat: 'compact' };
  } else {
    return { precision: 2, useScientific: false, displayFormat: 'normal' };
  }
}

function formatSmartPrice(price, includeSymbol = true) {
  if (price === null || price === undefined || isNaN(price)) {
    return includeSymbol ? '$0.00' : '0.00';
  }

  const { precision, useScientific } = getSmartPrecision(price);
  
  let formatted;
  
  if (useScientific) {
    formatted = price.toExponential(precision);
  } else {
    formatted = parseFloat(price.toFixed(precision)).toString();
  }
  
  return includeSymbol ? `$${formatted}` : formatted;
}

// Test data
const testPrices = [0.00001, 0.0000000667, 0.00000951, 0.0000102, 0.000001, 0.0000001];

console.log('=== PEPE FORMATTING TESTS ===');
console.log('');

testPrices.forEach(price => {
  const formatted = formatSmartPrice(price, true);
  const precision = getSmartPrecision(price);
  console.log(`Price: ${price.toString().padEnd(12)} -> ${formatted.padEnd(15)} (${precision.useScientific ? 'Scientific' : 'Normal'}, precision: ${precision.precision})`);
});
