// Test script for PEPE formatting functions
const { formatPrice, formatSmartPrice, formatPercentageChange, getSmartPrecision, isMicroCapToken } = require('../lib/priceFormatter.ts');

// Test data based on real PEPE prices
const testPrices = [
  0.00001,      // Current PEPE price
  0.0000000667, // Very small PEPE price
  0.00000951,   // PEPE low price
  0.0000102,    // PEPE high price
  0.000001,     // Edge case
  0.0000001,    // Scientific notation territory
  108761.99,    // BTC price for comparison
  2553.85       // ETH price for comparison
];

console.log('=== PEPE FORMATTING TESTS ===\n');

console.log('1. Smart Precision Detection:');
testPrices.forEach(price => {
  const precision = getSmartPrecision(price);
  console.log(`Price: ${price} -> Precision: ${precision.precision}, Scientific: ${precision.useScientific}, Format: ${precision.displayFormat}`);
});

console.log('\n2. Micro-cap Token Detection:');
testPrices.forEach(price => {
  console.log(`Price: ${price} -> Is Micro-cap: ${isMicroCapToken(price)}`);
});

console.log('\n3. PEPE Price Formatting:');
testPrices.slice(0, 6).forEach(price => {
  const formatted = formatPrice(price, 'PEPE', true);
  console.log(`Price: ${price} -> Formatted: ${formatted}`);
});

console.log('\n4. Smart Price Formatting:');
testPrices.forEach(price => {
  const formatted = formatSmartPrice(price, { includeSymbol: true });
  console.log(`Price: ${price} -> Smart Format: ${formatted}`);
});

console.log('\n5. Percentage Change Formatting:');
const percentageTests = [
  { change: 3.413, basePrice: 0.00001 },
  { change: 0.01, basePrice: 0.00001 },
  { change: -5.25, basePrice: 0.00001 },
  { change: 100.5, basePrice: 0.00001 },
  { change: 2.5, basePrice: 108761.99 }
];

percentageTests.forEach(test => {
  const result = formatPercentageChange(test.change, test.basePrice, true);
  console.log(`Change: ${test.change}%, Base: ${test.basePrice} -> ${result.value} (Significant: ${result.isSignificant})`);
});
