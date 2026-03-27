import { ipcMain } from 'electron';
import Store from 'electron-store';
import * as path from 'path';
import * as fs from 'fs';
import { EventEmitter } from 'events';

// Import from Molt SDK
import { 
  getOrCreateIdentity, 
  createMoltConnectServer,
  sendMoltMessage,
  toThreeWord
} from '../../../dist/molt-a2a.js';

interface Contact {
  address: string;
  url?: string;
  nickname?: string;
  trusted: boolean;
  blocked: boolean;
  addedAt: number;
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  outgoing: boolean;
}

interface Identity {
  address: string;
  publicKey: string;
  privateKey: string;
  createdAt: number;
}

interface Settings {
  relayUrl: string;
  listenPort: number;
  launchAtLogin: boolean;
  notifications: boolean;
  sound: boolean;
}

const store = new Store({
  defaults: {
    settings: {
      relayUrl: 'http://localhost:8080',
      listenPort: 4001,
      launchAtLogin: true,
      notifications: true,
      sound: true
    }
  }
});

export class MoltService extends EventEmitter {
  private identity: Identity | null = null;
  private contacts: Map<string, Contact> = new Map();
  private messages: Message[] = [];
  private connected = false;
  private listening = false;
  private settings: Settings;
  private dataPath: string;
  private server: any = null;
  private agentUrl: string = '';

  constructor() {
    super();
    this.settings = (store.get('settings') as Settings) || this.getDefaultSettings();
    this.dataPath = path.join(process.cwd(), 'molt-data');
    this.ensureDataDir();
    this.loadIdentity();
    this.loadContacts();
    this.loadMessages();
  }

