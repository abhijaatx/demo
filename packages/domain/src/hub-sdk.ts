/**
 * In-App Hub & Tour SDK Panel Mount Manager — TASK-153
 */

export interface HubSdkMountOptions {
  readonly hubId: string;
  readonly containerId: string;
  readonly isOpen: boolean;
}

export function createHubSdkOptions(
  hubId: string,
  containerId = "supademo-hub-root"
): HubSdkMountOptions {
  if (!hubId.trim()) {
    throw new Error("SDK mount requires a valid Hub ID.");
  }

  return Object.freeze({
    hubId: hubId.trim(),
    containerId: containerId.trim(),
    isOpen: false
  });
}

export function toggleHubWidget(options: HubSdkMountOptions): HubSdkMountOptions {
  return Object.freeze({
    ...options,
    isOpen: !options.isOpen
  });
}
