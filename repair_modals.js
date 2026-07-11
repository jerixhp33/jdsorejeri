const fs = require('fs');

const files = [
  'src/components/admin/AdminBannersView.tsx',
  'src/components/admin/AdminCategoriesView.tsx',
  'src/components/admin/AdminCollectionsView.tsx',
  'src/components/admin/AdminCouponsView.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Add data-lenis-prevent to the wrapper
  content = content.replace(
    /<div className="fixed inset-0 z-50 overflow-y-auto">/,
    '<div data-lenis-prevent="true" className="fixed inset-0 z-50 overflow-y-auto">'
  );
  
  // 2. Fix the corrupted onClick
  content = content.replace(
    /onClick=\{\(\) =><\/div> setShowModal\(false\)\} \/>/,
    'onClick={() => setShowModal(false)} />'
  );
  
  // 3. Fix the missing closing tag by adding a </div> before )}
  content = content.replace(
    /          <\/div>\n        <\/div>\n      \)\}/,
    '          </div>\n        </div>\n      </div>\n      )}'
  );

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
