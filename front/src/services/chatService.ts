import api from '@/lib/api';
import {
  ChatRoom,
  ChatMessage,
  CreateChatRoomRequest,
} from '@/types';

export const chatApi = {
  // Chat room management
  getMyChatRooms: async (): Promise<ChatRoom[]> => {
    const response = await api.get('/chats/my');
    return response.data;
  },

  createChatRoom: async (data: CreateChatRoomRequest): Promise<ChatRoom> => {
    const response = await api.post('/chats/create', data);
    return response.data;
  },

  getChatMessages: async (chatId: number): Promise<ChatMessage[]> => {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data;
  },

  // WebSocket token for real-time chat
  getWebSocketToken: async (): Promise<{ ws_token: string }> => {
    const response = await api.post('/ws-token');
    return response.data;
  },
};