const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/WargaPanel.jsx', 'utf8');

const startIdx = 122434;
const endIdx = 140499 + 2; // include the )}

// Remove the duplicate
const newContent = content.slice(0, startIdx) + content.slice(endIdx);
fs.writeFileSync('frontend/src/components/WargaPanel.jsx', newContent);
console.log('Removed duplicate. New length:', newContent.length);