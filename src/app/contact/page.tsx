import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { AnimatedText } from "@/components/animated-text";
import { Marquee } from "@/components/marquee";
import { ContactForm } from "@/components/contact/contact-form";
import { getSite } from "@/lib/data";

// ISR: regenerate at most every 60s. Cached reads (tag "site", revalidate 300).
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out to the Enouement 2K27 batch — questions, partnerships, and hellos are all welcome.",
};

export default async function ContactPage() {
  const site = await getSite();

  const contactInfo = (site?.contactInfo as Record<string, string>) ?? {};
  const socialLinks = (site?.socialLinks as Record<string, string>) ?? {};

  const infoCards = [
    {
      icon: Mail,
      label: "Email",
      value: contactInfo.email ?? "hello@enouement2k27.et",
      href: contactInfo.email ? `mailto:${contactInfo.email}` : undefined,
    },
    {
      icon: Phone,
      label: "Phone",
      value: contactInfo.phone ?? "+251 000 000 000",
      href: contactInfo.phone ? `tel:${contactInfo.phone.replace(/\s+/g, "")}` : undefined,
    },
    {
      icon: MapPin,
      label: "Location",
      value: contactInfo.location ?? "Addis Ababa, Ethiopia",
    },
    {
      icon: Clock,
      label: "Response time",
      value: contactInfo.hours ?? "Within 48 hours",
    },
  ];

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
        <div
          aria-hidden
          className="aurora -top-32 left-0 h-80 w-80 bg-primary/30"
        />
        <div
          aria-hidden
          className="aurora -top-20 right-0 h-72 w-72 bg-secondary/30"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Contact
          </p>
          <AnimatedText
            as="h1"
            text="Say Hello"
            className="mt-4 font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-tight"
          />
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Questions, partnerships, hellos — drop us a line. We read every
            message and we&apos;ll get back to you within 48 hours.
          </p>
        </div>
      </section>

      <Marquee text="Let's Talk" className="text-primary" />

      {/* INFO + FORM */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            {/* Info column */}
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary">
                  Reach us
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  <span className="text-gradient">Direct</span> lines
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {infoCards.map(({ icon: Icon, label, value, href }) => {
                  const content = (
                    <div className="glass group flex h-full flex-col gap-2 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:glow-primary">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        {label}
                      </p>
                      <p className="font-display text-base font-semibold text-foreground">
                        {value}
                      </p>
                    </div>
                  );
                  return href ? (
                    <a
                      key={label}
                      href={href}
                      className="block h-full"
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={label} className="h-full">
                      {content}
                    </div>
                  );
                })}
              </div>

              {/* Socials */}
              {Object.keys(socialLinks).length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <p className="mb-3 text-xs uppercase tracking-[0.25em] text-primary">
                    Follow us
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(socialLinks).map(([key, url]) => (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-border bg-surface/40 px-4 py-2 text-xs font-medium uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary"
                      >
                        {key}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="glass-strong rounded-3xl p-6 sm:p-8 md:p-10">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
