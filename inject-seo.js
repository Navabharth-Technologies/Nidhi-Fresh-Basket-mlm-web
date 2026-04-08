const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'index.html');
const sourcePath = path.join(__dirname, 'web', 'index.html');

if (!fs.existsSync(distPath)) {
    console.error('dist/index.html not found! Run export first.');
    process.exit(1);
}

let distHtml = fs.readFileSync(distPath, 'utf8');
const sourceHtml = fs.readFileSync(sourcePath, 'utf8');

// Extract head content from source
const headContentMatch = sourceHtml.match(/<head>([\s\S]*?)<\/head>/);
if (!headContentMatch) {
    console.error('Could not find <head> in web/index.html');
    process.exit(1);
}

const headContent = headContentMatch[1];

// Also find the script tag in distHtml to preserve it
const scriptTagMatch = distHtml.match(/<script src="\/_expo\/static\/js\/web\/index-.*?\.js" defer><\/script>/);
const scriptTag = scriptTagMatch ? scriptTagMatch[0] : '';
console.log('Preserving script tag:', scriptTag);

// Reconstruct the index.html
const newHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    ${headContent}
  </head>
  <body>
    <noscript>
      You need to enable JavaScript to run this app.
    </noscript>
    <div id="root"></div>
    ${scriptTag}
  </body>
</html>`;

fs.writeFileSync(distPath, newHtml);
console.log('Successfully injected SEO tags and styles into dist/index.html');
