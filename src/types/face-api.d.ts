declare module '@vladmandic/face-api' {
  export const nets: {
    tinyFaceDetector: {
      loadFromUri: (uri: string) => Promise<void>;
    };
    faceLandmark68TinyNet: {
      loadFromUri: (uri: string) => Promise<void>;
    };
    faceLandmark68Net: {
      loadFromUri: (uri: string) => Promise<void>;
    };
    faceRecognitionNet: {
      loadFromUri: (uri: string) => Promise<void>;
    };
  };

  export class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number });
  }

  export function detectSingleFace(
    input: any,
    options?: any
  ): {
    withFaceLandmarks: (useTinyModel?: boolean) => {
      withFaceDescriptor: () => Promise<{
        detection: { box: { width: number; height: number; x: number; y: number } };
        landmarks: { positions: Array<{ x: number; y: number }> };
        descriptor: Float32Array;
      } | null>;
    };
  };

  export function detectAllFaces(
    input: any,
    options?: any
  ): any;

  const defaultExport: any;
  export default defaultExport;
}

