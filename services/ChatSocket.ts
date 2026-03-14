
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { io, Socket } from 'socket.io-client';

export interface Message {
  id: string;
  chatId: string;
  text: string;
  sender: 'me' | 'them';
  senderId?: string; // ID of the specific contact/bot who sent this
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'voice' | 'image' | 'file';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  duration?: number; // seconds
  isEdited?: boolean;
  isDeleted?: boolean;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
}

export interface ChatPreview {
  id: string;
  name: string;
  avatar?: string;
  color: string; // Tailwind color class for avatar bg
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  isOnline: boolean;
  // New Profile Fields
  isBot?: boolean;
  isGroup?: boolean;
  username?: string;
  bio?: string;
  phone?: string;
  // New Features
  muted?: boolean;
  isAdmin?: boolean;
  membersCount?: number;
  sender?: 'me' | 'them';
  memberIds?: string[]; // IDs of contacts in this group
}

export interface Call {
  id: string;
  contactId: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  duration?: number; // seconds
}

export interface UserProfile {
    id: string;
    name: string;
    username: string;
    phone: string;
    bio: string;
    avatarColor: string;
    avatar?: string;
    isPremium?: boolean;
    isAdmin?: boolean;
    isOnline?: boolean;
    privacy?: {
        profilePhoto: 'everybody' | 'nobody';
        phoneNumber?: 'everybody' | 'nobody';
        lastSeen?: 'everybody' | 'nobody';
        stories?: 'everybody' | 'nobody';
    };
}

type Listener = (data: any) => void;

export class ChatSocket {
  private socket: Socket | null = null;
  private listeners: Set<Listener> = new Set();
  private url: string;
  private myUserId: string | null = null;
  private myProfile: UserProfile | null = null;

  constructor(url?: string) {
    // Logic to determine WebSocket URL
    if (url) {
        this.url = url;
    } else {
        // Use default auto-discovery which handles ports/proxies better
        this.url = ''; 
    }
    
    this.connect();
  }

  private connect() {
    if (this.socket && this.socket.connected) {
        return;
    }

    try {
      // If url is empty string, io() connects to window.location.origin automatically
      this.socket = this.url ? io(this.url, { transports: ['websocket', 'polling'] }) : io({ transports: ['websocket', 'polling'] });
      
      this.socket.on('connect', () => {
        console.log('Connected to RedGram Server at', this.url);
        this.notify({ type: 'STATUS', status: 'CONNECTED' });
        
        // Re-announce presence if we have an ID
        if (this.myProfile) {
            // Re-register to ensure server knows we are here after reconnect
            this.registerUser(this.myProfile);
        } else if (this.myUserId) {
            this.announcePresence();
        }
      });

      this.socket.on('INIT_STATE', (data) => {
          if (data.users) {
              this.notify({ type: 'USER_SYNC', users: data.users });
          }
      });

      this.socket.on('USER_JOINED', (data) => {
          if (data.profile.id !== this.myUserId) {
              this.notify({ type: 'USER_JOINED', profile: data.profile });
          }
      });

      this.socket.on('NEW_MESSAGE', (data) => {
          const msg = data.message;
          this.notify({ type: 'NEW_MESSAGE', message: msg });
      });

      this.socket.on('MESSAGE_READ', (data) => {
          this.notify({ 
              type: 'MESSAGE_READ', 
              chatId: data.chatId, 
              messageIds: data.messageIds,
              readerId: data.readerId
          });
      });

      // Forward these events directly
      ['PROMO_RESULT', 'UPDATE_ERROR', 'REGISTRATION_ERROR', 'REGISTRATION_SUCCESS', 'USER_UPDATED', 'USER_STATUS', 'CALL_USER', 'CALL_ACCEPTED', 'CALL_REJECTED', 'CALL_ENDED', 'ICE_CANDIDATE', 'ADMIN_DATA', 'TYPING_STATUS', 'BLOCKED_USERS', 'ARCHIVED_CHATS'].forEach(event => {
          this.socket?.on(event, (data) => {
              if (event === 'PROMO_RESULT') console.log('Received PROMO_RESULT', data);
              this.notify({ type: event, ...data });
          });
      });

      this.socket.on('connect_error', (e) => {
        console.warn('Socket.IO connection error. Ensure "node server.js" is running.', e);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server.');
      });
    } catch (e) {
      console.error("Socket init error", e);
    }
  }

