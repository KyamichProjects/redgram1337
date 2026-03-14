
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import fs from 'fs';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Ensure Tdata directory exists
const tdataDir = path.join(__dirname, 'Tdata');
if (!fs.existsSync(tdataDir)) {
    fs.mkdirSync(tdataDir);
}

// Database Setup
const db = new sqlite3.Database(path.join(tdataDir, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database in Tdata.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            name TEXT,
            bio TEXT,
            phone TEXT,
            avatarColor TEXT,
            avatar TEXT, 
            isPremium INTEGER DEFAULT 0,
            isAdmin INTEGER DEFAULT 0
        )`);

        // Attempt to add avatar column if it doesn't exist (migration)
        db.run("ALTER TABLE users ADD COLUMN avatar TEXT", (err) => {
            // Ignore error if column already exists
        });

        // Messages table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            chatId TEXT,
            text TEXT,
            sender TEXT,
            senderId TEXT,
            timestamp INTEGER,
            status TEXT,
            type TEXT,
            mediaUrl TEXT,
            fileName TEXT,
            fileSize TEXT,
            duration INTEGER,
            isEdited INTEGER DEFAULT 0,
            isDeleted INTEGER DEFAULT 0,
            reactions TEXT
        )`);

        // Attempt to add new columns if they don't exist (migration)
        db.run("ALTER TABLE messages ADD COLUMN isEdited INTEGER DEFAULT 0", () => {});
        db.run("ALTER TABLE messages ADD COLUMN isDeleted INTEGER DEFAULT 0", () => {});
        db.run("ALTER TABLE messages ADD COLUMN reactions TEXT", () => {});

        // Promo Codes table
        db.run(`CREATE TABLE IF NOT EXISTS promo_codes (
            code TEXT PRIMARY KEY,
            max_uses INTEGER,
            current_uses INTEGER DEFAULT 0
        )`);

        // User Promo Usage table (to track which user used which code)
        db.run(`CREATE TABLE IF NOT EXISTS user_promo_usage (
            user_id TEXT,
            code TEXT,
            PRIMARY KEY (user_id, code)
        )`);

        // Blocked Users table
        db.run(`CREATE TABLE IF NOT EXISTS blocked_users (
            user_id TEXT,
            blocked_user_id TEXT,
            PRIMARY KEY (user_id, blocked_user_id)
        )`);

        // Archived Chats table
        db.run(`CREATE TABLE IF NOT EXISTS archived_chats (
            user_id TEXT,
            chat_id TEXT,
            PRIMARY KEY (user_id, chat_id)
        )`);

        // Seed initial promo code
        db.run(`INSERT OR IGNORE INTO promo_codes (code, max_uses) VALUES ('welcome10', 999999)`);
    });
}

console.log(`🔴 RedGram Server starting...`);

// Serve static files from the 'dist' directory (Vite build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    if (!req.accepts('html')) return res.sendStatus(404);
    try {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } catch (e) {
        res.send('Build the app first using "npm run build"');
    }
});

function sendUserData(socket, userId) {
    db.all("SELECT blocked_user_id FROM blocked_users WHERE user_id = ?", [userId], (err, rows) => {
        if (!err) {
            socket.emit('BLOCKED_USERS', { blockedUsers: rows.map(r => r.blocked_user_id) });
        }
    });
    db.all("SELECT chat_id FROM archived_chats WHERE user_id = ?", [userId], (err, rows) => {
        if (!err) {
            socket.emit('ARCHIVED_CHATS', { archivedChats: rows.map(r => r.chat_id) });
        }
    });
}

