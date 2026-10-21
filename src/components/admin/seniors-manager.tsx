"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceForm, type FieldConfig } from "@/components/admin/resource-form";
import { ConfirmDelete, PageHeader } from "@/components/admin/page-header";
import { MediaUploader } from "@/components/admin/media-uploader";
import {
  Plus,
  Star,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  ImagePlus,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Student = {
  id: string;
  name: string;
  nickname: string | null;
  photoUrl: string | null;
  quote: string | null;
  futurePlan: string | null;
  section: string | null;
  club: string | null;
  stream: "Natural" | "Social" | null;
  order: number;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type Stats = {
  total: number;
  published: number;
  natural: number;
  social: number;
  withPhoto: number;
};

type Filters = {
  page: number;
  pageSize: number;
  q: string;
  stream: string; // "" | "Natural" | "Social" | "none"
  published: string; // "" | "true" | "false"
  featured: string; // "" | "true" | "false"
};

type ListResponse = {
  items: Student[];
  total: number;
  page: number;
  pageSize: number;
  stats: Stats;
};

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

/** Minimal CSV parser: handles quoted fields, embedded commas/quotes/newlines. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  // Normalise CRLF / CR to LF — but we still need to emit \n inside quoted fields.
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  while (i < src.length) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  // last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Trim trailing empty rows
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === "") {
    rows.pop();
  }
  return rows;
}

function csvEscape(v: string | null | undefined): string {
  const s = v ?? "";
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const CSV_HEADERS = [
  "name",
  "nickname",
  "section",
  "stream",
  "club",
  "quote",
  "futurePlan",
  "photoUrl",
] as const;

const CSV_TEMPLATE =
  CSV_HEADERS.join(",") +
  "\n" +
  [
    "Abebe Bekele",
    "Abe",
    "A",
    "Natural",
    "Science Club",
    "Dreams don't work unless you do",
    "Addis Ababa University — Software Engineering",
    "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  ]
    .map(csvEscape)
    .join(",") +
  "\n" +
  [
    "Sara Tadesse",
    "Sari",
    "B",
    "Social",
    "Debate Club",
    "The future belongs to those who believe in their dreams",
    "AAU — Law School",
    "",
  ]
    .map(csvEscape)
    .join(",") +
  "\n";

function downloadBlob(filename: string, content: string, mime = "text/csv") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Form schema + fields
// ---------------------------------------------------------------------------

const streamSchema = z
  .union([z.literal("Natural"), z.literal("Social"), z.literal("none")])
  .optional();

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  nickname: z.string().optional(),
  photoUrl: z.string().optional(),
  quote: z.string().optional(),
  futurePlan: z.string().optional(),
  section: z.string().optional(),
  stream: streamSchema,
  club: z.string().optional(),
  order: z.coerce.number().int(),
  featured: z.boolean(),
  published: z.boolean(),
});

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true },
  {
    name: "stream",
    label: "Stream",
    type: "select",
    options: [
      { label: "None", value: "none" },
      { label: "Natural", value: "Natural" },
      { label: "Social", value: "Social" },
    ],
  },
  { name: "nickname", label: "Nickname", type: "text" },
  { name: "section", label: "Section", type: "text", placeholder: "A / B / Science…" },
  { name: "club", label: "Club", type: "text" },
  { name: "photoUrl", label: "Photo", type: "image", full: true, folder: "seniors", placeholder: "https://…" },
  { name: "quote", label: "Quote", type: "textarea", full: true, rows: 2 },
  { name: "futurePlan", label: "Future Plan", type: "textarea", full: true, rows: 2 },
  { name: "order", label: "Order", type: "number" },
  { name: "featured", label: "Featured", type: "boolean" },
  { name: "published", label: "Published", type: "boolean" },
];

const EMPTY = {
  name: "",
  nickname: "",
  photoUrl: "",
  quote: "",
  futurePlan: "",
  section: "",
  stream: "none" as const,
  club: "",
  order: 0,
  featured: false,
  published: true,
};

function valuesToPayload(v: Record<string, any>) {
  const stream =
    v.stream === "Natural" || v.stream === "Social" ? v.stream : "";
  return {
    ...v,
    stream,
  };
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

function StatsBar({ stats }: { stats: Stats | undefined }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-7 w-10" />
          </div>
        ))}
      </div>
    );
  }
  const cards: { label: string; value: number; icon: React.ReactNode; hint?: string }[] = [
    { label: "Total", value: stats.total, icon: <Users className="size-4" />, hint: "All students" },
    { label: "Published", value: stats.published, icon: <CheckCircle2 className="size-4" />, hint: "Visible on site" },
    { label: "Natural", value: stats.natural, icon: <GraduationCap className="size-4" />, hint: "Science stream" },
    { label: "Social", value: stats.social, icon: <GraduationCap className="size-4" />, hint: "Social stream" },
    { label: "With photo", value: stats.withPhoto, icon: <ImagePlus className="size-4" />, hint: "Has a profile photo" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="glass rounded-xl p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-medium uppercase tracking-wide">{c.label}</span>
            <span className="text-primary">{c.icon}</span>
          </div>
          <p className="mt-1.5 font-display text-2xl tabular-nums">{c.value}</p>
          {c.hint ? <p className="text-[10px] text-muted-foreground/80">{c.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-student photo cell with inline uploader popover
// ---------------------------------------------------------------------------

function PhotoCell({
  student,
  onUploaded,
}: {
  student: Student;
  onUploaded: (id: string, url: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group relative size-12 overflow-hidden rounded-full border border-border/60 bg-muted"
          aria-label="Update photo"
        >
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-[10px] font-medium text-muted-foreground">
              {student.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover:opacity-100">
            <ImagePlus className="size-4 text-white" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Upload photo for <span className="text-foreground">{student.name}</span>
        </p>
        <MediaUploader
          value={student.photoUrl ?? ""}
          accept="image"
          folder="seniors"
          hideLabel
          onChange={(url) => {
            if (url) {
              onUploaded(student.id, url);
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Import dialog
// ---------------------------------------------------------------------------

type ParsedRow = {
  raw: string[];
  values: {
    name: string;
    nickname: string;
    section: string;
    stream: string;
    club: string;
    quote: string;
    futurePlan: string;
    photoUrl: string;
  };
  errors: string[];
};

function validateRow(values: ParsedRow["values"]): string[] {
  const errors: string[] = [];
  if (!values.name.trim()) errors.push("name required");
  if (
    values.stream &&
    values.stream !== "Natural" &&
    values.stream !== "Social"
  ) {
    errors.push(`stream must be Natural/Social (got "${values.stream}")`);
  }
  return errors;
}

function ImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onImported: () => void;
}) {
  const qc = useQueryClient();
  const [rows, setRows] = React.useState<ParsedRow[]>([]);
  const [fileName, setFileName] = React.useState<string>("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  React.useEffect(() => {
    if (!open) reset();
  }, [open]);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      toast.error("CSV is empty");
      setRows([]);
      return;
    }
    const header = parsed[0].map((h) => h.trim().toLowerCase());
    const idx: Record<string, number> = {};
    CSV_HEADERS.forEach((h) => {
      const i = header.indexOf(h);
      if (i >= 0) idx[h] = i;
    });
    if (Object.keys(idx).length === 0) {
      toast.error("CSV header not recognized — expected: " + CSV_HEADERS.join(", "));
      setRows([]);
      return;
    }
    const dataRows = parsed.slice(1);
    const out: ParsedRow[] = dataRows.map((cells) => {
      const get = (k: string) => (idx[k] != null ? (cells[idx[k]] ?? "").trim() : "");
      const values = {
        name: get("name"),
        nickname: get("nickname"),
        section: get("section"),
        stream: get("stream"),
        club: get("club"),
        quote: get("quote"),
        futurePlan: get("futurePlan"),
        photoUrl: get("photoUrl"),
      };
      return { raw: cells, values, errors: validateRow(values) };
    });
    setRows(out);
  };

  const validRows = React.useMemo(
    () => rows.filter((r) => r.errors.length === 0),
    [rows]
  );
  const invalidCount = rows.length - validRows.length;

  const importM = useMutation({
    mutationFn: async (payload: Record<string, unknown>[]) => {
      const r = await fetch("/api/admin/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: payload }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Import failed");
      }
      return r.json();
    },
    onSuccess: (data: { created: number }) => {
      toast.success(`Imported ${data.created} students`);
      qc.invalidateQueries({ queryKey: ["admin", "seniors"] });
      onImported();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleImport = async () => {
    const payload = validRows.map((r) => {
      const v = r.values;
      return {
        name: v.name,
        nickname: v.nickname || null,
        section: v.section || null,
        stream:
          v.stream === "Natural" || v.stream === "Social" ? v.stream : null,
        club: v.club || null,
        quote: v.quote || null,
        futurePlan: v.futurePlan || null,
        photoUrl: v.photoUrl || null,
      };
    });
    await importM.mutateAsync(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Import Seniors from CSV</DialogTitle>
          <DialogDescription>
            Bulk-create up to 1000 students at once. Existing students are
            <span className="font-medium text-foreground"> not</span> updated — this only adds new rows.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadBlob("seniors-template.csv", CSV_TEMPLATE)}
          >
            <Download className="size-4" />
            Download template
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <FileSpreadsheet className="size-4" />
            Choose CSV file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {fileName ? (
            <Badge variant="outline" className="font-mono text-[11px]">
              {fileName}
            </Badge>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="grid place-items-center rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              <FileSpreadsheet className="mb-2 size-6" />
              Pick a CSV file to preview its rows here.
              <div className="mt-1 text-[11px] text-muted-foreground/80">
                Headers: {CSV_HEADERS.join(", ")}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline">{rows.length} parsed</Badge>
                <Badge variant="secondary" className="text-primary">{validRows.length} valid</Badge>
                {invalidCount > 0 ? (
                  <Badge variant="destructive">{invalidCount} with errors</Badge>
                ) : null}
              </div>
              <div className="glass max-h-[50vh] overflow-auto rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="h-9 px-2 text-[10px]">#</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Name</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Stream</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Section</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Club</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Quote</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((r, i) => (
                      <TableRow key={i} className="border-border/60">
                        <TableCell className="px-2 py-2 text-[11px] tabular-nums text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="px-2 py-2 text-[11px] font-medium">{r.values.name || <span className="text-muted-foreground/60">—</span>}</TableCell>
                        <TableCell className="px-2 py-2 text-[11px]">{r.values.stream || <span className="text-muted-foreground/60">—</span>}</TableCell>
                        <TableCell className="px-2 py-2 text-[11px]">{r.values.section || <span className="text-muted-foreground/60">—</span>}</TableCell>
                        <TableCell className="px-2 py-2 text-[11px]">{r.values.club || <span className="text-muted-foreground/60">—</span>}</TableCell>
                        <TableCell className="max-w-[200px] truncate px-2 py-2 text-[11px] text-muted-foreground">{r.values.quote}</TableCell>
                        <TableCell className="px-2 py-2">
                          {r.errors.length === 0 ? (
                            <Badge variant="secondary" className="text-[10px] text-primary">OK</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">{r.errors[0]}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {rows.length > 10 ? (
                  <div className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
                    +{rows.length - 10} more rows (not shown — they will still be imported if valid).
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={importM.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={validRows.length === 0 || importM.isPending}
            onClick={handleImport}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {importM.isPending ? (
              <>
                <Progress value={50} className="h-1 w-20" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Import {validRows.length} student{validRows.length === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main manager
// ---------------------------------------------------------------------------

export function SeniorsManager({
  initial,
  initialFilters,
}: {
  initial: ListResponse;
  initialFilters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();

  const [filters, setFilters] = React.useState<Filters>(initialFilters);
  // Debounced search
  const [qInput, setQInput] = React.useState(initialFilters.q);
  React.useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === qInput ? f : { ...f, q: qInput, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  // Sync to URL
  React.useEffect(() => {
    const sp = new URLSearchParams();
    if (filters.page > 1) sp.set("page", String(filters.page));
    if (filters.pageSize !== 25) sp.set("pageSize", String(filters.pageSize));
    if (filters.q) sp.set("q", filters.q);
    if (filters.stream) sp.set("stream", filters.stream);
    if (filters.published) sp.set("published", filters.published);
    if (filters.featured) sp.set("featured", filters.featured);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [filters, pathname, router]);

  const queryKey = React.useMemo(
    () => ["admin", "seniors", "list", filters] as const,
    [filters]
  );

  const { data, isLoading, isFetching } = useQuery<ListResponse>({
    queryKey,
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(filters.page),
        pageSize: String(filters.pageSize),
      });
      if (filters.q) sp.set("q", filters.q);
      if (filters.stream) sp.set("stream", filters.stream);
      if (filters.published) sp.set("published", filters.published);
      if (filters.featured) sp.set("featured", filters.featured);
      const r = await fetch(`/api/admin/seniors?${sp.toString()}`);
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
    placeholderData: (prev) => prev,
  });

  // Reset page if filters change past pageSize (in case total < page*pageSize)
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / filters.pageSize));
  React.useEffect(() => {
    if (filters.page > totalPages) {
      setFilters((f) => ({ ...f, page: totalPages }));
    }
  }, [filters.page, totalPages]);

  // ----- Mutations -----
  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/seniors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valuesToPayload(values)),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to create");
      }
      return r.json();
    },
    onSuccess: () => {
      toast.success("Senior added.");
      qc.invalidateQueries({ queryKey: ["admin", "seniors"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/seniors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valuesToPayload(values)),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to update");
      }
      return r.json();
    },
    onSuccess: () => {
      toast.success("Senior updated.");
      qc.invalidateQueries({ queryKey: ["admin", "seniors"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/seniors/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Senior deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "seniors"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const photoM = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const r = await fetch(`/api/admin/seniors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: url }),
      });
      if (!r.ok) throw new Error("Failed to update photo");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Photo updated.");
      qc.invalidateQueries({ queryKey: ["admin", "seniors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkM = useMutation({
    mutationFn: async (payload: {
      ids: string[];
      action: "publish" | "unpublish" | "feature" | "unfeature" | "delete" | "setStream";
      value?: string;
    }) => {
      const r = await fetch("/api/admin/students/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Bulk action failed");
      }
      return r.json();
    },
    onSuccess: (data: { affected: number }, _vars, _ctx) => {
      toast.success(`Updated ${data.affected} student${data.affected === 1 ? "" : "s"}.`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["admin", "seniors"] });
      setBulkDeleteOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ----- UI state -----
  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Student | null>(null);
  const [deleting, setDeleting] = React.useState<Student | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const items = data?.items ?? [];
  const selectedCount = selected.size;
  const allOnPageSelected = items.length > 0 && items.every((s) => selected.has(s.id));
  const someOnPageSelected = items.some((s) => selected.has(s.id));

  const toggleSelectAll = () => {
    const next = new Set(selected);
    if (allOnPageSelected) {
      items.forEach((s) => next.delete(s.id));
    } else {
      items.forEach((s) => next.add(s.id));
    }
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectedIds = React.useMemo(() => Array.from(selected), [selected]);

  const handleBulk = (action: Parameters<typeof bulkM.mutate>[0]["action"], value?: string) => {
    if (selectedIds.length === 0) return;
    bulkM.mutate({ ids: selectedIds, action, value });
  };

  const handleExport = () => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.stream) sp.set("stream", filters.stream);
    if (filters.published) sp.set("published", filters.published);
    if (filters.featured) sp.set("featured", filters.featured);
    window.location.href = `/api/admin/students/export?${sp.toString()}`;
  };

  const pageSizeOptions = [25, 50, 100];

  return (
    <>
      <PageHeader
        title="Seniors"
        description="Class of 2027 senior profiles — the heart of Énouement."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" />
              Import CSV
            </Button>
            <Button
              onClick={() => setOpenCreate(true)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Add Student
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-4">
        <StatsBar stats={data?.stats} />
      </div>

      {/* Toolbar */}
      <div className="glass mb-3 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search name, nickname, section, club…"
            className="pl-9"
          />
          {qInput ? (
            <button
              type="button"
              onClick={() => setQInput("")}
              className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.stream || "all"}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, stream: v === "all" ? "" : v, page: 1 }))
            }
          >
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Stream" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All streams</SelectItem>
              <SelectItem value="Natural">Natural</SelectItem>
              <SelectItem value="Social">Social</SelectItem>
              <SelectItem value="none">No stream</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.published || "all"}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, published: v === "all" ? "" : v, page: 1 }))
            }
          >
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Published" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Unpublished</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.featured || "all"}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, featured: v === "all" ? "" : v, page: 1 }))
            }
          >
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Featured</SelectItem>
              <SelectItem value="false">Not featured</SelectItem>
            </SelectContent>
          </Select>
          {(filters.q || filters.stream || filters.published || filters.featured) ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setQInput("");
                setFilters((f) => ({ ...f, q: "", stream: "", published: "", featured: "", page: 1 }));
              }}
            >
              <X className="size-3.5" />
              Reset
            </Button>
          ) : null}
        </div>
      </div>

      {/* Table card */}
      <div className="glass relative overflow-hidden rounded-xl">
        {isFetching && !isLoading ? (
          <div className="absolute right-3 top-3 z-10">
            <Badge variant="outline" className="bg-background/80 text-[10px] text-muted-foreground">
              Refreshing…
            </Badge>
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="w-10 px-3">
                  <Checkbox
                    checked={
                      allOnPageSelected
                        ? true
                        : someOnPageSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all on page"
                  />
                </TableHead>
                <TableHead className="h-11 px-2 text-xs uppercase tracking-wide">Photo</TableHead>
                <TableHead className="h-11 px-2 text-xs uppercase tracking-wide">Name</TableHead>
                <TableHead className="h-11 px-2 text-xs uppercase tracking-wide">Stream</TableHead>
                <TableHead className="h-11 px-2 text-xs uppercase tracking-wide">Section</TableHead>
                <TableHead className="h-11 px-2 text-xs uppercase tracking-wide">Club</TableHead>
                <TableHead className="h-11 px-2 text-xs uppercase tracking-wide">Quote</TableHead>
                <TableHead className="h-11 px-2 text-xs uppercase tracking-wide">Status</TableHead>
                <TableHead className="h-11 px-2 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="border-border/60">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j} className="px-2 py-3">
                        <Skeleton className="h-5 w-full max-w-[140px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableCell colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="size-6" />
                      <span>No students match these filters.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((s) => (
                  <TableRow
                    key={s.id}
                    className={cn(
                      "border-border/60 cursor-pointer",
                      selected.has(s.id) && "bg-primary/5"
                    )}
                    onClick={() => setEditing(s)}
                  >
                    <TableCell className="px-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(s.id)}
                        onCheckedChange={() => toggleOne(s.id)}
                        aria-label={`Select ${s.name}`}
                      />
                    </TableCell>
                    <TableCell className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <PhotoCell student={s} onUploaded={(id, url) => photoM.mutate({ id, url })} />
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{s.name}</span>
                        {s.nickname ? (
                          <span className="text-[11px] text-muted-foreground">"{s.nickname}"</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      {s.stream ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            s.stream === "Natural"
                              ? "border-primary/40 text-primary"
                              : "border-secondary/40 text-secondary"
                          )}
                        >
                          {s.stream}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm">{s.section ?? <span className="text-muted-foreground/50">—</span>}</TableCell>
                    <TableCell className="px-2 py-2 text-sm">{s.club ?? <span className="text-muted-foreground/50">—</span>}</TableCell>
                    <TableCell className="max-w-[200px] truncate px-2 py-2 text-sm text-muted-foreground">
                      {s.quote ?? "—"}
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {s.featured ? (
                          <Badge variant="default" className="text-[10px]">
                            <Star className="size-3" />
                            Featured
                          </Badge>
                        ) : null}
                        {s.published ? (
                          <Badge variant="secondary" className="text-[10px] text-primary">
                            <Eye className="size-3" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            <EyeOff className="size-3" />
                            Hidden
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => setEditing(s)}
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive size-8"
                          onClick={() => setDeleting(s)}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Page</span>
          <span className="font-medium text-foreground tabular-nums">{filters.page}</span>
          <span>of</span>
          <span className="font-medium text-foreground tabular-nums">{totalPages}</span>
          <span className="ml-2">·</span>
          <span className="tabular-nums">{data?.total ?? 0}</span>
          <span>total</span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(filters.pageSize)}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, pageSize: Number(v), page: 1 }))
            }
          >
            <SelectTrigger size="sm" className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            disabled={filters.page <= 1 || isFetching}
            onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={filters.page >= totalPages || isFetching}
            onClick={() =>
              setFilters((f) => ({ ...f, page: Math.min(totalPages, f.page + 1) }))
            }
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Bulk action bar — desktop sticky, mobile bottom Sheet */}
      <BulkActionBar
        selectedCount={selectedCount}
        isPending={bulkM.isPending}
        onClear={() => setSelected(new Set())}
        onAction={handleBulk}
        onBulkDelete={() => setBulkDeleteOpen(true)}
      />

      {/* Add / Edit / Delete / Import dialogs */}
      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="Add Senior"
        fields={FIELDS}
        schema={schema}
        defaultValues={EMPTY}
        onSubmit={(v) => createM.mutateAsync(v)}
        submitLabel="Create"
      />
      {editing ? (
        <ResourceForm
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          title="Edit Senior"
          fields={FIELDS}
          schema={schema}
          defaultValues={editing as any}
          onSubmit={(v) => updateM.mutateAsync({ id: editing.id, values: v })}
          submitLabel="Save changes"
        />
      ) : null}
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={() => deleting && deleteM.mutateAsync(deleting.id)}
        title={`Delete "${deleting?.name}"?`}
      />
      <ConfirmDelete
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={() =>
          bulkM.mutateAsync({ ids: selectedIds, action: "delete" })
        }
        title={`Delete ${selectedIds.length} selected student${selectedIds.length === 1 ? "" : "s"}?`}
        description="This action cannot be undone. All selected profiles will be permanently removed."
        confirmLabel={`Delete ${selectedIds.length}`}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          /* invalidation handled by mutation */
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Bulk action bar — sticky on desktop, bottom sheet on mobile
// ---------------------------------------------------------------------------

function BulkActionBar({
  selectedCount,
  isPending,
  onClear,
  onAction,
  onBulkDelete,
}: {
  selectedCount: number;
  isPending: boolean;
  onClear: () => void;
  onAction: (
    action: "publish" | "unpublish" | "feature" | "unfeature" | "setStream",
    value?: string
  ) => void;
  onBulkDelete: () => void;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const actions = (
    <>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => onAction("publish")}>
        <Eye className="size-3.5" />
        Publish
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => onAction("unpublish")}>
        <EyeOff className="size-3.5" />
        Unpublish
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => onAction("feature")}>
        <Star className="size-3.5" />
        Feature
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => onAction("unfeature")}>
        <Sparkles className="size-3.5" />
        Unfeature
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={isPending}>
            Set Stream
            <ChevronRight className="size-3.5 rotate-90" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Set stream</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction("setStream", "Natural")}>
            Natural
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("setStream", "Social")}>
            Social
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("setStream", "none")}>
            Clear stream
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        disabled={isPending}
        onClick={onBulkDelete}
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        <X className="size-3.5" />
        Clear
      </Button>
    </>
  );

  if (selectedCount === 0) return null;

  // Desktop sticky bar (hidden on small screens)
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 hidden md:block">
        <div className="mx-auto mb-4 flex max-w-5xl items-center gap-2 rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur">
          <Badge variant="default" className="bg-primary text-primary-foreground">
            {selectedCount} selected
          </Badge>
          <div className="ml-2 flex flex-1 flex-wrap items-center gap-2">{actions}</div>
        </div>
      </div>

      {/* Mobile: small pill at bottom that opens a sheet */}
      <div className="fixed inset-x-0 bottom-0 z-30 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="mx-auto mb-4 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg"
        >
          <span className="tabular-nums">{selectedCount}</span>
          <span>selected</span>
          <ChevronRight className="size-4 rotate-90" />
        </button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="bottom" className="rounded-t-xl p-4">
          <SheetHeader>
            <SheetTitle>
              {selectedCount} student{selectedCount === 1 ? "" : "s"} selected
            </SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 pb-4">{actions}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
