// DOM Elements
const statusEl = document.getElementById('status');
const statusDot = statusEl.querySelector('.status-dot');
const statusText = statusEl.querySelector('.status-text');
const addressEl = document.getElementById('address');
const copyAddressBtn = document.getElementById('copyAddress');
const settingsBtn = document.getElementById('settingsBtn');
const newIdentityBtn = document.getElementById('newIdentityBtn');

// Tabs
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Send Tab
const toInput = document.getElementById('toInput');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const quickContactsList = document.getElementById('quickContactsList');

// Messages Tab
const messagesList = document.getElementById('messagesList');
const messageFilter = document.getElementById('messageFilter');

// Contacts Tab
const contactsList = document.getElementById('contactsList');
const addContactBtn = document.getElementById('addContactBtn');
const addContactForm = document.getElementById('addContactForm');
const newContactAddress = document.getElementById('newContactAddress');
const newContactNickname = document.getElementById('newContactNickname');
const cancelAddContact = document.getElementById('cancelAddContact');
const saveContact = document.getElementById('saveContact');

// State
let currentAddress = null;
let contacts = [];
let messages = [];
let connected = false;

// Initialize
async function init() {
  // Get initial status
  await updateStatus();
  await loadContacts();
  await loadMessages();
  
  // Set up event listeners
  setupTabs();
  setupSendForm();
  setupContacts();
  setupEventHandlers();
  
  // Listen for events from main process
  window.moltAPI.onConnectionChanged(handleConnectionChange);
  window.moltAPI.onMessageReceived(handleMessageReceived);
  window.moltAPI.onMessageSent(handleMessageSent);
  window.moltAPI.onContactAdded(handleContactAdded);
  window.moltAPI.onContactUpdated(handleContactUpdated);
  window.moltAPI.onContactRemoved(handleContactRemoved);
}

function setupTabs() {
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
          content.classList.add('active');
        }
      });
    });
  });
}

function setupSendForm() {
  sendBtn.addEventListener('click', sendMessage);
  
  // Cmd+Enter to send
  messageInput.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Enable/disable send button based on input
  const updateSendButton = () => {
    sendBtn.disabled = !connected || !toInput.value.trim() || !messageInput.value.trim();
  };
  
  toInput.addEventListener('input', updateSendButton);
  messageInput.addEventListener('input', updateSendButton);
}

function setupContacts() {
  addContactBtn.addEventListener('click', () => {
    addContactForm.classList.toggle('hidden');
  });
  
  cancelAddContact.addEventListener('click', () => {
    addContactForm.classList.add('hidden');
    newContactAddress.value = '';
    newContactNickname.value = '';
  });
  
  saveContact.addEventListener('click', addNewContact);
  
  // Enter to save
  newContactNickname.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addNewContact();
    }
  });
}

function setupEventHandlers() {
  // Copy address
  copyAddressBtn.addEventListener('click', async () => {
    if (currentAddress) {
      await navigator.clipboard.writeText(`@${currentAddress}`);
      showToast('Address copied!');
    }
  });
  
  // Settings button
  settingsBtn.addEventListener('click', () => {
    // Open settings window (handled by main process)
  });
  
  // New identity
  newIdentityBtn.addEventListener('click', async () => {
    if (confirm('Generate a new identity? Your current address will change.')) {
      await window.moltAPI.createIdentity();
      await updateStatus();
      showToast('New identity created!');
    }
  });
}

async function updateStatus() {
  try {
    const [isConnected, address] = await Promise.all([
      window.moltAPI.isConnected(),
      window.moltAPI.getAddress()
    ]);
    
    connected = isConnected;
    
    if (isConnected) {
      statusDot.className = 'status-dot connected';
      statusText.textContent = 'Connected';
    } else {
      statusDot.className = 'status-dot disconnected';
      statusText.textContent = 'Disconnected';
    }
    
    if (address && address !== currentAddress) {
      currentAddress = address;
      addressEl.textContent = `@${address}`;
    }
    
    sendBtn.disabled = !isConnected || !toInput.value.trim() || !messageInput.value.trim();
    
  } catch (error) {
    console.error('Failed to get status:', error);
    statusDot.className = 'status-dot disconnected';
    statusText.textContent = 'Error';
  }
}

async function sendMessage() {
  const to = toInput.value.trim().replace('@', '');
  const content = messageInput.value.trim();
  
  if (!to || !content || !connected) {
    return;
  }
  
  sendBtn.disabled = true;
  sendBtn.querySelector('.btn-text').textContent = 'Sending...';
  
  try {
    await window.moltAPI.sendMessage(to, content);
    messageInput.value = '';
    showToast('Message sent!');
  } catch (error) {
    console.error('Failed to send message:', error);
    showToast('Failed to send: ' + error.message);
  } finally {
    sendBtn.disabled = false;
    sendBtn.querySelector('.btn-text').textContent = 'Send';
    updateStatus();
  }
}

async function loadContacts() {
  try {
    contacts = await window.moltAPI.getContacts();
    renderContacts();
    renderQuickContacts();
    updateMessageFilter();
  } catch (error) {
    console.error('Failed to load contacts:', error);
  }
}

