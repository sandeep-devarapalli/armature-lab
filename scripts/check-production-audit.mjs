import { spawnSync } from "node:child_process";

const allowedAdvisory = "GHSA-qwww-vcr4-c8h2";
const expiresAt = new Date("2026-09-07T00:00:00Z");
const result = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
  encoding: "utf8"
});

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  process.stderr.write(result.stderr || result.stdout);
  throw new Error("npm audit did not return a valid report.");
}

const advisories = Object.values(report.vulnerabilities ?? {}).flatMap((entry) =>
  (entry.via ?? []).filter((item) => typeof item === "object")
);
const unexpected = advisories.filter(
  (advisory) => !advisory.url?.endsWith(`/${allowedAdvisory}`)
);

if (unexpected.length > 0) {
  throw new Error(
    `Unexpected production advisories: ${unexpected.map((item) => item.url).join(", ")}`
  );
}

if (advisories.length > 0 && new Date() >= expiresAt) {
  throw new Error(`${allowedAdvisory} exception expired; review the latest React Router release.`);
}

if (advisories.length > 0) {
  console.warn(
    `${allowedAdvisory} remains temporarily allowed for unused React Router RSC mode until 2026-09-07.`
  );
} else {
  console.log("Production dependency audit is clean.");
}
