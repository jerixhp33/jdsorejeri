const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/admin');
const files = fs.readdirSync(dir).filter(f => f.startsWith('Admin') && f.endsWith('View.tsx') && f !== 'AdminProductsView.tsx');

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // We are looking for:
  // <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
  //   <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
  
  // Or similar variations
  const searchPattern = /<div className="fixed inset-0 z-50 flex items-center justify-center[^>]*>\s*<div className="absolute inset-0 bg-black\/70 backdrop-blur-sm"([^>]*)(\/?>|><\/div>)/g;
  
  if (content.match(searchPattern)) {
    content = content.replace(searchPattern, (match, onClick) => {
      return `<div className="fixed inset-0 z-50 overflow-y-auto">\n          <div className="flex min-h-full items-center justify-center p-4">\n            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm"${onClick}></div>`;
    });
    
    // Find the end of the modal block which is usually `)}`
    // We want to add an extra </div> right before it.
    // The safest way is to match `          </div>\n        )}`
    content = content.replace(/<\/div>\n\s*\}\)/g, '</div>\n          </div>\n        )}');

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
