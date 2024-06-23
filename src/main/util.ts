/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { BrowserWindow } from 'electron';
import { Wallet } from '../app/types/wallet';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function importJSONFile(filePath: string, mainWindow: BrowserWindow) {
  const fs = require('fs');
  fs.readFile(filePath, 'utf8', (err: any, data: any) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return;
    }

    // Parse the JSON data
    const jsonWalletData = JSON.parse(data);
    console.log('JSON wallet data inside menu.ts:', jsonWalletData);

    // Do something with the JSON data, such as pass it to your renderer process
    mainWindow.webContents.send('json-wallet', jsonWalletData);
  });
}

export const saveJsonToFile = (jsonData: Wallet, filePath: string) => {
  const fs = require('fs');
  fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Error saving JSON file:', err);
    } else {
      console.log('JSON file saved successfully');
    }
  });
};
