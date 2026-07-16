import fs from "node:fs";
import path from "node:path";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("performance release gate", () => {
  it("runs the complete browser gate against a production build", () => {
    const packageJson = JSON.parse(read("package.json"));
    const runner = read("scripts/run-playwright-production.mjs");

    expect(packageJson.scripts["quality:all"]).toContain("test:e2e:production");
    expect(packageJson.scripts["test:e2e:production"]).toContain(
      "npm run build",
    );
    expect(runner).toMatch(/\[nextBin,\s*["']start["']/);
    expect(runner).toContain("PLAYWRIGHT_BASE_URL: baseUrl");
    expect(runner).toContain("/api/health");
  });

  it("defers below-the-fold landing work and bounds the YouTube request", () => {
    const landing = read("src/components/landing/LandingSpaContainer.tsx");
    const styles = read("src/app/ak-motion-effects.css");
    const youtube = read("src/lib/youtube/ak-channel.ts");

    expect(landing).toContain('key === "hero" ? "" : "ak-deferred-section"');
    expect(styles).toContain("content-visibility: auto");
    expect(youtube).toContain("AbortSignal.timeout(2500)");
  });

  it("keeps direct public imagery within a practical transfer size", () => {
    const simulatorHero = path.join(
      process.cwd(),
      "public/media/catalogo-servicios/discoteca-salon-ak-02.jpeg",
    );
    const landingHero = path.join(
      process.cwd(),
      "public/media/catalogo-servicios/quinceanera_hero.png",
    );

    expect(fs.statSync(simulatorHero).size).toBeLessThan(600 * 1024);
    expect(fs.statSync(landingHero).size).toBeLessThan(600 * 1024);
  });
});
