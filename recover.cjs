const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/p0psi/.cursor/projects/c-Users-p0psi-Desktop-Playto-GAR/agent-transcripts';
const dirs = fs.readdirSync(dir);
let found = false;

for (const d of dirs) {
  const p = path.join(dir, d, d + '.jsonl');
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    for (const line of lines) {
        if (!line.includes('const SHAPES')) continue;
        const m = line.match(/const SHAPES = [\s\S]*?const LEVELS = \[[^]*?\];/);
        if (m) {
            fs.writeFileSync('extracted.js', m[0].replace(/\\n/g, '\n').replace(/\\\"/g, '"'));
            console.log('Extracted to extracted.js');
            found = true;
            break;
        }
    }
  }
  if (found) break;
}

if (!found) console.log('Not found');
