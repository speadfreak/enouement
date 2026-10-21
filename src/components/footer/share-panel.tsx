"use client";

/**
 * SharePanel — copy link + social share + native share + QR popover.
 *
 * Performance:
 *   - Zero added JS for QR — rendered as an <img> pointed at the public
 *     api.qrserver.com endpoint. The browser just downloads a PNG.
 *   - All share buttons are anchor tags (no JS handlers needed for the
 *     simple share-window case) so they remain usable even if JS is
 *     still booting.
 *   - The only JS state is the current URL (filled in on mount to avoid
 *     SSR mismatch) + the popover open state.
 */

import React, { useEffect, useState, type SVGProps } from "react";
import { Link2, QrCode, Share2, MessageCircle, Facebook } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type IconComp = React.FC<SVGProps<SVGSVGElement>>;

type ShareTarget = {
  key: string;
  label: string;
  icon: IconComp;
  href: (url: string, text: string) => string;
};

const TARGETS: ShareTarget[] = [
  {
    key: "telegram",
    label: "Telegram",
    icon: Send,
    href: (u, t) =>
      `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    href: (u, t) =>
      `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}`,
  },
  {
    key: "x",
    label: "X",
    icon: XIcon,
    href: (u, t) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    href: (u, _t) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  },
];

export function SharePanel() {
  const [url, setUrl] = useState("");
  const [shareText] = useState("Énouement 2K27 — The Final Chapter");
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setHasNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Copied!");
    } catch {
      toast.error("Couldn't copy — long-press the URL bar.");
    }
  };

  const nativeShare = async () => {
    if (!hasNativeShare) return;
    try {
      await navigator.share({
        title: "Énouement 2K27",
        text: shareText,
        url,
      });
    } catch {
      /* User cancelled — silent. */
    }
  };

  const qrSrc = url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}`
    : "";

  return (
    <section
      aria-label="Share this site"
      className="glass flex flex-col gap-4 rounded-3xl p-5 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            Spread the word
          </span>
          <h3 className="mt-1 font-display text-lg font-bold sm:text-xl">
            Share Énouement
          </h3>
        </div>
        <Share2 className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Link2 className="h-4 w-4" />
          Copy link
        </button>

        {TARGETS.map(({ key, label, icon: Icon, href }) => (
          <a
            key={key}
            href={url ? href(url, shareText) : "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${label}`}
            title={`Share on ${label}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-foreground/80 transition hover:bg-primary hover:text-primary-foreground"
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}

        {hasNativeShare ? (
          <button
            type="button"
            onClick={nativeShare}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground/5 px-4 text-sm font-medium text-foreground/80 transition hover:bg-primary hover:text-primary-foreground"
          >
            <Share2 className="h-4 w-4" />
            Share…
          </button>
        ) : null}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Show QR code"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-foreground/80 transition hover:bg-primary hover:text-primary-foreground"
            >
              <QrCode className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="flex w-auto flex-col items-center gap-2 p-4"
          >
            {qrSrc ? (
              <img
                src={qrSrc}
                alt="QR code for this page"
                width={120}
                height={120}
                className="rounded-lg"
                loading="lazy"
              />
            ) : null}
            <p className="text-xs text-muted-foreground">
              Scan to open on another device.
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tiny inline brand icons for Telegram and X — keeps us from adding a new
// icon-pack dependency. These are just SVG paths.
// ---------------------------------------------------------------------------

function Send(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.65l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zM17.083 19.77h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default SharePanel;