function renderContacts() {
  if (contacts.length === 0) {
    contactsList.innerHTML = `
      <div class="empty-state">
        <p>No contacts yet</p>
        <p class="hint">Add a contact to send messages</p>
      </div>
    `;
    return;
  }
  
  contactsList.innerHTML = contacts.map(contact => `
    <div class="contact-item" data-address="${contact.address}">
      <div class="contact-info">
        <div class="contact-name">${contact.nickname || contact.address}</div>
        <div class="contact-address">@${contact.address}</div>
      </div>
      <div class="contact-badges">
        ${contact.trusted ? '<span class="badge trusted">Trusted</span>' : ''}
        ${contact.blocked ? '<span class="badge blocked">Blocked</span>' : ''}
      </div>
      <div class="contact-actions">
        <button class="contact-action" data-action="message" title="Send message">💬</button>
        <button class="contact-action" data-action="trust" title="${contact.trusted ? 'Untrust' : 'Trust'}">${contact.trusted ? '🔒' : '🔓'}</button>
        <button class="contact-action" data-action="block" title="${contact.blocked ? 'Unblock' : 'Block'}">${contact.blocked ? '❌' : '🚫'}</button>
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  contactsList.querySelectorAll('.contact-item').forEach(item => {
    const address = item.dataset.address;
    
    item.querySelector('[data-action="message"]').addEventListener('click', (e) => {
      e.stopPropagation();
      toInput.value = `@${address}`;
      tabs[0].click(); // Switch to send tab
    });
    
    item.querySelector('[data-action="trust"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.moltAPI.trustContact(address);
      await loadContacts();
    });
    
    item.querySelector('[data-action="block"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Block @${address}?`)) {
        await window.moltAPI.blockContact(address);
        await loadContacts();
      }
    });
    
    // Click on item fills the to field
    item.addEventListener('click', () => {
      toInput.value = `@${address}`;
      tabs[0].click();
    });
  });
}

function renderQuickContacts() {
  if (contacts.length === 0) {
    quickContactsList.innerHTML = '<span style="color: var(--text-tertiary); font-size: 12px;">No contacts</span>';
    return;
  }
  
  quickContactsList.innerHTML = contacts.slice(0, 5).map(contact => `
    <button class="quick-contact" data-address="${contact.address}">
      ${contact.nickname || `@${contact.address}`}
    </button>
  `).join('');
  
  quickContactsList.querySelectorAll('.quick-contact').forEach(btn => {
    btn.addEventListener('click', () => {
      toInput.value = `@${btn.dataset.address}`;
      messageInput.focus();
    });
  });
}

async function addNewContact() {
  const address = newContactAddress.value.trim().replace('@', '');
  const nickname = newContactNickname.value.trim();
  
  if (!address) {
    showToast('Please enter an address');
    return;
  }
  
  try {
    await window.moltAPI.addContact(address, nickname || undefined);
    addContactForm.classList.add('hidden');
    newContactAddress.value = '';
    newContactNickname.value = '';
    showToast('Contact added!');
  } catch (error) {
    showToast('Failed to add contact: ' + error.message);
  }
}

async function loadMessages() {
  try {
    messages = await window.moltAPI.getMessages(50);
    renderMessages();
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

function renderMessages() {
  if (messages.length === 0) {
    messagesList.innerHTML = `
      <div class="empty-state">
        <p>No messages yet</p>
        <p class="hint">Send a message to start a conversation</p>
      </div>
    `;
    return;
  }
  
  const filter = messageFilter.value;
  let filteredMessages = messages;
  
  if (filter !== 'all') {
    filteredMessages = messages.filter(m => m.from === filter || m.to === filter);
  }
  
  messagesList.innerHTML = filteredMessages.map(msg => `
    <div class="message-item ${msg.outgoing ? 'message-outgoing' : ''}" data-id="${msg.id}">
      <div class="message-header">
        <span class="message-from">${msg.outgoing ? '→ ' + msg.to : '← ' + msg.from}</span>
        <span class="message-time">${formatTime(msg.timestamp)}</span>
      </div>
      <div class="message-text">${escapeHtml(msg.content)}</div>
    </div>
  `).join('');
  
  // Click to reply
  messagesList.querySelectorAll('.message-item').forEach(item => {
    item.addEventListener('click', () => {
      const msg = messages.find(m => m.id === item.dataset.id);
      if (msg) {
        toInput.value = `@${msg.outgoing ? msg.to : msg.from}`;
        tabs[0].click();
        messageInput.focus();
      }
    });
  });
}

function updateMessageFilter() {
  const uniqueContacts = new Set();
  messages.forEach(m => {
    if (!m.outgoing) uniqueContacts.add(m.from);
    else uniqueContacts.add(m.to);
  });
  
  messageFilter.innerHTML = '<option value="all">All</option>' +
    Array.from(uniqueContacts).map(addr => {
      const contact = contacts.find(c => c.address === addr);
      return `<option value="${addr}">${contact?.nickname || `@${addr}`}</option>`;
    }).join('');
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 2000);
}

// Event handlers
function handleConnectionChange(data) {
  connected = data.status === 'connected';
  updateStatus();
  
  if (data.error) {
    showToast('Connection error: ' + data.error);
  }
}

function handleMessageReceived(message) {
  messages.push(message);
  renderMessages();
  updateMessageFilter();
}

function handleMessageSent(message) {
  messages.push(message);
  renderMessages();
  updateMessageFilter();
}

function handleContactAdded(contact) {
  contacts.push(contact);
  renderContacts();
  renderQuickContacts();
  updateMessageFilter();
}

function handleContactUpdated(updatedContact) {
  const index = contacts.findIndex(c => c.address === updatedContact.address);
  if (index !== -1) {
    contacts[index] = updatedContact;
    renderContacts();
  }
}

function handleContactRemoved(address) {
  contacts = contacts.filter(c => c.address !== address);
  renderContacts();
  renderQuickContacts();
}

// Start
init();
