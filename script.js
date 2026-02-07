// ===== CONFIGURATION =====
// ⚠️ USE THE SAME KEY THAT WORKED IN DEBUG TEST ⚠️
const SUPABASE_URL = 'https://tayhblmwkaujtkuulfqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRheWhibG13a2F1anRrdXVsZnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDQxNDEsImV4cCI6MjA4NTkyMDE0MX0.CY3cjbUqeVUynIHrsZ62fHCxFK-FtPxjxPOYwYL7a4E'; // ← SAME AS DEBUG TEST

console.log('🚀 NiamChat Starting...');
console.log('URL:', SUPABASE_URL);

// Initialize Supabase
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client created');
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    alert('Failed to initialize chat. Check console for errors.');
}

// ===== GLOBAL STATE =====
let currentUser = {
    id: null,
    username: '',
    role: 'user',
    sessionId: null
};

let currentRoom = 'open';
let currentTheme = 'seaside';

// ===== DOM ELEMENTS =====
const usernameModal = document.getElementById('usernameModal');
const chatApp = document.getElementById('chatApp');
const usernameInput = document.getElementById('usernameInput');
const usernameError = document.getElementById('usernameError');
const startChatBtn = document.getElementById('startChatBtn');
const currentUsername = document.getElementById('currentUsername');
const userRoleBadge = document.getElementById('userRoleBadge');
const onlineCount = document.getElementById('onlineCount');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    // Setup event listeners
    startChatBtn.addEventListener('click', handleStartChat);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleStartChat();
    });
    
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Check for saved session
    const savedUsername = localStorage.getItem('niamchat_username');
    if (savedUsername) {
        usernameModal.classList.remove('active');
        chatApp.classList.remove('hidden');
        currentUsername.textContent = savedUsername;
        loadMessages();
    } else {
        usernameModal.classList.add('active');
        usernameInput.focus();
    }
});

// ===== MAIN FUNCTIONS =====
async function handleStartChat() {
    const username = usernameInput.value.trim();
    console.log('Starting chat for:', username);
    
    if (!username || username.length < 3) {
        usernameError.textContent = 'Username must be at least 3 characters';
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
            console.error('Error:', error);
            usernameError.textContent = 'Database error';
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
                usernameError.textContent = 'Failed to create user';
                return;
            }
            
            currentUser = {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
                sessionId: 'session_' + Date.now()
            };
            console.log('New user:', currentUser);
        }
        
        // Save to localStorage
        localStorage.setItem('niamchat_username', currentUser.username);
        
        // Hide modal, show chat
        usernameModal.classList.remove('active');
        chatApp.classList.remove('hidden');
        
        // Update UI
        currentUsername.textContent = currentUser.username;
        userRoleBadge.textContent = currentUser.role;
        userRoleBadge.className = `role-badge ${currentUser.role}`;
        
        // Load messages
        loadMessages();
        
        // Setup real-time
        setupRealtime();
        
        // Focus message input
        setTimeout(() => messageInput.focus(), 100);
        
        console.log('✅ Chat started successfully!');
        
    } catch (error) {
        console.error('Error in handleStartChat:', error);
        usernameError.textContent = 'Error: ' + error.message;
    }
}

async function loadMessages() {
    console.log('Loading messages...');
    
    try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('room', currentRoom)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('Load messages error:', error);
            return;
        }
        
        console.log('Messages loaded:', messages?.length || 0);
        
        messagesContainer.innerHTML = '';
        
        if (messages && messages.length > 0) {
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message';
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-sender">${msg.username}</span>
                            <span class="message-time">${formatTime(msg.created_at)}</span>
                        </div>
                        <div class="message-text">${msg.content}</div>
                    </div>
                `;
                messagesContainer.appendChild(messageDiv);
            });
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendMessage() {
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

function setupRealtime() {
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
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message';
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-sender">${msg.username}</span>
                            <span class="message-time">${formatTime(msg.created_at)}</span>
                        </div>
                        <div class="message-text">${msg.content}</div>
                    </div>
                `;
                messagesContainer.appendChild(messageDiv);
                
                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        )
        .subscribe();
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ===== GLOBAL FUNCTIONS =====
window.previewImage = (url, filename) => {
    console.log('Preview image:', url);
};

window.reactToMessage = (messageId, reaction) => {
    console.log('React to message:', messageId, reaction);
};

window.replyToMessage = (messageId, username) => {
    messageInput.value = `@${username} `;
    messageInput.focus();
};

window.deleteMessage = (messageId) => {
    console.log('Delete message:', messageId);
};

window.scrollToMessage = (messageId) => {
    console.log('Scroll to message:', messageId);
};

console.log('✅ NiamChat script loaded');
