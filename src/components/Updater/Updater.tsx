import { useEffect, useRef, useCallback } from "react";
import { gooeyToast } from "goey-toast";
import {
  checkForUpdate,
  CHECK_INTERVAL_MS,
  type ReleaseInfo,
} from "./updaterService";

// ── Show update notification ───────────────────────────────────
function showUpdateNotification(release: ReleaseInfo) {
  gooeyToast.info("Nueva actualización", {
    description: `Nueva versión ${release.version} disponible`,
    action: {
      label: "Actualizar",
      onClick: () => {
        // Open the release page in the default browser
        if (release.htmlUrl) {
          window.open(release.htmlUrl, "_blank");
        }
      },
    },
    preset: "smooth",
    duration: 15000,
  });
}

// ── Updater Component ──────────────────────────────────────────
export default function Updater() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNotifiedRef = useRef<string | null>(null);

  const performCheck = useCallback(async () => {
    const release = await checkForUpdate();
    if (release && hasNotifiedRef.current !== release.version) {
      hasNotifiedRef.current = release.version;
      showUpdateNotification(release);
    }
  }, []);

  useEffect(() => {
    // Initial check after a short delay to let the app settle
    const initialTimeout = setTimeout(() => {
      performCheck();
    }, 5000);

    // Set up periodic checks every 30 minutes
    intervalRef.current = setInterval(performCheck, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [performCheck]);

  // This component doesn't render anything visible
  return null;
}
