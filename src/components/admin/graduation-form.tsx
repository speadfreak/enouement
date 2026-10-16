"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SingleRecordForm } from "@/components/admin/single-record-form";
import type { FieldConfig } from "@/components/admin/resource-form";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const schema = z.object({
  headline: z.string().min(1, "Required"),
  intro: z.string(),
  countdownDate: z.string().optional(),
  program: z.string(),
  thankYouText: z.string().optional(),
  memoriesGallery: z.string(),
});

const FIELDS: FieldConfig[] = [
  { name: "headline", label: "Headline", type: "text", required: true, full: true, placeholder: "The Walk" },
  { name: "intro", label: "Intro", type: "textarea", full: true, rows: 3 },
  { name: "countdownDate", label: "Countdown Date", type: "datetime-local" },
  { name: "thankYouText", label: "Thank-You Text", type: "textarea", full: true, rows: 3 },
  {
    name: "program",
    label: "Program (JSON array)",
    type: "json",
    full: true,
    description: 'e.g. [ { "time": "9:00 AM", "title": "Procession", "speaker": "..." }, … ]',
    rows: 8,
  },
  {
    name: "memoriesGallery",
    label: "Memories Gallery URLs",
    type: "url-list",
    full: true,
    placeholder: "https://…, https://…",
    description: "Comma-separated image URLs shown in the memories gallery.",
  },
];

export function GraduationForm({ initial }: { initial: Record<string, any> }) {
  const [data, setData] = React.useState<Record<string, any>>(initial);

  const onSubmit = async (values: any) => {
    const res = await fetch("/api/admin/graduation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Failed to save graduation content.");
      throw new Error("save failed");
    }
    const json = await res.json();
    setData(json);
    toast.success("Graduation content saved.");
  };

  const refetch = async () => {
    const res = await fetch("/api/admin/graduation");
    if (res.ok) {
      const j = await res.json();
      setData(j);
      toast.success("Reloaded.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={refetch}>
          <RefreshCw className="size-3.5" />
          Reload
        </Button>
      </div>
      <SingleRecordForm
        title="Graduation Content"
        description="The day we've been waiting for. Headline, countdown and full program."
        fields={FIELDS}
        schema={schema}
        defaultValues={data}
        onSubmit={onSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
