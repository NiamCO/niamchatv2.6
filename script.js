// ===== NAMECHAT - ULTIMATE FIX =====
// This will WORK because it avoids all naming conflicts

// Use a DIFFERENT variable name to avoid conflict
const NIAMCHAT_SUPABASE_URL = 'https://tayhblmwkaujtkuulfqj.supabase.co';
const NIAMCHAT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRheWhibG13a2F1anRrdXVsZnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDQxNDEsImV4cCI6MjA4NTkyMDE0MX0.CY3cjbUqeVUynIHrsZ62fHCxFK-FtPxjxPOYwYL7a4E'; // ← SAME AS DEBUG TEST

console.log('🔥 NIAMCHAT ULTIMATE FIX - STARTING');

// Use a unique variable name
let niamchatClient = null;
let niamchatCurrentUser = {
    id: null,
    username: '',
    role: 'user',
    sessionId: null
};
let niamchatCurrentRoom = 'open';

// Wait for Supabase to load
function waitForSupabaseLoad() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        function check() {
            attempts++;
            console.log(`Waiting for Supabase... attempt ${attempts}`);
            
            if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                console.log('✅ Supabase JS found!');
                resolve();
            } else if (attempts >= maxAttempts) {
                reject(new Error('Supabase JS never loaded'));
            } else {
                setTimeout(check, 100);
            }
        }
        
        check();
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🟢 DOM Ready - Starting NiamChat');
    
    try {
        // Wait for Supabase
        await waitForSupabaseLoad();
        
        // Create client with UNIQUE name
        niamchatClient = window.supabase.createClient(NIAMCHAT_SUPABASE_URL, NIAMCHAT_SUPABASE_KEY);
        console.log('✅ NiamChat Supabase client created');
        
        // Start the app
        startNiamChatApp();
        
    } catch (error) {
        console.error('❌ NiamChat failed to start:', error);
        showSimpleAlert('Chat failed to load. Please refresh the page.');
    }
});

function startNiamChatApp() {
    console.log('🚀 Starting NiamChat app...');
    
    // Get elements
    const usernameModal = document.getElementById('usernameModal');
    const chatApp = document.getElementById('chatApp');
    const usernameInput = document.getElementById('usernameInput');
    const startBtn = document.getElementById('startChatBtn');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const messagesDiv = document.getElementById('messagesContainer');
    const currentUserDisplay = document.getElementById('currentUsername');
    const roleBadge = document.getElementById('userRoleBadge');
    
    if (!usernameModal || !startBtn) {
        console.error('❌ Required elements not found');
        return;
    }
    
    console.log('✅ All DOM elements found');
    
    // Show modal
    usernameModal.classList.add('active');
    if (usernameInput) usernameInput.focus();
    
    // Handle start button
    startBtn.addEventListener('click', async function() {
        const username = usernameInput.value.trim();
        console.log('🎯 Start clicked, username:', username);
        
        if (!username || username.length < 3) {
            alert('Username must be at least 3 characters');
            return;
        }
        
        try {
            // Check if user exists
            const { data: existingUser, error: checkError } = await niamchatClient
                .from('users')
                .select('id, username, role')
                .eq('username', username)
                .single();
            
            console.log('User check result:', { existingUser, checkError });
            
            let userId;
            let userRole = 'user';
            
            if (checkError && checkError.code === 'PGRST116') {
                // User doesn't exist - create it
                console.log('Creating new user...');
                userRole = username.toLowerCase() === 'doneman123' ? 'owner' : 'user';
                
                const { data: newUser, error: createError } = await niamchatClient
                    .from('users')
                    .insert({
                        username: username,
                        role: userRole,
                        is_online: true,
                        current_room: 'open'
                    })
                    .select()
                    .single();
                
                if (createError) {
                    console.error('Create user error:', createError);
                    alert('Failed to create user: ' + createError.message);
                    return;
                }
                
                userId = newUser.id;
                userRole = newUser.role;
                console.log('New user created:', newUser);
                
            } else if (checkError) {
                console.error('Database error:', checkError);
                alert('Database error: ' + checkError.message);
                return;
            } else {
                // User exists
                userId = existingUser.id;
                userRole = existingUser.role;
                console.log('Existing user found:', existingUser);
            }
            
            // Save user info
            niamchatCurrentUser = {
                id: userId,
                username: username,
                role: userRole,
                sessionId: 'session_' + Date.now()
            };
            
            // Save to localStorage
            localStorage.setItem('niamchat_username', username);
            
            // Hide modal, show chat
            usernameModal.classList.remove('active');
            chatApp.classList.remove('hidden');
            
            // Update UI
            if (currentUserDisplay) currentUserDisplay.textContent = username;
            if (roleBadge) {
                roleBadge.textContent = userRole;
                roleBadge.className = `role-badge ${userRole}`;
            }
            
            // Load messages
            await loadNiamChatMessages(messagesDiv);
            
            // Setup real-time
            setupNiamChatRealtime(messagesDiv);
            
            // Focus input
            if (messageInput) {
                setTimeout(() => messageInput.focus(), 100);
            }
            
            console.log('🎉 CHAT STARTED SUCCESSFULLY! User:', niamchatCurrentUser);
            
        } catch (error) {
            console.error('❌ Error starting chat:', error);
            alert('Error: ' + error.message);
        }
    });
    
    // Handle Enter key in username input
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                startBtn.click();
            }
        });
    }
    
    // Handle send message
    if (sendBtn && messageInput) {
        sendBtn.addEventListener('click', async function() {
            await sendNiamChatMessage(messageInput, messagesDiv);
        });
        
        messageInput.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                await sendNiamChatMessage(messageInput, messagesDiv);
            }
        });
    }
    
    // Check for auto-login
    const savedUsername = localStorage.getItem('niamchat_username');
    if (savedUsername && niamchatClient) {
        console.log('Found saved username, attempting auto-login:', savedUsername);
        // We'll handle auto-login after user clicks start
    }
}

