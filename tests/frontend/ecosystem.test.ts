import {
  bengaluruBounds,
  bengaluruEcosystem,
  ecosystemToGeoJson,
  filterEcosystemEntities
} from "../../src/data/bengaluruEcosystem";

describe("Bengaluru ecosystem data", () => {
  it("keeps unique, sourced organization records", () => {
    expect(bengaluruEcosystem).toHaveLength(51);
    expect(new Set(bengaluruEcosystem.map((item) => item.slug)).size).toBe(
      bengaluruEcosystem.length
    );
    expect(bengaluruEcosystem.every((item) =>
      item.sourceUrl.startsWith("http")
      && item.websiteUrl.startsWith("http")
      && item.provenance.length > 0
      && /^\d{4}-\d{2}-\d{2}$/.test(item.verifiedAt)
    )).toBe(true);
    expect(bengaluruEcosystem.find((item) => item.slug === "lscl-robotics")?.verifiedAt)
      .toBe("2026-08-03");
    const cometAerospace = bengaluruEcosystem.find((item) => item.slug === "comet-aerospace");
    expect(cometAerospace).toMatchObject({
      verifiedAt: "2026-08-05",
      locationPrecision: "City-level"
    });
    expect(cometAerospace?.coordinates).toBeUndefined();
    expect(bengaluruEcosystem.find((item) => item.slug === "xp-robotics"))
      .toMatchObject({
        verifiedAt: "2026-08-07",
        locationPrecision: "Locality-level",
        coordinates: [77.6259, 12.9117]
      });
    expect(bengaluruEcosystem.find((item) => item.slug === "nolon"))
      .toMatchObject({
        verifiedAt: "2026-08-07",
        locationPrecision: "Locality-level",
        locationConfidence: "Medium",
        coordinates: [77.6821, 12.8766]
      });
    expect(bengaluruEcosystem.find((item) => item.slug === "panoculon-labs"))
      .toMatchObject({
        verifiedAt: "2026-08-07",
        locationPrecision: "Locality-level",
        locationConfidence: "High",
        coordinates: [77.63295, 12.91538]
      });
    const fastCode = bengaluruEcosystem.find((item) => item.slug === "fast-code-ai");
    expect(fastCode).toMatchObject({
      verifiedAt: "2026-08-07",
      locationPrecision: "Locality-level",
      locationConfidence: "High"
    });
    expect(fastCode?.coordinates).toBeUndefined();
    expect(bengaluruEcosystem.find((item) => item.slug === "cautio"))
      .toMatchObject({
        verifiedAt: "2026-08-07",
        locationPrecision: "Locality-level",
        locationConfidence: "Medium",
        coordinates: [77.63826, 12.91604]
      });
    const floMobility = bengaluruEcosystem.find((item) => item.slug === "flo-mobility");
    expect(floMobility).toMatchObject({
      verifiedAt: "2026-08-07",
      locationPrecision: "Locality-level",
      locationConfidence: "High",
      founders: "Manesh Jain · Pratik Patel"
    });
    expect(floMobility?.coordinates).toBeUndefined();
    const neuralzome = bengaluruEcosystem.find((item) => item.slug === "neuralzome-cybernetics");
    expect(neuralzome).toMatchObject({
      verifiedAt: "2026-08-08",
      locationPrecision: "Locality-level",
      locationConfidence: "High",
      founders: "Mohan Sivam · Aditya Shriwastava · Prasanna Venkatesan"
    });
    expect(neuralzome?.coordinates).toBeUndefined();
    expect(bengaluruEcosystem.find((item) => item.slug === "twara-robotics"))
      .toMatchObject({
        verifiedAt: "2026-08-08",
        locationPrecision: "Locality-level",
        locationConfidence: "High",
        coordinates: [77.5061288, 13.0177954],
        founders: "Kaushik Sampath · Alok Rawat · Ashish Joglekar"
      });
    expect(bengaluruEcosystem.find((item) => item.slug === "accio-robotics"))
      .toMatchObject({
        verifiedAt: "2026-08-08",
        locationPrecision: "Locality-level",
        locationConfidence: "High",
        coordinates: [77.6450991, 12.9175572],
        founders: "Pranav Srinivasan · Tuhin Sharma"
      });
    expect(bengaluruEcosystem.find((item) => item.slug === "strider-robotics"))
      .toMatchObject({
        verifiedAt: "2026-08-08",
        locationPrecision: "Locality-level",
        locationConfidence: "High",
        coordinates: [77.5399482, 13.0518839],
        founders: "Aditya Varma Sagi · Praveenchandra Kuthpady · Shishir Kolathaya"
      });
    const auleSpace = bengaluruEcosystem.find((item) => item.slug === "aule-space");
    expect(auleSpace).toMatchObject({
      verifiedAt: "2026-08-08",
      locationPrecision: "Locality-level",
      locationConfidence: "High",
      locality: "Kalyan Nagar Road, Bengaluru East",
      founders: "Jay Panchal · Nithyaa Giri · Hrishit Tambi"
    });
    expect(auleSpace?.coordinates).toBeUndefined();
    const astrobase = bengaluruEcosystem.find((item) => item.slug === "astrobase-space-technologies");
    expect(astrobase).toMatchObject({
      verifiedAt: "2026-08-08",
      locationPrecision: "Address-level",
      locationConfidence: "High",
      locality: "Awfis Vista Pixel, Jakkuru Layout, Bengaluru",
      founders: "Neeraj Khandelwal · Devakumar Thammisetty",
      sectors: ["Space hardware", "Hardware & sensing"]
    });
    expect(astrobase?.coordinates).toBeUndefined();
    const craftifAI = bengaluruEcosystem.find((item) => item.slug === "craftifai");
    expect(craftifAI).toMatchObject({
      verifiedAt: "2026-08-08",
      locationPrecision: "Address-level",
      locationConfidence: "High",
      locality: "Hustlehub Tech Park H206, HSR Layout, Bengaluru",
      founders: "Pratik Sharda · Yashwant Dagar",
      sectors: ["Physical AI", "Edge & embedded systems"]
    });
    expect(craftifAI?.coordinates).toBeUndefined();
  });

  it("only emits map features for records with bounded coordinates", () => {
    const collection = ecosystemToGeoJson(bengaluruEcosystem);
    const mapped = bengaluruEcosystem.filter((item) => item.coordinates);

    expect(collection.features).toHaveLength(mapped.length);
    expect(mapped.length).toBeGreaterThan(10);
    expect(mapped.length).toBeLessThan(bengaluruEcosystem.length);
    expect(collection.features.every((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      return longitude >= bengaluruBounds[0][0]
        && longitude <= bengaluruBounds[1][0]
        && latitude >= bengaluruBounds[0][1]
        && latitude <= bengaluruBounds[1][1];
    })).toBe(true);
  });

  it("filters across sector, founder, place, and organization fields", () => {
    expect(filterEcosystemEntities(bengaluruEcosystem, "Bellatrix", "All"))
      .toHaveLength(1);
    expect(filterEcosystemEntities(bengaluruEcosystem, "HSR", "All").length)
      .toBeGreaterThan(1);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Rakesh Gaonkar", "All")
      .map((item) => item.slug)).toEqual(["sarla-aviation"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "SUIND", "All")
      .map((item) => item.slug)).toEqual(["suind"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "missile", "All")
      .map((item) => item.slug)).toEqual(["comet-aerospace"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Vineet Saraogi", "All")
      .map((item) => item.slug)).toEqual(["xp-robotics"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Sathya Narayanan", "All")
      .map((item) => item.slug)).toEqual(["nolon"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Sreeraj Renjith", "All")
      .map((item) => item.slug)).toEqual(["panoculon-labs"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Arjun Jain", "All")
      .map((item) => item.slug)).toEqual(["fast-code-ai"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Pranjal Nadhani", "All")
      .map((item) => item.slug)).toEqual(["cautio"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Manesh Jain", "All")
      .map((item) => item.slug)).toEqual(["flo-mobility"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Mohan Sivam", "All")
      .map((item) => item.slug)).toEqual(["neuralzome-cybernetics"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Kaushik Sampath", "All")
      .map((item) => item.slug)).toEqual(["twara-robotics"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Tuhin Sharma", "All")
      .map((item) => item.slug)).toEqual(["accio-robotics"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Shishir Kolathaya", "All")
      .map((item) => item.slug)).toEqual(["strider-robotics"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Nithyaa Giri", "All")
      .map((item) => item.slug)).toEqual(["aule-space"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Yashwant Dagar", "All")
      .map((item) => item.slug)).toEqual(["craftifai"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "Devakumar Thammisetty", "All")
      .map((item) => item.slug)).toEqual(["astrobase-space-technologies"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "", "Learning & training")
      .map((item) => item.slug)).toEqual(["lscl-robotics"]);
    expect(filterEcosystemEntities(bengaluruEcosystem, "", "Space hardware")
      .every((item) => item.sectors.includes("Space hardware"))).toBe(true);
  });
});
