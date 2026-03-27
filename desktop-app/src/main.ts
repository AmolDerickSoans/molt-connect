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
  // Create a 16x16 black circle for macOS menu bar template image
  // Using a data URL for reliability
  const size = 16;
  
  // Black circle PNG (16x16) - base64 encoded minimal PNG
  const blackCircleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAJklEQVQ4T2NkYGD4z0ABYBw1YDQMRsMARsMAAyP5fzDAYMjAAABWtgEJmF9sNQAAAABJRU5ErkJggg==';
  
  return nativeImage.createFromDataURL(`data:image/png;base64,${blackCircleBase64}`);
}

function createTray() {
  const icon = getIcon('disconnected');
  
  tray = new Tray(icon);
  
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
    width: 360,
    height: 500,
    show: false,
    frame: false,
    resizable: false,
    transparent: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function showMainWindow() {
  if (!mainWindow) {
    createMainWindow();
  }
  
  // Position window near menu bar
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // Position in top right corner
  mainWindow?.setPosition(width - 380, 30);
  mainWindow?.show();
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
  
  // Create tray and main window
  createTray();
  createMainWindow();
  
  // Show window immediately on startup
  showMainWindow();
  
  // Auto-connect on startup
  connectToRelay();
  
  console.log('App ready - check menu bar for icon');
});

app.on('window-all-closed', () => {
  // Prevent app from quitting - menu bar apps stay running
});

app.on('before-quit', () => {
  disconnect();
});