async function loadNiamChatMessages(messagesDiv) {
    if (!messagesDiv || !niamchatClient) return;
    
    console.log('📨 Loading messages...');
    
    try {
        const { data: messages, error } = await niamchatClient
            .from('messages')
            .select('*')
            .eq('room', niamchatCurrentRoom)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(50);
        
        if (error) {
            console.error('Load messages error:', error);
            return;
        }
        
        console.log(`Loaded ${messages?.length || 0} messages`);
        
        // Clear and display messages
        messagesDiv.innerHTML = '';
        
        if (messages && messages.length > 0) {
            messages.forEach(msg => {
                addMessageToUI(msg, messagesDiv);
            });
            
            // Scroll to bottom
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        } else {
            messagesDiv.innerHTML = `
                <div class="empty-state">
                    <p>No messages yet. Be the first to chat!</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendNiamChatMessage(messageInput, messagesDiv) {
    if (!messageInput || !niamchatClient || !niamchatCurrentUser.id) return;
    
    const content = messageInput.value.trim();
    if (!content) return;
    
    console.log('Sending message:', content);
    
    try {
        const { error } = await niamchatClient
            .from('messages')
            .insert({
                room: niamchatCurrentRoom,
                user_id: niamchatCurrentUser.id,
                username: niamchatCurrentUser.username,
                content: content
            });
        
        if (error) {
            console.error('Send error:', error);
            alert('Failed to send message');
            return;
        }
        
        // Clear input
        messageInput.value = '';
        console.log('✅ Message sent');
        
    } catch (error) {
        console.error('Error sending:', error);
    }
}

function setupNiamChatRealtime(messagesDiv) {
    if (!messagesDiv || !niamchatClient) return;
    
    console.log('🔗 Setting up real-time...');
    
    niamchatClient
        .channel('niamchat-messages')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `room=eq.${niamchatCurrentRoom}`
            }, 
            (payload) => {
                console.log('Real-time message:', payload.new);
                addMessageToUI(payload.new, messagesDiv);
                
                // Scroll to bottom
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        )
        .subscribe((status) => {
            console.log('Real-time status:', status);
        });
}

function addMessageToUI(message, container) {
    if (!message || !container) return;
    
    const isOwner = message.username.toLowerCase() === 'doneman123';
    const isCurrentUser = message.username === niamchatCurrentUser.username;
    const isAdmin = message.role === 'admin' || isOwner;
    
    // Remove empty state if present
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwner ? 'owner' : ''} ${isAdmin ? 'admin' : ''}`;
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
            <div class="message-text">${escapeHtml(message.content)}</div>
        </div>
    `;
    
    container.appendChild(messageDiv);
}

// Helper functions
function formatTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'Now';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSimpleAlert(message) {
    alert(message);
}

// Global functions for HTML onclick (keep same interface)
window.previewImage = function(url, filename) {
    console.log('Preview:', url);
    // Implement if needed
};

window.reactToMessage = function(messageId, reaction) {
    console.log('React:', messageId, reaction);
    // Implement if needed
};

window.replyToMessage = function(messageId, username) {
    const input = document.getElementById('messageInput');
    if (input) {
        input.value = `@${username} `;
        input.focus();
    }
};

window.deleteMessage = function(messageId) {
    if (confirm('Delete this message?')) {
        console.log('Delete:', messageId);
        // Implement if needed
    }
};

console.log('✅ NIAMCHAT SCRIPT LOADED - Waiting for DOM...');
