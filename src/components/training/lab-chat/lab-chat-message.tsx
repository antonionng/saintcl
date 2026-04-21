"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { LabChatMessage } from "./lab-chat-types";

type Segment =
  | { kind: "text"; content: string }
  | { kind: "code"; language: string; code: string };

function splitFencedCode(input: string): Segment[] {
  if (!input) return [];
  const segments: Segment[] = [];
  const pattern = /```(\w*)\n([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    const [full, language, code] = match;
    if (match.index > cursor) {
      segments.push({ kind: "text", content: input.slice(cursor, match.index) });
    }
    segments.push({ kind: "code", language: language || "python", code: code.replace(/\s+$/u, "") });
    cursor = match.index + full.length;
  }
  if (cursor < input.length) {
    segments.push({ kind: "text", content: input.slice(cursor) });
  }
  return segments;
}

// Inline markdown: **bold**, *italic* / _italic_, `code`, [text](url).
// Defensive against malformed input - unmatched markers fall through as text.
function renderInline(text: string): ReactNode[] {
  if (!text) return [];
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*([^*\n]+?)\*\*|`([^`\n]+?)`|\[([^\]\n]+?)\]\((https?:\/\/[^\s)]+)\)|(?<![*\w])\*([^*\n]+?)\*(?!\*)|(?<!\w)_([^_\n]+?)_(?!\w))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const [full, , bold, code, linkText, linkHref, italicStar, italicUnderscore] = match;
    if (bold) {
      nodes.push(
        <strong key={`b-${key++}`} className="font-semibold text-white">
          {bold}
        </strong>,
      );
    } else if (code) {
      nodes.push(
        <code
          key={`c-${key++}`}
          className="rounded-md border border-white/10 bg-black/40 px-1 py-0.5 text-[12px] text-zinc-100"
        >
          {code}
        </code>,
      );
    } else if (linkText && linkHref) {
      nodes.push(
        <a
          key={`a-${key++}`}
          href={linkHref}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sky-300 underline-offset-2 hover:underline"
        >
          {linkText}
        </a>,
      );
    } else if (italicStar || italicUnderscore) {
      nodes.push(
        <em key={`i-${key++}`} className="italic text-zinc-100">
          {italicStar ?? italicUnderscore}
        </em>,
      );
    } else {
      nodes.push(full);
    }
    cursor = match.index + full.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

type MarkdownBlock =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "ordered"; items: string[] }
  | { kind: "bullet"; items: string[] };

const ORDERED_LINE = /^\s*\d+[.)]\s+(.+)$/;
const BULLET_LINE = /^\s*[-*]\s+(.+)$/;
const HEADING_LINE = /^(#{1,3})\s+(.+)$/;

// Parse plain text (no fenced code - handled upstream) into block-level
// markdown elements. Continuation lines on a list item join the previous item
// with a single space so nested bullets read as part of the parent line.
function parseBlocks(input: string): MarkdownBlock[] {
  const lines = input.split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    if (raw.trim() === "") {
      i++;
      continue;
    }
    const heading = HEADING_LINE.exec(raw);
    if (heading) {
      const level = Math.min(heading[1].length, 3) as 1 | 2 | 3;
      blocks.push({ kind: "heading", level, text: heading[2].trim() });
      i++;
      continue;
    }
    const ordered = ORDERED_LINE.exec(raw);
    if (ordered) {
      const items: string[] = [ordered[1].trim()];
      i++;
      while (i < lines.length) {
        const next = lines[i];
        if (next.trim() === "") break;
        const nextOrdered = ORDERED_LINE.exec(next);
        if (nextOrdered) {
          items.push(nextOrdered[1].trim());
          i++;
          continue;
        }
        if (/^\s+\S/.test(next)) {
          items[items.length - 1] = `${items[items.length - 1]} ${next.trim()}`;
          i++;
          continue;
        }
        break;
      }
      blocks.push({ kind: "ordered", items });
      continue;
    }
    const bullet = BULLET_LINE.exec(raw);
    if (bullet) {
      const items: string[] = [bullet[1].trim()];
      i++;
      while (i < lines.length) {
        const next = lines[i];
        if (next.trim() === "") break;
        const nextBullet = BULLET_LINE.exec(next);
        if (nextBullet) {
          items.push(nextBullet[1].trim());
          i++;
          continue;
        }
        if (/^\s+\S/.test(next)) {
          items[items.length - 1] = `${items[items.length - 1]} ${next.trim()}`;
          i++;
          continue;
        }
        break;
      }
      blocks.push({ kind: "bullet", items });
      continue;
    }
    const paragraphLines: string[] = [raw];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (next.trim() === "") break;
      if (HEADING_LINE.test(next) || ORDERED_LINE.test(next) || BULLET_LINE.test(next)) break;
      paragraphLines.push(next);
      i++;
    }
    blocks.push({ kind: "paragraph", text: paragraphLines.join("\n") });
  }
  return blocks;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CodeBlock({
  code,
  language,
  isRunnable,
  onRun,
}: {
  code: string;
  language: string;
  isRunnable: boolean;
  onRun: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const lineCount = code.split("\n").length;
  const isLong = lineCount > 30;
  const [expanded, setExpanded] = useState(!isLong);
  const visibleCode = expanded ? code : code.split("\n").slice(0, 30).join("\n");

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07111b]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          {language || "python"}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(code).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              });
            }}
            className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          {isRunnable ? (
            <button
              type="button"
              onClick={() => onRun(code)}
              className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.1] px-2.5 py-0.5 text-[10px] font-medium text-emerald-100 transition hover:bg-emerald-400/[0.16]"
            >
              Run
            </button>
          ) : null}
        </div>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[12px] leading-5 text-zinc-100">
        <code>{visibleCode}</code>
      </pre>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="block w-full border-t border-white/[0.06] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-zinc-400 transition hover:bg-white/[0.04]"
        >
          {expanded ? "Collapse" : `Show all ${lineCount} lines`}
        </button>
      ) : null}
    </div>
  );
}

