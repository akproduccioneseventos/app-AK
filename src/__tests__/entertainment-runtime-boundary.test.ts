import fs from "node:fs";
import path from "node:path";

describe("entertainment runtime boundaries", () => {
  const read = (relativePath: string) =>
    fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

  it.each([
    "src/app/evento/fotocabina/[fiestaId]/page.tsx",
    "src/app/evento/plataforma-360/[fiestaId]/page.tsx",
    "src/app/evento/bogue/[fiestaId]/page.tsx",
    "src/app/evento/espejo-magico/[fiestaId]/page.tsx",
  ])(
    "stops the current camera stream instead of a stale React render in %s",
    (file) => {
      const source = read(file);
      expect(source).toContain(
        "const streamRef = useRef<MediaStream | null>(null)",
      );
      expect(source).toContain("streamRef.current = mediaStream");
      expect(source).toContain("streamRef.current.getTracks().forEach");
    },
  );

  it("keeps configuration administrative while public uploads require scoped station access", () => {
    const source = read("src/app/actions/fiesta/entretenimiento.actions.ts");
    const protectedCalls = source.match(/await requireAppSession\(\);/g) ?? [];

    expect(protectedCalls.length).toBeGreaterThanOrEqual(3);
    expect(source).toContain(
      "hasEntertainmentGuestAccess(fiestaId, moduleId, accessToken)",
    );
    expect(source).toContain("formData.get('accessToken')");
  });

  it("does not expose a universal kiosk PIN or an unauthenticated storage reset", () => {
    const unlockSource = read("src/components/kiosk/kiosk-unlock-button.tsx");

    expect(unlockSource).not.toContain("savedPin || '1234'");
    expect(unlockSource).not.toContain("localStorage.clear()");
  });

  it("uses the live 360 stream and applies the operator Bogue frame", () => {
    const platformSource = read(
      "src/app/evento/plataforma-360/[fiestaId]/page.tsx",
    );
    const bogueSource = read("src/app/evento/bogue/[fiestaId]/page.tsx");

    expect(platformSource).toContain("const currentStream = streamRef.current");
    expect(platformSource).toContain("new MediaRecorder(currentStream");
    expect(bogueSource).toContain("const requestedFrame = s.settings?.frameId");
    expect(bogueSource).toContain("setSelectedFrame(requestedFrame)");
  });

  it("unlocks Bogue when event loading or camera access fails", () => {
    const bogueSource = read("src/app/evento/bogue/[fiestaId]/page.tsx");

    expect(bogueSource).toContain("withPublicRequestTimeout");
    expect(bogueSource).toContain("isEventLoading");
    expect(bogueSource).toContain("setCameraError");
    expect(bogueSource).toContain('aria-label="Cambiar cámara"');
    expect(bogueSource).toContain("Reintentar cámara");
  });

  it("requires explicit consent in both AI server actions", () => {
    const touchpixSource = read("src/app/actions/touchpix-ai.ts");
    const mirrorSource = read("src/app/actions/espejo-magico-ai.ts");

    const consentGuard =
      /formData\.get\(["']consentAccepted["']\) !== ["']true["']/g;
    expect(touchpixSource.match(consentGuard)).toHaveLength(2);
    expect(mirrorSource.match(consentGuard)).toHaveLength(1);
  });

  it.each([
    "src/app/evento/fotocabina/[fiestaId]/page.tsx",
    "src/app/evento/plataforma-360/[fiestaId]/page.tsx",
    "src/app/evento/bogue/[fiestaId]/page.tsx",
    "src/app/evento/espejo-magico/[fiestaId]/page.tsx",
  ])(
    "uses the scoped entertainment upload without a fake station QR in %s",
    (file) => {
      const source = read(file);

      expect(source).toContain("uploadEntretenimientoMedia(formData)");
      expect(source).not.toContain("setQrCodeUrl(window.location.href)");
    },
  );

  it.each([
    "src/app/evento/fotocabina/[fiestaId]/page.tsx",
    "src/app/evento/plataforma-360/[fiestaId]/page.tsx",
    "src/app/evento/bogue/[fiestaId]/page.tsx",
    "src/app/evento/espejo-magico/[fiestaId]/page.tsx",
  ])("reports camera failures to the operator in %s", (file) => {
    const source = read(file);

    expect(source).toContain("updateEntertainmentSessionStatus(");
    expect(source).toContain("{ lastError:");
    expect(source).toContain("No se pudo avisar la falla de cámara al operador:");
  });
});
