import { randomUUID } from "node:crypto";
import {
  MAX_QUEUE_MESSAGE_BYTES,
  type QueueAdapter,
  type QueueMessage,
  type ReceiveMessageOptions,
  type SendMessageOptions
} from "./types.js";

interface MemoryMessage extends QueueMessage {
  visibleAt: number;
}

export class InMemoryQueueAdapter implements QueueAdapter {
  private readonly messages = new Map<string, MemoryMessage[]>();

  async send(
    queueName: string,
    body: string,
    _options: SendMessageOptions = {}
  ): Promise<{ readonly messageId: string }> {
    if (new TextEncoder().encode(body).byteLength > MAX_QUEUE_MESSAGE_BYTES) {
      throw new Error("The queue message is too large.");
    }
    const messageId = randomUUID();
    const queue = this.messages.get(queueName) ?? [];
    queue.push({ messageId, receiptHandle: randomUUID(), body, visibleAt: Date.now() });
    this.messages.set(queueName, queue);
    return { messageId };
  }

  async receive(
    queueName: string,
    options: ReceiveMessageOptions = {}
  ): Promise<readonly QueueMessage[]> {
    const queue = this.messages.get(queueName) ?? [];
    const maxMessages = options.maxMessages ?? 1;
    const visibilityTimeoutSeconds = options.visibilityTimeoutSeconds ?? 30;
    const now = Date.now();
    const visible = queue.filter((message) => message.visibleAt <= now).slice(0, maxMessages);
    for (const message of visible) {
      message.visibleAt = now + visibilityTimeoutSeconds * 1_000;
    }
    return visible.map(({ messageId, receiptHandle, body }) => ({
      messageId,
      receiptHandle,
      body
    }));
  }

  async deleteMessage(queueName: string, receiptHandle: string): Promise<void> {
    const queue = this.messages.get(queueName) ?? [];
    const remaining = queue.filter((message) => message.receiptHandle !== receiptHandle);
    this.messages.set(queueName, remaining);
  }

  async changeVisibility(
    queueName: string,
    receiptHandle: string,
    visibilityTimeoutSeconds: number
  ): Promise<void> {
    const queue = this.messages.get(queueName) ?? [];
    const message = queue.find((candidate) => candidate.receiptHandle === receiptHandle);
    if (message === undefined) {
      throw new Error("The queue receipt handle was not found.");
    }
    message.visibleAt = Date.now() + visibilityTimeoutSeconds * 1_000;
  }

  size(queueName: string): number {
    return this.messages.get(queueName)?.length ?? 0;
  }
}
