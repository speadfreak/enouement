"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Check, ShoppingBag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MagneticButton } from "@/components/magnetic-button";
import { SmartImage } from "@/components/smart-image";
import { cn } from "@/lib/utils";

type MerchItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrls: string[];
  colors: string[];
  sizes: string[];
  details: string | null;
  featured: boolean;
  order: number;
};

function formatETB(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function MerchRow({ item, index }: { item: MerchItem; index: number }) {
  const reduce = useReducedMotion();

  const images = item.imageUrls.length > 0 ? item.imageUrls : ["/merch/placeholder.jpg"];
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [activeColor, setActiveColor] = React.useState<string | null>(
    item.colors[0] ?? null
  );
  const [activeSize, setActiveSize] = React.useState<string | null>(null);

  React.useEffect(() => {
    setActiveIdx(0);
    setActiveColor(item.colors[0] ?? null);
    setActiveSize(null);
  }, [item.id, item.colors]);

  function handleReserve() {
    if (item.sizes.length > 0 && !activeSize) {
      toast.error("Please pick a size first.");
      return;
    }
    toast.success("We'll reach out!", {
      description: `Reserved: ${item.name}${activeSize ? ` · Size ${activeSize}` : ""}`,
    });
  }

  const isReversed = index % 2 === 1;

  return (
    <motion.article
      id={item.id}
      initial={{ opacity: 0, y: reduce ? 0 : 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6 }}
      className="relative scroll-mt-28"
    >
      <div
        className={cn(
          "grid gap-8 lg:grid-cols-2 lg:gap-12",
          isReversed && "lg:[&>*:first-child]:order-2"
        )}
      >
        {/* Gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl gradient-border">
            <SmartImage
              src={images[activeIdx]}
              alt={item.name}
              fill
              seed={item.id}
              fallbackLabel={item.name}
              className="object-cover transition-transform duration-500 hover:scale-110"
              priority={index === 0}
            />
            {item.featured && (
              <div className="absolute left-4 top-4">
                <Badge className="gap-1.5 bg-primary text-primary-foreground">
                  <Star className="size-3.5 fill-current" /> Featured
                </Badge>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {images.slice(0, 5).map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={activeIdx === i}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-xl border transition",
                    activeIdx === i
                      ? "border-primary glow-primary"
                      : "border-border opacity-80 hover:opacity-100"
                  )}
                >
                  <SmartImage
                    src={img}
                    alt={`${item.name} thumbnail ${i + 1}`}
                    fill
                    seed={`${item.id}-${i}`}
                    fallbackLabel=""
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              Enouement 2K27 · Batch Clothes
            </p>
            <h2 className="mt-2 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              <span className="text-gradient">{item.name}</span>
            </h2>
          </div>

          {item.price != null && (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-foreground">
                {formatETB(item.price)}
              </span>
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                ETB
              </span>
            </div>
          )}

          {item.description && (
            <p className="max-w-md leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}

          {/* Colors */}
          {item.colors.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Color
                {activeColor && (
                  <span className="ml-2 normal-case tracking-normal text-foreground">
                    · {activeColor}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {item.colors.map((c) => {
                  const selected = activeColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveColor(c)}
                      aria-label={`Select color ${c}`}
                      aria-pressed={selected}
                      className={cn(
                        "relative size-11 rounded-full border-2 transition",
                        selected
                          ? "border-primary"
                          : "border-border hover:border-primary/60"
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {selected && (
                        <Check
                          className="absolute inset-0 m-auto size-4"
                          style={{
                            color:
                              c.toLowerCase() === "#0b130e" ||
                              c.toLowerCase() === "#000000"
                                ? "#ffe600"
                                : "#0b130e",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {item.sizes.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Size
                {activeSize && (
                  <span className="ml-2 normal-case tracking-normal text-foreground">
                    · {activeSize}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {item.sizes.map((s) => {
                  const selected = activeSize === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setActiveSize(s)}
                      aria-pressed={selected}
                      className={cn(
                        "min-h-[44px] min-w-[3rem] rounded-lg border px-4 py-2 text-sm font-semibold transition",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface/40 text-foreground hover:border-primary/60"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details card */}
          {item.details && (
            <div className="glass rounded-2xl p-5">
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">
                Details
              </p>
              <p className="text-sm leading-relaxed text-foreground/90">
                {item.details}
              </p>
            </div>
          )}

          <div className="mt-2">
            <MagneticButton
              onClick={handleReserve}
              className="h-12 rounded-full bg-primary px-8 font-semibold text-primary-foreground glow-primary"
            >
              <ShoppingBag className="size-5" />
              Reserve Now
            </MagneticButton>
          </div>

          <p className="text-xs text-muted-foreground">
            Reserve now — we&apos;ll reach out to confirm payment &amp; pickup
            details.
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export function MerchShowcase({ items }: { items: MerchItem[] }) {
  if (items.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
        New batch drops coming soon. Stay tuned.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-20 md:gap-28">
      {items.map((item, i) => (
        <MerchRow key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}
