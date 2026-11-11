import { $, esc } from "../lib/common.js";
import { initAuth } from "../lib/auth.js";

// Shown only to signed-in users. This hides the section in the browser; any
// data it shows later must come from an API that checks the sign-in token,
// since this page's code is public.
const $status = $("status");

// Read the token's payload (the middle part of the JWT) to show what it is
// for and when it expires. This doesn't verify it; the API does that.
function decode(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(part), (c) => c.charCodeAt(0)),
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

const formatTime = (seconds) =>
  new Date(seconds * 1000).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

function showToken(token) {
  const $text = $("tokenText");
  $text.value = token;
  $("copyToken").disabled = false;
  const payload = decode(token);
  if (!payload) {
    $("tokenInfo").textContent =
      "This token isn't a JWT, so the sheets API won't accept it.";
    return;
  }
  const aud = [].concat(payload.aud ?? []);
  $("tokenInfo").innerHTML =
    `For <code>${esc(aud[0] ?? "unknown")}</code> · ` +
    `expires <b>${esc(formatTime(payload.exp))}</b>`;
}

async function loadToken(auth, fresh = false) {
  const $info = $("tokenInfo");
  $info.textContent = "Getting token…";
  $("copyToken").disabled = true;
  try {
    showToken(await auth.getToken({ fresh }));
  } catch (e) {
    console.error("Couldn't get a token", e);
    $("tokenText").value = "";
    $info.textContent =
      /login_required|consent_required|missing_refresh_token|invalid_grant/.test(
        `${e.error} ${e.message}`,
      )
        ? "Your sign-in expired. Sign out and sign in again to get a token."
        : `Couldn't get a token: ${e.message || e}`;
  }
}

async function copyToken() {
  const $text = $("tokenText");
  const $btn = $("copyToken");
  try {
    await navigator.clipboard.writeText($text.value);
    $btn.textContent = "Copied";
  } catch (e) {
    $text.select();
    $btn.textContent = "Press ⌘C / Ctrl+C";
  }
  setTimeout(() => ($btn.textContent = "Copy"), 2000);
}

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
  $("copyToken").onclick = copyToken;
  $("newToken").onclick = () => loadToken(auth, true);
  loadToken(auth);
}

start();
