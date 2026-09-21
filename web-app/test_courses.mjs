import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ghmzsxaesegxmtxzdrlx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXpzeGFlc2VneG10eHpkcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Njk3NTYsImV4cCI6MjEwNTQ0NTc1Nn0.dACpDx6XXeIwItIhaXgDJEH-ow0bp7Dqi0ACQnt-lJg');

async function test() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    console.error("Select Error:", error);
  } else {
    console.log("Select Success! Found courses:", data.length);
    console.log(data);
  }
}
test();