function AssistantReply({
  text,
  isPending,
  runtimeReady,
  onRunCode,
}: {
  text: string;
  isPending: boolean | undefined;
  runtimeReady: boolean;
  onRunCode: (code: string) => void;
}) {
  const segments = useMemo(() => splitFencedCode(text), [text]);
  const trimmed = text.trim();
  const isThinking = Boolean(isPending) && trimmed.length === 0;
  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[88%] space-y-3 rounded-3xl rounded-tl-md border border-sky-400/[0.12] bg-sky-400/[0.04] px-4 py-3 text-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.22em] text-sky-200/80">Coach</span>
          {isPending && !isThinking ? (
            <span className="text-[10px] text-zinc-400">thinking...</span>
          ) : null}
        </div>
        {isThinking ? (
          <div className="flex items-center gap-2 py-1 text-[12px] text-zinc-400">
            <span className="inline-flex items-center gap-1" aria-hidden>
              <span className="size-1.5 animate-pulse rounded-full bg-sky-200/80 [animation-delay:-0.2s]" />
              <span className="size-1.5 animate-pulse rounded-full bg-sky-200/80" />
              <span className="size-1.5 animate-pulse rounded-full bg-sky-200/80 [animation-delay:0.2s]" />
            </span>
            <span>Coach is thinking</span>
          </div>
        ) : segments.length === 0 ? (
          <p className="text-[12px] text-zinc-400">(empty reply)</p>
        ) : (
          segments.map((segment, index) =>
            segment.kind === "text" ? (
              <MarkdownLite key={index} text={segment.content} />
            ) : (
              <CodeBlock
                key={index}
                code={segment.code}
                language={segment.language}
                isRunnable={runtimeReady && (segment.language === "python" || segment.language === "")}
                onRun={onRunCode}
              />
            ),
          )
        )}
      </div>
    </div>
  );
}

