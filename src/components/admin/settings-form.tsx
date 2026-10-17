"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SingleRecordForm } from "@/components/admin/single-record-form";
import type { FieldConfig } from "@/components/admin/resource-form";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const schema = z.object({
  siteName: z.string().min(1, "Required"),
  tagline: z.string(),
  description: z.string(),
  footerText: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  countdownLabel: z.string(),
  countdownDate: z.string().optional().nullable(),
  socialLinks: z.string(),
  contactInfo: z.string(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  ogImageUrl: z.string().optional(),
  reduceMotionDefault: z.boolean(),
});

const FIELDS: FieldConfig[] = [
  { name: "siteName", label: "Site Name", type: "text", required: true, placeholder: "Enouement 2K27" },
  { name: "tagline", label: "Tagline", type: "text", placeholder: "The Final Chapter — Class of 2027" },
  { name: "description", label: "Description", type: "textarea", full: true, rows: 3 },
  { name: "footerText", label: "Footer Text", type: "text", full: true },
  { name: "primaryColor", label: "Primary Color", type: "text", placeholder: "#FFE600" },
  { name: "secondaryColor", label: "Secondary Color", type: "text", placeholder: "#00C853" },
  { name: "countdownLabel", label: "Countdown Label", type: "text", placeholder: "Graduation Day" },
  { name: "countdownDate", label: "Countdown Date", type: "datetime-local" },
  { name: "logoUrl", label: "Logo URL", type: "image", folder: "settings", placeholder: "https://…" },
  { name: "faviconUrl", label: "Favicon URL", type: "image", folder: "settings", placeholder: "https://…" },
  { name: "ogImageUrl", label: "OG Image URL", type: "image", full: true, folder: "settings", placeholder: "https://…" },
  {
    name: "socialLinks",
    label: "Social Links (JSON)",
    type: "json",
    full: true,
    description: 'e.g. { "instagram": "https://…", "telegram": "https://…" }',
    rows: 4,
  },
  {
    name: "contactInfo",
    label: "Contact Info (JSON)",
    type: "json",
    full: true,
    description: 'e.g. { "email": "hi@…", "phone": "+251…" }',
    rows: 4,
  },
  { name: "reduceMotionDefault", label: "Reduce Motion (default)", type: "boolean" },
];

export function SettingsForm({ initial }: { initial: Record<string, any> }) {
  const [data, setData] = React.useState<Record<string, any>>(initial);

  const onSubmit = async (values: any) => {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Failed to save settings.");
      throw new Error("save failed");
    }
    const json = await res.json();
    setData(json);
    toast.success("Settings saved.");
  };

  const refetch = async () => {
    const res = await fetch("/api/admin/settings");
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
        title="Site Settings"
        description="Global site-wide configuration. Changes apply across the entire site."
        fields={FIELDS}
        schema={schema}
        defaultValues={data}
        onSubmit={onSubmit}
        submitLabel="Save settings"
      />
    </div>
  );
}
