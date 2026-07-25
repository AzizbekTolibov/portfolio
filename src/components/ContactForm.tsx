"use client";

import type { FormEvent } from "react";

type ContactFormProps = {
  email: string;
};

/**
 * Minimal accessible fallback to the main email CTA — no backend, just
 * builds a mailto: link from the fields and hands off to the visitor's
 * own mail client.
 */
export function ContactForm({ email }: ContactFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const name = data.get("name")?.toString().trim();
    const message = data.get("message")?.toString().trim() ?? "";

    const subject = encodeURIComponent(
      name ? `Hello from ${name}` : "Hello from your website",
    );
    const body = encodeURIComponent(message);

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="gap-md flex max-w-prose flex-col">
      <div className="gap-xs flex flex-col">
        <label
          htmlFor="contact-name"
          className="text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase"
        >
          Name (optional)
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          className="py-xs text-body text-off-black duration-fast focus:border-off-black border-b border-gray-500 bg-transparent font-sans transition-colors"
        />
      </div>

      <div className="gap-xs flex flex-col">
        <label
          htmlFor="contact-message"
          className="text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          className="py-xs text-body text-off-black duration-fast focus:border-off-black resize-none border-b border-gray-500 bg-transparent font-sans transition-colors"
        />
      </div>

      <button
        type="submit"
        className="text-mono-caption text-off-black duration-fast -my-sm py-sm hover:decoration-accent self-start font-mono tracking-[0.08em] uppercase underline decoration-transparent underline-offset-4 transition-colors"
      >
        Send via email →
      </button>
    </form>
  );
}
