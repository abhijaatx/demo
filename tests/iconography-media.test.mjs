import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AspectRatio,
  DeviceFrame,
  Image,
  ImageIcon,
  MediaFallback,
  SearchIcon,
  Thumbnail,
  isAllowedImageSource
} from "../packages/ui/dist/index.js";

const readSource = (name) =>
  readFile(new URL(`../packages/ui/src/${name}`, import.meta.url), "utf8");
const readCss = () => readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8");

function render(...children) {
  return renderToStaticMarkup(h("div", null, ...children));
}

test("named icons are accessible by default and support labels", () => {
  const markup = render(h(SearchIcon, null), h(ImageIcon, { label: "Image preview" }));

  assert.match(markup, /<svg[^>]*aria-hidden="true"/u);
  assert.match(markup, /<svg[^>]*focusable="false"/u);
  assert.match(markup, /role="img"[^>]*aria-label="Image preview"/u);
  assert.match(markup, /<title>Image preview<\/title>/u);
});

test("image sources are same-origin by default and exact HTTPS origins require opt-in", () => {
  assert.equal(isAllowedImageSource("/media/demo.png"), true);
  assert.equal(isAllowedImageSource("//cdn.example.test/demo.png"), false);
  assert.equal(isAllowedImageSource("data:image/svg+xml,<svg></svg>"), false);
  assert.equal(isAllowedImageSource("https://cdn.example.test/demo.png"), false);
  assert.equal(
    isAllowedImageSource("https://cdn.example.test/demo.png", {
      allowRemote: true,
      remoteOrigins: ["https://cdn.example.test"]
    }),
    true
  );
  assert.equal(
    isAllowedImageSource("https://other.example.test/demo.png", {
      allowRemote: true,
      remoteOrigins: ["https://cdn.example.test"]
    }),
    false
  );
});

test("image, thumbnail, aspect-ratio, device-frame, and fallback preserve layout semantics", () => {
  const markup = render(
    h(Image, { src: "/media/demo.png", alt: "Product demo", width: 640, height: 360 }),
    h(Image, {
      src: "https://untrusted.example.test/demo.png",
      alt: "Blocked remote",
      width: 640,
      height: 360
    }),
    h(Thumbnail, { src: "/media/thumb.png", alt: "Thumbnail", size: "sm" }),
    h(AspectRatio, { ratio: 4 / 3, children: h(MediaFallback, { label: "Unavailable preview" }) }),
    h(DeviceFrame, { device: "phone", label: "Phone screenshot", children: h("p", null, "Screen") })
  );

  assert.match(
    markup,
    /<img[^>]*src="\/media\/demo\.png"[^>]*alt="Product demo"[^>]*width="640"[^>]*height="360"/u
  );
  assert.match(markup, /ui-media-fallback[^>]*aria-label="Blocked remote"/u);
  assert.doesNotMatch(markup, /untrusted\.example\.test/iu);
  assert.match(markup, /ui-thumbnail ui-thumbnail-sm/iu);
  assert.match(markup, /ui-aspect-ratio/iu);
  assert.match(markup, /ui-device-frame ui-device-frame-phone/iu);
  assert.match(markup, /<figcaption class="ui-sr-only">Phone screenshot<\/figcaption>/u);
});

test("iconography and media source avoid raw HTML and define responsive presentation rules", async () => {
  const [icons, media, css] = await Promise.all([
    readSource("icons.tsx"),
    readSource("media.tsx"),
    readCss()
  ]);

  assert.match(icons, /export function SearchIcon/u);
  assert.match(icons, /currentColor/u);
  assert.doesNotMatch(`${icons}\n${media}`, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
  assert.match(media, /remoteOrigins/u);
  assert.match(media, /safeDimension/u);
  assert.match(css, /\.ui-media-image \{[^}]*max-width: 100%[^}]*height: auto/iu);
  assert.match(css, /\.ui-aspect-ratio > \* \{[^}]*position: absolute/iu);
  assert.match(css, /\.ui-device-frame-phone \{[^}]*max-width: 390px/iu);
});