// Track connected users: userId -> socketId
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    let currentUserId = null;

    // 1. Send current state to the new client
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (!err) {
            // Convert isPremium/isAdmin to boolean for frontend
            const formattedUsers = rows.map(u => ({
                ...u,
                isPremium: !!u.isPremium,
                isAdmin: !!u.isAdmin,
                isOnline: connectedUsers.has(u.id) // Add online status
            }));
            socket.emit('INIT_STATE', { users: formattedUsers });
        }
    });

    socket.on('REGISTER', (data) => {
        const { id, username, name, bio, phone, avatarColor, avatar } = data.profile;
        
        // Check if username is taken by ANOTHER user
        db.get("SELECT * FROM users WHERE username = ? AND id != ?", [username, id], (err, row) => {
            if (row) {
                socket.emit('REGISTRATION_ERROR', { message: 'Username is already taken.' });
                return;
            }

            const isAdmin = username === 'kyamich' ? 1 : 0;
            const isPremium = 0; // Default

            // Insert or Update
            db.run(`INSERT INTO users (id, username, name, bio, phone, avatarColor, avatar, isPremium, isAdmin) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET 
                    username=excluded.username, 
                    name=excluded.name, 
                    bio=excluded.bio, 
                    phone=excluded.phone, 
                    avatarColor=excluded.avatarColor,
                    avatar=excluded.avatar,
                    isAdmin=excluded.isAdmin`,
                [id, username, name, bio, phone, avatarColor, avatar, isPremium, isAdmin],
                (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    
                    currentUserId = id;
                    connectedUsers.set(id, socket.id);

                    const profile = { ...data.profile, isAdmin: !!isAdmin, isOnline: true };
                    console.log(`User registered/updated: ${username} (${id})`);
                    
                    socket.emit('REGISTRATION_SUCCESS', { profile });
                    sendUserData(socket, id);
                    
                    // Broadcast that user is ONLINE and updated
                    socket.broadcast.emit('USER_UPDATED', { profile });
                    socket.broadcast.emit('USER_STATUS', { userId: id, isOnline: true });
                }
            );
        });
    });

    socket.on('UPDATE_PROFILE', (data) => {
        const { id, avatar, username, name, bio, phone } = data;
        if (!id) return;

        // If username is being updated, check uniqueness
        if (username) {
            db.get("SELECT * FROM users WHERE username = ? AND id != ?", [username, id], (err, row) => {
                if (row) {
                    socket.emit('UPDATE_ERROR', { message: 'Username is already taken.' });
                    return;
                }
                
                // Proceed with update
                performUpdate();
            });
        } else {
            performUpdate();
        }

        function performUpdate() {
            // Build dynamic update query
            const fields = [];
            const values = [];

            if (avatar !== undefined) { fields.push("avatar = ?"); values.push(avatar); }
            if (username !== undefined) { fields.push("username = ?"); values.push(username); }
            if (name !== undefined) { fields.push("name = ?"); values.push(name); }
            if (bio !== undefined) { fields.push("bio = ?"); values.push(bio); }
            if (phone !== undefined) { fields.push("phone = ?"); values.push(phone); }

            if (fields.length === 0) return;

            values.push(id);

            const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

            db.run(sql, values, (err) => {
                if (err) {
                    console.error("Error updating profile", err);
                    socket.emit('UPDATE_ERROR', { message: 'Database error' });
                    return;
                }
                
                // Fetch updated user to broadcast
                db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
                    if (row) {
                        const updatedProfile = { 
                            ...row, 
                            isPremium: !!row.isPremium, 
                            isAdmin: !!row.isAdmin,
                            isOnline: true 
                        };
                        socket.emit('USER_UPDATED', { profile: updatedProfile });
                        sendUserData(socket, id);
                        socket.broadcast.emit('USER_UPDATED', { profile: updatedProfile });
                    }
                });
            });
        }
    });

    socket.on('REDEEM_PROMO', (data) => {
        console.log('REDEEM_PROMO received', data);
        const { userId, code } = data;
        
        db.get("SELECT * FROM promo_codes WHERE code = ?", [code], (err, promo) => {
            if (err) {
                console.error("Database error checking promo:", err);
                socket.emit('PROMO_RESULT', { success: false, message: 'Server error' });
                return;
            }
            if (!promo) {
                socket.emit('PROMO_RESULT', { success: false, message: 'Invalid code' });
                return;
            }

            // Check if user already used this code
            db.get("SELECT * FROM user_promo_usage WHERE user_id = ? AND code = ?", [userId, code], (err, usage) => {
                if (err) {
                    console.error("Database error checking usage:", err);
                    socket.emit('PROMO_RESULT', { success: false, message: 'Server error' });
                    return;
                }
                if (usage) {
                    socket.emit('PROMO_RESULT', { success: false, message: 'Code already used by you' });
                    return;
                }

                // Apply Premium
                db.run("UPDATE users SET isPremium = 1 WHERE id = ?", [userId], (err) => {
                    if (err) {
                         console.error("Database error updating user:", err);
                         socket.emit('PROMO_RESULT', { success: false, message: 'Database error' });
                         return;
                    }
                    
                    // Record usage
                    db.run("INSERT INTO user_promo_usage (user_id, code) VALUES (?, ?)", [userId, code], (err) => {
                        if (err) console.error("Error recording usage:", err);
                    });
                    
                    db.run("UPDATE promo_codes SET current_uses = current_uses + 1 WHERE code = ?", [code], (err) => {
                        if (err) console.error("Error updating promo count:", err);
                    });

                    socket.emit('PROMO_RESULT', { success: true, message: 'Premium Activated!' });
                    
                    // Notify everyone (or just user) to update UI
                    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, row) => {
                        if (row) {
                            const updatedProfile = { 
                                ...row, 
                                isPremium: !!row.isPremium, 
                                isAdmin: !!row.isAdmin,
                                isOnline: true
                            };
                            socket.emit('USER_UPDATED', { profile: updatedProfile });
                            socket.broadcast.emit('USER_UPDATED', { profile: updatedProfile });
                        }
                    });
                });
            });
        });
    });

    socket.on('BLOCK_USER', (data) => {
        const { userId, blockedUserId } = data;
        db.run("INSERT OR IGNORE INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)", [userId, blockedUserId], (err) => {
            if (!err) sendUserData(socket, userId);
        });
    });

    socket.on('UNBLOCK_USER', (data) => {
        const { userId, blockedUserId } = data;
        db.run("DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?", [userId, blockedUserId], (err) => {
            if (!err) sendUserData(socket, userId);
        });
    });

    socket.on('ARCHIVE_CHAT', (data) => {
        const { userId, chatId } = data;
        db.run("INSERT OR IGNORE INTO archived_chats (user_id, chat_id) VALUES (?, ?)", [userId, chatId], (err) => {
            if (!err) sendUserData(socket, userId);
        });
    });

    socket.on('UNARCHIVE_CHAT', (data) => {
        const { userId, chatId } = data;
        db.run("DELETE FROM archived_chats WHERE user_id = ? AND chat_id = ?", [userId, chatId], (err) => {
            if (!err) sendUserData(socket, userId);
        });
    });

    socket.on('SEND_MESSAGE', (data) => {
        const msg = data.message;
        console.log(`Message from ${msg.senderId} to ${msg.chatId}`);
        
        // Check if recipient blocked the sender or sender blocked recipient
        db.get("SELECT * FROM blocked_users WHERE (user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)", 
        [msg.chatId, msg.senderId, msg.senderId, msg.chatId], (err, row) => {
            if (row) {
                // Sender is blocked by recipient or vice versa, do not deliver or save
                return;
            }

            // Save to DB
            db.run(`INSERT INTO messages (id, chatId, text, sender, senderId, timestamp, status, type, mediaUrl, fileName, fileSize, duration)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [msg.id, msg.chatId, msg.text, msg.sender, msg.senderId, msg.timestamp, msg.status, msg.type, msg.mediaUrl, msg.fileName, msg.fileSize, msg.duration],
                (err) => {
                    if (err) console.error("Error saving message", err);
                }
            );

            // Targeted Delivery
            const targetSocketId = connectedUsers.get(msg.chatId);
            
            if (targetSocketId) {
                // Send ONLY to the recipient
                io.to(targetSocketId).emit('NEW_MESSAGE', {
                    message: {
                        ...msg,
                        sender: 'them', 
                        status: 'sent'
                    }
                });
            } else {
                // Fallback: Broadcast to everyone
                socket.broadcast.emit('NEW_MESSAGE', {
                    message: {
                        ...msg,
                        sender: 'them', 
                        status: 'sent'
                    }
                });
            }
        });
    });

    socket.on('EDIT_MESSAGE', (data) => {
        const { messageId, newText, chatId, isGroup } = data;
        db.run(`UPDATE messages SET text = ?, isEdited = 1 WHERE id = ?`, [newText, messageId], (err) => {
            if (err) console.error("Error editing message", err);
        });
        
        const targetSocketId = connectedUsers.get(chatId);
        if (targetSocketId && !isGroup) {
            io.to(targetSocketId).emit('MESSAGE_EDITED', data);
        } else {
            socket.broadcast.emit('MESSAGE_EDITED', data);
        }
    });

    socket.on('DELETE_MESSAGE', (data) => {
        const { messageId, chatId, isGroup, forEveryone } = data;
        if (forEveryone) {
            db.run(`UPDATE messages SET isDeleted = 1, text = '' WHERE id = ?`, [messageId], (err) => {
                if (err) console.error("Error deleting message", err);
            });
            
            const targetSocketId = connectedUsers.get(chatId);
            if (targetSocketId && !isGroup) {
                io.to(targetSocketId).emit('MESSAGE_DELETED', data);
            } else {
                socket.broadcast.emit('MESSAGE_DELETED', data);
            }
        }
    });

    socket.on('REACT_MESSAGE', (data) => {
        const { messageId, emoji, chatId, isGroup, userId } = data;
        
        db.get(`SELECT reactions FROM messages WHERE id = ?`, [messageId], (err, row) => {
            if (err) {
                console.error("Error fetching message reactions", err);
                return;
            }
            if (row) {
                let reactions = {};
                try {
                    if (row.reactions) {
                        reactions = JSON.parse(row.reactions);
                    }
                } catch (e) {
                    console.error("Error parsing reactions", e);
                }
                
                if (!reactions[emoji]) {
                    reactions[emoji] = [];
                }
                if (!reactions[emoji].includes(userId)) {
                    reactions[emoji].push(userId);
                }
                
                db.run(`UPDATE messages SET reactions = ? WHERE id = ?`, [JSON.stringify(reactions), messageId], (err) => {
                    if (err) console.error("Error updating reactions", err);
                });
            }
        });

        const targetSocketId = connectedUsers.get(chatId);
        if (targetSocketId && !isGroup) {
            io.to(targetSocketId).emit('MESSAGE_REACTED', data);
        } else {
            socket.broadcast.emit('MESSAGE_REACTED', data);
        }
    });

    socket.on('MESSAGE_READ', (data) => {
        const { chatId, messageIds, readerId } = data;
        
        // Update DB
        if (messageIds && messageIds.length > 0) {
            const placeholders = messageIds.map(() => '?').join(',');
            db.run(`UPDATE messages SET status = 'read' WHERE id IN (${placeholders})`, messageIds, (err) => {
                if (err) console.error("Error updating read status", err);
            });
            
            // Notify sender (and others in group)
            // Ideally we should find the sender of these messages and notify them specifically
            // For now, broadcast to the chat room (if we had rooms) or just broadcast to everyone involved
            // Since we don't have rooms, we'll broadcast to everyone and let clients filter
            socket.broadcast.emit('MESSAGE_READ', { chatId, messageIds, readerId });
        }
    });

    // --- Call Signaling ---

    socket.on('CALL_USER', (data) => {
        const { userToCall, signalData, from, name, isVideo } = data;
        const targetSocketId = connectedUsers.get(userToCall);
        if (targetSocketId) {
            io.to(targetSocketId).emit('CALL_USER', { signal: signalData, from, name, isVideo });
        } else {
            // User offline
            socket.emit('CALL_FAILED', { reason: 'User is offline' });
        }
    });

    socket.on('ANSWER_CALL', (data) => {
        const { to, signal } = data;
        const targetSocketId = connectedUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('CALL_ACCEPTED', { signal });
        }
    });

    socket.on('REJECT_CALL', (data) => {
        const { to } = data;
        const targetSocketId = connectedUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('CALL_REJECTED');
        }
    });

    socket.on('END_CALL', (data) => {
        const { to } = data;
        const targetSocketId = connectedUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('CALL_ENDED');
        }
    });

    socket.on('ICE_CANDIDATE', (data) => {
        const { to, candidate } = data;
        const targetSocketId = connectedUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('ICE_CANDIDATE', { candidate });
        }
    });

    // Admin Feature: Get All Chats
    socket.on('ADMIN_GET_ALL_DATA', (data) => {
        const { userId } = data;
        // Verify admin status
        db.get("SELECT isAdmin FROM users WHERE id = ?", [userId], (err, row) => {
            if (row && row.isAdmin) {
                // Fetch all messages
                db.all("SELECT * FROM messages", [], (err, messages) => {
                    if (!err) {
                        socket.emit('ADMIN_DATA', { messages });
                    }
                });
            }
        });
    });

    socket.on('TYPING', (data) => {
        const { chatId, isTyping, senderId } = data;
        // Broadcast to everyone (or ideally just the target chat room)
        socket.broadcast.emit('TYPING_STATUS', { chatId, isTyping, senderId });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (currentUserId) {
            connectedUsers.delete(currentUserId);
            socket.broadcast.emit('USER_STATUS', { userId: currentUserId, isOnline: false });
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
