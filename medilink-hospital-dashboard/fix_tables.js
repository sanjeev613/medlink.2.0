const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(/<table className="patient-table">([\s\S]*?)<\/table>/g, (match, inner) => {
  if (inner.includes('<tbody>')) return match; // already fixed
  const parts = inner.split('\n');
  const trIndex = parts.findIndex(line => line.includes('<tr><th>'));
  if (trIndex === -1) return match;
  const thead = parts[trIndex];
  parts.splice(trIndex, 1);
  return `<table className="patient-table">\n  <thead>\n${thead}\n  </thead>\n  <tbody>\n${parts.join('\n')}\n  </tbody>\n</table>`;
});

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed tables.');
