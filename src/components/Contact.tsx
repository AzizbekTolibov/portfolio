import { ContactForm } from "@/components/ContactForm";
import { KineticText } from "@/components/KineticText";
import { Reveal } from "@/components/Reveal";
import { contact } from "@/content/about";
import { home } from "@/content/home";

export function Contact() {
  return (
    <section id="contact" className="px-sm py-section sm:px-md">
      <div className="max-w-content gap-xl mx-auto flex flex-col">
        <div>
          <Reveal>
            <p className="mb-md text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase">
              Contact
            </p>
          </Reveal>
          <KineticText
            text={home.contactHeadline}
            as="h2"
            trigger="scroll"
            splitBy="word"
            className="font-display text-h1 max-w-4xl"
          />
        </div>

        <Reveal>
          <a
            href={`mailto:${contact.email}`}
            className="font-display text-display duration-fast hover:text-accent inline-block max-w-full break-all transition-colors"
          >
            {contact.email}
          </a>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="gap-md flex flex-wrap items-center">
            {contact.socials.map((social) => (
              <a
                key={social.url}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-mono-caption text-off-black duration-fast -my-sm py-sm hover:decoration-accent inline-block font-mono tracking-[0.08em] uppercase underline decoration-transparent underline-offset-4 transition-colors"
              >
                {social.label}
              </a>
            ))}
            <a
              href={contact.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-mono-caption text-off-black duration-fast -my-sm py-sm hover:decoration-accent inline-block font-mono tracking-[0.08em] uppercase underline decoration-transparent underline-offset-4 transition-colors"
            >
              Résumé
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <ContactForm email={contact.email} />
        </Reveal>
      </div>
    </section>
  );
}
