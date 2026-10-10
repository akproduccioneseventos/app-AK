import {
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
      "googleai/gemini-2.5-flash",
      "googleai/gemini-2.0-flash",
    ]);
  });

  it("no vuelve a probar el modelo retirado gemini-1.5-flash", () => {
    expect(getGeminiFallbackCandidates(geminiFastModel)).not.toContain("googleai/gemini-1.5-flash");
    expect(getGeminiFallbackCandidates(geminiProModel)).not.toContain("googleai/gemini-1.5-flash");
  });

  it("el modelo profundo cae primero al pro estable y recién después a los flash", () => {
    expect(getGeminiFallbackCandidates("googleai/gemini-pro-latest")).toEqual([
      "googleai/gemini-pro-latest",
      "googleai/gemini-2.5-pro",
      "googleai/gemini-flash-latest",
      "googleai/gemini-2.5-flash",
      "googleai/gemini-2.0-flash",
    ]);
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

  it("retries only model availability and transient failures", () => {
    expect(isRecoverableGeminiModelError({ status: 404, message: "model not found" })).toBe(true);
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
    expect(usados).toEqual(["googleai/gemini-flash-latest", "googleai/gemini-2.5-flash"]);

    const malaClave = jest.fn(async () => { throw { status: 401, message: "invalid api key" }; });
    await expect(ejecutarPromptConFallback(malaClave, {}, "googleai/gemini-flash-latest")).rejects.toMatchObject({ status: 401 });
    expect(malaClave).toHaveBeenCalledTimes(1);
  });
});
