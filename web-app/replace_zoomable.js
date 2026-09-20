const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = [
  'src/app/b2b/restaurants/page.tsx',
  'src/app/b2b/pousadas/page.tsx',
  'src/app/b2b/hotels/page.tsx',
  'src/app/b2b/bakeries/page.tsx',
  'src/app/b2b/airbnbs/page.tsx',
  'src/app/b2b/affiliates/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('ZoomableImage')) {
    content = content.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport ZoomableImage from '@/components/ZoomableImage';");
    if (file.includes('affiliates')) {
       content = content.replace("import Image from 'next/image';", "import Image from 'next/image';\nimport ZoomableImage from '@/components/ZoomableImage';");
    }
    content = content.replace(/<img\b/g, '<ZoomableImage');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
