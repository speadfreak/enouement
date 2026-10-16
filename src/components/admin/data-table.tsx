"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Pencil, Trash2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  /** custom cell renderer */
  render?: (row: T) => React.ReactNode;
  /** property name used for default text rendering & search */
  accessor?: (row: T) => string | number | boolean | null | undefined;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  rowKey: (row: T) => string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  searchKeys?: ((row: T) => string)[];
  emptyLabel?: string;
  /** hide the action column */
  hideActions?: boolean;
  /** caption shown above the table card */
  caption?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  rowKey,
  onEdit,
  onDelete,
  searchKeys,
  emptyLabel = "Nothing here yet.",
  hideActions,
  caption,
}: DataTableProps<T>) {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!q) return rows;
    const needle = q.toLowerCase();
    const keys = searchKeys ?? [];
    return rows.filter((r) =>
      keys.some((k) => (k(r) || "").toLowerCase().includes(needle))
    );
  }, [rows, q, searchKeys]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {caption ? <div className="text-sm text-muted-foreground">{caption}</div> : <div />}
        {searchKeys && searchKeys.length ? (
          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="pl-9"
            />
          </div>
        ) : null}
      </div>

      <div className="glass overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                {columns.map((c) => (
                  <TableHead key={c.key} className={cn("h-11 px-4 text-xs uppercase tracking-wide", c.className)}>
                    {c.header}
                  </TableHead>
                ))}
                {!hideActions ? (
                  <TableHead className="h-11 px-4 text-right text-xs uppercase tracking-wide">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="border-border/60">
                    {columns.map((c) => (
                      <TableCell key={c.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[180px]" />
                      </TableCell>
                    ))}
                    {!hideActions ? (
                      <TableCell className="px-4 py-3 text-right">
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableCell colSpan={columns.length + (hideActions ? 0 : 1)} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="size-6" />
                      <span>{emptyLabel}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={rowKey(row)} className="border-border/60">
                    {columns.map((c) => (
                      <TableCell key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                        {c.render ? c.render(row) : renderDefault(c.accessor ? c.accessor(row) : (row as any)[c.key])}
                      </TableCell>
                    ))}
                    {!hideActions ? (
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {onEdit ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              onClick={() => onEdit(row)}
                              aria-label="Edit"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {onDelete ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive size-8"
                              onClick={() => onDelete(row)}
                              aria-label="Delete"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {rows.length} records
      </p>
    </div>
  );
}

function renderDefault(v: any): React.ReactNode {
  if (v == null || v === "") return <span className="text-muted-foreground/60">—</span>;
  if (typeof v === "boolean") {
    return (
      <Badge variant={v ? "default" : "outline"} className={v ? "" : "text-muted-foreground"}>
        {v ? "Yes" : "No"}
      </Badge>
    );
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="text-muted-foreground/60">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {v.slice(0, 4).map((x, i) => (
          <Badge key={i} variant="outline" className="font-mono text-[10px]">
            {String(x)}
          </Badge>
        ))}
        {v.length > 4 ? <Badge variant="outline">+{v.length - 4}</Badge> : null}
      </div>
    );
  }
  if (v instanceof Date) return <span className="text-muted-foreground">{v.toLocaleString()}</span>;
  const s = String(v);
  if (s.length > 80) return <span title={s}>{s.slice(0, 80)}…</span>;
  return <span>{s}</span>;
}
