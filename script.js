// ===== CONFIGURATION =====
const SUPABASE_URL = 'https://tayhblmwkaujtkuulfqj.supabase.co';  // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRheWhibG13a2F1anRrdXVsZnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDQxNDEsImV4cCI6MjA4NTkyMDE0MX0.CY3cjbUqeVUynIHrsZ62fHCxFK-FtPxjxPOYwYL7a4E';  // Replace with your anon key

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== GLOBAL STATE =====
let currentUser = {
    id: null,
    username: '',
    role: 'user',
    sessionId: null,
    isOnline: false
};

let currentRoom = 'open';
let currentTheme = 'seaside';
let isTyping = false;
let typingTimeout = null;
let selectedFile = null;
let emojiPickerActive = false;
let onlineUsers = new Map();
let messages = new Map(); // room -> array of messages
let userReactions = new Map(); // messageId -> reaction type

// ===== DOM ELEMENTS =====
const usernameModal = document.getElementById('usernameModal');
const chatApp = document.getElementById('chatApp');
const usernameInput = document.getElementById('usernameInput');
const usernameError = document.getElementById('usernameError');
const startChatBtn = document.getElementById('startChatBtn');
const themeSelect = document.querySelector('.theme-grid');
const currentRoomTitle = document.getElementById('currentRoomTitle');
const currentUsername = document.getElementById('currentUsername');
const userRoleBadge = document.getElementById('userRoleBadge');
const onlineCount = document.getElementById('onlineCount');
const onlineCountSidebar = document.getElementById('onlineCountSidebar');
const userList = document.getElementById('userList');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const charCount = document.getElementById('charCount');
const filePreview = document.getElementById('filePreview');
const fileName = document.getElementById('fileName');
const removeFile = document.getElementById('removeFile');
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');
const adminChatBtn = document.getElementById('adminChatBtn');
const adminControls = document.getElementById('adminControls');
const settingsPanel = document.getElementById('settingsPanel');
const roomButtons = document.querySelectorAll('.room-btn');
const themeToggle = document.getElementById('themeToggle');
const settingsToggle = document.getElementById('settingsToggle');
const logoutBtn = document.getElementById('logoutBtn');
const typingIndicator = document.getElementById('typingIndicator');
const searchToggle = document.getElementById('searchToggle');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const emojiGrid = document.getElementById('emojiGrid');
const announcementModal = document.getElementById('announcementModal');
const announcementText = document.getElementById('announcementText');
const sendAnnounceBtn = document.getElementById('sendAnnounce');
const cancelAnnounceBtn = document.getElementById('cancelAnnounce');
const closeAnnounceModal = document.getElementById('closeAnnounceModal');
const kickUsername = document.getElementById('kickUsername');
const kickBtn = document.getElementById('kickBtn');
const adminUsername = document.getElementById('adminUsername');
const grantAdminBtn = document.getElementById('grantAdminBtn');
const revokeAdminBtn = document.getElementById('revokeAdminBtn');
const banUsername = document.getElementById('banUsername');
const banBtn = document.getElementById('banBtn');
const imagePreviewModal = document.getElementById('imagePreviewModal');
const previewImage = document.getElementById('previewImage');
const closeImagePreview = document.getElementById('closeImagePreview');
const searchModal = document.getElementById('searchModal');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const closeSearchModal = document.getElementById('closeSearchModal');
const searchResults = document.getElementById('searchResults');
const notificationContainer = document.getElementById('notificationContainer');

// ===== EMOJI DATA =====
const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗'],
    food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌'],
    objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🎮', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐']
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setupEmojiPicker();
    loadSavedSettings();
});

function initializeApp() {
    // Check for saved username and session
    const savedUsername = localStorage.getItem('niamchat_username');
    const savedSessionId = localStorage.getItem('niamchat_session');
    const savedTheme = localStorage.getItem('niamchat_theme') || 'seaside';
    
    if (savedUsername && savedSessionId) {
        // Auto-login with saved session
        currentUser.username = savedUsername;
        currentUser.sessionId = savedSessionId;
        startChat();
    } else {
        // Show username modal
        usernameModal.classList.add('active');
        usernameInput.focus();
    }
    
    // Apply saved theme
    applyTheme(savedTheme);
    highlightSelectedTheme(savedTheme);
}

