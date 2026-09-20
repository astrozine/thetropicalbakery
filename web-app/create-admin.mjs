import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ghmzsxaesegxmtxzdrlx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXpzeGFlc2VneG10eHpkcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Njk3NTYsImV4cCI6MjEwNTQ0NTc1Nn0.dACpDx6XXeIwItIhaXgDJEH-ow0bp7Dqi0ACQnt-lJg';
const supabase = createClient(supabaseUrl, supabaseKey);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Please provide an email and password!");
  console.log("Usage: node create-admin.mjs <email> <password>");
  process.exit(1);
}

async function createAdmin() {
  console.log(`Creating user: ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("❌ Error creating user:");
    console.error(error.message);
  } else {
    console.log("✅ User created successfully!");
    console.log("If email confirmations are enabled in your Supabase project, she may need to click the link sent to her email before logging in.");
  }
}

createAdmin();
