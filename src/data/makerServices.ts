import type {
  ConsumableItem,
  LockerOffering,
  MakerServicesDemoState,
  ToolkitTemplate
} from "../types/makerServices";

export const MAKER_SERVICES_STORAGE_KEY = "armature-maker-services-demo-v1";

const lockerPlans = [
  { term: "week", label: "One week", rate: "Rs [rate]" },
  { term: "month", label: "One month", rate: "Rs [rate]" },
  { term: "year", label: "One year", rate: "Rs [rate]" }
] as const;

export const lockerOfferings: LockerOffering[] = [
  {
    slug: "small-parts-locker",
    size: "small",
    name: "Small parts locker",
    description: "Secure storage for controllers, sensors, hand tools, and project boxes.",
    suitedFor: ["Component organizers", "Small prototypes", "Personal hand tools"],
    plans: [...lockerPlans],
    availability: "available",
    storageRules: [
      "Label all stored items with the member name and project.",
      "No loose cells, chemicals, food, or powered devices."
    ]
  },
  {
    slug: "medium-project-locker",
    size: "medium",
    name: "Medium project locker",
    description: "Secure storage for robot subassemblies, test equipment, and work in progress.",
    suitedFor: ["Robot subassemblies", "Equipment cases", "Work-in-progress bins"],
    plans: [...lockerPlans],
    availability: "limited",
    storageRules: [
      "Store sharp items in closed cases.",
      "Disconnect batteries and follow the lab battery-storage process."
    ]
  },
  {
    slug: "tall-build-locker",
    size: "tall",
    name: "Tall build locker",
    description: "Secure vertical storage for larger project cases and long-form assemblies.",
    suitedFor: ["Mobile robot frames", "Long assemblies", "Stacked project crates"],
    plans: [...lockerPlans],
    availability: "limited",
    storageRules: [
      "Keep heavy items on the lowest shelf.",
      "Staff approval is required for batteries, pressurized items, or unusual materials."
    ]
  }
];

