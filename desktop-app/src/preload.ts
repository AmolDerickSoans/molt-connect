import { contextBridge, ipcRenderer } from 'electron';

// Types
interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  outgoing: boolean;
}

interface Contact {
  address: string;
  url?: string;
  nickname?: string;
  trusted: boolean;
  blocked: boolean;
  addedAt: number;
}

interface Identity {
  address: string;
  publicKey: string;
  createdAt: number;
}

interface Settings {
  relayUrl: string;
  launchAtLogin: boolean;
  notifications: boolean;
  sound: boolean;
}

// Expose API to renderer
contextBridge.exposeInMainWorld('moltAPI', {
  // Identity
  getAddress: (): Promise<string | null> => ipcRenderer.invoke('molt:getAddress'),
  getIdentity: (): Promise<Identity | null> => ipcRenderer.invoke('molt:getIdentity'),
  createIdentity: (): Promise<Identity> => ipcRenderer.invoke('molt:createIdentity'),
  getUrl: (): Promise<string> => ipcRenderer.invoke('molt:getUrl'),

  // Connection
  connect: (): Promise<void> => ipcRenderer.invoke('molt:connect'),
  disconnect: (): Promise<void> => ipcRenderer.invoke('molt:disconnect'),
  isConnected: (): Promise<boolean> => ipcRenderer.invoke('molt:isConnected'),
  isListening: (): Promise<boolean> => ipcRenderer.invoke('molt:isListening'),

  // Messages
  sendMessage: (to: string, content: string): Promise<Message> => 
    ipcRenderer.invoke('molt:send', to, content),
  getMessages: (limit?: number): Promise<Message[]> => 
    ipcRenderer.invoke('molt:getMessages', limit),
  getMessagesWith: (address: string, limit?: number): Promise<Message[]> => 
    ipcRenderer.invoke('molt:getMessagesWith', address, limit),

  // Contacts
  addContact: (address: string, url?: string, nickname?: string): Promise<Contact> => 
    ipcRenderer.invoke('molt:addContact', address, url, nickname),
  removeContact: (address: string): Promise<boolean> => 
    ipcRenderer.invoke('molt:removeContact', address),
  trustContact: (address: string): Promise<void> => 
    ipcRenderer.invoke('molt:trustContact', address),
  blockContact: (address: string): Promise<void> => 
    ipcRenderer.invoke('molt:blockContact', address),
  getContacts: (): Promise<Contact[]> => ipcRenderer.invoke('molt:getContacts'),
  getContact: (address: string): Promise<Contact | undefined> => 
    ipcRenderer.invoke('molt:getContact', address),

  // Settings
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('molt:getSettings'),
  updateSettings: (settings: Partial<Settings>): Promise<Settings> => 
    ipcRenderer.invoke('molt:updateSettings', settings),

  // Events
  onConnectionChanged: (callback: (data: { status: string; error?: string }) => void) => {
    ipcRenderer.on('connection:changed', (_event, data) => callback(data));
  },
  onMessageReceived: (callback: (message: Message) => void) => {
    ipcRenderer.on('message:received', (_event, message) => callback(message));
  },
  onMessageSent: (callback: (message: Message) => void) => {
    ipcRenderer.on('message:sent', (_event, message) => callback(message));
  },
  onContactAdded: (callback: (contact: Contact) => void) => {
    ipcRenderer.on('contact:added', (_event, contact) => callback(contact));
  },
  onContactUpdated: (callback: (contact: Contact) => void) => {
    ipcRenderer.on('contact:updated', (_event, contact) => callback(contact));
  },
  onContactRemoved: (callback: (address: string) => void) => {
    ipcRenderer.on('contact:removed', (_event, address) => callback(address));
  }
});
