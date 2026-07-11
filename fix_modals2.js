const fs = require('fs');
const path = require('path');

const dir = 'src/components/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add data-lenis-prevent to any fixed inset-0 div that doesn't have it
  const newContent = content.replace(/<div\s+className="fixed inset-0([^"]*)"/g, '<div data-lenis-prevent="true" className="fixed inset-0$1"');
  if (newContent !== content) {
    content = newContent;
    changed = true;
  }
  
  const newContent2 = content.replace(/className="fixed inset-0([^"]*z-50[^"]*)"/g, 'className="fixed inset-0$1 overflow-y-auto"');
  if (newContent2 !== content) {
    content = newContent2;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
}