function MarkdownLite({ text }: { text: string }) {
  const trimmed = text.replace(/^\n+|\n+$/g, "");
  const blocks = useMemo(() => (trimmed ? parseBlocks(trimmed) : []), [trimmed]);
  if (blocks.length === 0) return null;
  return (
    <div className="space-y-2 text-[13px] leading-6 text-zinc-200">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          if (block.level === 1) {
            return (
              <h3 key={index} className="text-[15px] font-semibold text-white">
                {renderInline(block.text)}
              </h3>
            );
          }
          if (block.level === 2) {
            return (
              <h4 key={index} className="text-[14px] font-semibold text-white">
                {renderInline(block.text)}
              </h4>
            );
          }
          return (
            <h5
              key={index}
              className="text-[12px] font-semibold uppercase tracking-[0.18em] text-zinc-300"
            >
              {renderInline(block.text)}
            </h5>
          );
        }
        if (block.kind === "ordered") {
          return (
            <ol key={index} className="ml-5 list-decimal space-y-1.5 marker:text-zinc-500">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1 text-zinc-200">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        }
        if (block.kind === "bullet") {
          return (
            <ul key={index} className="ml-5 list-disc space-y-1 marker:text-zinc-500">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1 text-zinc-200">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="whitespace-pre-wrap">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

function AssistantError({
  message,
  onRetryCoach,
}: {
  message: Extract<LabChatMessage, { kind: "assistant_error" }>;
  onRetryCoach?: (prompt: string, extraSystem: string | null) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const canRetry = Boolean(message.retryPrompt && onRetryCoach);
  const hasDetail = Boolean(message.detail && message.detail.trim().length > 0);
  const showDetailButton =
    hasDetail &&
    (process.env.NODE_ENV !== "production" || message.detail !== message.text);
  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[88%] space-y-2 rounded-3xl rounded-tl-md border border-rose-400/30 bg-rose-400/[0.06] px-4 py-3 text-[12px] leading-5 text-rose-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.22em] text-rose-200/80">
            Coach error
          </span>
        </div>
        <p className="whitespace-pre-wrap">{message.text}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {canRetry ? (
            <button
              type="button"
              onClick={() => {
                onRetryCoach?.(message.retryPrompt ?? "", message.retryExtraSystem ?? null);
              }}
              className="rounded-full border border-rose-300/40 bg-rose-300/[0.12] px-3 py-1 text-[11px] font-medium text-rose-50 transition hover:bg-rose-300/[0.2]"
            >
              Retry
            </button>
          ) : null}
          {showDetailButton ? (
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-zinc-200 transition hover:bg-black/50"
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>
          ) : null}
        </div>
        {showDetails && hasDetail ? (
          <pre className="mt-1 overflow-x-auto rounded-2xl border border-rose-400/20 bg-black/40 px-3 py-2 text-[11px] leading-5 text-rose-100/90">
            {message.detail}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

function CodeRunCard({
  message,
}: {
  message: Extract<LabChatMessage, { kind: "code_run" }>;
}) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const codeLines = message.code.split("\n");
  const previewLines = codeLines.slice(0, 8);
  const hasMoreLines = codeLines.length > previewLines.length;
  const visibleCode = codeOpen ? message.code : previewLines.join("\n");

  const statusLabel =
    message.status === "running"
      ? "Running"
      : message.status === "failed"
        ? "Failed"
        : "Ran";
  const statusTone =
    message.status === "running"
      ? "border-amber-400/30 bg-amber-400/[0.08] text-amber-100"
      : message.status === "failed"
        ? "border-rose-400/30 bg-rose-400/[0.08] text-rose-100"
        : "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-100";

  return (
    <div className="space-y-2 rounded-3xl border border-white/[0.06] bg-black/30 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          {message.label ?? "Run output"}
        </p>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusTone}`}>
          {statusLabel}
        </span>
      </div>
      {message.code.trim().length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#07111b]">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">python</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(message.code).then(() => {
                    setCodeCopied(true);
                    window.setTimeout(() => setCodeCopied(false), 1200);
                  });
                }}
                className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                {codeCopied ? "Copied" : "Copy"}
              </button>
              {hasMoreLines ? (
                <button
                  type="button"
                  onClick={() => setCodeOpen((value) => !value)}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  {codeOpen ? "Collapse" : `View full (${codeLines.length} lines)`}
                </button>
              ) : null}
            </div>
          </div>
          <pre className="overflow-x-auto px-4 py-2.5 text-[11px] leading-5 text-zinc-100">
            <code>{visibleCode}</code>
          </pre>
        </div>
      ) : null}
      {message.stdout ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/40 px-3 py-2 text-[11px] leading-5 text-zinc-200">
          {message.stdout}
        </pre>
      ) : null}
      {message.stderr ? (
        <pre className="overflow-x-auto rounded-2xl border border-rose-400/20 bg-rose-400/[0.04] px-3 py-2 text-[11px] leading-5 text-rose-100">
          {message.stderr}
        </pre>
      ) : null}
      {message.dataPreview ? (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-1.5 text-[10px] text-zinc-400">
            <span className="uppercase tracking-[0.16em]">DataFrame &middot; {message.dataPreview.name}</span>
            <span>
              {message.dataPreview.rowCount} rows &middot; {message.dataPreview.columnCount} cols
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  {message.dataPreview.columns.map((column) => (
                    <th
                      key={column}
                      className="border-b border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-left font-medium text-zinc-300"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.dataPreview.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="odd:bg-white/[0.01]">
                    {message.dataPreview!.columns.map((column) => (
                      <td
                        key={column}
                        className="border-b border-white/[0.04] px-2.5 py-1 text-zinc-200"
                      >
                        {row[column] === null || row[column] === undefined
                          ? ""
                          : String(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {message.charts.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {message.charts.map((chart) => (
            <div key={chart.id} className="overflow-hidden rounded-2xl border border-white/[0.06] bg-black/40">
              <Image
                src={chart.dataUrl}
                alt="chart"
                width={640}
                height={400}
                unoptimized
                className="h-auto w-full"
              />
            </div>
          ))}
        </div>
      ) : null}
      {message.files.filter((file) => file.scope === "output").length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {message.files
            .filter((file) => file.scope === "output")
            .map((file) => (
              <span
                key={file.path}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-zinc-200"
              >
                <span className="font-medium">{file.name}</span>
                <span className="text-zinc-500">{formatBytes(file.size)}</span>
              </span>
            ))}
        </div>
      ) : null}
    </div>
  );
}

export type LabChatMessageProps = {
  message: LabChatMessage;
  runtimeReady: boolean;
  onRunCode: (code: string) => void;
  onStartCheckpoint?: () => void;
  onMarkComplete?: () => void;
  canMarkComplete?: boolean;
  onRetryCoach?: (prompt: string, extraSystem: string | null) => void;
};

export function LabChatMessageView({
  message,
  runtimeReady,
  onRunCode,
  onStartCheckpoint,
  onMarkComplete,
  canMarkComplete,
  onRetryCoach,
}: LabChatMessageProps) {
  if (message.kind === "system_brief") {
    return (
      <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Activity</p>
            <h2 className="mt-0.5 text-base font-semibold text-white">{message.title}</h2>
            <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-zinc-400">
              {message.description}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-100">
            <span aria-hidden className="size-1.5 rounded-full bg-emerald-300" />
            Facilitator sees this
          </span>
        </div>
        {message.facilitatorPrompt ? (
          <p className="mt-2 text-[11px] text-zinc-500">
            Facilitator note &middot; {message.facilitatorPrompt}
          </p>
        ) : null}
        {onStartCheckpoint ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onStartCheckpoint}
              className="rounded-full border border-sky-400/30 bg-sky-400/[0.12] px-3 py-1 text-[11px] font-medium text-sky-100 transition hover:bg-sky-400/[0.18]"
            >
              Start checkpoint
            </button>
            <span className="text-[11px] text-zinc-500">
              Or use the next action above to dive in.
            </span>
          </div>
        ) : null}
      </article>
    );
  }

  if (message.kind === "system_note") {
    const tone =
      message.tone === "warn"
        ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-100"
        : message.tone === "success"
          ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100"
          : "border-white/[0.08] bg-white/[0.025] text-zinc-300";
    return (
      <p className={`mx-auto max-w-[680px] rounded-full border px-4 py-1.5 text-center text-[11px] ${tone}`}>
        {message.text}
      </p>
    );
  }

  if (message.kind === "system_dataset") {
    return (
      <div className="mx-auto flex max-w-[680px] items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[11px] text-zinc-300">
        <span aria-hidden className="text-zinc-400">
          {message.datasetSource === "uploaded" ? "Uploaded" : "Attached"}
        </span>
        <span className="font-medium text-white">{message.datasetLabel}</span>
        {message.pathHint ? (
          <code className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-zinc-400">
            {message.pathHint}
          </code>
        ) : null}
      </div>
    );
  }

  if (message.kind === "user_text") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-3xl rounded-tr-md border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-[13px] leading-6 text-zinc-100">
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    );
  }

  if (message.kind === "assistant_reply") {
    return (
      <AssistantReply
        text={message.text}
        isPending={message.isPending}
        runtimeReady={runtimeReady}
        onRunCode={onRunCode}
      />
    );
  }

  if (message.kind === "assistant_error") {
    return (
      <AssistantError
        message={message}
        onRetryCoach={onRetryCoach}
      />
    );
  }

  if (message.kind === "code_run") {
    return <CodeRunCard message={message} />;
  }

  if (message.kind === "checkpoint_event") {
    const tone =
      message.status === "passed" || message.status === "completed"
        ? "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-100"
        : message.status === "retry"
          ? "border-rose-400/30 bg-rose-400/[0.06] text-rose-100"
          : "border-sky-400/30 bg-sky-400/[0.06] text-sky-100";
    const label =
      message.status === "passed"
        ? "Check passed"
        : message.status === "retry"
          ? "Needs another go"
          : message.status === "completed"
            ? "Checkpoint complete"
            : "Checkpoint started";
    return (
      <div className={`rounded-3xl border px-4 py-3 ${tone}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] opacity-80">{label}</p>
            <p className="mt-0.5 text-[13px] font-medium">{message.title}</p>
            {message.detail ? (
              <p className="mt-1 text-[12px] opacity-90">{message.detail}</p>
            ) : null}
            {message.details.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-[11px] opacity-80">
                {message.details.map((detail) => (
                  <li key={detail}>&middot; {detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
          {message.status === "passed" && onMarkComplete && canMarkComplete ? (
            <button
              type="button"
              onClick={onMarkComplete}
              className="rounded-full border border-emerald-400/40 bg-emerald-400/[0.16] px-3 py-1.5 text-xs font-medium text-emerald-50 transition hover:bg-emerald-400/[0.22]"
            >
              Mark checkpoint complete
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}
