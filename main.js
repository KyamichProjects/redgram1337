const { app, BrowserWindow, Menu } = require('electron');
app.on('ready', () => {
  Menu.setApplicationMenu(null); // Это уберет меню "File, Edit, и т.д."
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: __dirname + '/icon.ico',
    webPreferences: { nodeIntegration: false }
  });
  win.loadURL('https://redgram1337.onrender.com');
});