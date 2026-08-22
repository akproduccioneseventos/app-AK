import {
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
      "googleai/gemini-1.5-flash",
    ]);
  });

  it("does not send sampling parameters deprecated by Gemini 3.6", () => {
    expect(getGeminiGenerationConfigForAgent()).toEqual({});
  });

  it("retries only model availability and transient failures", () => {
    expect(isRecoverableGeminiModelError({ status: 404, message: "model not found" })).toBe(true);
    expect(isRecoverableGeminiModelError({ status: 503, message: "overloaded" })).toBe(true);
    expect(isRecoverableGeminiModelError({ status: 401, message: "invalid api key" })).toBe(false);
    expect(isRecoverableGeminiModelError({ status: 400, message: "invalid request" })).toBe(false);
  });
});
