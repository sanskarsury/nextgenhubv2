// Replace these placeholders with your Supabase project values.
// Use ONLY the publishable (or legacy anon) key in browser code.
// Never put a secret/service_role key in this file.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

export const isConfigured =
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE");

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
