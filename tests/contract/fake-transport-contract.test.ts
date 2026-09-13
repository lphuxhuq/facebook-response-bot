import { describe, it, expect } from 'vitest';
import { FakeFacebookTransport } from '../../src/transport/facebook/fake-transport.ts';

describe('MessagingTransport Contract Tests', () => {
  it('should implement all methods of MessagingTransport interface', async () => {
    const transport = new FakeFacebookTransport();
    expect(transport.isConnected).toBe(false);

    await transport.connect();
    expect(transport.isConnected).toBe(true);

    // Test sending message
    const sendResult = await transport.sendMessage('group_999', { text: 'Hello Group!' });
    expect(sendResult.threadId).toBe('group_999');
    expect(sendResult.messageId).toBeDefined();

    // Test reaction
    await transport.react(sendResult.messageId, '❤️');
    expect(transport.reactions.length).toBe(1);
    expect(transport.reactions[0].reaction).toBe('❤️');

    // Test getThread
    const thread = await transport.getThread('group_999');
    expect(thread.id).toBe('group_999');
    expect(thread.type).toBe('GROUP');

    // Test markRead
    await transport.markRead('group_999');
    expect(transport.readThreads).toContain('group_999');

    await transport.disconnect();
    expect(transport.isConnected).toBe(false);
  });
});