export const consumableItems: ConsumableItem[] = [
  {
    slug: "metric-screw-assortment",
    skuCode: "ARM-CNS-SCREWS",
    name: "Metric screw assortment",
    category: "Fasteners",
    description: "Common M2, M3, M4, and M5 machine screws for enclosures and mechanisms.",
    purchaseUnit: "assorted pack",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Return unused pieces to the correctly labelled compartment."]
  },
  {
    slug: "metric-nuts-washers",
    skuCode: "ARM-CNS-NUTS",
    name: "Metric nuts and washers",
    category: "Fasteners",
    description: "Matching nuts, flat washers, and lock washers for common metric builds.",
    purchaseUnit: "assorted pack",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Select the matching thread before tightening an assembly."]
  },
  {
    slug: "hookup-wire",
    skuCode: "ARM-CNS-WIRE",
    name: "Hookup wire",
    category: "Wire and cable",
    description: "Stranded wire in multiple colours for low-voltage prototypes.",
    purchaseUnit: "cut length",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Use only within the wire's marked voltage and current limits."]
  },
  {
    slug: "jumper-wires",
    skuCode: "ARM-CNS-JUMPERS",
    name: "Jumper wires",
    category: "Wire and cable",
    description: "Male-male, male-female, and female-female leads for breadboard work.",
    purchaseUnit: "set",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Inspect loose terminals before applying power."]
  },
  {
    slug: "heat-shrink-tubing",
    skuCode: "ARM-CNS-HEATSHRINK",
    name: "Heat-shrink tubing",
    category: "Wire and cable",
    description: "Assorted diameters for insulating joints and adding strain relief.",
    purchaseUnit: "assorted pack",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Use a controlled heat source at the designated bench."]
  },
  {
    slug: "headers-connectors",
    skuCode: "ARM-CNS-CONNECTORS",
    name: "Headers and connectors",
    category: "Prototyping",
    description: "Breakaway headers, terminal blocks, and common crimp housings.",
    purchaseUnit: "assorted pack",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Use the correct crimp tool and verify polarity before power-up."]
  },
  {
    slug: "cable-ties",
    skuCode: "ARM-CNS-TIES",
    name: "Cable ties",
    category: "Wire and cable",
    description: "Reusable and single-use ties for routing prototype wiring.",
    purchaseUnit: "pack",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Trim ends flush and avoid compressing delicate cables."]
  },
  {
    slug: "breadboards",
    skuCode: "ARM-CNS-BREADBOARD",
    name: "Solderless breadboards",
    category: "Prototyping",
    description: "Reusable boards for low-voltage circuit experiments.",
    purchaseUnit: "board",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Disconnect power before changing circuit wiring."]
  },
  {
    slug: "perfboard",
    skuCode: "ARM-CNS-PERFBOARD",
    name: "Perfboard",
    category: "Prototyping",
    description: "Cuttable prototyping board for permanent hand-soldered circuits.",
    purchaseUnit: "sheet",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Cut and solder only at the appropriate fabrication bench."]
  },
  {
    slug: "electronics-solder",
    skuCode: "ARM-CNS-SOLDER",
    name: "Electronics solder",
    category: "Soldering",
    description: "Small workshop quantities for electronics assembly and repair.",
    purchaseUnit: "small spool",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Use extraction, wash hands after use, and follow the spool's handling label."]
  },
  {
    slug: "electronics-flux",
    skuCode: "ARM-CNS-FLUX",
    name: "Electronics flux",
    category: "Soldering",
    description: "Controlled quantities of electronics-grade flux for rework and assembly.",
    purchaseUnit: "small container",
    price: "Rs [rate]",
    availability: "limited",
    safetyNotes: ["Use extraction and keep the container closed outside the soldering area."]
  },
  {
    slug: "low-voltage-fuses",
    skuCode: "ARM-CNS-FUSES",
    name: "Low-voltage fuse assortment",
    category: "Protection",
    description: "Common replaceable fuses for protected bench prototypes.",
    purchaseUnit: "assorted pack",
    price: "Rs [rate]",
    availability: "available",
    safetyNotes: ["Replace only with the specified type and rating after finding the fault."]
  },
  {
    slug: "prototype-adhesives",
    skuCode: "ARM-CNS-ADHESIVE",
    name: "Prototype adhesives",
    category: "Adhesives",
    description: "Small packs of approved tape and general-purpose project adhesive.",
    purchaseUnit: "pack",
    price: "Rs [rate]",
    availability: "limited",
    safetyNotes: ["Use only approved products in ventilated work areas and follow their labels."]
  },
  {
    slug: "alkaline-batteries",
    skuCode: "ARM-CNS-ALKALINE",
    name: "Sealed alkaline batteries",
    category: "Batteries",
    description: "AA and 9V non-rechargeable cells for low-power test equipment and prototypes.",
    purchaseUnit: "pack",
    price: "Rs [rate]",
    availability: "limited",
    safetyNotes: [
      "Do not recharge, mix old and new cells, or use damaged or leaking cells.",
      "Tape exposed 9V terminals and place spent cells in the designated battery-return bin."
    ]
  }
];

export const toolkitTemplates: ToolkitTemplate[] = [
  {
    slug: "electronics-bench-kit",
    kind: "electronics_bench",
    name: "Electronics bench kit",
    description: "Portable essentials for wiring, prototyping, and board-level checks.",
    includedContents: [
      "Wire stripper",
      "Flush cutters",
      "Needle-nose pliers",
      "Digital multimeter",
      "Test leads",
      "Crimp tool"
    ],
    rentalPlans: [
      { period: "session", rate: "Rs [rate]" },
      { period: "day", rate: "Rs [rate]" },
      { period: "week", rate: "Rs [rate]" }
    ],
    deposit: "Rs [rate]",
    requiredCertification: null,
    safetyNotes: ["Use only on de-energized circuits unless the bench procedure permits live testing."],
    availability: "available"
  },
  {
    slug: "mechanical-assembly-kit",
    kind: "mechanical_assembly",
    name: "Mechanical assembly kit",
    description: "A compact toolbox for robot frames, mounts, and enclosures.",
    includedContents: [
      "Metric hex keys",
      "Combination screwdrivers",
      "Small socket set",
      "Adjustable spanner",
      "Pliers",
      "Tape measure"
    ],
    rentalPlans: [
      { period: "session", rate: "Rs [rate]" },
      { period: "day", rate: "Rs [rate]" },
      { period: "week", rate: "Rs [rate]" }
    ],
    deposit: "Rs [rate]",
    requiredCertification: null,
    safetyNotes: ["Wear eye protection and secure the work before applying torque."],
    availability: "available"
  },
  {
    slug: "portable-soldering-kit",
    kind: "soldering",
    name: "Portable soldering kit",
    description: "A controlled kit for electronics assembly at designated soldering stations.",
    includedContents: [
      "Temperature-controlled soldering unit",
      "Iron stand",
      "Tip cleaner",
      "Desoldering pump",
      "Solder wick",
      "Heat-resistant mat"
    ],
    rentalPlans: [
      { period: "session", rate: "Rs [rate]" },
      { period: "day", rate: "Rs [rate]" }
    ],
    deposit: "Rs [rate]",
    requiredCertification: "Soldering and fume-extraction induction",
    safetyNotes: [
      "Use only at a designated bench with extraction running.",
      "Return the unit cool, clean, and switched off."
    ],
    availability: "limited"
  },
  {
    slug: "precision-toolkit",
    kind: "precision",
    name: "Precision toolkit",
    description: "Small-format tools for sensors, cameras, controllers, and delicate assemblies.",
    includedContents: [
      "Precision bit driver",
      "ESD tweezers",
      "Plastic opening tools",
      "Fine pliers",
      "Inspection loupe",
      "ESD wrist strap"
    ],
    rentalPlans: [
      { period: "session", rate: "Rs [rate]" },
      { period: "day", rate: "Rs [rate]" },
      { period: "week", rate: "Rs [rate]" }
    ],
    deposit: "Rs [rate]",
    requiredCertification: "ESD bench induction",
    safetyNotes: ["Use the wrist strap only at a verified ESD-safe workstation."],
    availability: "available"
  },
  {
    slug: "field-diagnostics-kit",
    kind: "field_diagnostics",
    name: "Field diagnostics kit",
    description: "Portable instruments and leads for diagnosing robots away from the main bench.",
    includedContents: [
      "Digital multimeter",
      "DC clamp meter",
      "USB power meter",
      "Logic probe",
      "Insulated test leads",
      "Cable and connector adapters"
    ],
    rentalPlans: [
      { period: "session", rate: "Rs [rate]" },
      { period: "day", rate: "Rs [rate]" }
    ],
    deposit: "Rs [rate]",
    requiredCertification: "Electrical test-equipment induction",
    safetyNotes: [
      "Restricted to documented extra-low-voltage lab systems.",
      "Inspect probes and leads before every use."
    ],
    availability: "limited"
  }
];

