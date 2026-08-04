"use client";

import type { DemoChapter, ChapterType } from "@supademo/domain";
import React, { useState } from "react";

export interface ChapterEditorProps {
  chapter: DemoChapter;
  readOnly?: boolean;
  onChangeChapter: (updated: DemoChapter) => void;
}

export function ChapterEditor({ chapter, readOnly = false, onChangeChapter }: ChapterEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTitleChange = (title: string) => {
    onChangeChapter({ ...chapter, title });
  };

  const handleBodyChange = (bodyText: string) => {
    onChangeChapter({ ...chapter, bodyText: bodyText || null });
  };

  const handleTypeChange = (type: ChapterType) => {
    onChangeChapter({ ...chapter, type });
  };

  const handlePresenterNotesChange = (presenterNotes: string) => {
    onChangeChapter({ ...chapter, presenterNotes: presenterNotes || null });
  };

  return (
    <div className="space-y-4 text-xs text-slate-200" aria-label="Chapter Editor">
      <div className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
        Chapter Editor
      </div>

      {/* Simple Default Authoring */}
      <div className="space-y-3">
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Chapter Type</label>
          <select
            value={chapter.type}
            disabled={readOnly}
            onChange={(e) => handleTypeChange(e.target.value as ChapterType)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="intro">Intro Chapter</option>
            <option value="context">Context Slide</option>
            <option value="instruction">Instruction</option>
            <option value="cta">Call to Action (CTA)</option>
            <option value="survey">Survey / Quiz</option>
            <option value="outro">Outro / Thank You</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Chapter Title</label>
          <input
            type="text"
            value={chapter.title}
            disabled={readOnly}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Welcome to the Platform"
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Body Text / Description</label>
          <textarea
            rows={3}
            value={chapter.bodyText ?? ""}
            disabled={readOnly}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder="Provide context or instructions for viewers..."
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Advanced Disclosure */}
      <div className="border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
        >
          <span>
            {showAdvanced
              ? "▲ Hide Advanced Presenter Options"
              : "▼ Show Presenter Notes & Advanced Options"}
          </span>
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 pl-1 border-l-2 border-indigo-500/30">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Private Presenter Notes
              </label>
              <textarea
                rows={2}
                value={chapter.presenterNotes ?? ""}
                disabled={readOnly}
                onChange={(e) => handlePresenterNotesChange(e.target.value)}
                placeholder="Private notes visible only during live presenter mode..."
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500 italic"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
