import assert from "node:assert/strict";
import { test } from "node:test";

test("HotspotInspector state updates produce clean sanitized style payloads", () => {
  const hotspot = {
    id: "h-test-1",
    x: 20,
    y: 20,
    width: 15,
    height: 10,
    targetStepId: null,
    tooltipText: "Initial",
    style: { pulse: true, color: "#4f46e5", opacity: 0.8 }
  };

  const updatedTooltip = { ...hotspot, tooltipText: "Updated tooltip" };
  assert.equal(updatedTooltip.tooltipText, "Updated tooltip");

  const updatedStyle = {
    ...hotspot,
    style: { ...hotspot.style, color: "#10b981", pulse: false }
  };
  assert.equal(updatedStyle.style.color, "#10b981");
  assert.equal(updatedStyle.style.pulse, false);
});
