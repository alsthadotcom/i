
import { supabase } from './supabase';
import { Message, Conversation, ChatUser } from '../types/chat';

// Regex for validation
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
const HTML_REGEX = /<[^>]*>/g;
const MAX_LENGTH = 4000;

export const ChatService = {
    validateMessage(content: string): { valid: boolean; error?: string } {
        if (!content || content.trim().length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }
        if (content.length > MAX_LENGTH) {
            return { valid: false, error: `Message exceeds ${MAX_LENGTH} characters` };
        }
        if (URL_REGEX.test(content)) {
            return { valid: false, error: 'Links are not allowed' };
        }
        if (HTML_REGEX.test(content)) {
            return { valid: false, error: 'HTML tags are not allowed' };
        }
        return { valid: true };
    },

    async sendMessage(senderId: string, recipientId: string, content: string): Promise<{ error?: string }> {
        const validation = this.validateMessage(content);
        if (!validation.valid) {
            return { error: validation.error };
        }

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: senderId,
                recipient_id: recipientId,
                content: content.trim()
            });

        return { error: error?.message };
    },

    async fetchConversations(currentUserId: string): Promise<{ conversations: Conversation[]; error?: string }> {
        // Fetch all messages involving the user from last 24h
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
            .gt('created_at', yesterday)
            .order('created_at', { ascending: true }); // Get chronological to build threads

        if (error) {
            console.error('Error fetching messages:', error);
            return { conversations: [], error: error.message };
        }

        if (!messages || messages.length === 0) {
            return { conversations: [] };
        }

        // Group by other user
        const threads: Record<string, Message[]> = {};
        const otherUserIds = new Set<string>();

        messages.forEach((msg: Message) => {
            const otherId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id;
            if (!threads[otherId]) {
                threads[otherId] = [];
                otherUserIds.add(otherId);
            }
            threads[otherId].push(msg);
        });

        // Fetch details for other users
        const idsArray = Array.from(otherUserIds);
        const { data: usersData, error: usersError } = await supabase
            .from('user_info')
            .select('user_id, username, name') // Adjust fields based on schema
            .in('user_id', idsArray);

        if (usersError) {
            console.error('Error fetching user details:', usersError);
        }

        const userMap: Record<string, ChatUser> = {};
        usersData?.forEach((u: any) => {
            userMap[u.user_id] = {
                id: u.user_id,
                username: u.username || 'Unknown',
                full_name: u.name || u.username
            };
        });

        // specific workaround for database inconsistencies where user_info might be missing
        // we'll just show "User" or ID if missing

        const conversations: Conversation[] = Object.keys(threads).map(otherId => {
            const threadMsgs = threads[otherId];
            const lastMsg = threadMsgs[threadMsgs.length - 1]; // sorted ascending, so last is latest
            const userInfo = userMap[otherId];

            // Count unread: where I am recipient AND read_at is null
            const unreadCount = threadMsgs.filter(m =>
                m.recipient_id === currentUserId && !m.read_at
            ).length;

            return {
                other_user_id: otherId,
                other_user_name: userInfo?.full_name || userInfo?.username || 'User',
                last_message: lastMsg,
                unread_count: unreadCount,
                messages: threadMsgs
            };
        });

        // Sort conversations by last message time (descending)
        conversations.sort((a, b) =>
            new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
        );

        return { conversations };
    },

    async markThreadRead(currentUserId: string, otherUserId: string): Promise<void> {
        // Mark all messages from otherUserId to currentUserId as read
        const { error } = await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('sender_id', otherUserId)
            .eq('recipient_id', currentUserId)
            .is('read_at', null);

        if (error) console.error('Error marking messages as read:', error);
    }
};
