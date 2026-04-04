// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
    onQrImg: (callback) => {
        ipcRenderer.on("qrImage", (event, data) => callback(data))
    },
    onConnectionError: (callback) => {
        ipcRenderer.on("connection-error", (event, data) => callback(data))
    },
    onload: (callback) => {
        ipcRenderer.on("load", (event, data) => callback(data))
    },
    sendData: (data) => {
        ipcRenderer.send("send-Data", data)
    },
    toggleServer: () => ipcRenderer.invoke("toggle-server")
})