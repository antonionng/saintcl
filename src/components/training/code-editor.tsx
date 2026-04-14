"use client";

import { useEffect, useRef } from "react";

import { python } from "@codemirror/lang-python";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";

import { cn } from "@/lib/utils";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  minHeightClassName?: string;
  className?: string;
};

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "#07111b",
    color: "#e0f2fe",
    fontSize: "0.95rem",
    lineHeight: "1.7",
    height: "100%",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  ".cm-content": {
    minHeight: "32rem",
    padding: "1rem",
    caretColor: "#f8fafc",
  },
  ".cm-gutters": {
    backgroundColor: "#07111b",
    color: "#64748b",
    border: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(125, 211, 252, 0.22) !important",
  },
});

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  minHeightClassName,
  className,
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const readOnlyCompartmentRef = useRef(new Compartment());

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;

    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
      python(),
      oneDark,
      editorTheme,
      EditorView.lineWrapping,
      readOnlyCompartmentRef.current.of(EditorState.readOnly.of(readOnly)),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        onChangeRef.current(update.state.doc.toString());
      }),
    ];

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    viewRef.current = new EditorView({
      state,
      parent: hostRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [readOnly, value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue === value) return;

    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    });
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: readOnlyCompartmentRef.current.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-b-[1.5rem]",
        minHeightClassName ?? "min-h-[32rem]",
        className,
      )}
    >
      <div ref={hostRef} className="h-full min-h-[32rem]" />
    </div>
  );
}
