const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain, dialog } = require('electron')


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require


if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  mainWindow.webContents.openDevTools();
};

// electron termina de inicializar => cria window
app.on('ready', createWindow);

// quita quando fecha tudo
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// quando invoke (render) é chamado o handle com o nome é executado na main
ipcMain.handle("browse_pasta", () => {  
  return dialog.showOpenDialogSync({ properties: ['openDirectory'] });
});
