import fs from "fs";
import path from "path";

describe("Touchpix real AI wiring", () => {
  const sourceRoot = path.resolve(__dirname, "..");
  const pageSource = fs.readFileSync(
    path.join(
      sourceRoot,
      "app",
      "evento",
      "touchpix",
      "[fiestaId]",
      "page.tsx",
    ),
    "utf8",
  );
  const actionSource = fs.readFileSync(
    path.join(sourceRoot, "app", "actions", "touchpix-ai.ts"),
    "utf8",
  );

  it("calls both image generation server actions from the booth UI", () => {
    expect(pageSource).toContain("await applyFaceSwap(formData)");
    expect(pageSource).toContain("await applyTouchpixTheme(formData)");
    expect(pageSource).not.toContain("Simulate AI processing");
  });

  it("sends the source photo to the current Gemini image editor", () => {
    const imageHelper = fs.readFileSync(
      path.join(sourceRoot, "lib", "ai", "gemini-image.ts"),
      "utf8",
    );

    expect(actionSource).toContain("generateGeminiImage({");
    expect(actionSource).toContain("images: [{ base64, contentType }]");
    expect(actionSource).not.toContain("googleai/imagen3");
    expect(actionSource).not.toContain("gemini-1.5-flash");
    expect(imageHelper).toContain("gemini-3.1-flash-image");
    expect(imageHelper).toContain("inlineData");
  });

  it("reuses a stable content hash so an offline retry cannot duplicate a photo", () => {
    expect(actionSource).toContain('createHash("sha256")');
    expect(actionSource).toContain('socialFormData.set("imageHash", imageHash)');
  });
});
