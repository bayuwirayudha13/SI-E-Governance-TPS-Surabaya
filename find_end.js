const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/WargaPanel.jsx', 'utf8');

// Find the end marker
const endMarker = '{activeMenu === "panduan"';
const endIdx = content.indexOf(endMarker, 122434);

console.log('End marker at:', endIdx);

// Find the closing )} before panduan
const closingMarker = ')}';
let closingIdx = content.lastIndexOf(closingMarker, endIdx);
console.log('Closing at:', closingIdx);

if (closingIdx !== -1) {
  console.log('Context around closing:');
  console.log(content.slice(closingIdx - 100, closingIdx + 10));
}