  private getDefaultSettings(): Settings {
    return {
      relayUrl: 'http://localhost:8080',
      listenPort: 4001,
      launchAtLogin: true,
      notifications: true,
      sound: true
    };
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private loadIdentity() {
    const identityPath = path.join(this.dataPath, 'identity.json');
    if (fs.existsSync(identityPath)) {
      this.identity = JSON.parse(fs.readFileSync(identityPath, 'utf-8'));
    }
  }

  private saveIdentity() {
    if (this.identity) {
      fs.writeFileSync(
        path.join(this.dataPath, 'identity.json'),
        JSON.stringify(this.identity, null, 2)
      );
    }
  }

  private loadContacts() {
    const contactsPath = path.join(this.dataPath, 'contacts.json');
    if (fs.existsSync(contactsPath)) {
      const data = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));
      this.contacts = new Map(Object.entries(data));
    }
  }

  private saveContacts() {
    fs.writeFileSync(
      path.join(this.dataPath, 'contacts.json'),
      JSON.stringify(Object.fromEntries(this.contacts), null, 2)
    );
  }

  private loadMessages() {
    const messagesPath = path.join(this.dataPath, 'messages.json');
    if (fs.existsSync(messagesPath)) {
      this.messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    }
  }

  private saveMessages() {
    fs.writeFileSync(
      path.join(this.dataPath, 'messages.json'),
      JSON.stringify(this.messages, null, 2)
    );
  }

  // Identity management - uses real SDK
  async createIdentity(): Promise<Identity> {
    try {
      // Use the real SDK to create identity
      const sdkIdentity = await getOrCreateIdentity();
      
      this.identity = {
        address: sdkIdentity.address,
        publicKey: sdkIdentity.publicKey,
        privateKey: sdkIdentity.privateKey,
        createdAt: Date.now()
      };
      
      this.saveIdentity();
      return this.identity;
    } catch (error) {
      console.error('Failed to create identity:', error);
      throw error;
    }
  }

  getIdentity(): Identity | null {
    return this.identity;
  }

  getAddress(): string | null {
    return this.identity?.address || null;
  }

  // Connection management
  async connect(): Promise<void> {
    if (!this.identity) {
      await this.createIdentity();
    }
    
    // Start listening server
    if (!this.listening) {
      await this.startListening();
    }
    
    this.connected = true;
    this.emit('connected');
  }

  async startListening(): Promise<void> {
    if (this.listening) return;
    
    try {
      const port = this.settings.listenPort || 4001;
      this.agentUrl = `http://localhost:${port}`;
      
      // Create Molt Connect server
      this.server = await createMoltConnectServer({
        port,
        onMessage: async (from: string, message: string) => {
          this.handleIncomingMessage(from, message);
          return 'OK';
        }
      });
      
      this.listening = true;
      console.log(`Molt Connect listening on ${this.agentUrl}`);
      
    } catch (error) {
      console.error('Failed to start listening:', error);
      throw error;
    }
  }

  private handleIncomingMessage(from: string, content: string) {
    const message: Message = {
      id: crypto.randomUUID(),
      from,
      to: this.identity?.address || '',
      content,
      timestamp: Date.now(),
      outgoing: false
    };

    this.messages.push(message);
    this.saveMessages();
    this.emit('message:received', message);
  }

  disconnect(): void {
    if (this.server) {
      // Stop the server
      this.server = null;
    }
    this.listening = false;
    this.connected = false;
    this.emit('disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  isListening(): boolean {
    return this.listening;
  }

  getUrl(): string {
    return this.agentUrl;
  }

  // Messaging - uses real SDK
  async sendMessage(to: string, content: string): Promise<Message> {
    if (!this.identity) {
      throw new Error('No identity');
    }

    if (!this.connected) {
      throw new Error('Not connected');
    }

    // Find contact URL
    const contact = this.contacts.get(to);
    const targetUrl = contact?.url || `http://localhost:4002`; // Default for testing
    
    try {
      // Use real SDK to send message
      const response = await sendMoltMessage(targetUrl, content, {
        address: this.identity.address,
        publicKey: this.identity.publicKey,
        privateKey: this.identity.privateKey,
        createdAt: String(this.identity.createdAt)
      });

      const message: Message = {
        id: crypto.randomUUID(),
        from: this.identity.address,
        to,
        content,
        timestamp: Date.now(),
        outgoing: true
      };

      this.messages.push(message);
      this.saveMessages();
      this.emit('message:sent', message);

      return message;
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  receiveMessage(from: string, content: string): Message {
    const message: Message = {
      id: crypto.randomUUID(),
      from,
      to: this.identity?.address || '',
      content,
      timestamp: Date.now(),
      outgoing: false
    };

    this.messages.push(message);
    this.saveMessages();
    this.emit('message:received', message);

    return message;
  }

  getMessages(limit = 50): Message[] {
    return this.messages.slice(-limit);
  }

  getMessagesWithContact(address: string, limit = 50): Message[] {
    return this.messages
      .filter(m => m.from === address || m.to === address)
      .slice(-limit);
  }

  // Contact management
  addContact(address: string, url?: string, nickname?: string): Contact {
    const contact: Contact = {
      address,
      url,
      nickname,
      trusted: false,
      blocked: false,
      addedAt: Date.now()
    };
    
    this.contacts.set(address, contact);
    this.saveContacts();
    this.emit('contact:added', contact);
    
    return contact;
  }

  removeContact(address: string): boolean {
    const result = this.contacts.delete(address);
    if (result) {
      this.saveContacts();
      this.emit('contact:removed', address);
    }
    return result;
  }

  trustContact(address: string): void {
    const contact = this.contacts.get(address);
    if (contact) {
      contact.trusted = true;
      this.saveContacts();
      this.emit('contact:updated', contact);
    }
  }

  blockContact(address: string): void {
    const contact = this.contacts.get(address);
    if (contact) {
      contact.blocked = true;
      this.saveContacts();
      this.emit('contact:updated', contact);
    }
  }

  unblockContact(address: string): void {
    const contact = this.contacts.get(address);
    if (contact) {
      contact.blocked = false;
      this.saveContacts();
      this.emit('contact:updated', contact);
    }
  }

  getContacts(): Contact[] {
    return Array.from(this.contacts.values());
  }

  getContact(address: string): Contact | undefined {
    return this.contacts.get(address);
  }

  // Settings
  getSettings(): Settings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<Settings>): Settings {
    this.settings = { ...this.settings, ...newSettings };
    store.set('settings', this.settings);
    this.emit('settings:updated', this.settings);
    return this.settings;
  }
}

// Singleton instance
let moltService: MoltService | null = null;

export function getMoltService(): MoltService {
  if (!moltService) {
    moltService = new MoltService();
  }
  return moltService;
}

// IPC handlers
export function registerMoltIPC() {
  const service = getMoltService();

  // Identity
  ipcMain.handle('molt:getAddress', () => service.getAddress());
  ipcMain.handle('molt:getIdentity', () => service.getIdentity());
  ipcMain.handle('molt:createIdentity', () => service.createIdentity());
  ipcMain.handle('molt:getUrl', () => service.getUrl());

  // Connection
  ipcMain.handle('molt:connect', () => service.connect());
  ipcMain.handle('molt:disconnect', () => service.disconnect());
  ipcMain.handle('molt:isConnected', () => service.isConnected());
  ipcMain.handle('molt:isListening', () => service.isListening());

  // Messages
  ipcMain.handle('molt:send', (_e, to: string, content: string) => service.sendMessage(to, content));
  ipcMain.handle('molt:getMessages', (_e, limit?: number) => service.getMessages(limit));
  ipcMain.handle('molt:getMessagesWith', (_e, address: string, limit?: number) => 
    service.getMessagesWithContact(address, limit));

  // Contacts
  ipcMain.handle('molt:addContact', (_e, address: string, url?: string, nickname?: string) => 
    service.addContact(address, url, nickname));
  ipcMain.handle('molt:removeContact', (_e, address: string) => service.removeContact(address));
  ipcMain.handle('molt:trustContact', (_e, address: string) => service.trustContact(address));
  ipcMain.handle('molt:blockContact', (_e, address: string) => service.blockContact(address));
  ipcMain.handle('molt:getContacts', () => service.getContacts());
  ipcMain.handle('molt:getContact', (_e, address: string) => service.getContact(address));

  // Settings
  ipcMain.handle('molt:getSettings', () => service.getSettings());
  ipcMain.handle('molt:updateSettings', (_e, settings: Partial<Settings>) => 
    service.updateSettings(settings));
}
