const { execSync } = require('child_process');
const fs = require('fs');
try {
  const result = execSync('node seed.js', { encoding: 'utf-8' });
  fs.writeFileSync('full_error.txt', result);
} catch (e) {
  fs.writeFileSync('full_error.txt', e.stdout + '\n\n' + e.stderr);
}
