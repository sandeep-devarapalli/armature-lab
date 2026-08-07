export type BuildingVisionFloor =
  | "Frontage"
  | "Ground floor"
  | "First floor"
  | "Second floor"
  | "Circulation";

export type BuildingVisionItem = {
  id: string;
  floor: BuildingVisionFloor;
  title: string;
  proposedUse: string;
  before: string;
  after: string;
  beforeCaption?: string;
  afterCaption?: string;
  beforeAlt?: string;
  afterAlt?: string;
  flooring: string;
  paint: string;
  furniture: string;
  lighting: string;
  preserve: string;
};

export const buildingVisionItems: BuildingVisionItem[] = [
  {
    id: "building-frontage",
    floor: "Frontage",
    title: "Building frontage",
    proposedUse: "Shaded outdoor café seating, main-entrance arrival and Armature identity",
    before: "/building-vision/before/01-building-frontage.jpg",
    after: "/building-vision/after/01-building-frontage.png",
    flooring: "Clean and retain the forecourt; add loose outdoor mats only where needed.",
    paint: "Warm off-white walls with ink-grey metalwork and a restrained saffron sign.",
    furniture: "Movable café tables, weighted market umbrellas, planters and cycle parking within the existing setback.",
    lighting: "Warm surface-mounted wall lights and discreet sign illumination.",
    preserve: "Gate line, curved balcony, columns, windows, trees, drainage and a clear route to the entrance."
  },
  {
    id: "street-identity-concept",
    floor: "Frontage",
    title: "Street approach identity",
    proposedUse: "Street-readable HSR Founders Club identity and a programmable events display",
    before: "/building-vision/before/02-street-identity-concept.png",
    after: "/building-vision/after/02-street-identity-concept.png",
    beforeCaption: "Earlier street-view concept",
    afterCaption: "Revised signage concept",
    beforeAlt: "Earlier street-view concept with armature lettering on the boundary wall",
    afterAlt: "Street-view concept with an HSR Founders Club lightbox and programmable LED information panel",
    flooring: "No change to the footpath or forecourt; retain the existing paving and drainage.",
    paint: "Keep the existing wall profile and warm off-white finish with ink-grey trim.",
    furniture: "Retain the cycle parking, movable café seating and planters without narrowing the gate or footpath.",
    lighting: "Warm opal HSR Founders Club lightbox plus a dimmable, programmable LED information strip.",
    preserve: "Street tree, wall height and profile, gate, entrance, café sign, paving, drainage, bicycles, seating, planters and neighbouring context."
  },
  {
    id: "main-entrance-reception",
    floor: "Ground floor",
    title: "Main entrance reception",
    proposedUse: "Visitor welcome, check-in and a compact Armature goodies store",
    before: "/building-vision/before/18-quiet-meeting-room.jpg",
    after: "/building-vision/after/18-quiet-meeting-room.png",
    flooring: "Light-oak commercial LVT following the existing room and raised threshold exactly.",
    paint: "Warm white with one restrained ink-grey arrival wall and small saffron accents.",
    furniture: "Movable reception counter, slim freestanding merchandise shelves and a compact visitor perch.",
    lighting: "Warm surface-mounted welcome and merchandise lighting.",
    preserve: "Entrance door, left window, stepped opening, raised threshold, arched frame and all door swings."
  },
  {
    id: "window-cafe-lounge",
    floor: "Ground floor",
    title: "Window café lounge",
    proposedUse: "Informal meetings, laptop work and coffee",
    before: "/building-vision/before/03-window-cafe-lounge.jpg",
    after: "/building-vision/after/03-window-cafe-lounge.png",
    flooring: "Retain the existing white-grey marble and dark border; repair, clean and machine-polish only.",
    paint: "Warm white walls with existing frames refinished in ink grey.",
    furniture: "Loose lounge chairs, compact tables, window stools and plants.",
    lighting: "Warm wall washers and table lamps; retain the available daylight.",
    preserve: "Existing marble floor and border, window positions, wall returns, doors, ceiling and every opening."
  },
  {
    id: "existing-kitchen",
    floor: "Ground floor",
    title: "Existing kitchen",
    proposedUse: "Café prep and wash-up",
    before: "/building-vision/before/05-existing-kitchen.jpg",
    after: "/building-vision/after/05-existing-kitchen.png",
    flooring: "Retain the kitchen's existing veined marble and double dark border; repair, deep-clean and machine-polish only.",
    paint: "Washable warm white with an ink-grey utility band.",
    furniture: "Freestanding stainless prep bench, mobile storage and open service racks.",
    lighting: "Bright surface task lights above preparation and washing zones.",
    preserve: "Existing marble floor and border, plumbing wall, doors, windows, counters, ceiling and service locations."
  },
  {
    id: "main-lab-commons",
    floor: "First floor",
    title: "Main lab commons",
    proposedUse: "Open project commons for Armature Lab",
    before: "/building-vision/before/07-main-lab-commons.jpg",
    after: "/building-vision/after/07-main-lab-commons.png",
    flooring: "Soft-grey oak-look commercial LVT throughout the open room.",
    paint: "Warm off-white with restrained ink-grey work-zone accents; keep the entire staircase white.",
    furniture: "Mobile project tables, ergonomic task chairs, carts and low storage.",
    lighting: "Surface track and task lamps coordinated with the existing ceiling.",
    preserve: "White staircase finish and railings, windows, doors, beams, columns, floor levels and wall lines."
  },
  {
    id: "lab-commons-stair-view",
    floor: "First floor",
    title: "Lab commons — stair view",
    proposedUse: "Shared build tables with an open route to the stair",
    before: "/building-vision/before/08-lab-commons-stair-view.jpg",
    after: "/building-vision/after/08-lab-commons-stair-view.png",
    flooring: "Continue the commons' soft-grey commercial LVT.",
    paint: "Warm white walls and staircase, with existing railings refinished in ink grey.",
    furniture: "Lockable-caster worktables, stools, mobile tool carts and pinboards.",
    lighting: "Warm-neutral surface track over work zones and the circulation edge.",
    preserve: "White stair finish, balustrade, void, windows, ceiling and existing wall openings."
  },
  {
    id: "daylit-project-studio",
    floor: "First floor",
    title: "Daylit project studio",
    proposedUse: "Flexible electronics and robotics project room",
    before: "/building-vision/before/09-daylit-project-studio.jpg",
    after: "/building-vision/after/09-daylit-project-studio.png",
    flooring: "Mid-grey commercial LVT for easy maintenance and cable visibility.",
    paint: "Warm white with a single ink-grey review wall.",
    furniture: "Movable benches, stools, rolling component storage and mobile displays.",
    lighting: "Even surface track with focused task lights at each bench.",
    preserve: "Glazing, doors, ceiling, beam lines, walls and room footprint."
  },
  {
    id: "atrium-stair-landing",
    floor: "Circulation",
    title: "Atrium stair landing",
    proposedUse: "Wayfinding and a brief collaboration pause",
    before: "/building-vision/before/10-atrium-stair-landing.jpg",
    after: "/building-vision/after/10-atrium-stair-landing.png",
    flooring: "Consistent grey landing finish with a visible stair-edge strip.",
    paint: "Warm white walls and staircase with ink-grey metalwork and floor identifiers.",
    furniture: "A narrow movable perch and one small plant outside the escape route.",
    lighting: "Continuous warm wall lighting across stair and landing levels.",
    preserve: "White stair flight, railings, atrium void, windows, landings and openings."
  },
  {
    id: "curved-collaboration-gallery",
    floor: "First floor",
    title: "Curved collaboration gallery",
    proposedUse: "Short reviews, laptop work and project display",
    before: "/building-vision/before/11-curved-collaboration-gallery.jpg",
    after: "/building-vision/after/11-curved-collaboration-gallery.png",
    flooring: "Light-oak LVT following the existing curved circulation line.",
    paint: "Warm off-white with ink-grey trims and small saffron markers.",
    furniture: "Slim café-height tables, stools and freestanding display shelves.",
    lighting: "Surface track following the curve, aimed at tables and project displays.",
    preserve: "Curved wall, glazing, railings, doors, ceiling and corridor width."
  },
  {
    id: "curved-gallery-end",
    floor: "First floor",
    title: "Curved gallery end",
    proposedUse: "A small project-review nook",
    before: "/building-vision/before/12-curved-gallery-end.jpg",
    after: "/building-vision/after/12-curved-gallery-end.png",
    flooring: "Continue the gallery's light-oak commercial LVT.",
    paint: "Warm white with ink-grey frames and one compact pin-up zone.",
    furniture: "A movable high table, stools, pinboard and plant.",
    lighting: "Focused surface spots for work and display without a false ceiling.",
    preserve: "Curved envelope, window and door positions, railing and floor edge."
  },
  {
    id: "covered-front-balcony",
    floor: "Frontage",
    title: "Covered front balcony",
    proposedUse: "Outdoor coffee and informal coworking",
    before: "/building-vision/before/13-covered-front-balcony.jpg",
    after: "/building-vision/after/13-covered-front-balcony.png",
    flooring: "Weather-ready outdoor tiles laid to respect current drainage and levels.",
    paint: "Warm off-white exterior walls with ink-grey doors and railings.",
    furniture: "Loose outdoor tables, chairs and planters kept clear of every door.",
    lighting: "Warm weather-rated surface sconces and table lighting.",
    preserve: "Curved steps, balcony edge, railings, doors, windows and roof line."
  },
  {
    id: "upper-atrium-overlook",
    floor: "Circulation",
    title: "Upper atrium overlook",
    proposedUse: "A safe, legible upper-floor connection",
    before: "/building-vision/before/14-upper-atrium-overlook.jpg",
    after: "/building-vision/after/14-upper-atrium-overlook.png",
    flooring: "Grey commercial LVT continued to the landing edge.",
    paint: "Warm white walls and staircase with ink-grey railings and clear floor graphics.",
    furniture: "No fixed fit-out; only a small movable plant beyond circulation.",
    lighting: "Even surface-mounted lighting across the landing and stair void.",
    preserve: "Atrium void, white stair finish, balustrades, windows, ceiling and all landings."
  },
  {
    id: "large-team-studio",
    floor: "Second floor",
    title: "Large team studio",
    proposedUse: "Resident company and robotics team workspace",
    before: "/building-vision/before/15-large-team-studio.jpg",
    after: "/building-vision/after/15-large-team-studio.png",
    flooring: "Mid-grey oak-look LVT for a robust studio surface.",
    paint: "Warm off-white with ink-grey work and review zones.",
    furniture: "Team desks, mobile prototype table, ergonomic chairs and rolling carts.",
    lighting: "Surface track and bench task lights; no ceiling reconstruction.",
    preserve: "Windows, doorway, beam, ceiling, walls and the full room footprint."
  },
  {
    id: "team-studio-storage-side",
    floor: "Second floor",
    title: "Team studio — storage side",
    proposedUse: "Additional desks and mobile project review",
    before: "/building-vision/before/16-team-studio-storage-side.jpg",
    after: "/building-vision/after/16-team-studio-storage-side.png",
    flooring: "Continue the studio's mid-grey oak-look LVT.",
    paint: "Warm off-white with ink-grey trims and minimal identity graphics.",
    furniture: "Movable desks, rolling review table, low storage and freestanding shelves.",
    lighting: "Surface track above desks and the central review position.",
    preserve: "Hallway opening, far and side windows, ceiling, fan, walls and levels."
  },
  {
    id: "materials-prototype-library",
    floor: "Second floor",
    title: "Materials and prototype library",
    proposedUse: "Components, samples, tools and in-progress builds",
    before: "/building-vision/before/17-materials-prototype-library.jpg",
    after: "/building-vision/after/17-materials-prototype-library.png",
    flooring: "Light-oak commercial LVT for a bright, practical workspace.",
    paint: "Warm off-white with ink-grey wayfinding and labelling.",
    furniture: "Freestanding material racks, labelled bins and a central caster table.",
    lighting: "Bright surface task lights at shelves and the project table.",
    preserve: "Central beam, fan, grey door, arched grille door, right door and walls."
  },
];
