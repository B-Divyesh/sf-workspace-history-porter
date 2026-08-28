import { browser } from 'wxt/browser';

const SLUG = 'workspace-history-porter';
const BILLING_BASE = 'https://api.sociobot.in';
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `sb_license_verdict:${SLUG}`;
const DAY = 86_400_000;

export interface LicenseVerdict {
  valid: boolean;
  reason?: string;
  expires_at?: string | null;
  checkedAt: number;
}

export async function cachedLicenseVerdict(): Promise<LicenseVerdict | null> {
  const result = await browser.storage.local.get(VERDICT_KEY);
  const value = result[VERDICT_KEY];
  return value && typeof value === 'object' ? value as LicenseVerdict : null;
}

export async function saveLicense(token: string): Promise<void> {
  await browser.storage.local.set({ [LICENSE_KEY]: token });
}

export async function verifySavedLicense(force = false): Promise<LicenseVerdict | null> {
  const stored = await browser.storage.local.get([LICENSE_KEY, VERDICT_KEY]);
  const token = typeof stored[LICENSE_KEY] === 'string' ? stored[LICENSE_KEY] : '';
  const cached = stored[VERDICT_KEY] as LicenseVerdict | undefined;
  if (!token) return null;
  if (!force && cached && Date.now() - cached.checkedAt < DAY) return cached;
  try {
    const response = await fetch(`${BILLING_BASE}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('License service unavailable.');
    const result = await response.json() as Omit<LicenseVerdict, 'checkedAt'>;
    const verdict = { ...result, checkedAt: Date.now() };
    await browser.storage.local.set({ [VERDICT_KEY]: verdict });
    return verdict;
  } catch {
    return cached || null;
  }
}
