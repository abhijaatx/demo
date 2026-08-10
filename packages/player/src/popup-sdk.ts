/**
 * Framework-Agnostic Popup Embed SDK — TASK-085
 */

export interface PopupSDKOptions {
  readonly baseUrl?: string;
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
}

export class SupaDemoSDK {
  private activeModalEl: HTMLElement | null = null;

  open(demoId: string, options: PopupSDKOptions = {}): void {
    if (typeof document === "undefined") {
      options.onOpen?.();
      return;
    }

    this.close(); // Close any existing active popup

    const baseUrl = options.baseUrl ?? "https://app.supademo.com";
    const embedUrl = `${baseUrl.replace(/\/$/, "")}/e/${encodeURIComponent(demoId)}?popup=true`;

    const overlay = document.createElement("div");
    overlay.id = "supademo-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Interactive Demo Popup");
    overlay.style.cssText =
      "position: fixed; inset: 0; z-index: 999999; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);";

    const container = document.createElement("div");
    container.style.cssText =
      "position: relative; width: 90vw; max-width: 1100px; height: 80vh; max-height: 700px; background: #0f172a; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close Modal");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText =
      "position: absolute; top: 12px; right: 16px; z-index: 10; background: rgba(0,0,0,0.5); color: #fff; border: 0; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center;";
    closeBtn.onclick = () => this.close();

    const iframe = document.createElement("iframe");
    iframe.src = embedUrl;
    iframe.style.cssText = "width: 100%; height: 100%; border: 0;";
    iframe.setAttribute("allow", "fullscreen; clipboard-write");

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    this.activeModalEl = overlay;
    options.onOpen?.();
  }

  close(): void {
    if (this.activeModalEl && this.activeModalEl.parentNode) {
      this.activeModalEl.parentNode.removeChild(this.activeModalEl);
      this.activeModalEl = null;
    }
  }

  destroy(): void {
    this.close();
  }
}

export const supademoSDK = new SupaDemoSDK();
