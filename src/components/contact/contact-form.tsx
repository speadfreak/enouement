"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MagneticButton } from "@/components/magnetic-button";

const schema = z.object({
  name: z
    .string()
    .min(2, "Please tell us your name (2+ characters).")
    .max(80, "That name is a bit long."),
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email."),
  subject: z
    .string()
    .max(120, "Subject is too long.")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "A few more words would help (10+ characters).")
    .max(2000, "Message is too long."),
  // Honeypot — must stay empty
  website: z.string().max(0, "Spam detected.").optional(),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [submitting, setSubmitting] = React.useState(false);
  const inFlight = React.useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });

  async function onSubmit(values: FormValues) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.status === 201) {
        toast.success("Message sent!", {
          description: "We'll get back to you within 48 hours.",
        });
        reset();
        return;
      }
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        toast.error("Slow down a sec", {
          description: data.error ?? "Too many messages. Try again shortly.",
        });
        return;
      }
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        toast.error("Check your details", {
          description:
            (data && (data.error || data.message)) ??
            "Some fields need a closer look.",
        });
        return;
      }
      toast.error("Something went wrong", {
        description: "Please try again in a moment.",
      });
    } catch {
      toast.error("Network error", {
        description: "Please check your connection and try again.",
      });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <fieldset
        disabled={submitting}
        className="flex flex-col gap-5 border-0 p-0"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Send a message
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            <span className="text-gradient">Drop</span> us a line
          </h2>
        </div>

        {/* Name + Email */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Your name"
              aria-invalid={!!errors.name}
              className="bg-surface/50 border-border focus-visible:ring-primary"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              className="bg-surface/50 border-border focus-visible:ring-primary"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Subject */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="subject">
            Subject <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="subject"
            placeholder="What's this about?"
            aria-invalid={!!errors.subject}
            className="bg-surface/50 border-border focus-visible:ring-primary"
            {...register("subject")}
          />
          {errors.subject && (
            <p className="text-xs text-destructive">{errors.subject.message}</p>
          )}
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            rows={6}
            placeholder="Pour your heart out…"
            aria-invalid={!!errors.message}
            className="bg-surface/50 border-border focus-visible:ring-primary min-h-[140px] resize-y"
            {...register("message")}
          />
          {errors.message && (
            <p className="text-xs text-destructive">{errors.message.message}</p>
          )}
        </div>

        {/* Honeypot — visually hidden, must stay empty */}
        <div
          aria-hidden
          className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor="website">Website (leave empty)</label>
          <input
            id="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </div>

        <div className="mt-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-xs text-muted-foreground">
            By sending, you agree to be contacted back about your message.
          </p>
          <MagneticButton className="h-12 min-h-[44px] shrink-0 justify-center rounded-full bg-primary px-6 font-semibold text-primary-foreground glow-primary">
            {submitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
            <span>{submitting ? "Sending…" : "Send Message"}</span>
          </MagneticButton>
        </div>
      </fieldset>
    </form>
  );
}
