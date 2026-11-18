
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tablasRPPWindow', {
  // Controles de ventana
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  // Estado de maximización
  onMaximizeState: (callback) => {
    ipcRenderer.on('window:maximize-state', (event, maximized) => {
      callback(maximized);
    });
  },

  // Actualizaciones de TablasRPP
  updater: {
    // Comprobando actualizaciones
    onChecking: (callback) => {
      ipcRenderer.on('updater:checking', () => callback());
    },

    // Nueva versión disponible
    onAvailable: (callback) => {
      ipcRenderer.on('updater:available', (event, info) => {
        callback(info);
      });
    },

    // No hay actualizaciones
    onNotAvailable: (callback) => {
      ipcRenderer.on('updater:not-available', () => callback());
    },

    // Progreso de descarga
    onProgress: (callback) => {
      ipcRenderer.on('updater:progress', (event, progress) => {
        callback(progress);
      });
    },

    // Actualización descargada
    onDownloaded: (callback) => {
      ipcRenderer.on('updater:downloaded', (event, info) => {
        callback(info);
      });
    },

    // Error de actualización
    onError: (callback) => {
      ipcRenderer.on('updater:error', (event, error) => {
        callback(error);
      });
    },

    // Reiniciar e instalar
    install: () => {
      ipcRenderer.send('updater:install');
    }
  }
});
