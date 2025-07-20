/**
 * Test file to verify unique ID generation
 */

import { generateUniqueId, generateUniqueStringId } from '../lib/utils';

console.log('Testing unique ID generation...');

// Test numeric IDs
const numericIds = [];
for (let i = 0; i < 100; i++) {
  numericIds.push(generateUniqueId());
}

console.log('First 10 numeric IDs:', numericIds.slice(0, 10));
console.log('Last 10 numeric IDs:', numericIds.slice(-10));
console.log('Unique numeric IDs:', new Set(numericIds).size === numericIds.length);

// Test string IDs
const stringIds = [];
for (let i = 0; i < 100; i++) {
  stringIds.push(generateUniqueStringId());
}

console.log('First 10 string IDs:', stringIds.slice(0, 10));
console.log('Last 10 string IDs:', stringIds.slice(-10));
console.log('Unique string IDs:', new Set(stringIds).size === stringIds.length);
