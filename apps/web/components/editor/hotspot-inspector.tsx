"use client";

import type { DemoHotspot, DemoStep } from "@supademo/domain";
import React, { useState } from "react";

export interface HotspotInspectorProps {
  hotspot: DemoHotspot;
  steps: readonly DemoStep[];
  readOnly?: boolean;
  onChangeHotspot: (updated: DemoHotspot) => void;
}

export function HotspotInspector({
  hotspot,
  steps,
  readOnly = false,
  onChangeHotspot
}: HotspotInspectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTextChange = (text: string) => {
    onChangeHotspot({ ...hotspot, tooltipText: text });
  };

  const handleTargetStepChange = (targetStepId: string) => {
    onChangeHotspot({ ...hotspot, targetStepId: targetStepId || null });
  };

  const handleColorChange = (color: string) => {
    onChangeHotspot({
      ...hotspot,
      style: { ...hotspot.style, color }
    });
  };

  const handlePulseChange = (pulse: boolean) => {
    onChangeHotspot({
      ...hotspot,
      style: { ...hotspot.style, pulse }
    });
  };

  const handleOpacityChange = (opacity: number) => {
    onChangeHotspot({
      ...hotspot,
      style: { ...hotspot.style, opacity }
    });
  };

  return (
    <div className="space-y-4 text-xs text-slate-200" aria-label="Hotspot Inspector">
      <div className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
        Hotspot Inspector
      </div>

      {/* Simple Default Controls */}
      <div className="space-y-3">
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Tooltip Text</label>
          <input
            type="text"
            value={hotspot.tooltipText ?? ""}
            disabled={readOnly}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="e.g. Click to continue"
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Target Step</label>
          <select
            value={hotspot.targetStepId ?? ""}
            disabled={readOnly}
            onChange={(e) => handleTargetStepChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Next Step (Default)</option>
            {steps.map((step, idx) => (
              <option key={step.id} value={step.id}>
                Step {idx + 1}: {step.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Disclosure */}
      <div className="border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
        >
          <span>{showAdvanced ? "▲ Hide Advanced Options" : "▼ Show Advanced Options"}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 pl-1 border-l-2 border-indigo-500/30">
            <div>
              <label className="block text-slate-400 mb-1">Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={hotspot.style.color}
                  disabled={readOnly}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded bg-transparent border border-slate-700 cursor-pointer"
                />
                <span className="font-mono text-slate-300">{hotspot.style.color}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Opacity ({Math.round(hotspot.style.opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={hotspot.style.opacity}
                disabled={readOnly}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pulse-toggle"
                checked={hotspot.style.pulse}
                disabled={readOnly}
                onChange={(e) => handlePulseChange(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="pulse-toggle" className="text-slate-300 font-medium">
                Pulse Animation
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
