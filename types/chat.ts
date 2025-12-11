
export interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    created_at: string;
    read_at: string | null;
}

export interface Conversation {
    other_user_id: string;
    other_user_name: string;
    other_user_avatar?: string; // Optional if we have avatars
    last_message: Message;
    unread_count: number;
    messages: Message[];
}

export interface ChatUser {
    id: string;
    username: string; // or display name
    full_name?: string;
}