function setupEventListeners() {
    // Username Modal
    startChatBtn.addEventListener('click', handleStartChat);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleStartChat();
    });
    
    // Theme Selection
    themeSelect.addEventListener('click', (e) => {
        const themeOption = e.target.closest('.theme-option');
        if (themeOption) {
            const theme = themeOption.dataset.theme;
            applyTheme(theme);
            highlightSelectedTheme(theme);
        }
    });
    
    // Message Input
    messageInput.addEventListener('input', updateCharCount);
    messageInput.addEventListener('input', handleTyping);
    messageInput.addEventListener('keydown', handleMessageKeydown);
    messageInput.addEventListener('keyup', () => {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            isTyping = false;
            updateTypingStatus();
        }, 1000);
    });
    
    sendBtn.addEventListener('click', sendMessage);
    attachBtn.addEventListener('click', () => {
        document.getElementById('fileInput')?.click();
    });
    
    // File handling
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = 'fileInput';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', handleFileSelect);
    removeFile.addEventListener('click', removeSelectedFile);
    
    // Sidebar controls
    menuToggle.addEventListener('click', toggleSidebar);
    closeSidebar.addEventListener('click', toggleSidebar);
    
    // Room switching
    roomButtons.forEach(btn => {
        btn.addEventListener('click', () => switchRoom(btn.dataset.room));
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', () => {
        const themes = Array.from(document.querySelectorAll('.theme-option'));
        const currentIndex = themes.findIndex(t => t.dataset.theme === currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex].dataset.theme;
        applyTheme(nextTheme);
        highlightSelectedTheme(nextTheme);
    });
    
    // Settings toggle
    settingsToggle.addEventListener('click', () => {
        adminControls.classList.remove('active');
        settingsPanel.classList.toggle('active');
        adminChatBtn.classList.toggle('hidden');
    });
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Search
    searchToggle.addEventListener('click', toggleSearchModal);
    closeSearchModal.addEventListener('click', toggleSearchModal);
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Emoji picker
    emojiBtn.addEventListener('click', toggleEmojiPicker);
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.classList.remove('active');
            emojiPickerActive = false;
        }
    });
    
    // Admin controls
    document.getElementById('announceBtn')?.addEventListener('click', () => {
        announcementModal.classList.remove('hidden');
        announcementText.focus();
    });
    
    cancelAnnounceBtn.addEventListener('click', () => {
        announcementModal.classList.add('hidden');
        announcementText.value = '';
    });
    
    closeAnnounceModal.addEventListener('click', () => {
        announcementModal.classList.add('hidden');
        announcementText.value = '';
    });
    
    sendAnnounceBtn.addEventListener('click', sendAnnouncement);
    announcementText.addEventListener('input', () => {
        const count = announcementText.value.length;
        document.getElementById('announceCharCount').textContent = `${count}/500`;
    });
    
    kickBtn.addEventListener('click', kickUser);
    grantAdminBtn.addEventListener('click', () => changeUserRole('admin'));
    revokeAdminBtn.addEventListener('click', () => changeUserRole('user'));
    banBtn.addEventListener('click', banUser);
    
    // Image preview
    closeImagePreview.addEventListener('click', () => {
        imagePreviewModal.classList.add('hidden');
    });
    
    // Window resize
    window.addEventListener('resize', handleResize);
}

function setupEmojiPicker() {
    // Populate emoji grid
    let html = '';
    for (const [category, emojis] of Object.entries(emojiCategories)) {
        emojis.forEach(emoji => {
            html += `<button class="emoji-item" data-emoji="${emoji}" data-category="${category}">${emoji}</button>`;
        });
    }
    emojiGrid.innerHTML = html;
    
    // Emoji category switching
    document.querySelectorAll('.emoji-category').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-category').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            document.querySelectorAll('.emoji-item').forEach(item => {
                item.style.display = item.dataset.category === category ? 'flex' : 'none';
            });
        });
    });
    
    // Emoji selection
    emojiGrid.addEventListener('click', (e) => {
        const emojiItem = e.target.closest('.emoji-item');
        if (emojiItem) {
            const emoji = emojiItem.dataset.emoji;
            insertAtCursor(emoji);
            emojiPicker.classList.remove('active');
            emojiPickerActive = false;
        }
    });
}

