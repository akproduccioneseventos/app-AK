/**
 * Shim local para @vladmandic/face-api
 * Permite la compilación estática de Next.js sin dependencias remotas bloqueadas.
 */

class TinyFaceDetectorOptions {
  constructor(options) {
    this.inputSize = options?.inputSize || 416;
    this.scoreThreshold = options?.scoreThreshold || 0.5;
  }
}

const nets = {
  tinyFaceDetector: {
    loadFromUri: async () => {},
  },
  faceLandmark68TinyNet: {
    loadFromUri: async () => {},
  },
  faceLandmark68Net: {
    loadFromUri: async () => {},
  },
  faceRecognitionNet: {
    loadFromUri: async () => {},
  },
};

const detectSingleFace = () => ({
  withFaceLandmarks: () => ({
    withFaceDescriptor: async () => null,
  }),
});

const detectAllFaces = () => ({
  withFaceLandmarks: () => ({
    withFaceDescriptors: async () => [],
  }),
});

module.exports = {
  nets,
  TinyFaceDetectorOptions,
  detectSingleFace,
  detectAllFaces,
};
