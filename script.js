// ===== CONFIGURATION =====
// ⚠️ USE THE SAME KEY THAT WORKED IN DEBUG TEST ⚠️
const SUPABASE_URL = 'https://tayhblmwkaujtkuulfqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRheWhibG13a2F1anRrdXVsZnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDQxNDEsImV4cCI6MjA4NTkyMDE0MX0.CY3cjbUqeVUynIHrsZ62fHCxFK-FtPxjxPOYwYL7a4E'; // ← SAME AS DEBUG TEST

console.log('🚀 NiamChat Starting...');
console.log('URL:', SUPABASE_URL);

// Global variables
let supabase;
let currentUser = {
    id: null,
    username: '',
    role: 'user',
    sessionId: null
};
let currentRoom = 'open';
let currentTheme = 'seaside';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded');
    
    try {
        // Wait for Supabase to be available
        await waitForSupabase();
        
        // Initialize Supabase client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client created');
        
        // Setup the app
        setupApp();
        
    } catch (error) {
        console.error('❌ Failed to initialize:', error);
        alert('Failed to load chat. Please refresh the page.');
    }
});

// Wait for Supabase JS to load
function waitForSupabase() {
    return new Promise((resolve, reject) => {
        const maxWaitTime = 10000; // 10 seconds
        const startTime = Date.now();
        
        function check() {
            if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                console.log('✅ Supabase JS loaded');
                resolve();
            } else if (Date.now() - startTime > maxWaitTime) {
                reject(new Error('Supabase JS failed to load'));
            } else {
                setTimeout(check, 100);
            }
        }
        
        check();
    });
}

function setupApp() {
    console.log('Setting up app...');
    
    // Get DOM elements
    const usernameModal = document.getElementById('usernameModal');
    const chatApp = document.getElementById('chatApp');
    const usernameInput = document.getElementById('usernameInput');
    const usernameError = document.getElementById('usernameError');
    const startChatBtn = document.getElementById('startChatBtn');
    const currentUsername = document.getElementById('currentUsername');
    const userRoleBadge = document.getElementById('userRoleBadge');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // Setup event listeners
    startChatBtn.addEventListener('click', () => handleStartChat(
        usernameInput, usernameError, usernameModal, chatApp, 
        currentUsername, userRoleBadge, messagesContainer, messageInput
    ));
    
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleStartChat(
                usernameInput, usernameError, usernameModal, chatApp,
                currentUsername, userRoleBadge, messagesContainer, messageInput
            );
        }
    });
    
    sendBtn.addEventListener('click', () => sendMessage(messageInput, messagesContainer));
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage(messageInput, messagesContainer);
    });
    
    // Check for saved session
    const savedUsername = localStorage.getItem('niamchat_username');
    if (savedUsername) {
        console.log('Auto-login with saved username:', savedUsername);
        usernameModal.classList.remove('active');
        chatApp.classList.remove('hidden');
        currentUsername.textContent = savedUsername;
        loadMessages(messagesContainer);
    } else {
        console.log('No saved session, showing login modal');
        usernameModal.classList.add('active');
        if (usernameInput) usernameInput.focus();
    }
}

// ===== MAIN FUNCTIONS =====
async function handleStartChat(
    usernameInput, usernameError, usernameModal, chatApp,
    currentUsername, userRoleBadge, messagesContainer, messageInput
) {
    const username = usernameInput.value.trim();
    console.log('Starting chat for:', username);
    
    if (!username || username.length < 3) {
        if (usernameError) usernameError.textContent = 'Username must be at least 3 characters';
        return;
    }
    
    try {
        // Check if user exists
        const { data: existingUser, error } = await supabase
            .from('users')
            .select('id, username, role')
            .eq('username', username)
            .single();
        
        console.log('User check:', { existingUser, error });
        
        if (error && error.code !== 'PGRST116') {
            console.error('Database error:', error);
            if (usernameError) usernameError.textContent = 'Database error: ' + error.message;
            return;
        }
        
        if (existingUser) {
            // User exists
            currentUser = {
                id: existingUser.id,
                username: existingUser.username,
                role: existingUser.role,
                sessionId: 'session_' + Date.now()
            };
            console.log('Existing user:', currentUser);
        } else {
            // Create new user
            const role = username.toLowerCase() === 'doneman123' ? 'owner' : 'user';
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    username: username,
                    role: role,
                    is_online: true,
                    current_room: 'open'
                })
                .select()
                .single();
            
            if (createError) {
                console.error('Create error:', createError);
                if (usernameError) usernameError.textContent = 'Failed to create user: ' + createError.message;
                return;
            }
            
            currentUser = {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
                sessionId: 'session_' + Date.now()
            };
            console.log('New user created:', currentUser);
        }
        
        // Save to localStorage
        localStorage.setItem('niamchat_username', currentUser.username);
        
        // Hide modal, show chat
        if (usernameModal) usernameModal.classList.remove('active');
        if (chatApp) chatApp.classList.remove('hidden');
        
        // Update UI
        if (currentUsername) currentUsername.textContent = currentUser.username;
        if (userRoleBadge) {
            userRoleBadge.textContent = currentUser.role;
            userRoleBadge.className = `role-badge ${currentUser.role}`;
        }
        
        // Load messages
        loadMessages(messagesContainer);
        
        // Setup real-time
        setupRealtime(messagesContainer);
        
        // Focus message input
        setTimeout(() => {
            if (messageInput) {
                messageInput.focus();
                console.log('Message input focused');
            }
        }, 100);
        
        console.log('✅ Chat started successfully!');
        
    } catch (error) {
        console.error('Error in handleStartChat:', error);
        if (usernameError) usernameError.textContent = 'Error: ' + error.message;
    }
}