// ===== CORE FUNCTIONS =====
async function handleStartChat() {
    const username = usernameInput.value.trim();
    
    console.log('Starting chat with username:', username);
    
    if (!validateUsername(username)) {
        return;
    }
    
    try {
        // Check if username exists (except for Doneman123)
        if (username.toLowerCase() !== 'doneman123') {
            const { data: existingUser, error } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error checking username:', error);
                showError('Error checking username availability');
                return;
            }
            
            if (existingUser) {
                showError('Username already taken. Please choose another.');
                return;
            }
        }
        
        // Create user session
        currentUser.username = username;
        currentUser.sessionId = generateSessionId();
        currentUser.role = username.toLowerCase() === 'doneman123' ? 'owner' : 'user';
        
        console.log('User created:', currentUser);
        
        // Save to localStorage
        localStorage.setItem('niamchat_username', username);
        localStorage.setItem('niamchat_session', currentUser.sessionId);
        localStorage.setItem('niamchat_theme', currentTheme);
        
        // Initialize user in database
        await initializeUser();
        
        // Start chat
        startChat();
        
    } catch (error) {
        console.error('Error in handleStartChat:', error);
        showError('Error starting chat. Check console for details.');
    }
}

function validateUsername(username) {
    if (username.length < 3) {
        showError('Username must be at least 3 characters');
        return false;
    }
    
    if (username.length > 30) {
        showError('Username cannot exceed 30 characters');
        return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError('Only letters, numbers, and underscores allowed');
        return false;
    }
    
    return true;
}

function showError(message) {
    usernameError.textContent = message;
    usernameError.style.opacity = '1';
    setTimeout(() => {
        usernameError.style.opacity = '0';
    }, 3000);
}

function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

async function initializeUser() {
    try {
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('username', currentUser.username)
            .single();
        
        if (existingUser) {
            currentUser.id = existingUser.id;
            currentUser.role = existingUser.role;
            
            // Update user as online
            await supabase
                .from('users')
                .update({
                    is_online: true,
                    last_seen: new Date().toISOString(),
                    current_room: currentRoom
                })
                .eq('id', currentUser.id);
        } else {
            // Create new user
            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    username: currentUser.username,
                    role: currentUser.role,
                    is_online: true,
                    last_seen: new Date().toISOString(),
                    current_room: currentRoom
                })
                .select()
                .single();
            
            if (error) throw error;
            
            currentUser.id = newUser.id;
        }
        
        // Set up real-time subscriptions
        setupSubscriptions();
        
    } catch (error) {
        console.error('Error initializing user:', error);
        showNotification('Error connecting to chat. Please refresh.', 'error');
    }
}

function startChat() {
    // Hide modal, show chat
    usernameModal.classList.remove('active');
    chatApp.classList.remove('hidden');
    
    // Update UI with user info
    currentUsername.textContent = currentUser.username;
    userRoleBadge.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    userRoleBadge.className = `role-badge ${currentUser.role}`;
    
    // Enable admin chat if user is admin/owner
    if (currentUser.role === 'admin' || currentUser.role === 'owner') {
        adminChatBtn.disabled = false;
        adminChatBtn.classList.add('enabled');
        adminControls.classList.add('active');
    }
    
    // Load messages for current room
    loadMessages(currentRoom);
    
    // Focus message input
    setTimeout(() => {
        messageInput.focus();
    }, 100);
}

// ===== REAL-TIME SUBSCRIPTIONS =====
function setupSubscriptions() {
    // Subscribe to messages
    supabase
        .channel('messages')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `room=eq.${currentRoom}`
            }, 
            (payload) => {
                handleNewMessage(payload.new);
            }
        )
        .on('postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'messages'
            },
            (payload) => {
                handleDeletedMessage(payload.old.id);
            }
        )
        .subscribe();
    
    // Subscribe to users (online status)
    supabase
        .channel('users')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'users'
            },
            async () => {
                await updateOnlineUsers();
            }
        )
        .subscribe();
    
    // Subscribe to typing indicators
    supabase
        .channel('typing')
        .on('presence', { event: 'sync' }, () => {
            const state = supabase.channel('typing').presenceState();
            updateTypingDisplay(state);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await supabase.channel('typing').track({
                    user: currentUser.username,
                    room: currentRoom,
                    typing: false,
                    timestamp: Date.now()
                });
            }
        });
}

