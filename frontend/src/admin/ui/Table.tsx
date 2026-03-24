import React from "react";

interface TableProps {
  head: string[];
  rows: React.ReactNode[][];
}

export default function Table({ head, rows }: TableProps) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="text-left text-xs uppercase tracking-wide text-neutral-500 px-4 py-3 border-b"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-neutral-50">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3 border-b">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
