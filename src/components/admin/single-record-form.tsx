"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodTypeAny } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FieldConfig } from "@/components/admin/resource-form";
import { toInputValue } from "@/components/admin/field-utils";
import { MediaField } from "@/components/admin/media-field";
import { MediaMultiUploader } from "@/components/admin/media-uploader";

export interface SingleRecordFormProps {
  title: string;
  description?: string;
  fields: FieldConfig[];
  schema: ZodTypeAny;
  defaultValues: Record<string, any>;
  onSubmit: (values: any) => Promise<void>;
  submitLabel?: string;
}

export function SingleRecordForm({
  title,
  description,
  fields,
  schema,
  defaultValues,
  onSubmit,
  submitLabel = "Save changes",
}: SingleRecordFormProps) {
  const defaults = React.useMemo(() => {
    const out: Record<string, any> = {};
    for (const f of fields) {
      out[f.name] = toInputValue(defaultValues?.[f.name], f.type);
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
    const out: Record<string, any> = {};
    for (const f of fields) {
      out[f.name] = toInputValue(defaultValues?.[f.name], f.type);
    }
    reset(out);
  }, [fields, defaultValues, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="font-display">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <form id={`single-record-${title}`} onSubmit={submit} className="space-y-4">
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
                          <Switch id={f.name} checked={!!field.value} onCheckedChange={field.onChange} />
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
                    if (f.type === "image" || f.type === "video") {
                      return (
                        <MediaField
                          value={field.value ?? ""}
                          accept={f.accept ?? f.type}
                          folder={f.folder}
                          placeholder={f.placeholder}
                          onChange={(url) => field.onChange(url)}
                        />
                      );
                    }
                    if (f.type === "image-list") {
                      return (
                        <MediaMultiUploader
                          value={field.value ?? ""}
                          accept="both"
                          folder={f.folder}
                          onChange={(urls) => field.onChange(urls.join(", "))}
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
                        type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime-local" ? "datetime-local" : "text"}
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
        </form>
      </CardContent>
      <CardFooter className="border-t border-border/60 pt-4">
        <Button
          type="submit"
          form={`single-record-${title}`}
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