  public setUserId(id: string) {
      this.myUserId = id;
  }

  public disconnect() {
      if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
      }
  }

  public registerUser(profile: UserProfile) {
      this.myUserId = profile.id;
      this.myProfile = profile;
      if (this.socket && this.socket.connected) {
          this.socket.emit('REGISTER', { profile: profile });
      }
  }
  
  public announcePresence() {
      if (this.socket && this.socket.connected && this.myUserId) {
          this.socket.emit('PRESENCE', { userId: this.myUserId });
      }
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(data: any) {
    this.listeners.forEach(l => l(data));
  }

  public sendMessage(message: Message, toUserId?: string, isGroup?: boolean) {
    // Send to Server
    if (this.socket && this.socket.connected) {
      this.socket.emit('SEND_MESSAGE', { 
          message: {
             ...message,
             chatId: isGroup ? message.chatId : toUserId, // If DM, send to their UserID. If Group, send to ChatID.
             senderId: this.myUserId
          },
          isGroup
      });
    } 
  }

  public editMessage(messageId: string, newText: string, chatId: string, isGroup?: boolean) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('EDIT_MESSAGE', {
              messageId,
              newText,
              chatId,
              isGroup,
              senderId: this.myUserId
          });
      }
  }

  public deleteMessage(messageId: string, chatId: string, isGroup?: boolean, forEveryone?: boolean) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('DELETE_MESSAGE', {
              messageId,
              chatId,
              isGroup,
              forEveryone,
              senderId: this.myUserId
          });
      }
  }

  public reactMessage(messageId: string, emoji: string, chatId: string, isGroup?: boolean) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('REACT_MESSAGE', {
              messageId,
              emoji,
              chatId,
              isGroup,
              userId: this.myUserId,
              senderId: this.myUserId
          });
      }
  }

  public blockUser(blockedUserId: string) {
      if (this.socket && this.socket.connected && this.myUserId) {
          this.socket.emit('BLOCK_USER', { userId: this.myUserId, blockedUserId });
      }
  }

  public unblockUser(blockedUserId: string) {
      if (this.socket && this.socket.connected && this.myUserId) {
          this.socket.emit('UNBLOCK_USER', { userId: this.myUserId, blockedUserId });
      }
  }

  public archiveChat(chatId: string) {
      if (this.socket && this.socket.connected && this.myUserId) {
          this.socket.emit('ARCHIVE_CHAT', { userId: this.myUserId, chatId });
      }
  }

  public unarchiveChat(chatId: string) {
      if (this.socket && this.socket.connected && this.myUserId) {
          this.socket.emit('UNARCHIVE_CHAT', { userId: this.myUserId, chatId });
      }
  }

  public updateProfile(profile: Partial<UserProfile>) {
      if (this.socket && this.socket.connected && profile.id) {
          this.socket.emit('UPDATE_PROFILE', profile);
      }
  }

  public callUser(userToCall: string, signalData: any, from: string, name: string, isVideo: boolean) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('CALL_USER', { userToCall, signalData, from, name, isVideo });
      }
  }

  public answerCall(to: string, signal: any) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('ANSWER_CALL', { to, signal });
      }
  }

  public rejectCall(to: string) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('REJECT_CALL', { to });
      }
  }

  public endCall(to: string) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('END_CALL', { to });
      }
  }

  public sendIceCandidate(to: string, candidate: any) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('ICE_CANDIDATE', { to, candidate });
      }
  }

  public isConnected(): boolean {
      return !!(this.socket && this.socket.connected);
  }

  public redeemPromo(userId: string, code: string) {
      if (this.socket && this.socket.connected) {
          console.log('Sending REDEEM_PROMO', userId, code);
          this.socket.emit('REDEEM_PROMO', { userId, code });
      } else {
          console.warn('Cannot redeem promo: Socket not connected');
      }
  }

  public getAdminData(userId: string) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('ADMIN_GET_ALL_DATA', { userId });
      }
  }

  public sendReadReceipt(chatId: string, messageIds: string[]) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('MESSAGE_READ', { 
              chatId, 
              messageIds, 
              readerId: this.myUserId 
          });
      }
  }

  public sendTyping(chatId: string, isTyping: boolean) {
      if (this.socket && this.socket.connected) {
          this.socket.emit('TYPING', { 
              chatId, 
              isTyping, 
              senderId: this.myUserId 
          });
      }
  }
}
