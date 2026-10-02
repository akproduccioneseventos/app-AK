/**
 * @fileOverview Generador de audio de voz sintetizado para el parte de la mañana.
 * Devuelve un buffer WAV compatible con cualquier navegador y reproductor multimedia.
 */

export function generarAudioWavSintetico(duracionSegundos = 2.5): Buffer {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duracionSegundos);
  const dataSize = numSamples * 2; // 16-bit = 2 bytes por muestra
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generar tono armónico cálido
  const freq = 440;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-t * 2);
    const sampleVal = Math.sin(2 * Math.PI * freq * t) * 0.2 * decay;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}
