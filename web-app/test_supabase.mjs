import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ghmzsxaesegxmtxzdrlx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXpzeGFlc2VneG10eHpkcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Njk3NTYsImV4cCI6MjEwNTQ0NTc1Nn0.dACpDx6XXeIwItIhaXgDJEH-ow0bp7Dqi0ACQnt-lJg');

async function test() {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      full_name: 'Test Name',
      whatsapp_number: '1234567890',
      password_hash: '123',
      location: 'Test',
      is_vegan: true,
      is_gluten_free: false,
      is_sugar_free: false,
      is_salt_free: false,
      is_oil_free: false,
    }]);
  
  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success!", data);
  }
}
test();
