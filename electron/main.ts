import { app, BrowserWindow, ipcMain, shell } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import https from "node:https";
import http from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// ── IPC: Download update file to disk ─────────────────────────────
ipcMain.handle(
  "download-update",
  async (event, url: string, fileName: string) => {
    const tempDir = path.join(app.getPath("temp"), "convdesing-updates");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, fileName);

    return new Promise<string>((resolve, reject) => {
      const follow = (downloadUrl: string) => {
        const protocol = downloadUrl.startsWith("https") ? https : http;

        protocol
          .get(downloadUrl, { headers: { "User-Agent": "ConvDesing-Updater" } }, (response) => {
            // Handle redirects (GitHub uses 302 for asset downloads)
            if (
              (response.statusCode === 301 ||
                response.statusCode === 302 ||
                response.statusCode === 307) &&
              response.headers.location
            ) {
              follow(response.headers.location);
              return;
            }

            if (response.statusCode !== 200) {
              reject(new Error(`Download failed with status ${response.statusCode}`));
              return;
            }

            const totalBytes = parseInt(
              response.headers["content-length"] || "0",
              10
            );
            let downloadedBytes = 0;

            const fileStream = fs.createWriteStream(filePath);

            response.on("data", (chunk: Buffer) => {
              downloadedBytes += chunk.length;
              if (totalBytes > 0) {
                const progress = Math.round(
                  (downloadedBytes / totalBytes) * 100
                );
                // Send progress to renderer
                event.sender.send("download-progress", progress);
              }
            });

            response.pipe(fileStream);

            fileStream.on("finish", () => {
              fileStream.close();
              resolve(filePath);
            });

            fileStream.on("error", (err) => {
              fs.unlink(filePath, () => {}); // Clean up partial file
              reject(err);
            });
          })
          .on("error", (err) => {
            reject(err);
          });
      };

      follow(url);
    });
  }
);

// ── IPC: Install update (execute the downloaded file) ─────────────
ipcMain.handle("install-update", async (_event, filePath: string) => {
  try {
    // On Windows, execute the .exe installer
    if (process.platform === "win32") {
      await shell.openPath(filePath);
      // Quit the app so the installer can replace files
      setTimeout(() => app.quit(), 1000);
      return { success: true };
    }

    // On macOS, open the .dmg/.pkg
    if (process.platform === "darwin") {
      await shell.openPath(filePath);
      setTimeout(() => app.quit(), 1000);
      return { success: true };
    }

    // On Linux, open the file with the default handler
    await shell.openPath(filePath);
    setTimeout(() => app.quit(), 1000);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

// ── IPC: Get app version ──────────────────────────────────────────
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
