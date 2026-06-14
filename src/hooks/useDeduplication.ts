import { useCallback } from 'react';
import { shouldSendMessage, recordSentMessage } from '../utils/deduplication';

export function useDeduplication() {
  const shouldSend = useCallback((guestId: string, messageType: string): boolean => {
    return shouldSendMessage(guestId, messageType);
  }, []);

  const recordSent = useCallback((guestId: string, messageType: string): void => {
    recordSentMessage(guestId, messageType);
  }, []);

  const checkAndRecord = useCallback((guestId: string, messageType: string): boolean => {
    const canSend = shouldSendMessage(guestId, messageType);
    if (canSend) {
      recordSentMessage(guestId, messageType);
    }
    return canSend;
  }, []);

  const isDuplicate = useCallback((guestId: string, messageType: string): boolean => {
    return !shouldSendMessage(guestId, messageType);
  }, []);

  return { shouldSend, recordSent, checkAndRecord, isDuplicate };
}