// ===== MESSAGE FUNCTIONS =====
async function sendMessage() {
    const content = messageInput.value.trim();
    
    if (!content && !selectedFile) {
        return;
    }
    
    let attachmentUrl = null;
    
    // Upload file if selected
    if (selectedFile) {
        attachmentUrl = await uploadFile(selectedFile);
        if (!attachmentUrl) {
            showNotification('Failed to upload image', 'error');
            return;
        }
    }
    
    try {
        // Insert message
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                room: currentRoom,
                user_id: currentUser.id,
                username: currentUser.username,
                content: content,
                is_announcement: false
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Insert attachment if exists
        if (attachmentUrl) {
            await supabase
                .from('attachments')
                .insert({
                    message_id: message.id,
                    filename: selectedFile.name,
                    file_url: attachmentUrl,
                    file_size: selectedFile.size,
                    mime_type: selectedFile.type
                });
        }
        
        // Clear input
        messageInput.value = '';
        updateCharCount();
        removeSelectedFile();
        
        // Stop typing
        isTyping = false;
        updateTypingStatus();
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message', 'error');
    }
}

async function loadMessages(room) {
    try {
        // Fetch messages for room
        const { data: messagesData, error } = await supabase
            .from('messages')
            .select(`
                *,
                attachments(*)
            `)
            .eq('room', room)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // Clear container
        messagesContainer.innerHTML = '';
        
        if (messagesData.length === 0) {
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <p>No messages yet in this room. Start the conversation!</p>
                </div>
            `;
            return;
        }
        
        // Display messages
        messagesData.forEach(msg => {
            addMessageToDOM(msg);
        });
        
        // Scroll to bottom
        scrollToBottom();
        
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Failed to load messages', 'error');
    }
}

function addMessageToDOM(message) {
    const messageElement = createMessageElement(message);
    messagesContainer.appendChild(messageElement);
    
    // Add to messages map
    if (!messages.has(currentRoom)) {
        messages.set(currentRoom, []);
    }
    messages.get(currentRoom).push(message);
}

function createMessageElement(message) {
    const isOwner = message.username.toLowerCase() === 'doneman123';
    const isCurrentUser = message.username === currentUser.username;
    const isAdmin = message.role === 'admin' || isOwner;
    const isAnnouncement = message.is_announcement;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwner ? 'owner' : ''} ${isAdmin ? 'admin' : ''} ${isAnnouncement ? 'announcement' : ''}`;
    messageDiv.dataset.id = message.id;
    messageDiv.dataset.username = message.username;
    
    let attachmentHtml = '';
    if (message.attachments && message.attachments.length > 0) {
        const attachment = message.attachments[0];
        attachmentHtml = `
            <div class="message-attachment">
                <img src="${attachment.file_url}" 
                     alt="${attachment.filename}" 
                     class="attachment-image"
                     onclick="previewImage('${attachment.file_url}', '${attachment.filename}')">
            </div>
        `;
    }
    
    // Check user's reaction to this message
    const userReaction = userReactions.get(message.id);
    const likeClass = userReaction === 'like' ? 'liked' : '';
    const dislikeClass = userReaction === 'dislike' ? 'disliked' : '';
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <div class="message-sender">
                    <span class="sender-name">${escapeHtml(message.username)}</span>
                    ${isOwner ? '<span class="owner-tag">👑 Owner</span>' : ''}
                    ${isAdmin && !isOwner ? '<span class="admin-tag">🛡️ Admin</span>' : ''}
                </div>
                <div class="message-time">${formatTime(message.created_at)}</div>
            </div>
            ${isAnnouncement ? '<div class="announcement-header">📢 Announcement</div>' : ''}
            <div class="message-text">${formatMessageContent(message.content)}</div>
            ${attachmentHtml}
            <div class="message-footer">
                <div class="message-actions">
                    <button class="action-btn like-btn ${likeClass}" onclick="reactToMessage('${message.id}', 'like')">
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path ${userReaction === 'like' ? 'fill="currentColor"' : 'stroke="currentColor" stroke-width="1.5"'} 
                                  d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"/>
                        </svg>
                        <span class="count">${message.likes || 0}</span>
                    </button>
                    <button class="action-btn dislike-btn ${dislikeClass}" onclick="reactToMessage('${message.id}', 'dislike')">
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path ${userReaction === 'dislike' ? 'fill="currentColor"' : 'stroke="currentColor" stroke-width="1.5"'} 
                                  d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54"/>
                        </svg>
                        <span class="count">${message.dislikes || 0}</span>
                    </button>
                    <button class="action-btn reply-btn" onclick="replyToMessage('${message.id}', '${message.username}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                            <path d="M20 18v-2a4 4 0 0 0-4-4H4"/><path d="m9 17-5-5 5-5"/>
                        </svg>
                        Reply
                    </button>
                </div>
                ${(currentUser.role === 'admin' || currentUser.role === 'owner' || isCurrentUser) ? `
                    <button class="action-btn delete-btn" onclick="deleteMessage('${message.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return messageDiv;
}

// ===== REACTIONS =====
async function reactToMessage(messageId, reaction) {
    try {
        const currentReaction = userReactions.get(messageId);
        
        if (currentReaction === reaction) {
            // Remove reaction
            const { error } = await supabase
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId)
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            
            userReactions.delete(messageId);
            
            // Update message counts
            await updateMessageReactionCount(messageId, reaction, -1);
            
        } else {
            // Remove previous reaction if exists
            if (currentReaction) {
                await supabase
                    .from('message_reactions')
                    .delete()
                    .eq('message_id', messageId)
                    .eq('user_id', currentUser.id);
                
                await updateMessageReactionCount(messageId, currentReaction, -1);
            }
            
            // Add new reaction
            const { error } = await supabase
                .from('message_reactions')
                .insert({
                    message_id: messageId,
                    user_id: currentUser.id,
                    reaction: reaction
                });
            
            if (error) throw error;
            
            userReactions.set(messageId, reaction);
            
            // Update message counts
            await updateMessageReactionCount(messageId, reaction, 1);
        }
        
        // Update UI
        updateMessageReactionUI(messageId);
        
    } catch (error) {
        console.error('Error reacting to message:', error);
    }
}

async function updateMessageReactionCount(messageId, reaction, delta) {
    const column = reaction === 'like' ? 'likes' : 'dislikes';
    
    const { data: message } = await supabase
        .from('messages')
        .select(column)
        .eq('id', messageId)
        .single();
    
    const newCount = Math.max(0, (message[column] || 0) + delta);
    
    await supabase
        .from('messages')
        .update({ [column]: newCount })
        .eq('id', messageId);
}

function updateMessageReactionUI(messageId) {
    const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
    if (!messageElement) return;
    
    const likeBtn = messageElement.querySelector('.like-btn');
    const dislikeBtn = messageElement.querySelector('.dislike-btn');
    const likeCount = messageElement.querySelector('.like-btn .count');
    const dislikeCount = messageElement.querySelector('.dislike-btn .count');
    
    const userReaction = userReactions.get(messageId);
    
    // Update button states
    likeBtn.classList.toggle('liked', userReaction === 'like');
    dislikeBtn.classList.toggle('disliked', userReaction === 'dislike');
    
    // Update counts from database (could fetch if needed)
    // For now, just toggle visual states
}

// ===== ADMIN FUNCTIONS =====
async function sendAnnouncement() {
    const content = announcementText.value.trim();
    
    if (!content) {
        showNotification('Please enter announcement text', 'warning');
        return;
    }
    
    if (currentUser.role !== 'owner') {
        showNotification('Only owner can send announcements', 'error');
        return;
    }
    
    try {
        // Create announcement
        const { data: announcement, error } = await supabase
            .from('announcements')
            .insert({
                content: content,
                created_by: currentUser.id
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Send as message to all rooms
        const rooms = ['open', 'public'];
        for (const room of rooms) {
            await supabase
                .from('messages')
                .insert({
                    room: room,
                    user_id: currentUser.id,
                    username: currentUser.username,
                    content: content,
                    is_announcement: true
                });
        }
        
        showNotification('Announcement sent to all users', 'success');
        announcementModal.classList.add('hidden');
        announcementText.value = '';
        
    } catch (error) {
        console.error('Error sending announcement:', error);
        showNotification('Failed to send announcement', 'error');
    }
}

async function kickUser() {
    const username = kickUsername.value.trim();
    
    if (!username) {
        showNotification('Please enter username', 'warning');
        return;
    }
    
    if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
        showNotification('Admin privileges required', 'error');
        return;
    }
    
    if (username === currentUser.username) {
        showNotification('Cannot kick yourself', 'warning');
        return;
    }
    
    try {
        // Get user to kick
        const { data: userToKick } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();
        
        if (!userToKick) {
            showNotification('User not found', 'error');
            return;
        }
        
        // Record kick
        await supabase
            .from('user_kicks')
            .insert({
                user_id: userToKick.id,
                kicked_by: currentUser.id,
                reason: 'Kicked by admin'
            });
        
        // Update user as offline
        await supabase
            .from('users')
            .update({ is_online: false })
            .eq('id', userToKick.id);
        
        showNotification(`User ${username} has been kicked`, 'success');
        kickUsername.value = '';
        
        // Update online users list
        await updateOnlineUsers();
        
    } catch (error) {
        console.error('Error kicking user:', error);
        showNotification('Failed to kick user', 'error');
    }
}

async function changeUserRole(newRole) {
    const username = adminUsername.value.trim();
    
    if (!username) {
        showNotification('Please enter username', 'warning');
        return;
    }
    
    if (currentUser.role !== 'owner') {
        showNotification('Only owner can change roles', 'error');
        return;
    }
    
    if (username === currentUser.username) {
        showNotification('Cannot change your own role', 'warning');
        return;
    }
    
    try {
        // Update user role
        const { error } = await supabase
            .from('users')
            .update({ role: newRole })
            .eq('username', username);
        
        if (error) throw error;
        
        showNotification(`User ${username} is now ${newRole}`, 'success');
        adminUsername.value = '';
        
        // Update online users list
        await updateOnlineUsers();
        
    } catch (error) {
        console.error('Error changing user role:', error);
        showNotification('Failed to change user role', 'error');
    }
}

async function banUser() {
    const username = banUsername.value.trim();
    
    if (!username) {
        showNotification('Please enter username', 'warning');
        return;
    }
    
    if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
        showNotification('Admin privileges required', 'error');
        return;
    }
    
    if (username === currentUser.username) {
        showNotification('Cannot ban yourself', 'warning');
        return;
    }
    
    try {
        // Get user to ban
        const { data: userToBan } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();
        
        if (!userToBan) {
            showNotification('User not found', 'error');
            return;
        }
        
        // Delete all user messages
        await supabase
            .from('messages')
            .update({ is_deleted: true })
            .eq('user_id', userToBan.id);
        
        // Set user as offline
        await supabase
            .from('users')
            .update({ is_online: false })
            .eq('id', userToBan.id);
        
        showNotification(`User ${username} has been banned`, 'success');
        banUsername.value = '';
        
        // Update online users list
        await updateOnlineUsers();
        // Reload messages to remove banned user's messages
        loadMessages(currentRoom);
        
    } catch (error) {
        console.error('Error banning user:', error);
        showNotification('Failed to ban user', 'error');
    }
}

async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    try {
        // Check permissions
        const { data: message } = await supabase
            .from('messages')
            .select('user_id, username')
            .eq('id', messageId)
            .single();
        
        if (!message) {
            showNotification('Message not found', 'error');
            return;
        }
        
        const canDelete = currentUser.role === 'owner' || 
                         currentUser.role === 'admin' || 
                         message.username === currentUser.username;
        
        if (!canDelete) {
            showNotification('You do not have permission to delete this message', 'error');
            return;
        }
        
        // Soft delete the message
        const { error } = await supabase
            .from('messages')
            .update({ 
                is_deleted: true,
                deleted_by: currentUser.id
            })
            .eq('id', messageId);
        
        if (error) throw error;
        
        // Remove from UI
        const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
        
        showNotification('Message deleted', 'success');
        
    } catch (error) {
        console.error('Error deleting message:', error);
        showNotification('Failed to delete message', 'error');
    }
}

// ===== FILE HANDLING =====
function handleFileSelect(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    if (file.size > 6 * 1024 * 1024) {
        showNotification('File size must be less than 6MB', 'error');
        return;
    }
    
    selectedFile = file;
    
    // Show preview
    filePreview.classList.remove('hidden');
    fileName.textContent = file.name;
    document.getElementById('fileInfo').textContent = ` (${formatFileSize(file.size)})`;
    
    // Clear file input
    e.target.value = '';
}

function removeSelectedFile() {
    selectedFile = null;
    filePreview.classList.add('hidden');
    fileName.textContent = '';
    document.getElementById('fileInfo').textContent = '';
}

async function uploadFile(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;
        
        const { data, error } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file);
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath);
        
        return publicUrl;
        
    } catch (error) {
        console.error('Error uploading file:', error);
        return null;
    }
}

function previewImage(url, filename) {
    previewImage.src = url;
    document.getElementById('imageName').textContent = filename;
    imagePreviewModal.classList.remove('hidden');
}

// ===== TYPING INDICATORS =====
function handleTyping() {
    if (!isTyping) {
        isTyping = true;
        updateTypingStatus();
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        updateTypingStatus();
    }, 1000);
}

async function updateTypingStatus() {
    try {
        await supabase.channel('typing').track({
            user: currentUser.username,
            room: currentRoom,
            typing: isTyping,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error updating typing status:', error);
    }
}

function updateTypingDisplay(state) {
    const typingUsers = [];
    
    for (const [key, value] of Object.entries(state)) {
        const userData = value[0];
        if (userData.user !== currentUser.username && 
            userData.room === currentRoom && 
            userData.typing) {
            typingUsers.push(userData.user);
        }
    }
    
    if (typingUsers.length > 0) {
        const text = typingUsers.length === 1 
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.length} people are typing...`;
        
        typingIndicator.textContent = text;
        typingIndicator.classList.remove('hidden');
    } else {
        typingIndicator.classList.add('hidden');
    }
}

// ===== ROOM MANAGEMENT =====
async function switchRoom(room) {
    if (room === 'admin' && !adminChatBtn.enabled) {
        showNotification('Admin access required', 'error');
        return;
    }
    
    // Update current room
    currentRoom = room;
    
    // Update UI
    roomButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.room === room);
    });
    
    currentRoomTitle.textContent = document.querySelector(`.room-btn[data-room="${room}"]`).dataset.roomName;
    
    // Update user's current room in database
    if (currentUser.id) {
        await supabase
            .from('users')
            .update({ current_room: room })
            .eq('id', currentUser.id);
    }
    
    // Stop typing in previous room
    isTyping = false;
    updateTypingStatus();
    
    // Load messages for new room
    loadMessages(room);
    
    // Update subscription filter
    // Note: In a real app, you'd need to update the subscription
    // For simplicity, we'll reload all subscriptions
    setupSubscriptions();
}

