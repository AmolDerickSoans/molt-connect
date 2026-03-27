import { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain, shell } from 'electron';
import * as path from 'path';
import { getMoltService, registerMoltIPC, MoltService } from './services/MoltService';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let moltService: MoltService;

// Connection states
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
let connectionStatus: ConnectionStatus = 'disconnected';

// Menu bar icons
function getIcon(status: ConnectionStatus): Electron.NativeImage {
  const size = 22;
  const canvas = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${
        status === 'connected' ? '#34C759' : 
        status === 'connecting' ? '#FF9500' : 
        '#8E8E93'
      }"/>
    </svg>
  `;
  return nativeImage.createFromBuffer(Buffer.from(canvas));
}

function createTray() {
  tray = new Tray(getIcon('disconnected'));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Molt Connect', click: () => showMainWindow() },
    { type: 'separator' },
    { label: 'Status: Disconnected', enabled: false },
    { label: 'Connect', click: () => connectToRelay() },
    { type: 'separator' },
    { label: 'Settings', click: () => showSettings() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setToolTip('Molt Connect');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    showMainWindow();
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  mainWindow.on('blur', () => {
    mainWindow?.hide();
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.show();
    return;
  }
  
  settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    show: true,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function showMainWindow() {
  if (!mainWindow) {
    createMainWindow();
  }
  mainWindow?.show();
}

function showSettings() {
  createSettingsWindow();
}

async function connectToRelay() {
  if (connectionStatus === 'connected') return;
  
  connectionStatus = 'connecting';
  updateTrayIcon();
  
  try {
    await moltService.connect();
    
    connectionStatus = 'connected';
    updateTrayIcon();
    
    // Notify renderer
    mainWindow?.webContents.send('connection:changed', { status: 'connected' });
    
  } catch (error) {
    console.error('Connection failed:', error);
    connectionStatus = 'disconnected';
    updateTrayIcon();
    mainWindow?.webContents.send('connection:changed', { status: 'disconnected', error: String(error) });
  }
}

function updateTrayIcon() {
  if (!tray) return;
  
  tray.setImage(getIcon(connectionStatus));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Molt Connect', click: () => showMainWindow() },
    { type: 'separator' },
    { label: `Status: ${connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}`, enabled: false },
    { 
      label: connectionStatus === 'connected' ? 'Disconnect' : 'Connect', 
      click: () => connectionStatus === 'connected' ? disconnect() : connectToRelay() 
    },
    { type: 'separator' },
    { label: 'Settings', click: () => showSettings() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setContextMenu(contextMenu);
}

function disconnect() {
  moltService.disconnect();
  connectionStatus = 'disconnected';
  updateTrayIcon();
  mainWindow?.webContents.send('connection:changed', { status: 'disconnected' });
}

function showNotification(from: string, message: string) {
  const settings = moltService.getSettings();
  
  if (!settings.notifications) return;
  
  const notification = new Notification({
    title: `Message from @${from}`,
    body: message,
    silent: !settings.sound
  });
  
  notification.on('click', () => {
    showMainWindow();
  });
  
  notification.show();
}

// App lifecycle
app.whenReady().then(() => {
  // Initialize service
  moltService = getMoltService();
  registerMoltIPC();
  
  // Set up event handlers
  moltService.on('message:received', (message) => {
    const contact = moltService.getContact(message.from);
    const displayName = contact?.nickname || message.from;
    showNotification(displayName, message.content);
    mainWindow?.webContents.send('message:received', message);
  });
  
  moltService.on('message:sent', (message) => {
    mainWindow?.webContents.send('message:sent', message);
  });
  
  moltService.on('contact:added', (contact) => {
    mainWindow?.webContents.send('contact:added', contact);
  });
  
  moltService.on('contact:updated', (contact) => {
    mainWindow?.webContents.send('contact:updated', contact);
  });
  
  moltService.on('contact:removed', (address) => {
    mainWindow?.webContents.send('contact:removed', address);
  });
  
  // Create UI
  createTray();
  createMainWindow();
  
  // Auto-connect on startup
  connectToRelay();
});

app.on('window-all-closed', () => {
  // Prevent app from quitting - menu bar apps stay running
});

app.on('before-quit', () => {
  disconnect();
});
