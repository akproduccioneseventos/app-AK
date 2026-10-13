import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import semver from 'semver';
import zlib from 'node:zlib';

const initialPath = 'docs/evidencias/109-seguridad-inventario.json';
const initial = JSON.parse(fs.existsSync(initialPath) ? fs.readFileSync(initialPath,'utf8')
  : zlib.gunzipSync(fs.readFileSync(initialPath+'.gz')).toString('utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const metadata = { ...initial.advisoryMetadata };
for (const row of initial.advisories) {
  if (!metadata[row.id]) metadata[row.id] = JSON.parse(execFileSync('gh', ['api', `/advisories/${row.id}`],
    { encoding: 'utf8', timeout: 60000, maxBuffer: 2 * 1024 * 1024 }));
}
const policies = {
  'sharp': ['PUBLIC_RUNTIME_REACHABLE', 'Next image optimizer uses sharp0.34.5; harmless local image request proves endpoint reachability, NOT exploitation. Patch native image stack first.'],
  '@grpc/grpc-js': ['CONDITION_NOT_FOUND_IN_APP', 'SDK client dependency; app has no grpc Server, getAuthContext or server mutual-TLS consumer. Retain update requirement; external cloud TLS not tested.'],
  '@opentelemetry/auto-instrumentations-node': ['TELEMETRY_DISABLED_IN_WEBPACK', 'next.config.js aliases NodeSDK to no-op; inspected nft traces contain no package. This does not certify a separate Genkit development server.'],
  '@opentelemetry/core': ['TELEMETRY_DISABLED_IN_WEBPACK', 'Webpack NodeSDK alias; no package in inspected nft traces. Baggage propagation not used directly in app.'],
  '@opentelemetry/instrumentation-cassandra-driver': ['TELEMETRY_DISABLED_IN_WEBPACK', 'NodeSDK alias and no Cassandra/MongoDB/MySQL/Postgres instrumentations configured by AK; no package in inspected nft traces.'],
  '@opentelemetry/propagator-jaeger': ['TELEMETRY_DISABLED_IN_WEBPACK', 'No JaegerPropagator configured; NodeSDK alias, no package in inspected nft traces.'],
  'baseline-browser-mapping': ['BUILD_TOOL_INPUT', 'Browser target data via browserslist/autoprefixer; no client-controlled Browserslist query consumer found in AK. Installed prod flag is not public reachability.'],
  'brace-expansion': ['BUILD_TOOL_INPUT', 'Globs from installed build tooling; no direct AK consumer taking request-controlled glob expressions. Preserve compatible patch requirement.'],
  'braces': ['BUILD_TOOL_INPUT_NO_PATCH_REPORTED', 'chokidar/micromatch used by Tailwind/PWA tooling. Official advisory has no patch at snapshot; do not downgrade PWA or migrate Tailwind to clear counter.'],
  'browserslist': ['BUILD_TOOL_INPUT', 'Build targets from Tailwind/autoprefixer; no untrusted browser query/stats JSON route consumer found.'],
  'postcss-selector-parser': ['BUILD_TOOL_INPUT', 'Stylesheet processing at build; user CSS parser route not found. Maintain patch in compatible branch; v6 patch only addresses one advisory.'],
  'dompurify': ['VULNERABLE_MODE_NOT_USED_BY_INSPECTED_CONSUMER', 'jspdf.html receives DOM element in AK; jspdf clones and sanitizes innerHTML as a string without IN_PLACE or hooks. Other uses not certified by nft absence.'],
  'fast-uri': ['TRANSITIVE_CONDITION_NOT_FOUND', 'AJV dependency. No direct AK serialize/parse host allowlist or request-controlled port construction found. Bundling means no nft entry cannot prove absence.'],
  'fflate': ['VULNERABLE_METHOD_INPUT_NOT_FOUND', 'jspdf compression and three-stdlib loaders present. No AK unzipSync on user ZIP/FBX input found; image/video ZIP downloads use JSZip. Not a declaration that every loader is safe.'],
  'qs': ['TRANSITIVE_CONDITION_NOT_FOUND', 'Express/Genkit/googleapis transitive. Next handlers use URL/request.json/formData, not qs round-trip. Genkit reflection starts only isDevEnv; no standalone flow server started by AK. Keep patch requirement.'],
  'uuid': ['VULNERABLE_API_INPUT_NOT_FOUND', 'Advisory concerns v3/v5/v6 with external buffer/offset, not v4. AK uses crypto.randomUUID; transitive consumers still require compatible SDK upgrade, not blind major override.'],
};
const advisories = initial.advisories.map(row => {
  const upstream = metadata[row.id];
  const [classification, rationale] = policies[row.package] || ['UNCLASSIFIED', 'Review required'];
  const parents = Object.entries(lock.packages).filter(([, value]) =>
    value.dependencies?.[row.package] || value.optionalDependencies?.[row.package]).map(([parent, value]) =>
    ({ path: parent, version: value.version, requires: value.dependencies?.[row.package] || value.optionalDependencies?.[row.package] }));
  return { ...row, classification, rationale,
    installations: row.installations.map(item => ({ ...item,
      matchesSnapshotRange: semver.valid(item.version) ? semver.satisfies(item.version, row.range, { includePrerelease: true }) : null })),
    parents, upstreamPatchedBranches: upstream.vulnerabilities.filter(v => v.package.name === row.package)
      .map(v => ({ vulnerableRange: v.vulnerable_version_range, firstPatched: v.first_patched_version })),
    advisorySource: { url: upstream.html_url, updatedAt: upstream.updated_at } };
});
const counts = advisories.reduce((all, row) => ({ ...all, [row.classification]: (all[row.classification] || 0) + 1 }), {});
fs.writeFileSync('docs/evidencias/109-seguridad-contraste.json', JSON.stringify({ sourceApp: initial.appSource,
  sourceHead: initial.head, fetchedAt: new Date().toISOString(),
  initialCollectionErrors: initial.errors, metadataCount: Object.keys(metadata).length,
  explanation: 'All27 assessed; source classifications do not remove advisories or prove exploitation. npm explain failures replaced by structured lockfile parents; original failures retained.',
  counts, advisories, retriedMetadata: Object.fromEntries(Object.entries(metadata).filter(([key]) => !initial.advisoryMetadata[key])) }, null, 2) + '\n');
console.log(JSON.stringify({ metadata: Object.keys(metadata).length, counts, assessed: advisories.length }));
if (advisories.length !== 27 || advisories.some(row => row.classification === 'UNCLASSIFIED')) throw new Error('Incomplete triage');
