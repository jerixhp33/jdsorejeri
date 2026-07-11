const fs = require('fs');

const files = [
  'src/components/admin/AdminBannersView.tsx',
  'src/components/admin/AdminCategoriesView.tsx',
  'src/components/admin/AdminCollectionsView.tsx',
  'src/components/admin/AdminCouponsView.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('useScrollLock(') && !content.includes('import { useScrollLock }')) {
    content = content.replace(/import \{ useState[^}]*\} from 'react';/, 
      "import { useState, useEffect } from 'react';\nimport { useScrollLock } from '@/hooks/useScrollLock';"
    );
    // If the above didn't match perfectly, just inject it at the top
    if (!content.includes('import { useScrollLock }')) {
      content = "import { useScrollLock } from '@/hooks/useScrollLock';\n" + content;
    }
    fs.writeFileSync(file, content);
    console.log('Fixed imports in', file);
  }
}
