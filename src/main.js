import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import qrcode from 'qrcode'
import os from 'os'
import express from 'express'
import Store from 'electron-store'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import login from '../routes/login'
import home from '../routes/home'
import upload from '../routes/upload'
import files from '../routes/files'
import session from 'express-session'
import dotenv from 'dotenv'
import cors from 'cors'



let mainWindow;
const store = new Store();
let ROOT_DIR = "";
let token = crypto.randomBytes(16).toString("hex")
dotenv.config()

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 550,
    height: 600,

    minWidth: 400,
    minHeight: 500,

    maxWidth: 600,
    maxHeigth: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.webContents.on("did-finish-load", () => {
    ROOT_DIR = store.get("path");
    const passwrd = store.get("password")

    if (ROOT_DIR == null || passwrd == null) {
      mainWindow.webContents.send("load", ROOT_DIR, false);
      return;
    }
    mainWindow.webContents.send("load", ROOT_DIR, true);

  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  // Menu.setApplicationMenu(null)
  const template = [
    {
      label: "File",
      submenu: [
        { role: "quit" }
      ]
    },
    {
      label: "Edit",
      subMenu: [
        { role: "copy" },
        { role: "paste" },
        { role: "undo" },
        { role: "redo" },
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on("send-Data", async (event, data) => {
  try {
    store.set("path", data.path);
    ROOT_DIR = data.path
    if (data.password) {
      const hash = await bcrypt.hash(data.password, 10)
      store.set("password", hash)
    }
  } catch (error) {
    mainWindow.webContents.send("connection-error", "saving have issue");
  }

})

async function getLocalIPQr() {
  try {
    const interfaces = os.networkInterfaces();
    const preferred = ["Wi-Fi", "Ethernet"];
    let foundIP = null
    for (const name of preferred) {
      const nets = interfaces[name];
      if (!nets) continue;

      const net = nets.find(n => n.family === "IPv4" && !n.internal)
      if (net) {
        foundIP = net.address;
        break; // stop after first
      }
    }

    if (!foundIP) {
      mainWindow.webContents.send("connection-error", "No Wifi or Ethernet connection");
      return false;
    }
    if (!store.get("password") && !store.get("path")) {
      mainWindow.webContents.send("connection-error", "Fill up path and password");
      return false
    }

    const qrImg = await qrcode.toDataURL(`http://${foundIP}:5147/${token}/login`);
    mainWindow.webContents.send("qrImage", qrImg);
    return true

  } catch (err) {
    console.error("Error generating QR code:", err);
    mainWindow.webContents.send("connection-error", "Something went wrong");
  }
}

const isDev = !app.isPackaged;
const basePath = isDev ? "public" : path.join(process.resourcesPath, "public")


const appServer = express();
appServer.use(express.static(basePath));
appServer.use(express.json())
appServer.use(express.urlencoded({ extended: true }))
appServer.use(cors());
// appServer.locals.token = token;
appServer.use(session({
  secret: process.env.SECRET_KEY || "hello",
  resave: false,
  saveUninitailized: true,

}))


appServer.use(`/${token}/login`, login)
appServer.use(`/${token}/home`, home)
appServer.use(`/${token}/files`, files)
appServer.use(`/${token}/upload`, upload)

let serverRunning = false
let server = null
let connections = new Set()
ipcMain.handle("toggle-server", async () => {
  serverRunning = !serverRunning

  if (serverRunning) {
    const status = getLocalIPQr()
    if (!status) {
      serverRunning = !serverRunning
      return serverRunning
    }
    server = appServer.listen(process.env.PORT_SERVER || 5147, "0.0.0.0", () => {
      console.log("Server running:5147 ");
    });
    server.on("connection", (conn) => {
      connections.add(conn)
      conn.on("close", () => { connections.delete(conn) })
    })
  } else {
    connections.forEach((conn) => conn.destroy())
    connections.clear();
    server.close(() => {
      console.log("server stopped");
    })
  }
  return serverRunning
})

export function sendToRenderer(channel, data) {
  mainWindow.webContents.send(channel, data)
}