async function loadMessages(messagesContainer) {
    if (!messagesContainer) return;
    
    console.log('Loading messages...');
    
    try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('room', currentRoom)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(50);
        
        if (error) {
            console.error('Load messages error:', error);
            return;
        }
        
        console.log('Messages loaded:', messages?.length || 0);
        
        messagesContainer.innerHTML = '';
        
        if (messages && messages.length > 0) {
            messages.forEach(msg => {
                const isOwner = msg.username.toLowerCase() === 'doneman123';
                const isCurrentUser = msg.username === currentUser.username;
                const isAdmin = msg.role === 'admin' || isOwner;
                
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${isOwner ? 'owner' : ''} ${isAdmin ? 'admin' : ''}`;
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <div class="message-header">
                            <div class="message-sender">
                                <span class="sender-name">${escapeHtml(msg.username)}</span>
                                ${isOwner ? '<span class="owner-tag">👑 Owner</span>' : ''}
                                ${isAdmin && !isOwner ? '<span class="admin-tag">🛡️ Admin</span>' : ''}
                            </div>
                            <div class="message-time">${formatTime(msg.created_at)}</div>
                        </div>
                        <div class="message-text">${formatMessageContent(msg.content)}</div>
                    </div>
                `;
                messagesContainer.appendChild(messageDiv);
            });
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendMessage(messageInput, messagesContainer) {
    if (!messageInput) return;
    
    const content = messageInput.value.trim();
    
    if (!content) return;
    
    console.log('Sending message:', content);
    
    try {
        const { error } = await supabase
            .from('messages')
            .insert({
                room: currentRoom,
                user_id: currentUser.id,
                username: currentUser.username,
                content: content
            });
        
        if (error) {
            console.error('Send message error:', error);
            return;
        }
        
        messageInput.value = '';
        console.log('✅ Message sent');
        
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

function setupRealtime(messagesContainer) {
    if (!messagesContainer) return;
    
    console.log('Setting up real-time...');
    
    supabase
        .channel('messages-channel')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `room=eq.${currentRoom}`
            }, 
            (payload) => {
                console.log('New message via real-time:', payload.new);
                
                const msg = payload.new;
                const isOwner = msg.username.toLowerCase() === 'doneman123';
                const isCurrentUser = msg.username === currentUser.username;
                const isAdmin = msg.role === 'admin' || isOwner;
                
                // Remove empty state if present
                const emptyState = messagesContainer.querySelector('.empty-state');
                if (emptyState) emptyState.remove();
                
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${isOwner ? 'owner' : ''} ${isAdmin ? 'admin' : ''}`;
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <div class="message-header">
                            <div class="message-sender">
                                <span class="sender-name">${escapeHtml(msg.username)}</span>
                                ${isOwner ? '<span class="owner-tag">👑 Owner</span>' : ''}
                                ${isAdmin && !isOwner ? '<span class="admin-tag">🛡️ Admin</span>' : ''}
                            </div>
                            <div class="message-time">${formatTime(msg.created_at)}</div>
                        </div>
                        <div class="message-text">${formatMessageContent(msg.content)}</div>
                    </div>
                `;
                messagesContainer.appendChild(messageDiv);
                
                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        )
        .subscribe((status) => {
            console.log('Real-time subscription status:', status);
        });
}

// ===== HELPER FUNCTIONS =====
function formatTime(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    } catch (e) {
        return 'Recently';
    }
}

function formatMessageContent(content) {
    if (!content) return '';
    
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
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== GLOBAL FUNCTIONS (for HTML onclick) =====
window.previewImage = (url, filename) => {
    console.log('Preview image:', url);
    // You can implement image preview modal here
};

window.reactToMessage = (messageId, reaction) => {
    console.log('React to message:', messageId, reaction);
    // Implement reaction functionality
};

window.replyToMessage = (messageId, username) => {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = `@${username} `;
        messageInput.focus();
    }
};

window.deleteMessage = (messageId) => {
    console.log('Delete message:', messageId);
    if (confirm('Are you sure you want to delete this message?')) {
        // Implement delete functionality
    }
};

window.scrollToMessage = (messageId) => {
    console.log('Scroll to message:', messageId);
    const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
    if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth' });
    }
};

console.log('✅ NiamChat script loaded - Waiting for DOM...');
