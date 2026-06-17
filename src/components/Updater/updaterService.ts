// ── Configuration ──────────────────────────────────────────────
const GITHUB_OWNER = "HectorCortesA";
const GITHUB_REPO = "ConvDesing";
export const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const CURRENT_VERSION = "0.1.1"; // Must match package.json version

// ── Types ──────────────────────────────────────────────────────
export interface ReleaseInfo {
  version: string;
  name: string;
  body: string;
  htmlUrl: string;
  publishedAt: string;
  assets: ReleaseAsset[];
}

export interface ReleaseAsset {
  name: string;
  downloadUrl: string;
  size: number;
  contentType: string;
}

// ── Version comparison utility ─────────────────────────────────
function compareVersions(current: string, latest: string): number {
  const normalize = (v: string) =>
    v.replace(/^v/, "").split(".").map(Number);
  const c = normalize(current);
  const l = normalize(latest);
  const len = Math.max(c.length, l.length);

  for (let i = 0; i < len; i++) {
    const cv = c[i] || 0;
    const lv = l[i] || 0;
    if (lv > cv) return 1;
    if (lv < cv) return -1;
  }
  return 0;
}

// ── Fetch latest release from GitHub ───────────────────────────
export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      // If no releases exist yet, return null gracefully
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      version: (data.tag_name || data.name || "").replace(/^v/, ""),
      name: data.name || data.tag_name || "",
      body: data.body || "",
      htmlUrl: data.html_url || "",
      publishedAt: data.published_at || "",
      assets: (data.assets || []).map(
        (asset: {
          name: string;
          browser_download_url: string;
          size: number;
          content_type: string;
        }) => ({
          name: asset.name,
          downloadUrl: asset.browser_download_url,
          size: asset.size,
          contentType: asset.content_type,
        })
      ),
    };
  } catch (error) {
    console.error("[Updater] Error checking for updates:", error);
    return null;
  }
}

// ── Check if update is available ───────────────────────────────
export async function checkForUpdate(): Promise<ReleaseInfo | null> {
  const release = await fetchLatestRelease();
  if (!release) return null;

  if (compareVersions(CURRENT_VERSION, release.version) > 0) {
    return release;
  }

  return null;
}

// ── Get current version ────────────────────────────────────────
export function getCurrentVersion(): string {
  return CURRENT_VERSION;
}
