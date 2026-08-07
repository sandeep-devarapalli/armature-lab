export const ecosystemSectors = [
  "Robotics",
  "Physical AI",
  "Drones & aerospace",
  "Space hardware",
  "Industrial automation",
  "Hardware & sensing",
  "Learning & training",
  "Research & ecosystem"
] as const;

export type EcosystemSector = (typeof ecosystemSectors)[number];
export type EcosystemEntityType = "Startup" | "Company" | "Research & ecosystem";
export type EcosystemConfidence = "High" | "Medium";
export type EcosystemLocationPrecision = "Locality-level" | "City-level" | "Metro presence";

export interface EcosystemEntity {
  slug: string;
  name: string;
  entityType: EcosystemEntityType;
  sectors: readonly EcosystemSector[];
  summary: string;
  locality: string;
  coordinates?: readonly [longitude: number, latitude: number];
  locationPrecision: EcosystemLocationPrecision;
  confidence: EcosystemConfidence;
  locationConfidence: EcosystemConfidence;
  websiteUrl: string;
  sourceUrl: string;
  founders?: string;
  provenance: string;
  verifiedAt: string;
}

export interface EcosystemGeoJson {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    geometry: {
      type: "Point";
      coordinates: readonly [number, number];
    };
    properties: {
      slug: string;
      name: string;
      sector: EcosystemSector;
      locationPrecision: EcosystemLocationPrecision;
      confidence: EcosystemConfidence;
    };
  }>;
}

export const bengaluruCenter = [77.5946, 12.9716] as const;
export const bengaluruBounds = [
  [77.43, 12.76],
  [77.82, 13.17]
] as const;

const verifiedAt = "2026-07-30";

const entity = (
  value: Omit<EcosystemEntity, "verifiedAt">,
  recordVerifiedAt = verifiedAt
): EcosystemEntity => ({ ...value, verifiedAt: recordVerifiedAt });

