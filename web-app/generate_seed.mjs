import fs from 'fs';
import path from 'path';

const menuData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/menu.json'), 'utf8'));

const values = menuData.map(i => {
  const priceNumeric = parseFloat(i.price.replace(',', '.'));
  return `('${i.name.replace(/'/g, "''")}', '${i.description.replace(/'/g, "''")}', ${priceNumeric}, '${i.image.replace(/'/g, "''")}', true, 1, 1)`;
}).join(',\n  ');

const sql = `INSERT INTO treats (name, description, price, image_url, is_available, min_batch_size, batch_multiplier) VALUES\n  ${values};`;

fs.writeFileSync('seed_treats.sql', sql);
console.log('Done!');
