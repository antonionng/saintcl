"use client";

import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type DataFramePreview = {
  name: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  rows: Array<Record<string, string | number | boolean | null>>;
};

export type ChartPreview = {
  id: string;
  dataUrl: string;
};

type OutputPanelProps = {
  expectedSignals: string[];
  stdout: string;
  stderr: string;
  dataPreview: DataFramePreview | null;
  charts: ChartPreview[];
};

export function OutputPanel({ expectedSignals, stdout, stderr, dataPreview, charts }: OutputPanelProps) {
  return (
    <div className="space-y-3">
      <Card className="border-white/8 bg-black/15">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Expected signals</CardTitle>
          <CardDescription>These are the outcomes learners should be able to see before they move on.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {expectedSignals.map((signal, index) => (
            <div
              key={`${index}-${signal}`}
              className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2 text-xs text-zinc-200"
            >
              {signal}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/8 bg-black/15">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Console output</CardTitle>
          <CardDescription>Standard output and errors are split so traceback details are easier to review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Stdout</p>
            <pre className="mt-2 max-h-[14rem] min-h-[6rem] overflow-auto rounded-xl border border-white/8 bg-[#05080d] px-3 py-3 text-xs leading-5 text-zinc-300">
              <code>{stdout || "No stdout yet."}</code>
            </pre>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Stderr</p>
            <pre className="mt-2 max-h-[14rem] min-h-[6rem] overflow-auto rounded-xl border border-white/8 bg-[#05080d] px-3 py-3 text-xs leading-5 text-rose-200">
              <code>{stderr || "No stderr yet."}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {dataPreview ? (
        <Card className="border-white/8 bg-black/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data preview</CardTitle>
            <CardDescription>
              {dataPreview.name} with {dataPreview.rowCount} rows and {dataPreview.columnCount} columns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-xl border border-white/8">
              <table className="min-w-full text-left text-xs text-zinc-300">
                <thead className="bg-white/[0.04] text-zinc-400">
                  <tr>
                    {dataPreview.columns.map((column) => (
                      <th key={column} className="border-b border-white/8 px-3 py-2 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataPreview.rows.map((row, rowIndex) => (
                    <tr key={`${dataPreview.name}-${rowIndex}`} className="bg-black/10">
                      {dataPreview.columns.map((column) => (
                        <td key={`${rowIndex}-${column}`} className="border-b border-white/8 px-3 py-2 align-top">
                          {String(row[column] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {charts.length > 0 ? (
        <Card className="border-white/8 bg-black/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Chart previews</CardTitle>
            <CardDescription>Matplotlib figures from the latest run are rendered inline for quick review.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {charts.map((chart, index) => (
              <div key={chart.id} className="overflow-hidden rounded-2xl border border-white/8 bg-[#05080d] p-2">
                <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Figure {index + 1}</div>
                <Image
                  src={chart.dataUrl}
                  alt={`Generated figure ${index + 1}`}
                  width={1200}
                  height={800}
                  className="h-auto w-full rounded-xl"
                  unoptimized
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
