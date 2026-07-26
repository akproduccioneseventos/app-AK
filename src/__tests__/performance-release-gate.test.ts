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
    const landingPage = read("src/app/page.tsx");
    const clubPage = read("src/app/club-uruguay/page.tsx");
    const styles = read("src/app/ak-motion-effects.css");
    const youtube = read("src/lib/youtube/ak-channel.ts");

    expect(landing).toContain('DEFERRED_SECTIONS.has(key) ? "ak-deferred-section"');
    expect(landing).toContain("scroll-mt-20");
    expect(styles).toContain("content-visibility: auto");
    expect(youtube).toContain("AbortSignal.timeout(2500)");
    expect(landingPage).toContain("withPublicFallback(getSalones(), [])");
    expect(clubPage).toContain("getSalonesWithoutBlockingSale");
  });

  it("keeps the public blog from bundling the complete icon catalog", () => {
    const publicBlogFiles = [
      "src/components/landing/BlogSection.tsx",
      "src/components/public/BlogInteractiveList.tsx",
      "src/app/public/blog/page.tsx",
      "src/app/public/blog/[slug]/page.tsx",
      "src/app/blog/[slug]/page.tsx",
    ];

    for (const file of publicBlogFiles) {
      expect(read(file)).not.toMatch(
        /import\s+\*\s+as\s+\w+\s+from\s+["']lucide-react["']/,
      );
    }
  });

  it("loads the advanced invitation editor only when it is requested", () => {
    const editor = read("src/app/(app)/fiestas/nueva/pagina-web/page.tsx");

    expect(editor).toContain("const AdvancedInvitationCanvas = dynamic(");
    expect(editor).toContain("const ControlPanel = dynamic(");
    expect(editor).toContain("const SectionEditorPanel = dynamic(");
    expect(editor).toContain("const TemplatePickerGallery = dynamic(");
    expect(editor).toContain("{templateGalleryOpen && (");
    expect(editor).not.toContain("from '@dnd-kit/core'");
    expect(editor).not.toContain("from '@dnd-kit/sortable'");
    expect(editor).not.toContain("from '@/components/invitacion/templates/GraziaTemplate'");
  });

  it("splits heavy accounting charts and the CRM desktop board", () => {
    const accounting = read("src/app/(app)/empresa/contabilidad/page.tsx");
    const crm = read("src/app/(app)/contabilidad/crm/page.tsx");

    expect(accounting).toContain("const MonthlySalesChart = dynamic(");
    expect(accounting).toContain("const PaymentStatusPieChart = dynamic(");
    expect(crm).toContain("const CrmDesktopBoard = dynamic(");
    expect(crm).toContain("const AddLeadDialog = dynamic(");
    expect(crm).not.toContain("import { DndContext");
    expect(crm).not.toContain("from '@/components/crm/CrmStageColumn'");
  });

  it("keeps dashboard and analytics charts out of their initial bundles", () => {
    const dashboard = read("src/app/(app)/admin/page.tsx");
    const analytics = read("src/app/analytics/page.tsx");

    expect(dashboard).toContain("const MonthlySalesChart = dynamic(");
    expect(dashboard).toContain("const PaymentStatusPieChart = dynamic(");
    expect(analytics).toContain("const ProfitabilityChart = dynamic(");
    expect(analytics).toContain("const StaffEfficiencyChart = dynamic(");
    expect(analytics).not.toMatch(/import \{ .*Chart.* \} from '@\/components\/charts\//);
  });

  it("loads the QR camera engine only when a scanner is activated", () => {
    const publicScanner = read("src/app/evento/accesos/[fiestaId]/page.tsx");
    const internalScanner = read(
      "src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx",
    );

    for (const scanner of [publicScanner, internalScanner]) {
      expect(scanner).toContain("await import('html5-qrcode')");
      expect(scanner).toContain("getTracks().forEach((track) => track.stop())");
      expect(scanner).not.toContain("import { Html5QrcodeScanner");
    }
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
