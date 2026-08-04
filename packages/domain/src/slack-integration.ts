/**
 * Slack Integration & Block Kit Message Payload Formatting — TASK-126
 */

export interface SlackLeadNotificationInput {
  readonly channelId: string;
  readonly demoTitle: string;
  readonly leadEmail: string;
  readonly intentScore: number;
}

export function formatSlackLeadNotification(input: SlackLeadNotificationInput): {
  channel: string;
  text: string;
  blocks: readonly Record<string, unknown>[];
} {
  const title = input.demoTitle.replace(/[*_~`]/g, "");
  const email = input.leadEmail.replace(/[*_~`]/g, "");

  return Object.freeze({
    channel: input.channelId,
    text: `New lead captured for demo "${title}": ${email}`,
    blocks: Object.freeze([
      Object.freeze({
        type: "section",
        text: Object.freeze({
          type: "mrkdwn",
          text: `🎯 *New Lead Captured*\n*Demo:* ${title}\n*Email:* ${email}\n*Intent Score:* ${input.intentScore}/100`
        })
      })
    ])
  });
}