export const makerServicesDemoState: MakerServicesDemoState = {
  lockerUnits: [
    { id: "locker-unit-small-022", code: "L-S-022", size: "small", state: "available" },
    { id: "locker-unit-medium-014", code: "L-M-014", size: "medium", state: "assigned" },
    { id: "locker-unit-medium-015", code: "L-M-015", size: "medium", state: "available" },
    { id: "locker-unit-tall-006", code: "L-T-006", size: "tall", state: "available" }
  ],
  lockerAssignments: [
    {
      id: "locker-assignment-001",
      memberId: "member-demo",
      lockerSlug: "medium-project-locker",
      lockerLabel: "L-M-014",
      planTerm: "month",
      startsOn: "2026-07-15",
      endsOn: "2026-08-14",
      state: "active",
      autoRenew: false
    }
  ],
  consumableOrders: [
    {
      id: "consumable-order-001",
      memberId: "member-demo",
      lines: [
        {
          consumableSlug: "metric-screw-assortment",
          quantity: 1,
          unit: "assorted pack"
        },
        {
          consumableSlug: "jumper-wires",
          quantity: 2,
          unit: "set"
        }
      ],
      total: "Rs [rate]",
      state: "ready",
      requestedAt: "2026-07-26T10:30:00+05:30",
      collectionPoint: "Tool desk"
    }
  ],
  toolkitRentals: [
    {
      id: "toolkit-rental-001",
      memberId: "member-demo",
      toolkitSlug: "electronics-bench-kit",
      assetTag: "ARM-KIT-000021",
      period: "day",
      startsAt: "2026-07-26T11:00:00+05:30",
      dueAt: "2026-07-26T19:00:00+05:30",
      state: "returned",
      deposit: "Rs [rate]",
      checkoutCondition: "good",
      returnCondition: "good",
      returnedAt: "2026-07-26T18:20:00+05:30"
    }
  ]
};

export function readMakerServicesDemoState(): MakerServicesDemoState {
  if (typeof window === "undefined") return makerServicesDemoState;
  try {
    const stored = window.localStorage.getItem(MAKER_SERVICES_STORAGE_KEY);
    return stored
      ? (JSON.parse(stored) as MakerServicesDemoState)
      : makerServicesDemoState;
  } catch {
    return makerServicesDemoState;
  }
}

export function hasOpenDemoToolkitRental(memberId: string) {
  return readMakerServicesDemoState().toolkitRentals.some(
    (rental) =>
      rental.memberId === memberId &&
      ["reserved", "checked_out", "overdue"].includes(rental.state)
  );
}
