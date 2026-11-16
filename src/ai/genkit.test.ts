import {
  DEFAULT_GEMINI_LATEST_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_PRO_FALLBACK_MODEL,
  DEFAULT_GEMINI_PRO_MODEL,
  PISO_DE_TOKENS_DE_SALIDA,
  conLugarParaPensar,
  geminiFastModel,
  geminiProModel,
  getGeminiFallbackCandidates,
  getGeminiGenerationConfigForAgent,
  isRecoverableGeminiModelError,
} from "./genkit";

describe("Gemini model policy", () => {
  it("uses the automatic Flash alias and keeps stable production fallbacks", () => {
    expect(getGeminiFallbackCandidates("googleai/gemini-flash-latest")).toEqual([
      "googleai/gemini-flash-latest",
      "googleai/gemini-3.8-flash",
      "googleai/gemini-3.6-flash",
      "googleai/gemini-2.5-flash",
    ]);
  });

  it("no vuelve a probar modelos retirados como gemini-1.5-flash o gemini-2.0-flash", () => {
    expect(getGeminiFallbackCandidates(geminiFastModel)).not.toContain("googleai/gemini-1.5-flash");
    expect(getGeminiFallbackCandidates(geminiFastModel)).not.toContain("googleai/gemini-2.0-flash");
    expect(getGeminiFallbackCandidates(geminiProModel)).not.toContain("googleai/gemini-1.5-flash");
    expect(getGeminiFallbackCandidates(geminiProModel)).not.toContain("googleai/gemini-2.0-flash");
  });

  it("la lista de respaldo del profundo empieza por gemini-pro-latest y termina en un flash", () => {
    const fallbackPro = getGeminiFallbackCandidates(geminiProModel);
    expect(fallbackPro[0]).toBe("googleai/gemini-pro-latest");
    expect(fallbackPro[fallbackPro.length - 1]).toMatch(/flash/);
    expect(fallbackPro).toEqual([
      "googleai/gemini-pro-latest",
      "googleai/gemini-flash-latest",
      "googleai/gemini-3.8-flash",
    ]);
  });

  it("el modelo rápido por defecto no contiene 'pro'", () => {
    expect(geminiFastModel.toLowerCase()).not.toContain("pro");
    for (const m of getGeminiFallbackCandidates(geminiFastModel)) {
      expect(m.toLowerCase()).not.toContain("pro");
    }
  });

  it("el asistente manda un tope de salida explícito, así el piso de tokens sí se aplica", () => {
    const rapido = getGeminiGenerationConfigForAgent("secretaria");
    const profundo = getGeminiGenerationConfigForAgent("central", { deep: true });
    expect(rapido.maxOutputTokens).toBeGreaterThanOrEqual(PISO_DE_TOKENS_DE_SALIDA);
    expect(profundo.maxOutputTokens).toBeGreaterThanOrEqual(rapido.maxOutputTokens);
    // Con un tope chico heredado, el piso lo sube; con el del asistente queda como está.
    const subido = conLugarParaPensar({ prompt: "x", config: { maxOutputTokens: 500 } } as any) as any;
    expect(subido.config.maxOutputTokens).toBe(PISO_DE_TOKENS_DE_SALIDA);
  });

  it("does not send sampling parameters deprecated by Gemini 3.6 (sólo el tope de salida)", () => {
    expect(Object.keys(getGeminiGenerationConfigForAgent())).toEqual(["maxOutputTokens"]);
  });

  it("retries only model availability and transient failures (incluye 402 sin saldo y 429)", () => {
    expect(isRecoverableGeminiModelError({ status: 402, message: "payment required" })).toBe(true);
    expect(isRecoverableGeminiModelError({ status: 404, message: "model not found" })).toBe(true);
    expect(isRecoverableGeminiModelError({ status: 429, message: "resource_exhausted" })).toBe(true);
    expect(isRecoverableGeminiModelError({ status: 503, message: "overloaded" })).toBe(true);
    expect(isRecoverableGeminiModelError({ status: 401, message: "invalid api key" })).toBe(false);
    expect(isRecoverableGeminiModelError({ status: 400, message: "invalid request" })).toBe(false);
  });
});

describe("ejecutarPromptConFallback", () => {
  it("prueba el siguiente modelo si el primero no está disponible, y corta si el error no es de disponibilidad", async () => {
    const { ejecutarPromptConFallback } = await import("./genkit");
    const usados: string[] = [];
    const prompt = jest.fn(async (_i: unknown, opts?: { model?: string }) => {
      usados.push(String(opts?.model));
      if (usados.length === 1) throw { status: 404, message: "model not found" };
      return "ok";
    });
    await expect(ejecutarPromptConFallback(prompt, { x: 1 }, "googleai/gemini-flash-latest")).resolves.toBe("ok");
    expect(usados).toEqual(["googleai/gemini-flash-latest", "googleai/gemini-3.8-flash"]);

    const malaClave = jest.fn(async () => { throw { status: 401, message: "invalid api key" }; });
    await expect(ejecutarPromptConFallback(malaClave, {}, "googleai/gemini-flash-latest")).rejects.toMatchObject({ status: 401 });
    expect(malaClave).toHaveBeenCalledTimes(1);
  });
});
