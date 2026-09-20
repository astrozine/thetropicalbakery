import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ghmzsxaesegxmtxzdrlx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXpzeGFlc2VneG10eHpkcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Njk3NTYsImV4cCI6MjEwNTQ0NTc1Nn0.dACpDx6XXeIwItIhaXgDJEH-ow0bp7Dqi0ACQnt-lJg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log("Reading menu.json...");
  const menuData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/menu.json'), 'utf8'));

  for (const item of menuData) {
    const priceNumeric = parseFloat(item.price.replace(',', '.'));
    
    // We will set default batch size and multiplier to 1 for now.
    // They can be edited in the admin dashboard.
    const treat = {
      name: item.name,
      description: item.description,
      price: priceNumeric,
      image_url: item.image,
      is_available: true,
      min_batch_size: 1,
      batch_multiplier: 1
    };

    console.log(`Inserting: ${treat.name}...`);
    
    const { error } = await supabase
      .from('treats')
      .insert([treat]);

    if (error) {
      console.error(`Failed to insert ${treat.name}:`, error.message);
    }
  }

  console.log("Migration complete!");
}

migrateData();
