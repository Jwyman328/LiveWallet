/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import {
  importJSONFile,
  resolveHtmlPath,
  saveJsonToFile,
  savePsbtToFile,
} from './util';
import { WalletConfigs } from '../app/types/wallet';
import { Pages } from '../renderer/pages';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});
ipcMain.on('current-route', (event, currentRoute) => {
  console.log('Current route:', currentRoute);
  const menuImportedWallet = MenuBuilder.menu.getMenuItemById('importWallet');
  const menuSaveWallet = MenuBuilder.menu.getMenuItemById('saveWallet');
  const menuLogout = MenuBuilder.menu.getMenuItemById('logout');

  if (currentRoute === Pages.SIGN_IN || currentRoute === Pages.CHOOSE_PATH) {
    if (menuImportedWallet) {
      console.log('setting import wallet option to enabled');
      menuImportedWallet.enabled = true;
    }
    if (menuSaveWallet) {
      console.log('setting save wallet option to disabled');
      menuSaveWallet.enabled = false;
      menuLogout.enabled = false;
    }
  } else {
    if (menuImportedWallet) {
      console.log('setting import wallet option to disabled');
      menuImportedWallet.enabled = false;
    }

    if (menuSaveWallet) {
      console.log('setting save wallet option to enabled');
      menuSaveWallet.enabled = true;
      menuLogout.enabled = true;
    }
  }
});

ipcMain.on('save-wallet', async (event, walletDetails) => {
  const menu = MenuBuilder.menu;
  menu.walletDetails = walletDetails;
});
ipcMain.on('import-wallet-from-dialog', async (event, walletDetails) => {
  // Open file dialog to select JSON file
  const { dialog } = require('electron');
  dialog
    .showOpenDialog({
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile'],
    })
    .then((result: any) => {
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const mainWindow = BrowserWindow.getAllWindows()[0];
        importJSONFile(filePath, mainWindow as BrowserWindow);
      }
    })
    .catch((err: any) => {
      console.error('Error opening file dialog:', err);
    });
});

ipcMain.on('save-wallet-data-from-dialog', async (event, walletDetails) => {
  // Open file dialog to select JSON file
  const { dialog } = require('electron');
  dialog
    .showSaveDialog({
      title: 'Save JSON File',
      defaultPath: './my_wallet.json', // Specify the default file name
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    })
    .then((result) => {
      if (!result.canceled && result.filePath) {
        const jsonFilePath = result.filePath;
        const walletDetails = MenuBuilder.menu.walletDetails;
        const walletConfigs = MenuBuilder.menu.walletConfigs;
        const walletData = { ...walletDetails, ...walletConfigs };
        saveJsonToFile(walletData, jsonFilePath);
      }
    })
    .catch((err) => {
      console.error('Error saving JSON file:', err);
    });
});

ipcMain.on('save-psbt', async (event, psbt: string) => {
  // Open file dialog to save psbt file
  const { dialog } = require('electron');
  dialog
    .showSaveDialog({
      title: 'Save psbt',
      defaultPath: './my_psbt.psbt', // Specify the default file name
    })
    .then((result) => {
      if (!result.canceled && result.filePath) {
        const filePath = result.filePath;
        savePsbtToFile(psbt, filePath);
      }
    })
    .catch((err) => {
      console.error('Error saving psbt file:', err);
    });
});

ipcMain.on(
  'save-wallet-configs',
  async (event, walletConfigs: WalletConfigs) => {
    const menu = MenuBuilder.menu;
    menu.walletConfigs = walletConfigs;
  },
);

ipcMain.on('get-wallet-data', async (event) => {
  const menu = MenuBuilder.menu;
  console.log('menu wallet configs', menu.walletConfigs);
  console.log('menu wallet details', menu.walletDetails);
  if (!menu.walletConfigs || !menu.walletDetails) {
    event.reply('wallet-data', undefined);
  } else {
    event.reply('wallet-data', {
      ...menu.walletConfigs,
      ...menu.walletDetails,
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

let backendProcess: any;
const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  function startupBackend() {
    console.log('starting backend');
    try {
      const pythonBinary = getAssetPath('app');
      const child = require('child_process');
      backendProcess = child.execFile(
        pythonBinary,
        function (err: any, data: any) {
          if (err) {
            console.log('Error starting backend', err);
          }
          console.log(data.toString());
        },
      );
    } catch (err) {
      console.log('Error starting backend', err);
    }
  }

  if (process.env.NODE_ENV === "production") {
    startupBackend();
  } else {
    console.log(
      'Backend is not starting via electron, please start it separately via backend/start_app.sh',
    );
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1224,
    height: 900,
    minHeight: 874,
    minWidth: 824,
    icon: path.join(__dirname, 'resources/assets/icons'),
    title: 'UXTO Fee Estimator',
    webPreferences: {
      nodeIntegration: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('before-quit', () => {
  if (backendProcess) {
    console.log('killing backend process');
    if (process.platform === 'win32') {
      const kill = require("tree-kill")
      kill(backendProcess.pid, "SIGTERM")
    } else {
      backendProcess.kill();
    }
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
