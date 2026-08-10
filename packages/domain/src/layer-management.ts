/**
 * Component Layer Management & Z-Ordering — TASK-069
 */

export interface ComponentLayer {
  readonly id: string;
  readonly name: string;
  readonly kind: "hotspot" | "annotation";
  readonly zIndex: number;
  readonly isVisible: boolean;
  readonly isLocked: boolean;
  readonly groupId: string | null;
}

export function reorderLayers(
  layers: readonly ComponentLayer[],
  fromIndex: number,
  toIndex: number
): readonly ComponentLayer[] {
  if (
    fromIndex < 0 ||
    fromIndex >= layers.length ||
    toIndex < 0 ||
    toIndex >= layers.length ||
    fromIndex === toIndex
  ) {
    return layers;
  }

  const copy = [...layers];
  const [moved] = copy.splice(fromIndex, 1);
  if (!moved) return layers;
  copy.splice(toIndex, 0, moved);

  return Object.freeze(
    copy.map((layer, idx) =>
      Object.freeze({
        ...layer,
        zIndex: idx + 1
      })
    )
  );
}

export function toggleLayerVisibility(
  layers: readonly ComponentLayer[],
  layerId: string
): readonly ComponentLayer[] {
  return Object.freeze(
    layers.map((layer) =>
      layer.id === layerId ? Object.freeze({ ...layer, isVisible: !layer.isVisible }) : layer
    )
  );
}

export function toggleLayerLock(
  layers: readonly ComponentLayer[],
  layerId: string
): readonly ComponentLayer[] {
  return Object.freeze(
    layers.map((layer) =>
      layer.id === layerId ? Object.freeze({ ...layer, isLocked: !layer.isLocked }) : layer
    )
  );
}

export function renameLayer(
  layers: readonly ComponentLayer[],
  layerId: string,
  newName: string
): readonly ComponentLayer[] {
  const trimmed = newName.trim();
  if (!trimmed) return layers;

  return Object.freeze(
    layers.map((layer) =>
      layer.id === layerId ? Object.freeze({ ...layer, name: trimmed }) : layer
    )
  );
}

export function groupLayers(
  layers: readonly ComponentLayer[],
  layerIds: ReadonlySet<string>,
  groupId: string
): readonly ComponentLayer[] {
  return Object.freeze(
    layers.map((layer) => (layerIds.has(layer.id) ? Object.freeze({ ...layer, groupId }) : layer))
  );
}
