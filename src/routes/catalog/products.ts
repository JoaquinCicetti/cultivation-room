// Catalog data, ported from the old Growcast landing (Chakra + react-intl) into
// a plain Spanish-only data module. Device artwork lives in /public/devices;
// product photos stay on the existing S3 bucket (remote URLs).

const S3 = "https://webapp-resources-production-sa-east-1.s3.sa-east-1.amazonaws.com";

export interface Product {
  name: string;
  description: string;
  benefits: string[];
  image: string; // line-art SVG in /public/devices (rendered inverted on dark)
  link?: string; // MercadoLibre "Comprar" URL
  sheet?: string; // datasheet PDF URL
  pics: string[]; // remote product photos
}

export interface ProductGroup {
  id: string;
  title: string;
  products: Product[];
}

export const groups: ProductGroup[] = [
  {
    id: "controladores",
    title: "Controladores",
    products: [
      {
        name: "Growcast +",
        description:
          "El sistema más completo de monitoreo y control para cultivos indoor. Ideal para usuarios que buscan automatización avanzada, trazabilidad y conectividad total.",
        benefits: [
          "Automatizaciones personalizadas y alertas en tiempo real.",
          "Reportes, trazabilidad y control desde app y web.",
          "Escalable con sensores y módulos para máxima flexibilidad.",
        ],
        image: "/devices/deviceMain.svg",
        link: "https://www.mercadolibre.com.ar/growcast-plus--controlador-principal--sensor-4x1/up/MLAU3061550905",
        sheet: `${S3}/Growcast plus.pdf`,
        pics: [
          `${S3}/PIC-GCplus-1.jpg`,
          `${S3}/PIC-GCplus-2.jpg`,
          `${S3}/PIC-GCplus-3.jpg`,
          `${S3}/PIC-GCplus-4.jpg`,
        ],
      },
      {
        name: "Growcast",
        description:
          "La versión base del ecosistema Growcast, pensada para usuarios que buscan control remoto, monitoreo constante y una plataforma intuitiva para mejorar sus cultivos.",
        benefits: [
          "Control remoto desde cualquier dispositivo.",
          "Registro histórico de datos y tareas.",
          "Plataforma con notificaciones y alarmas configurables.",
        ],
        image: "/devices/deviceGrowcast.svg",
        link: "https://www.mercadolibre.com.ar/estacion-de-sensado-growcast/up/MLAU2894280746",
        sheet: `${S3}/Growcast.pdf`,
        pics: [],
      },
      {
        name: "Growcast Industria",
        description:
          "Controlador diseñado para instalaciones industriales o de gran escala. Permite centralizar procesos complejos con máxima estabilidad y potencia de procesamiento.",
        benefits: [
          "Preparado para operaciones industriales 24/7.",
          "Control de múltiples salas desde una misma interfaz.",
          "Alta capacidad de expansión y robustez.",
        ],
        image: "/devices/deviceGrowcastIndustry.svg",
        pics: [],
      },
    ],
  },
  {
    id: "modulos-de-control",
    title: "Módulos de Control",
    products: [
      {
        name: "Módulo de Control x3",
        description:
          "Diseñado para controlar hasta tres dispositivos de forma remota. Ideal para hogares o pequeños cultivos indoor que buscan eficiencia sin complicaciones.",
        benefits: [
          "Hasta 3 salidas controlables desde la app.",
          "Compatible con enchufes domésticos.",
          "Instalación rápida y segura.",
        ],
        image: "/devices/deviceController_3.svg",
        link: "https://www.mercadolibre.com.ar/modulo-expansor-de-controles-growcast/up/MLAU403355339",
        sheet: `${S3}/Modulo de control.pdf`,
        pics: [
          `${S3}/PIC-MC-1.jpg`,
          `${S3}/PIC-MC-2.jpg`,
          `${S3}/PIC-MC-3.jpg`,
          `${S3}/PIC-MC-4.jpg`,
        ],
      },
    ],
  },
  {
    id: "sensores",
    title: "Sensores",
    products: [
      {
        name: "Sensor THC",
        description:
          "El sensor más completo del ecosistema Growcast. Ideal para monitorear todas las variables ambientales críticas en una sola unidad.",
        benefits: [
          "Medición precisa y confiable de 3 variables.",
          "Calibración automática de fábrica.",
          "Protección IP67 y conexión de largo alcance.",
        ],
        image: "/devices/deviceSensor.svg",
        link: "https://www.mercadolibre.com.ar/sensor-temperatura-y-humedad-ambiente-co2-y-vpd/up/MLAU407166680",
        sheet: `${S3}/Sensor THC.pdf`,
        pics: [
          `${S3}/PIC-TH-1.jpg`,
          `${S3}/PIC-TH-2.jpg`,
          `${S3}/PIC-TH-3.jpg`,
          `${S3}/PIC-TH-4.jpg`,
        ],
      },
      {
        name: "Sensor TH",
        description:
          "Sensor básico pero potente, ideal para quienes no necesitan medir CO₂. Permite conocer las condiciones climáticas con alta precisión.",
        benefits: [
          "Datos precisos con bajo margen de error.",
          "Instalación plug & play.",
          "Resistente al agua y al polvo.",
        ],
        image: "/devices/deviceSensor.svg",
        sheet: `${S3}/Sensor TH.pdf`,
        pics: [
          `${S3}/PIC-TH-1.jpg`,
          `${S3}/PIC-TH-2.jpg`,
          `${S3}/PIC-TH-3.jpg`,
          `${S3}/PIC-TH-4.jpg`,
        ],
      },
      {
        name: "Sensor THP",
        description:
          "Ideal para quienes buscan mayor control ambiental incluyendo presión barométrica. Ofrece monitoreo ampliado y precisión profesional.",
        benefits: [
          "Mide 3 variables clave del entorno.",
          "Excelente para cultivos sensibles a presión.",
          "Compatible con todos los controladores Growcast.",
        ],
        image: "/devices/deviceSensor.svg",
        pics: [
          `${S3}/PIC-TH-1.jpg`,
          `${S3}/PIC-TH-2.jpg`,
          `${S3}/PIC-TH-3.jpg`,
          `${S3}/PIC-TH-4.jpg`,
        ],
      },
      {
        name: "Sensor HS",
        description:
          "Diseñado para conocer en tiempo real la humedad del sustrato. Se adapta a diferentes tipos de cultivo gracias a su calibración personalizada.",
        benefits: [
          "Lectura precisa de humedad en sustratos.",
          "Calibración desde la app en vacío y con agua.",
          "Resistente y apto para condiciones exigentes.",
        ],
        image: "/devices/deviceSensor.svg",
        link: "https://www.mercadolibre.com.ar/sensor-humedad-de-suelo/up/MLAU2889382787",
        sheet: `${S3}/Sensor HS.pdf`,
        pics: [`${S3}/PIC-HS-1.jpg`, `${S3}/PIC-HS-2.jpg`, `${S3}/PIC-HS-3.jpg`],
      },
    ],
  },
  {
    id: "expansores",
    title: "Expansores",
    products: [
      {
        name: "Expansor x3",
        description:
          "Expansor pasivo que permite sumar hasta tres sensores o módulos adicionales a tu sistema. Compacto, liviano y de fácil instalación.",
        benefits: [
          "Conexión simple tipo cascada.",
          "Ideal para pequeñas ampliaciones del sistema.",
          "No requiere alimentación externa.",
        ],
        image: "/devices/deviceGrowcast_3.0.svg",
        link: "https://www.mercadolibre.com.ar/modulo-expansor-de-sensores-growcast/up/MLAU403357691",
        sheet: `${S3}/Expansor x3.pdf`,
        pics: [
          `${S3}/PIC-ExpX3-1.jpg`,
          `${S3}/PIC-ExpX3-2.jpg`,
          `${S3}/PIC-ExpX3-3.jpg`,
          `${S3}/PIC-ExpX3-4.jpg`,
        ],
      },
      {
        name: "Expansor x5",
        description:
          "Expansor activo que permite sumar hasta cinco sensores o módulos, con alimentación eléctrica propia. Recomendado para salas lejanas al controlador principal.",
        benefits: [
          "Amplía el alcance de la red Growcast.",
          "Alimentación independiente para sensores.",
          "Protección IP67 para entornos exigentes.",
        ],
        image: "/devices/deviceGrowcast_5.0.svg",
        sheet: `${S3}/Expansor x5.pdf`,
        pics: [
          `${S3}/PIC-ExpX5-1.jpg`,
          `${S3}/PIC-ExpX5-2.jpg`,
          `${S3}/PIC-ExpX5-3.jpg`,
          `${S3}/PIC-ExpX5-4.jpg`,
        ],
      },
    ],
  },
];
