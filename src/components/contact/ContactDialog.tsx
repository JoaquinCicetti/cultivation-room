import { useEffect, useState } from "react";

import {
  type AmountOfRooms,
  type CustomerType,
  type DomesticActivity,
  type HowToContinue,
  sendWhatsapp,
  type StepperState,
} from "./intents";

const TOTAL_STEPS = 2;

interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

const clientTypeOptions: Option<CustomerType>[] = [
  {
    value: "domestic",
    label: "Doméstica",
    description:
      "Para espacios hogareños. Solo necesitás un tomacorriente para conectar tus equipos (luces, ventilación, etc.).",
  },
  {
    value: "profesional",
    label: "Profesional",
    description:
      "Para salas de mayor escala. Se conecta al tablero eléctrico y requiere instalación por personal calificado.",
  },
];

const domesticActivityOptions: Option<DomesticActivity>[] = [
  {
    value: "sense",
    label: "Sólo sensar variables",
    description: "Temperatura, humedad, CO₂, etc. (sin controlar equipos externos)",
  },
  {
    value: "sense_and_control",
    label: "Sensar y controlar periféricos",
    description: "Además del monitoreo, querés automatizar luces, ventilación, riegos, etc.",
  },
];

const howToContinueOptions: Option<HowToContinue>[] = [
  { value: "receive_quote", label: "Recibir presupuesto" },
  { value: "coordinate_call", label: "Coordinar una llamada" },
];

const amountOfRoomsOptions: Option<AmountOfRooms>[] = [
  { value: "one", label: "Una" },
  { value: "two", label: "Dos o Tres" },
  { value: "more", label: "Más" },
];

function OptionGroup<T extends string>(props: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  collapsed?: boolean;
}) {
  const { label, value, options, onChange, collapsed } = props;
  return (
    <div className="option-block">
      <span className="option-label">{label}</span>
      <div className={collapsed ? "option-row" : "option-grid"}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`option-card${opt.value === value ? " is-selected" : ""}`}
            aria-pressed={opt.value === value}
            onClick={() => onChange(opt.value)}
          >
            <span className="option-card-label">{opt.label}</span>
            {opt.description && <span className="option-card-desc">{opt.description}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// The 2-step contact wizard rendered as a modal. Mirrors the original
// ActionDialog flow without Chakra/i18n.
export function ContactDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [type, setType] = useState<CustomerType>("domestic");
  const [domesticActivity, setDomesticActivity] = useState<DomesticActivity>("sense");
  const [howToContinue, setHowToContinue] = useState<HowToContinue>("receive_quote");
  const [amountOfRooms, setAmountOfRooms] = useState<AmountOfRooms>("one");

  // Close on Escape, lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleSend = () => {
    const state: StepperState =
      type === "domestic"
        ? { type: "domestic", domesticActivity }
        : { type: "profesional", amountOfRooms, howToContinue };
    sendWhatsapp(state);
    onClose();
  };

  return (
    <div className="contact-overlay" onClick={onClose}>
      <div
        className="contact-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Contacto Growcast"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="contact-header">
          <span>¡Bienvenido a Growcast!</span>
          <button type="button" className="contact-close" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="contact-body">
          <p className="contact-intro">
            Antes de ayudarte, necesitamos saber un poco más sobre tu espacio de cultivo, y así
            recomendarte la solución justa para vos.
          </p>

          {step === 0 && (
            <OptionGroup
              label="¿Cómo es tu instalación?"
              value={type}
              options={clientTypeOptions}
              onChange={setType}
            />
          )}

          {step === 1 && type === "domestic" && (
            <OptionGroup
              label="¿Qué necesitas hacer con Growcast?"
              value={domesticActivity}
              options={domesticActivityOptions}
              onChange={setDomesticActivity}
            />
          )}

          {step === 1 && type === "profesional" && (
            <>
              <OptionGroup
                label="¿Cómo prefieres avanzar?"
                value={howToContinue}
                options={howToContinueOptions}
                onChange={setHowToContinue}
              />
              {howToContinue === "receive_quote" && (
                <OptionGroup
                  label="¿Cuántas salas necesitas automatizar?"
                  value={amountOfRooms}
                  options={amountOfRoomsOptions}
                  onChange={setAmountOfRooms}
                  collapsed
                />
              )}
            </>
          )}

          <div className="contact-actions">
            {step > 0 && (
              <button type="button" className="contact-back" onClick={() => setStep(step - 1)}>
                Atrás
              </button>
            )}
            <div className="contact-actions-end">
              {step === 0 ? (
                <button type="button" className="cta" onClick={() => setStep(1)}>
                  Siguiente
                </button>
              ) : (
                <button type="button" className="cta" onClick={handleSend}>
                  Enviar
                </button>
              )}
              <span className="contact-step-num">
                Paso {step + 1}/{TOTAL_STEPS}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
