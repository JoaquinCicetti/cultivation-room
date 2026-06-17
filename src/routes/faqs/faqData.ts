// FAQ structure — message-id stems only; the actual copy lives in the i18n
// catalogs (src/i18n/messages.ts) under `faq.<key>.q` / `faq.<key>.a`.
export interface FaqSection {
  titleId: string;
  items: string[]; // faq keys, in display order
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    titleId: "faqs.section.product",
    items: [
      "acquisition",
      "indoorUse",
      "agriculturalUse",
      "sensorCapacity",
      "sensorChoice",
      "whatDevices",
      "deviceControl",
      "acControl",
      "cableLength",
      "energyConsumption",
      "moreEnergy",
      "deviceType",
    ],
  },
  {
    titleId: "faqs.section.platform",
    items: [
      "platformAccess",
      "dataDownload",
      "dataAdministration",
      "internetDisconnection",
      "recordConsultation",
      "appSync",
      "multipleZones",
      "alertConfiguration",
    ],
  },
];
