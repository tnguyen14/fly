import { $ } from "../lib/common.js";
import { initAuth } from "../lib/auth.js";

// Shown only to signed-in users. This hides the section in the browser; any
// data it shows later must come from an API that checks the sign-in token,
// since this page's code is public.
const $status = $("status");

async function start() {
  let auth;
  try {
    auth = await initAuth();
  } catch (e) {
    console.error("Sign-in check failed", e);
    $status.textContent =
      "Couldn't check sign-in. Reload the page to try again.";
    return;
  }
  $status.hidden = true;
  $("signIn").onclick = () => auth.login();
  $("signOut").onclick = () => auth.logout();
  if (!auth.user) {
    $("signedOut").hidden = false;
    return;
  }
  $("who").textContent = auth.user.name || auth.user.email || "you";
  $("signedIn").hidden = false;
  // Nothing to show yet.
}

start();
