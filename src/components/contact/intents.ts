// Contact wizard logic, ported from the old landing's ActionDialog. The wizard
// collects a couple of answers, maps them to a canned Spanish message, and
// opens WhatsApp prefilled with it.

const CONTACT_PHONE = "+54 9 341 275-3179";

export type CustomerType = "domestic" | "profesional";
export type DomesticActivity = "sense" | "sense_and_control";
export type AmountOfRooms = "one" | "two" | "more";
export type HowToContinue = "receive_quote" | "coordinate_call";

export interface Domestic {
  type: "domestic";
  domesticActivity: DomesticActivity;
}

export interface Profesional {
  type: "profesional";
  amountOfRooms: AmountOfRooms;
  howToContinue: HowToContinue;
}

export type StepperState = Domestic | Profesional;

export type WhatsappIntent =
  | "domestic_control"
  | "domestic_sensor"
  | "industrial_call"
  | "industrial_quote_one"
  | "industrial_quote_two"
  | "industrial_quote_more";

// Verbatim mapping from the original ActionContext.parseStepperStateToWhatsappIntent.
export function parseStepperStateToWhatsappIntent(state: StepperState): WhatsappIntent {
  if (state.type === "domestic") {
    return state.domesticActivity === "sense" ? "domestic_sensor" : "domestic_control";
  }

  if (state.howToContinue === "coordinate_call") {
    return "industrial_call";
  }

  switch (state.amountOfRooms) {
    case "one":
      return "industrial_quote_one";
    case "two":
      return "industrial_quote_two";
    case "more":
      return "industrial_quote_more";
  }
}

const messages: Record<WhatsappIntent, string> = {
  domestic_control: "Hola, estoy buscando una solución para automatizar mi cultivo doméstico",
  domestic_sensor: "Hola, estoy interesado en monitorear mi cultivo doméstico",
  industrial_call: "Hola, estoy trabajando en una instalación industrial y quiero coordinar una llamada",
  industrial_quote_one:
    "Hola, estoy planificando automatizar una sala de cultivo industrial y quiero recibir una cotización",
  industrial_quote_two:
    "Hola, me gustaría automatizar dos salas de cultivo industrial, ¿me podrían enviar un presupuesto?",
  industrial_quote_more:
    "Hola, estoy pensando en automatizar un establecimiento industrial y me gustaría recibir un presupuesto",
};

// Build the wa.me link from the wizard answers and open it in a new tab.
export function sendWhatsapp(state: StepperState): void {
  const intent = parseStepperStateToWhatsappIntent(state);
  const message = messages[intent];
  const sanitizedPhone = CONTACT_PHONE.replace(/\s+-|\+|\D/g, "");
  const link = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
  window.open(link, "_blank");
}
