import { supabase, isConfigured } from "./config.js";
const form = document.querySelector("#login-form");
const status = document.querySelector("#login-status");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isConfigured) { status.textContent = "Configure Supabase in js/config.js first."; return; }
  const data = new FormData(form);
  const { error } = await supabase.auth.signInWithPassword({
    email: String(data.get("email")), password: String(data.get("password"))
  });
  if (error) { status.textContent = "Sign-in failed. Check your credentials."; return; }
  window.location.href = "dashboard.html";
});
