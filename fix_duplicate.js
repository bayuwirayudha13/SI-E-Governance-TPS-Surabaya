const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/WargaPanel.jsx', 'utf8');

// Find the start of old duplicate code
const startMarker = ') : isSetoranCompleted(currentSetoran) ? (';
const startIdx = content.indexOf(startMarker, 300000); // Search after the new code

// Find the end - right before '{activeMenu === "panduan"'
const endMarker = '{activeMenu === "panduan"';
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  // We need to include the closing )} for the tab
  // Find the closing )} before panduan
  const closingMarker = ')}';
  let closingIdx = content.lastIndexOf(closingMarker, endIdx);
  
  console.log('Start:', startIdx);
  console.log('End:', endIdx);
  console.log('Closing:', closingIdx);
  
  // Remove from startIdx to closingIdx + 2
  const newContent = content.slice(0, startIdx) + ')}' + content.slice(endIdx);
  fs.writeFileSync('frontend/src/components/WargaPanel.jsx', newContent);
  console.log('Done - removed duplicate');
} else {
  console.log('Markers not found');
}