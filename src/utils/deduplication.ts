const SENT_MESSAGES_KEY = 'sent_messages_dedup';
const DEDUP_WINDOW = 24 * 60 * 60 * 1000;

interface SentMessages {
  [key: string]: number;
}

function getSentMessages(): SentMessages {
  try {
    const stored = localStorage.getItem(SENT_MESSAGES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function shouldSendMessage(guestId: string, messageType: string): boolean {
  const sentMessages = getSentMessages();
  const key = `${guestId}_${messageType}`;
  const lastSent = sentMessages[key];
  
  if (!lastSent) return true;
  return Date.now() - lastSent > DEDUP_WINDOW;
}

export function recordSentMessage(guestId: string, messageType: string): void {
  const sentMessages = getSentMessages();
  const key = `${guestId}_${messageType}`;
  sentMessages[key] = Date.now();
  
  Object.keys(sentMessages).forEach(k => {
    if (Date.now() - sentMessages[k] > DEDUP_WINDOW * 2) {
      delete sentMessages[k];
    }
  });
  
  localStorage.setItem(SENT_MESSAGES_KEY, JSON.stringify(sentMessages));
}
