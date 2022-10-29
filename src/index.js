const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain, dialog } = require('electron')
const { getTamanhotela, setTamanhotela, setPos } = require("./settings");
const { savePos } = require('./preload');


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require


if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const { fullscreen, tamanho } = getTamanhotela()

  const mainWindow = new BrowserWindow({
    width: tamanho[0],
    height: tamanho[1],
    icon: path.join(__dirname, "./icons/icone-100x100.ico"),
    show: false,
    backgroundColor: '#1c0d49',
    titleBarOverlay: true,
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js'),
      nodeIntegrationInWorker: true,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (fullscreen) {
    mainWindow.maximize()
  }
  mainWindow.on("resized", () => setTamanhotela(false, mainWindow.getSize()))
  mainWindow.on("maximize", () => setTamanhotela(true, mainWindow.getSize()))
  mainWindow.setMenuBarVisibility(false)
  //mainWindow.webContents.openDevTools();

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
  return dialog.showOpenDialogSync({ properties: ['openDirectory'] })
});

ipcMain.handle("salvar_pos", (e, pos) => {      // salva posiçao musica quando fecha
  setPos(pos)
});


