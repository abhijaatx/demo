import assert from "node:assert/strict";
import { test } from "node:test";
import {
  reorderLayers,
  toggleLayerVisibility,
  toggleLayerLock,
  renameLayer,
  groupLayers
} from "@supademo/domain";

test("reorderLayers updates zIndex order", () => {
  const layer1 = {
    id: "l-1",
    name: "L1",
    kind: "hotspot",
    zIndex: 1,
    isVisible: true,
    isLocked: false,
    groupId: null
  };
  const layer2 = {
    id: "l-2",
    name: "L2",
    kind: "annotation",
    zIndex: 2,
    isVisible: true,
    isLocked: false,
    groupId: null
  };
  const layers = [layer1, layer2];

  const reordered = reorderLayers(layers, 0, 1);
  assert.equal(reordered[0].id, "l-2");
  assert.equal(reordered[0].zIndex, 1);
  assert.equal(reordered[1].id, "l-1");
  assert.equal(reordered[1].zIndex, 2);
});

test("toggleLayerVisibility & toggleLayerLock toggle boolean states", () => {
  const layers = [
    {
      id: "l-1",
      name: "L1",
      kind: "hotspot",
      zIndex: 1,
      isVisible: true,
      isLocked: false,
      groupId: null
    }
  ];

  const hidden = toggleLayerVisibility(layers, "l-1");
  assert.equal(hidden[0].isVisible, false);

  const locked = toggleLayerLock(layers, "l-1");
  assert.equal(locked[0].isLocked, true);
});

test("renameLayer & groupLayers mutate layer names and groups safely", () => {
  const layers = [
    {
      id: "l-1",
      name: "L1",
      kind: "hotspot",
      zIndex: 1,
      isVisible: true,
      isLocked: false,
      groupId: null
    }
  ];

  const renamed = renameLayer(layers, "l-1", "Header Hotspot");
  assert.equal(renamed[0].name, "Header Hotspot");

  const grouped = groupLayers(layers, new Set(["l-1"]), "grp-1");
  assert.equal(grouped[0].groupId, "grp-1");
});
