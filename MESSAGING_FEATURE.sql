
-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    recipient_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    read_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can read messages they sent or received
CREATE POLICY "Users can read their own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 2. Users can insert messages only as themselves
CREATE POLICY "Users can insert messages as sender"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- 3. Users can update messages (mark as read) only if they are the recipient
CREATE POLICY "Recipients can update their received messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- Rate Limiting Function & Trigger
CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    msg_count INT;
BEGIN
    SELECT count(*) INTO msg_count
    FROM public.messages
    WHERE sender_id = auth.uid()
    AND created_at > now() - interval '1 minute';

    IF msg_count >= 10 THEN
        RAISE EXCEPTION 'Rate limit exceeded: You can only send 10 messages per minute.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_message_rate_limit_trigger
    BEFORE INSERT ON public.messages
    FOR EACH ROW EXECUTE PROCEDURE check_message_rate_limit();

-- Note on Expiration:
-- To physically delete messages older than 24h, you would typically run a cron job or scheduled query:
-- DELETE FROM public.messages WHERE created_at < now() - interval '24 hours';
-- For this implementation, the frontend will filter out expired messages, 
-- and we can enforce it in RLS if strictly needed, but manual cleanup is safer.
