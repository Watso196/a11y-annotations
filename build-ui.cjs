// build-ui.js
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

const html = fs.readFileSync('src/ui.html', 'utf8');
const css = fs.readFileSync('src/ui.css', 'utf8');
const js = fs.readFileSync('src/ui.js', 'utf8');

const final = html
  .replace('<!-- INJECT_CSS -->', `<style>${css}</style>`)
  .replace('<!-- INJECT_JS -->', `<script>${js}</script>`);

fs.writeFileSync('dist/ui.html', final);
console.log('✓ Built ui.html');