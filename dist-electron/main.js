import { ipcMain, app, shell, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import https from "node:https";
import http from "node:http";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
ipcMain.handle(
  "download-update",
  async (event, url, fileName) => {
    const tempDir = path.join(app.getPath("temp"), "convdesing-updates");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const filePath = path.join(tempDir, fileName);
    return new Promise((resolve, reject) => {
      const follow = (downloadUrl) => {
        const protocol = downloadUrl.startsWith("https") ? https : http;
        protocol.get(downloadUrl, { headers: { "User-Agent": "ConvDesing-Updater" } }, (response) => {
          if ((response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) && response.headers.location) {
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
          response.on("data", (chunk) => {
            downloadedBytes += chunk.length;
            if (totalBytes > 0) {
              const progress = Math.round(
                downloadedBytes / totalBytes * 100
              );
              event.sender.send("download-progress", progress);
            }
          });
          response.pipe(fileStream);
          fileStream.on("finish", () => {
            fileStream.close();
            resolve(filePath);
          });
          fileStream.on("error", (err) => {
            fs.unlink(filePath, () => {
            });
            reject(err);
          });
        }).on("error", (err) => {
          reject(err);
        });
      };
      follow(url);
    });
  }
);
ipcMain.handle("install-update", async (_event, filePath) => {
  try {
    if (process.platform === "win32") {
      await shell.openPath(filePath);
      setTimeout(() => app.quit(), 1e3);
      return { success: true };
    }
    if (process.platform === "darwin") {
      await shell.openPath(filePath);
      setTimeout(() => app.quit(), 1e3);
      return { success: true };
    }
    await shell.openPath(filePath);
    setTimeout(() => app.quit(), 1e3);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});
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
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
