import {
  MAX_QUEUE_MESSAGE_BYTES,
  QueueTransportError,
  type QueueAdapter,
  type QueueMessage,
  type ReceiveMessageOptions,
  type SendMessageOptions
} from "./types.js";

export interface SqsCompatibleQueueOptions {
  readonly endpoint: string;
  readonly requestTimeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

export class SqsCompatibleQueueAdapter implements QueueAdapter {
  private readonly endpoint: URL;
  private readonly requestTimeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SqsCompatibleQueueOptions) {
    const endpoint = new URL(options.endpoint);
    if (
      !["http:", "https:"].includes(endpoint.protocol) ||
      endpoint.username ||
      endpoint.password
    ) {
      throw new QueueTransportError(
        "The queue endpoint must be an HTTP(S) URL without credentials."
      );
    }
    endpoint.search = "";
    endpoint.hash = "";
    if (!endpoint.pathname.endsWith("/")) {
      endpoint.pathname += "/";
    }
    this.endpoint = endpoint;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 5_000;
    if (
      !Number.isSafeInteger(this.requestTimeoutMs) ||
      this.requestTimeoutMs < 100 ||
      this.requestTimeoutMs > 60_000
    ) {
      throw new QueueTransportError("The queue request timeout is invalid.");
    }
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async send(
    queueName: string,
    body: string,
    options: SendMessageOptions = {}
  ): Promise<{ readonly messageId: string }> {
    validateQueueName(queueName);
    if (new TextEncoder().encode(body).byteLength > MAX_QUEUE_MESSAGE_BYTES) {
      throw new QueueTransportError("The queue message is too large.");
    }
    const parameters: Record<string, string> = { MessageBody: body };
    if (options.delaySeconds !== undefined) {
      validateInteger(options.delaySeconds, 0, 900, "delaySeconds");
      parameters["DelaySeconds"] = String(options.delaySeconds);
    }
    const response = await this.request(queueName, "SendMessage", parameters);
    const messageId = extractXmlTag(response, "MessageId");
    if (messageId === undefined) {
      throw new QueueTransportError("The queue returned an invalid send response.");
    }
    return { messageId };
  }

  async receive(
    queueName: string,
    options: ReceiveMessageOptions = {}
  ): Promise<readonly QueueMessage[]> {
    validateQueueName(queueName);
    const maxMessages = options.maxMessages ?? 1;
    const visibilityTimeoutSeconds = options.visibilityTimeoutSeconds ?? 30;
    const waitTimeSeconds = options.waitTimeSeconds ?? 0;
    validateInteger(maxMessages, 1, 10, "maxMessages");
    validateInteger(visibilityTimeoutSeconds, 0, 43_200, "visibilityTimeoutSeconds");
    validateInteger(waitTimeSeconds, 0, 20, "waitTimeSeconds");
    const response = await this.request(
      queueName,
      "ReceiveMessage",
      {
        MaxNumberOfMessages: String(maxMessages),
        VisibilityTimeout: String(visibilityTimeoutSeconds),
        WaitTimeSeconds: String(waitTimeSeconds)
      },
      options.signal,
      this.requestTimeoutMs + waitTimeSeconds * 1_000 + 1_000
    );
    const messages: QueueMessage[] = [];
    for (const block of response.matchAll(/<Message>([\s\S]*?)<\/Message>/gu)) {
      const messageBlock = block[1];
      if (messageBlock === undefined) {
        continue;
      }
      const messageId = extractXmlTag(messageBlock, "MessageId");
      const receiptHandle = extractXmlTag(messageBlock, "ReceiptHandle");
      const body = extractXmlTag(messageBlock, "Body");
      if (messageId === undefined || receiptHandle === undefined || body === undefined) {
        throw new QueueTransportError("The queue returned an invalid receive response.");
      }
      if (new TextEncoder().encode(body).byteLength > MAX_QUEUE_MESSAGE_BYTES) {
        throw new QueueTransportError("The queue returned an oversized message.");
      }
      messages.push({ messageId, receiptHandle, body });
    }
    return messages;
  }

  async deleteMessage(queueName: string, receiptHandle: string): Promise<void> {
    validateQueueName(queueName);
    validateReceiptHandle(receiptHandle);
    await this.request(queueName, "DeleteMessage", { ReceiptHandle: receiptHandle });
  }

  async changeVisibility(
    queueName: string,
    receiptHandle: string,
    visibilityTimeoutSeconds: number
  ): Promise<void> {
    validateQueueName(queueName);
    validateReceiptHandle(receiptHandle);
    validateInteger(visibilityTimeoutSeconds, 0, 43_200, "visibilityTimeoutSeconds");
    await this.request(queueName, "ChangeMessageVisibility", {
      ReceiptHandle: receiptHandle,
      VisibilityTimeout: String(visibilityTimeoutSeconds)
    });
  }

  private async request(
    queueName: string,
    action: string,
    parameters: Record<string, string>,
    signal?: AbortSignal,
    timeoutMs = this.requestTimeoutMs
  ): Promise<string> {
    const queueUrl = new URL(encodeURIComponent(queueName), this.endpoint);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    timeout.unref();
    const abort = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const body = new URLSearchParams({ Action: action, ...parameters });
      const response = await this.fetchImpl(queueUrl, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal
      });
      const contentLength = response.headers.get("content-length");
      if (
        contentLength !== null &&
        /^\d+$/u.test(contentLength) &&
        Number(contentLength) > 2_000_000
      ) {
        throw new QueueTransportError("The queue response is too large.", response.status);
      }
      const responseBody = await response.text();
      if (new TextEncoder().encode(responseBody).byteLength > 2_000_000) {
        throw new QueueTransportError("The queue response is too large.", response.status);
      }
      if (!response.ok) {
        throw new QueueTransportError("The queue request failed.", response.status);
      }
      return responseBody;
    } catch (error) {
      if (error instanceof QueueTransportError) {
        throw error;
      }
      throw new QueueTransportError("The queue request could not be completed.");
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }
}

function validateQueueName(value: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/u.test(value)) {
    throw new QueueTransportError("The queue name is invalid.");
  }
}

function validateReceiptHandle(value: string): void {
  if (value.length === 0 || value.length > 2_048 || /[\r\n]/u.test(value)) {
    throw new QueueTransportError("The queue receipt handle is invalid.");
  }
}

function validateInteger(value: number, minimum: number, maximum: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new QueueTransportError(`The queue ${field} is invalid.`);
  }
}

function extractXmlTag(xml: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "u").exec(xml);
  return match?.[1] === undefined ? undefined : decodeXml(match[1]);
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replace(/&#(\d+);/gu, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/giu, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    );
}
