"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodTypeAny } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toInputValue as toInput } from "@/components/admin/field-utils";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "datetime-local"
  | "select"
  | "tags"
  | "json"
  | "password"
  | "url-list";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  description?: string;
  /** span full width on desktop */
  full?: boolean;
  rows?: number;
}

export interface ResourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldConfig[];
  schema: ZodTypeAny;
  defaultValues: Record<string, any>;
  onSubmit: (values: any) => Promise<void>;
  submitLabel?: string;
}

/** Convenience helper to render a checkbox-only label cell */
export function BooleanCell({ value, label }: { value: boolean; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={!!value} disabled />
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
    </div>
  );
}

export function ResourceForm({
  open,
  onOpenChange,
  title,
  description,
  fields,
  schema,
  defaultValues,
  onSubmit,
  submitLabel = "Save",
}: ResourceFormProps) {
  const defaults = React.useMemo(() => {
    const out: Record<string, any> = {};
    for (const f of fields) {
      out[f.name] = toInput(defaultValues?.[f.name], f.type);
    }
    return out;
  }, [fields, defaultValues]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema as any),
    defaultValues: defaults,
  });

  React.useEffect(() => {
    if (open) {
      const out: Record<string, any> = {};
      for (const f of fields) {
        out[f.name] = toInput(defaultValues?.[f.name], f.type);
      }
      reset(out);
    }
  }, [open, fields, defaultValues, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch {
      // error already toasted by manager
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div
                key={f.name}
                className={cn("space-y-1.5", f.full ? "sm:col-span-2" : "")}
              >
                <Label htmlFor={f.name} className="text-xs uppercase tracking-wide">
                  {f.label}
                  {f.required ? <span className="text-primary">*</span> : null}
                </Label>

                <Controller
                  control={control}
                  name={f.name}
                  render={({ field }) => {
                    if (f.type === "textarea") {
                      return (
                        <Textarea
                          id={f.name}
                          rows={f.rows ?? 4}
                          placeholder={f.placeholder}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      );
                    }
                    if (f.type === "boolean") {
                      return (
                        <div className="flex h-9 items-center">
                          <Switch
                            id={f.name}
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="ml-3 text-sm text-muted-foreground">
                            {field.value ? "Yes" : "No"}
                          </span>
                        </div>
                      );
                    }
                    if (f.type === "select") {
                      return (
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={f.placeholder ?? "Select…"} />
                          </SelectTrigger>
                          <SelectContent>
                            {(f.options ?? []).map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }
                    if (f.type === "tags" || f.type === "url-list") {
                      return (
                        <Input
                          id={f.name}
                          placeholder={f.placeholder ?? "comma, separated, values"}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      );
                    }
                    if (f.type === "json") {
                      return (
                        <Textarea
                          id={f.name}
                          rows={f.rows ?? 6}
                          placeholder='{ "key": "value" }'
                          className="font-mono text-xs"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      );
                    }
                    return (
                      <Input
                        id={f.name}
                        type={f.type === "password" ? "password" : f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime-local" ? "datetime-local" : "text"}
                        placeholder={f.placeholder}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    );
                  }}
                />

                {f.description ? (
                  <p className="text-[11px] text-muted-foreground">{f.description}</p>
                ) : null}
                {errors[f.name as any]?.message ? (
                  <p className="text-[11px] text-destructive">
                    {(errors[f.name as any]?.message as string) || "Invalid value"}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSubmitting ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
