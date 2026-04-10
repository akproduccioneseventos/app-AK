/**
 * @fileOverview Compatibility re-export for data-service-firebase.
 *
 * All functionality has been consolidated into data-service.ts, which now
 * handles JSON persistence, in-memory cache, and conditional Firebase sync
 * through a single unified service.
 *
 * This file is kept as a thin re-export so that any remaining imports from
 * '@/lib/data-service-firebase' continue to work without changes.
 */
'use server';

export { readData, writeData } from './data-service';