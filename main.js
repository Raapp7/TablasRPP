
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;

// Configuración del actualizador
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Enviar información del actualizador a la interfaz
function enviarActualizacion(canal, datos = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(canal, datos);
  }
}

// Eventos de actualización
autoUpdater.on('checking-for-update', () => {
  enviarActualizacion('updater:checking');
});

autoUpdater.on('update-available', (info) => {
  enviarActualizacion('updater:available', {
    version: info.version
  });
});

autoUpdater.on('update-not-available', () => {
  enviarActualizacion('updater:not-available');
});

autoUpdater.on('download-progress', (progress) => {
  enviarActualizacion('updater:progress', {
    percent: Math.round(progress.percent)
  });
});

autoUpdater.on('update-downloaded', (info) => {
  enviarActualizacion('updater:downloaded', {
    version: info.version
  });
});

autoUpdater.on('error', (error) => {
  console.error('Error al actualizar TablasRPP:', error);

  enviarActualizacion('updater:error', {
    message: error.message
  });
});

// Notificar cambios en el estado de la ventana
function enviarEstadoMaximizacion(win) {
  const enviar = () => {
    if (!win.isDestroyed()) {
      win.webContents.send(
        'window:maximize-state',
        win.isMaximized()
      );
    }
  };

  win.on('maximize', enviar);
  win.on('unmaximize', enviar);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'TablasRPP',
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0b0f19',
    show: false,
    autoHideMenuBar: true,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  enviarEstadoMaximizacion(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      html {
        color-scheme: light;
      }

      html body.modo-oscuro {
        color-scheme: dark;
      }
    `);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadFile(
    path.join(__dirname, 'index.html')
  );
}

// Minimizar
ipcMain.on('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

// Maximizar / restaurar
ipcMain.on('window:toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

// Cerrar
ipcMain.on('window:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

// Consultar estado de maximización
ipcMain.handle('window:is-maximized', (event) => {
  return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false;
});

// Instalar actualización cuando el usuario lo solicite
ipcMain.on('updater:install', () => {
  autoUpdater.quitAndInstall();
});

// Inicialización
app.whenReady().then(() => {
  createWindow();

  // Buscar actualizaciones únicamente en la aplicación instalada
  if (app.isPackaged && process.platform === 'win32') {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((error) => {
        console.error('No se pudo comprobar la actualización:', error);
      });
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cerrar aplicación
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
