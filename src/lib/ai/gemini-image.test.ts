jest.mock("server-only", () => ({}));

import { generateGeminiImage } from "./gemini-image";

describe("Gemini image editor", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalImageModel = process.env.GEMINI_IMAGE_MODEL;
  const originalEditModel = process.env.GEMINI_IMAGE_EDIT_MODEL;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
    if (originalImageModel === undefined) delete process.env.GEMINI_IMAGE_MODEL;
    else process.env.GEMINI_IMAGE_MODEL = originalImageModel;
    if (originalEditModel === undefined)
      delete process.env.GEMINI_IMAGE_EDIT_MODEL;
    else process.env.GEMINI_IMAGE_EDIT_MODEL = originalEditModel;

    if (originalFetch) {
      Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        writable: true,
        value: originalFetch,
      });
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
    }
    jest.restoreAllMocks();
  });

  it("posts the reference image and returns Gemini inline image data", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_IMAGE_MODEL = "googleai/imagen3";
    delete process.env.GEMINI_IMAGE_EDIT_MODEL;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { data: "generated-base64" } }],
            },
          },
        ],
      }),
    } as Response);
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    await expect(
      generateGeminiImage({
        prompt: "Preserve the face.",
        images: [{ base64: "source-base64", contentType: "image/jpeg" }],
      }),
    ).resolves.toBe("generated-base64");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));
    expect(url).toContain("/gemini-3.1-flash-image:generateContent");
    expect(request.headers).toMatchObject({ "x-goog-api-key": "test-key" });
    expect(body.contents[0].parts[0].inlineData).toEqual({
      mimeType: "image/jpeg",
      data: "source-base64",
    });
    expect(body.contents[0].parts[1]).toEqual({ text: "Preserve the face." });
    expect(body.generationConfig.responseModalities).toEqual(["IMAGE"]);
    expect(body.generationConfig.responseFormat.image).toEqual({
      aspectRatio: "3:4",
      imageSize: "1K",
    });
  });
});