// ===== USER MANAGEMENT =====
async function updateOnlineUsers() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, role, is_online, current_room')
            .eq('is_online', true)
            .order('username');
        
        if (error) throw error;
        
        // Update count
        onlineUsers.clear();
        users.forEach(user => onlineUsers.set(user.id, user));
        
        onlineCount.textContent = users.length;
        onlineCountSidebar.textContent = users.length;
        
        // Update user list
        updateUserList(users);
        
        // Update room counts
        updateRoomCounts(users);
        
    } catch (error) {
        console.error('Error updating online users:', error);
    }
}

function updateUserList(users) {
    userList.innerHTML = '';
    
    if (users.length === 0) {
        userList.innerHTML = '<div class="empty-users">No users online</div>';
        return;
    }
    
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="user-info-sidebar">
                <div class="user-name">${escapeHtml(user.username)}</div>
                <div class="user-status ${user.is_online ? 'online' : ''}">
                    <svg class="online-icon" width="8" height="8" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M1.371 8.143c5.858-5.857 15.356-5.857 21.213 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.06 0c-4.98-4.979-13.053-4.979-18.032 0a.75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182c4.1-4.1 10.749-4.1 14.85 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.062 0 8.25 8.25 0 0 0-11.667 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.204 3.182a6 6 0 0 1 8.486 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0 3.75 3.75 0 0 0-5.304 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182a1.5 1.5 0 0 1 2.122 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0l-.53-.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
                    </svg>
                    ${user.current_room}
                </div>
            </div>
            <div class="user-role ${user.role}">${user.role}</div>
        `;
        userList.appendChild(userElement);
    });
}

function updateRoomCounts(users) {
    const counts = { open: 0, public: 0, admin: 0 };
    
    users.forEach(user => {
        if (counts.hasOwnProperty(user.current_room)) {
            counts[user.current_room]++;
        }
    });
    
    document.getElementById('openCount').textContent = counts.open;
    document.getElementById('publicCount').textContent = counts.public;
    document.getElementById('adminCount').textContent = counts.admin;
}

// ===== THEME FUNCTIONS =====
function applyTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('niamchat_theme', theme);
    
    // Update theme preview in modal if open
    highlightSelectedTheme(theme);
}

function highlightSelectedTheme(theme) {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.toggle('active', option.dataset.theme === theme);
    });
}

// ===== UI HELPERS =====
function toggleSidebar() {
    sidebar.classList.toggle('active');
}

function toggleSearchModal() {
    searchModal.classList.toggle('hidden');
    if (!searchModal.classList.contains('hidden')) {
        searchInput.focus();
    }
}

function toggleEmojiPicker() {
    emojiPicker.classList.toggle('active');
    emojiPickerActive = !emojiPickerActive;
}

function insertAtCursor(text) {
    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    const value = messageInput.value;
    
    messageInput.value = value.substring(0, start) + text + value.substring(end);
    messageInput.selectionStart = messageInput.selectionEnd = start + text.length;
    messageInput.focus();
    updateCharCount();
}

function updateCharCount() {
    const count = messageInput.value.length;
    charCount.textContent = `${count}/1000`;
    charCount.style.color = count > 900 ? 'var(--danger)' : 'var(--text-tertiary)';
}

function handleMessageKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleResize() {
    if (window.innerWidth < 768) {
        sidebar.classList.remove('active');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to leave the chat?')) {
        // Update user as offline
        if (currentUser.id) {
            supabase
                .from('users')
                .update({ is_online: false })
                .eq('id', currentUser.id);
        }
        
        // Clear local storage
        localStorage.removeItem('niamchat_session');
        
        // Reload page
        location.reload();
    }
}

function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        searchResults.innerHTML = '<div class="empty-search"><p>Enter a search term to find messages</p></div>';
        return;
    }
    
    // Search in current room messages
    const roomMessages = messages.get(currentRoom) || [];
    const results = roomMessages.filter(msg => 
        msg.content.toLowerCase().includes(query) && !msg.is_deleted
    );
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="empty-search"><p>No messages found</p></div>';
        return;
    }
    
    let html = '';
    results.forEach(msg => {
        html += `
            <div class="search-result" onclick="scrollToMessage('${msg.id}')">
                <div class="result-sender">${escapeHtml(msg.username)}</div>
                <div class="result-content">${escapeHtml(msg.content.substring(0, 100))}...</div>
                <div class="result-time">${formatTime(msg.created_at)}</div>
            </div>
        `;
    });
    
    searchResults.innerHTML = html;
}

function scrollToMessage(messageId) {
    const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
    if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('highlight');
        setTimeout(() => messageElement.classList.remove('highlight'), 2000);
    }
    searchModal.classList.add('hidden');
}

// ===== FORMATTING FUNCTIONS =====
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    } else if (diff < 604800000) { // Less than 1 week
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function formatMessageContent(content) {
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let formatted = escapeHtml(content).replace(urlRegex, url => 
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
    
    // Convert newlines to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <svg class="notification-icon" viewBox="0 0 24 24">
            ${getNotificationIcon(type)}
        </svg>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
        </button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>';
        case 'error':
            return '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>';
        case 'warning':
            return '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>';
        default:
            return '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>';
    }
}

// ===== LOAD SAVED SETTINGS =====
function loadSavedSettings() {
    const soundEnabled = localStorage.getItem('niamchat_sound') !== 'false';
    const typingEnabled = localStorage.getItem('niamchat_typing') !== 'false';
    const imagesEnabled = localStorage.getItem('niamchat_images') !== 'false';
    const autoScroll = localStorage.getItem('niamchat_autoscroll') !== 'false';
    
    document.getElementById('soundToggle').checked = soundEnabled;
    document.getElementById('typingIndicatorToggle').checked = typingEnabled;
    document.getElementById('imagePreviewsToggle').checked = imagesEnabled;
    document.getElementById('autoScrollToggle').checked = autoScroll;
}

// ===== GLOBAL FUNCTIONS FOR HTML ONCLICK =====
window.previewImage = previewImage;
window.reactToMessage = reactToMessage;
window.replyToMessage = (messageId, username) => {
    messageInput.value = `@${username} `;
    messageInput.focus();
};
window.deleteMessage = deleteMessage;
window.scrollToMessage = scrollToMessage;

// ===== REAL-TIME HANDLERS =====
function handleNewMessage(message) {
    if (message.room === currentRoom && !message.is_deleted) {
        addMessageToDOM(message);
        scrollToBottom();
        
        // Play notification sound if enabled
        if (localStorage.getItem('niamchat_sound') !== 'false' && 
            message.username !== currentUser.username) {
            playNotificationSound();
        }
    }
}

function handleDeletedMessage(messageId) {
    const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
    if (messageElement) {
        messageElement.remove();
    }
}

function playNotificationSound() {
    // Simple notification sound
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

// ===== HEARTBEAT FOR ONLINE STATUS =====
setInterval(async () => {
    if (currentUser.id) {
        await supabase
            .from('users')
            .update({ 
                last_seen: new Date().toISOString(),
                current_room: currentRoom
            })
            .eq('id', currentUser.id);
    }
}, 30000); // Update every 30 seconds

// ===== INITIALIZE ONLINE USERS =====
setTimeout(() => {
    if (currentUser.id) {
        updateOnlineUsers();
    }
}, 2000);
