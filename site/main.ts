import './style.css';

const SLUG = 'workspace-history-porter';
const BILLING_BASE = import.meta.env.VITE_BILLING_BASE || 'https://api.sociobot.in';
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `sb_license_verdict:${SLUG}`;
const DAY = 86_400_000;
const status = document.querySelector<HTMLElement>('#license-status')!;
const tokenInput = document.querySelector<HTMLInputElement>('#license-token')!;

interface Verdict { valid: boolean; reason?: string; checkedAt: number; expires_at?: string | null }

document.querySelector<HTMLAnchorElement>('#buy-link')!.href = `${BILLING_BASE}/api/v1/products/${SLUG}/checkout`;

function setStatus(message: string, valid = false) {
  status.textContent = message;
  status.classList.toggle('valid', valid);
}

function cachedVerdict(): Verdict | null {
  try { return JSON.parse(localStorage.getItem(VERDICT_KEY) || 'null') as Verdict | null; } catch { return null; }
}

async function verify(token: string, force = false) {
  const cached = cachedVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < DAY) {
    setStatus(cached.valid ? '✓ Team Relay license active on this browser.' : 'License no longer active. You can restore another token.', cached.valid);
    return;
  }
  try {
    const response = await fetch(`${BILLING_BASE}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable.');
    const result = await response.json() as Omit<Verdict, 'checkedAt'>;
    const verdict = { ...result, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    setStatus(result.valid ? '✓ Team Relay license active on this browser.' : 'License no longer active. Check the token or buy a new license.', result.valid);
  } catch {
    if (cached?.valid) setStatus('✓ Team Relay remains available offline from the last successful check.', true);
    else setStatus('Could not verify while offline. The free extension is still available.');
  }
}

const params = new URLSearchParams(location.search);
const returnedLicense = params.get('license');
if (returnedLicense) {
  localStorage.setItem(LICENSE_KEY, returnedLicense);
  params.delete('license');
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  void verify(returnedLicense, true);
} else {
  const saved = localStorage.getItem(LICENSE_KEY);
  const cached = cachedVerdict();
  if (saved && cached?.valid) setStatus('✓ Team Relay license active on this browser.', true);
  if (saved) void verify(saved);
}

document.querySelector<HTMLFormElement>('#license-form')!.addEventListener('submit', (event) => {
  event.preventDefault();
  const token = tokenInput.value.trim();
  if (!token) return setStatus('Paste the license token from your receipt.');
  localStorage.setItem(LICENSE_KEY, token);
  void verify(token, true);
});
