/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
const qrdiv = document.getElementById("Qr")
const alreadypsetted = true

window.api.onConnectionError((data) => {
  const qrErr = document.createElement("span")
  const errdiv = document.getElementById("errordiv")
  qrErr.innerText = data
  errordiv.append(qrErr)
  errdiv.style.display = "block"
  setTimeout(() => {
    errdiv.style.display = "none"
  }, 4000);
})

window.api.onQrImg((dataUrl) => {
  const qrdiv = document.getElementById("Qr")
  const qrimg = document.createElement("img")
  qrimg.src = dataUrl
  qrdiv.innerHTML = ""
  qrdiv.append(qrimg)
})



window.api.onload((path, psswd) => {
  if (path) {
    document.getElementById("filePath").value = path;
  }
  if (psswd) {
    alreadypsetted = true
  }
})
//ui section
let isEditting = true
document.getElementById("setup").addEventListener("click", () => {
  const inputPath = document.getElementById("filePath")
  const btn = document.getElementById("setup")
  const inputpswd = document.getElementById("passwrd")
  if (!isEditting) {
    inputPath.disabled = false
    isEditting = true
    inputpswd.disabled = false
    btn.textContent = "Save"
  } else {
    const value = inputPath.value.trim();
    const passwrd = inputpswd.value.trim();
    inputPath.disabled = false
    if (!value || (!passwrd && !alreadypsetted)) {
      const parent = !value ? inputPath.parentElement : inputpswd.parentElement
      parent.style.border = "1px solid red"
      setTimeout(() => {
        parent.style.border = "1px solid #686868"
      }, 4000);
      return;
    }
    isEditting = false
    inputPath.disabled = true
    inputpswd.disabled = true
    btn.textContent = "Edit"
    if (passwrd) {
      window.api.sendData({ path: value, password: passwrd })
      return;
    }
    window.api.sendData({ path: value, password: null })

  }
})

document.getElementById("server").addEventListener("click", async () => {
  try {
    const state = await window.api.toggleServer();
    const btn = document.getElementById("server");
    btn.textContent = state ? "Stop Server" : "Start Server"
  } catch (error) {
    console.log(error);
  }
})


window.api.onUserConnected((user) => {
  const head = document.getElementById("head")
  if (head.style.display == "none") {
    head.style.display = "block"
  }
  const ul = document.getElementById("userU")
  const li = document.createElement("li")
  li.textContent = user
  ul.append(li)
})