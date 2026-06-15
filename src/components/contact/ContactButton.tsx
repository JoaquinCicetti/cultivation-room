import { useState } from "react";

import { ContactDialog } from "./ContactDialog";

// CTA that opens the contact wizard modal. Reuses the shared .cta button style;
// extra className lets callers position it (e.g. the landing's final block).
export function ContactButton({
  label = "Contacto",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className ? `cta ${className}` : "cta"}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && <ContactDialog onClose={() => setOpen(false)} />}
    </>
  );
}