export const bengaluruEcosystem = [
  entity({
    slug: "niqo-robotics",
    name: "Niqo Robotics",
    entityType: "Startup",
    sectors: ["Robotics", "Physical AI"],
    summary: "Field-deployed agricultural robots and edge cameras for spraying, thinning, and weeding.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://niqorobotics.com/",
    sourceUrl: "https://niqorobotics.com/about/",
    founders: "Jaisimha Rao",
    provenance: "Bangalore Founders · row 7"
  }),
  entity({
    slug: "ati-motors",
    name: "Ati Motors",
    entityType: "Startup",
    sectors: ["Robotics", "Industrial automation"],
    summary: "Autonomous mobile robots for factory and warehouse material movement.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.atimotors.com/",
    sourceUrl: "https://www.atimotors.com/",
    founders: "Saurabh Chandra",
    provenance: "Bangalore Founders · row 10"
  }),
  entity({
    slug: "systemantics",
    name: "Systemantics",
    entityType: "Company",
    sectors: ["Robotics", "Industrial automation"],
    summary: "Indian industrial robots and automation systems for manufacturing.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.systemantics.com/",
    sourceUrl: "https://www.systemantics.com/about/",
    founders: "Anand Narayanan · Jagannath Raju",
    provenance: "Bangalore Founders · rows 13–14"
  }),
  entity({
    slug: "anscer-robotics",
    name: "ANSCER Robotics",
    entityType: "Startup",
    sectors: ["Robotics", "Industrial automation"],
    summary: "Autonomous mobile robots and factory or warehouse automation systems.",
    locality: "Bommasandra Industrial Area, Bengaluru",
    coordinates: [77.704, 12.816],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.anscer.com/",
    sourceUrl: "https://www.anscer.com/contact-us/",
    founders: "Ebin Sunny · Raghu V · Raj Mohan · Ribin Mathew",
    provenance: "Bangalore Founders · rows 15–18"
  }),
  entity({
    slug: "cynlr",
    name: "CynLr",
    entityType: "Startup",
    sectors: ["Robotics", "Physical AI"],
    summary: "Visual object intelligence intended to make industrial robots adapt to unfamiliar objects.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://cynlr.com/",
    sourceUrl: "https://cynlr.com/",
    founders: "Gokul N A · Nikhil Ramaswamy",
    provenance: "Bangalore Founders · rows 28–29"
  }),
  entity({
    slug: "accio-robotics",
    name: "Accio Robotics",
    entityType: "Startup",
    sectors: ["Robotics", "Industrial automation"],
    summary: "Warehouse robotics and automation for goods movement and order operations.",
    locality: "HSR Layout, Bengaluru",
    coordinates: [77.638, 12.9135],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://acciorobotics.com/",
    sourceUrl: "https://acciorobotics.com/about",
    founders: "Pranav Srinivasan · Tuhin Sharma",
    provenance: "Bangalore Founders · rows 30–31"
  }),
  entity({
    slug: "strider-robotics",
    name: "Strider Robotics",
    entityType: "Startup",
    sectors: ["Robotics", "Physical AI"],
    summary: "Industrial legged robots for material movement and autonomous plant inspection.",
    locality: "Bengaluru · IISc and ARTPARK ecosystem",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.strider-robotics.in/",
    sourceUrl: "https://www.strider-robotics.in/about",
    founders: "Aditya Varma Sagi · Praveenchandra Kuthpady",
    provenance: "Web Research Leads · row 102"
  }),
  entity({
    slug: "rabtronix",
    name: "RABTRONIX",
    entityType: "Startup",
    sectors: ["Robotics", "Industrial automation"],
    summary: "AMRs, AGVs, ASRS, and custom automation machinery for factories and warehouses.",
    locality: "Peenya, Bengaluru",
    coordinates: [77.5195, 13.0291],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.rabtronix.in/",
    sourceUrl: "https://www.linkedin.com/company/rabtronix/",
    founders: "Richu Abraham Sam",
    provenance: "Web Research Leads · row 114"
  }),
  entity({
    slug: "newrro",
    name: "NEWRRO TECH",
    entityType: "Startup",
    sectors: ["Robotics", "Hardware & sensing"],
    summary: "ROS2 AMRs, robot controllers, visual SLAM systems, and robotics lab infrastructure.",
    locality: "Yelahanka, Bengaluru",
    coordinates: [77.5963, 13.1007],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.newrro.in/",
    sourceUrl: "https://www.newrro.in/about",
    founders: "Nikhil U",
    provenance: "Web Research Leads · row 116"
  }),
  entity({
    slug: "control-one-ai",
    name: "Control One AI",
    entityType: "Startup",
    sectors: ["Robotics", "Physical AI", "Industrial automation"],
    summary: "A physical-AI operating system for autonomous forklifts and pallet-moving vehicles.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.linkedin.com/company/control-one-ai/",
    sourceUrl: "https://www.linkedin.com/company/control-one-ai/",
    founders: "Pranavan",
    provenance: "Web Research Leads · row 124"
  }),
  entity({
    slug: "general-autonomy",
    name: "General Autonomy",
    entityType: "Startup",
    sectors: ["Robotics", "Physical AI"],
    summary: "Robotics and AI systems aimed at making capable robots more affordable.",
    locality: "HSR Layout signal · exact site needs verification",
    coordinates: [77.6483, 12.9162],
    locationPrecision: "Locality-level",
    confidence: "Medium",
    locationConfidence: "Medium",
    websiteUrl: "https://elevationcapital.com/portfolio/general-autonomy",
    sourceUrl: "https://elevationcapital.com/portfolio/general-autonomy",
    founders: "Bhanu Pratap Singh · Farid Ahsan",
    provenance: "Bangalore Founders · rows 36–37"
  }),
  entity({
    slug: "origin-autonomy",
    name: "Origin Autonomy",
    entityType: "Startup",
    sectors: ["Robotics", "Physical AI"],
    summary: "Physical-AI and construction-robotics work with a Bengaluru-linked founding team.",
    locality: "Bengaluru team · San Francisco Bay Area presence",
    locationPrecision: "Metro presence",
    confidence: "High",
    locationConfidence: "Medium",
    websiteUrl: "https://www.linkedin.com/company/origin-autonomy",
    sourceUrl: "https://www.linkedin.com/company/origin-autonomy",
    founders: "Ashish Daga · Tushar Makkar · Yogesh Vilasrao Ghaturle",
    provenance: "Bangalore Founders · rows 19–21"
  }),
  entity({
    slug: "edgehax",
    name: "Edgehax",
    entityType: "Startup",
    sectors: ["Physical AI", "Hardware & sensing"],
    summary: "Edge-AI hardware platforms for putting physical intelligence close to devices and sensors.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://edgehax.com/",
    sourceUrl: "https://edgehax.com/about-us/",
    founders: "Prabhu Stavarmath · Savitri Patil",
    provenance: "Bangalore Founders · rows 22–23"
  }),
  entity({
    slug: "invento-robotics",
    name: "Invento Robotics",
    entityType: "Company",
    sectors: ["Robotics"],
    summary: "Service and humanoid-style robots developed for public-facing deployments.",
    locality: "Bengaluru — current operating site needs verification",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://yourstory.com/companies/invento-robotics",
    sourceUrl: "https://yourstory.com/companies/invento-robotics",
    founders: "Balaji Viswanathan · Bharath Kumar · Mahalakshmi Radhakrushnan",
    provenance: "Bangalore Founders · rows 25–27"
  }),
  entity({
    slug: "ifuture-robotics",
    name: "iFuture Robotics",
    entityType: "Startup",
    sectors: ["Robotics", "Industrial automation"],
    summary: "Autonomous warehouse robots, ASRS, parcel sorting, palletizing, and smart logistics.",
    locality: "Bengaluru — operating status and exact site need verification",
    locationPrecision: "City-level",
    confidence: "Medium",
    locationConfidence: "Medium",
    websiteUrl: "https://www.ifuturerobotics.in/",
    sourceUrl: "https://www.ifuturerobotics.in/",
    founders: "Rajesh Manpat",
    provenance: "Bangalore Founders · row 39"
  }),
  entity({
    slug: "mowito",
    name: "Mowito",
    entityType: "Startup",
    sectors: ["Robotics", "Physical AI"],
    summary: "Robot-learning systems that teach factory robots by demonstration rather than fixed programming.",
    locality: "Bengaluru and Detroit",
    locationPrecision: "Metro presence",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.mowito.ai/",
    sourceUrl: "https://www.mowito.ai/",
    provenance: "Web Research Leads · row 15"
  }),
  entity({
    slug: "skild-ai",
    name: "Skild AI",
    entityType: "Startup",
    sectors: ["Robotics", "Physical AI"],
    summary: "General-purpose robot foundation models with a reported Bengaluru presence.",
    locality: "Bengaluru · Pittsburgh · San Mateo",
    locationPrecision: "Metro presence",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.skild.ai/",
    sourceUrl: "https://www.skild.ai/",
    provenance: "Web Research Leads · row 21"
  }),
  entity({
    slug: "craftifai",
    name: "CraftifAI",
    entityType: "Startup",
    sectors: ["Physical AI", "Hardware & sensing"],
    summary: "Embedded, edge-AI, FPGA, IoT, and robotics infrastructure for intelligent physical products.",
    locality: "Bengaluru · Sunnyvale · Mainz",
    locationPrecision: "Metro presence",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.craftifai.com/",
    sourceUrl: "https://www.craftifai.com/",
    provenance: "Web Research Leads · row 100"
  }),
  entity({
    slug: "deevia-software",
    name: "Deevia Software",
    entityType: "Company",
    sectors: ["Physical AI", "Industrial automation"],
    summary: "Embedded and edge-AI engineering with machine-vision inspection for manufacturing.",
    locality: "HSR Layout, Bengaluru",
    coordinates: [77.6425, 12.9105],
    locationPrecision: "Locality-level",
    confidence: "Medium",
    locationConfidence: "High",
    websiteUrl: "https://www.deevia.pw/",
    sourceUrl: "https://www.deevia.pw/about-us/",
    founders: "Indrakant Thakur",
    provenance: "Web Research Leads · row 117"
  }),
  entity({
    slug: "nacstergen-ai",
    name: "Nacstergen AI",
    entityType: "Company",
    sectors: ["Robotics", "Industrial automation"],
    summary: "Robot cells, bin-picking, conveyor measurement, and factory automation systems.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.nacstergen.ai/",
    sourceUrl: "https://www.linkedin.com/company/nacstergen-ai-private-limited/",
    provenance: "Web Research Leads · row 118"
  }),
  entity({
    slug: "bhatiyani-ai",
    name: "Bhatiyani Astute Intelligence",
    entityType: "Startup",
    sectors: ["Physical AI", "Industrial automation"],
    summary: "Computer vision for warehouse inventory, onsite edge devices, and industrial monitoring.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "Medium",
    locationConfidence: "High",
    websiteUrl: "https://bhatiyaniai.com/",
    sourceUrl: "https://bhatiyaniai.com/",
    provenance: "Web Research Leads · row 119"
  }),
  entity({
    slug: "eyres-ai",
    name: "EyRes.AI",
    entityType: "Startup",
    sectors: ["Physical AI", "Industrial automation"],
    summary: "Machine-vision quality inspection, AIoT maintenance, and edge systems for manufacturing.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "Medium",
    locationConfidence: "High",
    websiteUrl: "https://www.eyresai.com/",
    sourceUrl: "https://www.eyresai.com/",
    provenance: "Web Research Leads · row 120"
  }),
  entity({
    slug: "cognecto",
    name: "Cognecto",
    entityType: "Startup",
    sectors: ["Physical AI", "Hardware & sensing", "Industrial automation"],
    summary: "IoT sensors and vision intelligence for heavy equipment, roads, mines, and industrial sites.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.cognecto.com/",
    sourceUrl: "https://www.cognecto.com/",
    founders: "Divyani Singh · Anshul Saxena",
    provenance: "Web Research Leads · row 121"
  }),
  entity({
    slug: "insight-technologies",
    name: "Insight Technologies",
    entityType: "Company",
    sectors: ["Robotics", "Industrial automation"],
    summary: "Robotic cells, gantry systems, AGVs, and special-purpose automation machinery.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "Medium",
    locationConfidence: "High",
    websiteUrl: "https://www.linkedin.com/company/insight-technologies-india/",
    sourceUrl: "https://www.linkedin.com/company/insight-technologies-india/",
    provenance: "Web Research Leads · row 122"
  }),
  entity({
    slug: "minus-zero",
    name: "Minus Zero",
    entityType: "Startup",
    sectors: ["Physical AI", "Robotics"],
    summary: "Camera-based autonomy and embodied-AI foundation models for vehicles.",
    locality: "HSR Layout, Bengaluru",
    coordinates: [77.646, 12.9145],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://minuszero.ai/",
    sourceUrl: "https://minuszero.ai/",
    founders: "Gagandeep Reehal · Gursimran Kalra",
    provenance: "Web Research Leads · row 123"
  }),
  entity({
    slug: "drona-automations",
    name: "Drona Automations",
    entityType: "Startup",
    sectors: ["Robotics", "Industrial automation"],
    summary: "Customized robots and industrial automation, including sewage-pipe cleaning systems.",
    locality: "Yelahanka, Bengaluru",
    coordinates: [77.588, 13.095],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "http://www.dronaautomations.com/",
    sourceUrl: "https://www.linkedin.com/company/drona-automations-pvt-ltd/",
    provenance: "Web Research Leads · row 125"
  }),
  entity({
    slug: "quantavolts",
    name: "QuantaVolts DeepTech",
    entityType: "Startup",
    sectors: ["Robotics", "Hardware & sensing", "Industrial automation"],
    summary: "Robotics, motor-control, embedded-hardware, and industrial-automation engineering.",
    locality: "Bengaluru operating address · Tumakuru registered address",
    locationPrecision: "Metro presence",
    confidence: "Medium",
    locationConfidence: "Medium",
    websiteUrl: "https://www.quantavolts.com/",
    sourceUrl: "https://www.quantavolts.com/",
    founders: "CK Gowda",
    provenance: "Web Research Leads · row 126"
  }),
  entity({
    slug: "tif-labs",
    name: "TIF Labs / Robocraze",
    entityType: "Company",
    sectors: ["Hardware & sensing", "Research & ecosystem"],
    summary: "Robotics and embedded-system hardware, kits, AI labs, and learning infrastructure.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "Medium",
    locationConfidence: "High",
    websiteUrl: "https://tiflabs.in/",
    sourceUrl: "https://tiflabs.in/about-us/",
    founders: "Daniel D'Souza",
    provenance: "Bangalore Founders · row 38"
  }),
  entity({
    slug: "yantrayug",
    name: "YANTRAYUG",
    entityType: "Startup",
    sectors: ["Drones & aerospace", "Physical AI"],
    summary: "Autonomous UAV platforms and mission software for defence, security, and surveillance.",
    locality: "KR Puram, Bengaluru",
    coordinates: [77.7, 13.006],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.yantrayug.in/",
    sourceUrl: "https://www.yantrayug.in/about",
    founders: "D Manoj",
    provenance: "Web Research Leads · row 113"
  }),
  entity({
    slug: "suind",
    name: "SUIND",
    entityType: "Startup",
    sectors: ["Drones & aerospace", "Physical AI", "Hardware & sensing"],
    summary: "Autonomy-first aerial robotics for agricultural operations in complex and GPS-degraded terrain.",
    locality: "MCECHS Layout, Bengaluru",
    coordinates: [77.6152, 13.0726],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://suind.com/",
    sourceUrl: "https://suind.com/about-us/",
    founders: "Kunal Shrivastava · Kevin Kleber",
    provenance: "User Provided Startups · supplied 30-07-2026; official address and founders verified 30-07-2026; OpenStreetMap locality centroid"
  }),
  entity({
    slug: "vayuyantra",
    name: "VayuYantra",
    entityType: "Startup",
    sectors: ["Drones & aerospace", "Robotics", "Physical AI"],
    summary: "Autonomous industrial drones and indoor ground robots using vision, AI, and IoT.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://vayuyantra.com/",
    sourceUrl: "https://www.linkedin.com/company/vayuyantra/",
    founders: "Prabhat Kler · Sanjeev Kumar Jha",
    provenance: "Web Research Leads · row 115"
  }),
  entity({
    slug: "vecros",
    name: "VECROS",
    entityType: "Startup",
    sectors: ["Drones & aerospace", "Physical AI"],
    summary: "Autonomous drones designed for navigation in GPS-denied environments.",
    locality: "Bengaluru — current operating site needs verification",
    locationPrecision: "City-level",
    confidence: "Medium",
    locationConfidence: "Medium",
    websiteUrl: "https://www.linkedin.com/company/vecros/",
    sourceUrl: "https://www.linkedin.com/company/vecros/",
    founders: "Besta Prem Sai · Rajeshree Deotalu",
    provenance: "Bangalore Founders · rows 33–34"
  }),
  entity({
    slug: "skylark-drones",
    name: "Skylark Drones",
    entityType: "Company",
    sectors: ["Drones & aerospace", "Physical AI"],
    summary: "Drone operations, fleet management, and worksite intelligence for industrial teams.",
    locality: "HSR Layout, Bengaluru",
    coordinates: [77.6366, 12.9129],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://skylarkdrones.com/",
    sourceUrl: "https://skylarkdrones.com/about",
    founders: "Mrinal Pai",
    provenance: "Founder Company Rollup · row 25"
  }),
  entity({
    slug: "general-aeronautics",
    name: "General Aeronautics",
    entityType: "Company",
    sectors: ["Drones & aerospace", "Robotics"],
    summary: "Unmanned aircraft and drone-based systems for agriculture and industrial operations.",
    locality: "Dooravani Nagar / KR Puram, Bengaluru",
    coordinates: [77.678, 13.007],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://generalaeronautics.com/",
    sourceUrl: "https://generalaeronautics.com/ga-contact-us/",
    provenance: "Official source supplement · verified 30-07-2026"
  }),
  entity({
    slug: "asteria-aerospace",
    name: "Asteria Aerospace",
    entityType: "Company",
    sectors: ["Drones & aerospace", "Hardware & sensing"],
    summary: "Unmanned aircraft systems and drone software for enterprise operations.",
    locality: "Yelahanka New Town, Bengaluru",
    coordinates: [77.59, 13.097],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://asteria.co.in/",
    sourceUrl: "https://asteria.co.in/",
    provenance: "User Provided Startups · row 10; official address verified 30-07-2026"
  }),
  entity({
    slug: "bellatrix-aerospace",
    name: "Bellatrix Aerospace",
    entityType: "Startup",
    sectors: ["Space hardware", "Hardware & sensing"],
    summary: "Satellite propulsion systems and orbital-transfer platforms for in-space mobility.",
    locality: "Sankey Road, Bengaluru",
    coordinates: [77.574, 12.993],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://bellatrix.aero/",
    sourceUrl: "https://bellatrix.aero/contact",
    provenance: "User Provided Startups · row 16; official address verified 30-07-2026"
  }),
  entity({
    slug: "comet-aerospace",
    name: "Comet Aerospace",
    entityType: "Startup",
    sectors: ["Drones & aerospace", "Hardware & sensing"],
    summary: "Defence aerospace systems spanning missile propulsion, flight controls, embedded avionics, radar, and air-defence hardware.",
    locality: "Bengaluru — exact site not publicly verified",
    locationPrecision: "City-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.linkedin.com/company/cometaeropace/",
    sourceUrl: "https://in.linkedin.com/jobs/view/business-cofounder-missile-propulsion-startup-by-iit-founder-at-comet-aerospace-4377263062",
    founders: "Garvit Goel",
    provenance: "User Provided Startups · verified 05-08-2026; indexed LinkedIn company and recruiting evidence; no exact public site"
  }, "2026-08-05"),
  entity({
    slug: "xp-robotics",
    name: "XP Robotics",
    entityType: "Startup",
    sectors: ["Robotics", "Physical AI", "Hardware & sensing"],
    summary: "Humanoid robots and physical-AI data infrastructure for learning real-world industrial, logistics, retail, and human-motion tasks.",
    locality: "Roopena Agrahara / Bommanahalli, Bengaluru",
    coordinates: [77.6259, 12.9117],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://xprobotics.ai/",
    sourceUrl: "https://www.linkedin.com/company/xp-robotics/",
    founders: "Vineet Saraogi · Raushan Kumar",
    provenance: "User Provided Startups · verified 07-08-2026; LinkedIn and registry-derived address; OpenStreetMap locality centroid"
  }, "2026-08-07"),
  entity({
    slug: "nolon",
    name: "Nolon AI",
    entityType: "Startup",
    sectors: ["Robotics", "Physical AI", "Hardware & sensing"],
    summary: "Mobile-manipulation and autonomous-cleaning systems combining AMRs, robotic arms, vision, and ROS2-based physical AI.",
    locality: "Rayasandra / Electronic City, Bengaluru",
    coordinates: [77.6821, 12.8766],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "Medium",
    websiteUrl: "https://nolon.ai/",
    sourceUrl: "https://discourse.openrobotics.org/t/hiring-a-cto-co-founder-for-a-humanoid-robotics-startup-in-brussels/50999/3",
    founders: "Sathya Narayanan · Raushan Kumar · Vijeth Rai",
    provenance: "User Provided Startups · verified 07-08-2026; official founding team and registry-derived Bangalore South address; OpenStreetMap locality centroid"
  }, "2026-08-07"),
  entity({
    slug: "panoculon-labs",
    name: "Panoculon Labs",
    entityType: "Startup",
    sectors: ["Physical AI", "Hardware & sensing", "Robotics"],
    summary: "Synchronized egocentric camera and IMU systems for collecting VLA, world-model, manipulation, and 3D-reconstruction training data.",
    locality: "FPM Tower, HSR Layout, Bengaluru",
    coordinates: [77.63295, 12.91538],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.panoculonlabs.com/",
    sourceUrl: "https://www.panoculonlabs.com/trinet",
    founders: "Sreeraj Renjith · Rishabh Sharma",
    provenance: "User Provided Startups · verified 07-08-2026; official product, co-founder, and HSR Layout address pages; official map embed coordinates"
  }, "2026-08-07"),
  entity({
    slug: "fast-code-ai",
    name: "Fast Code AI",
    entityType: "Company",
    sectors: ["Physical AI"],
    summary: "Software R&D for autonomous-driving perception, automotive edge models, gesture recognition, and ADAS data systems.",
    locality: "Whitefield, Bengaluru",
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.fastcode.ai/",
    sourceUrl: "https://www.fastcode.ai/what-we-do/platform-development",
    founders: "Arjun Jain",
    provenance: "User Provided Startups · verified 07-08-2026; official company, portfolio, founder, and Whitefield address pages; physical-AI-adjacent software R&D, not a robot or hardware manufacturer; map coordinate unverified"
  }, "2026-08-07"),
  entity({
    slug: "cautio",
    name: "Cautio",
    entityType: "Startup",
    sectors: ["Physical AI", "Hardware & sensing"],
    summary: "Connected AI dual-camera hardware and video telematics for real-time driver-risk detection and fleet safety.",
    locality: "14th Main Road, Sector 5, HSR Layout, Bengaluru",
    coordinates: [77.63826, 12.91604],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "Medium",
    websiteUrl: "https://www.cautio.com/",
    sourceUrl: "https://play.google.com/store/apps/details?id=in.cautio.cautio",
    founders: "Ankit Acharya · Pranjal Nadhani",
    provenance: "User Provided Startups · verified 07-08-2026; official product and founder pages, current Google Play developer address, and indexed LinkedIn profiles; OpenStreetMap 14th Main Road approximation; deployment figures are company-reported"
  }, "2026-08-07"),
  entity({
    slug: "newspace-research",
    name: "NewSpace Research & Technologies",
    entityType: "Company",
    sectors: ["Drones & aerospace", "Space hardware", "Physical AI"],
    summary: "Autonomous uncrewed aircraft, swarms, mesh networks, and aerospace-defence R&D.",
    locality: "Sahakar Nagar, Bengaluru",
    coordinates: [77.588, 13.062],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://newspace.co.in/",
    sourceUrl: "https://newspace.co.in/",
    provenance: "Official source supplement · verified 30-07-2026"
  }),
  entity({
    slug: "sarla-aviation",
    name: "Sarla Aviation",
    entityType: "Startup",
    sectors: ["Drones & aerospace", "Hardware & sensing"],
    summary: "Electric vertical-take-off aircraft and advanced urban-air-mobility systems.",
    locality: "Indiranagar, Bengaluru",
    coordinates: [77.646, 12.968],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.sarla-aviation.com/",
    sourceUrl: "https://www.sarla-aviation.com/legal/contact/",
    founders: "Rakesh Gaonkar · Adrian Schmidt",
    provenance: "User Provided Startups · row 53; official address verified 30-07-2026"
  }),
  entity({
    slug: "lscl-robotics",
    name: "LSCL Robotics",
    entityType: "Company",
    sectors: ["Learning & training", "Robotics", "Hardware & sensing"],
    summary: "Hands-on STEM and robotics education, kits, trainers, and on-campus labs for school students.",
    locality: "Koramangala 4th Block, Bengaluru",
    coordinates: [77.6295, 12.9331],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://lsclrobotics.com/",
    sourceUrl: "https://in.linkedin.com/company/lscl-robotics",
    provenance: "User-supplied Google share · resolved 03-08-2026; official address verified 03-08-2026; OpenStreetMap road centroid"
  }, "2026-08-03"),
  entity({
    slug: "artpark",
    name: "ARTPARK @ IISc",
    entityType: "Research & ecosystem",
    sectors: ["Research & ecosystem", "Robotics", "Physical AI", "Drones & aerospace"],
    summary: "A Section 8 venture-builder and shared robotics, AI, autonomy, fabrication, and testing ecosystem.",
    locality: "ARTGarage, Jalahalli, Bengaluru",
    coordinates: [77.546, 13.048],
    locationPrecision: "Locality-level",
    confidence: "High",
    locationConfidence: "High",
    websiteUrl: "https://www.artpark.in/",
    sourceUrl: "https://www.artpark.in/artgarage-1",
    provenance: "Web Research Leads · row 127; official facility source verified 30-07-2026"
  })
] as const satisfies readonly EcosystemEntity[];

export function filterEcosystemEntities(
  entities: readonly EcosystemEntity[],
  query: string,
  sector: EcosystemSector | "All"
) {
  const needle = query.trim().toLowerCase();
  return entities.filter((item) => {
    const matchesSector = sector === "All" || item.sectors.includes(sector);
    const haystack = [
      item.name,
      item.entityType,
      item.locality,
      item.summary,
      item.founders ?? "",
      ...item.sectors
    ].join(" ").toLowerCase();
    return matchesSector && (!needle || haystack.includes(needle));
  });
}

export function ecosystemToGeoJson(
  entities: readonly EcosystemEntity[]
): EcosystemGeoJson {
  return {
    type: "FeatureCollection",
    features: entities.flatMap((item) => item.coordinates ? [{
      type: "Feature" as const,
      id: item.slug,
      geometry: {
        type: "Point" as const,
        coordinates: item.coordinates
      },
      properties: {
        slug: item.slug,
        name: item.name,
        sector: item.sectors[0],
        locationPrecision: item.locationPrecision,
        confidence: item.confidence
      }
    }] : [])
  };
}
