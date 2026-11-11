const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/WargaPanel.jsx', 'utf8');

// Find all occurrences
const startMarker = ') : isSetoranCompleted(currentSetoran) ? (';
let pos = 0;
while ((pos = content.indexOf(startMarker, pos)) !== -1) {
  console.log('Found at:', pos);
  // Print context
  console.log(content.slice(pos - 100, pos + 200));
  console.log('---');
  pos += startMarker.length;
}