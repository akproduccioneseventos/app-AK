'use server';
// Unified: all data operations go through the main data-service which handles
// JSON persistence, server-cache, and optional Firestore dual-write.
export { readData, writeData } from './data-service';
