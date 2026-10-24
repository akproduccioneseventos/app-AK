const copy = (value) => value == null ? value : structuredClone(value);

function flattenSuites(suites, parents = [], output = []) {
  for (const suite of suites ?? []) {
    const chain = [...parents, suite.title].filter(Boolean);
    for (const spec of suite.specs ?? []) {
      output.push({ spec, chain });
    }
    flattenSuites(suite.suites, chain, output);
  }
  return output;
}

function classify(status, annotations) {
  const declared = annotations.find((item) => item.type === 'skip' || item.type === 'fixme');
  if (declared) return declared.type;
  if (status === 'interrupted') return 'interrupted';
  if (status === 'skipped') return 'not-run';
  if (status === 'passed' || status === 'failed' || status === 'timedOut') return status;
  return 'not-run';
}

export function normalizeReport(report, runId) {
  return flattenSuites(report?.suites).flatMap(({ spec, chain }) => {
    const file = String(spec.file ?? '').replace(/(^|[\\/])ak207-/g, '$1');
    const fullTitle = [...chain, spec.title].filter(Boolean).join(' › ');
    const tests = spec.tests?.length ? spec.tests : [{ results: [] }];
    return tests.map((test) => {
      const project = test.projectName ?? test.projectId ?? spec.projectName ?? spec.projectId ?? '';
      const annotations = copy([...(spec.annotations ?? []), ...(test.annotations ?? [])]) ?? [];
      const results = copy(test.results ?? []) ?? [];
      // Playwright's test.status is expected/unexpected/flaky, not passed/failed.
      const status = results.at(-1)?.status;
      const kind = classify(status, annotations);
      const executed = status === 'passed' || status === 'failed' || status === 'timedOut';
      const repeat = test.repeatEachIndex ?? spec.repeatEachIndex ?? 0;
      const identity = spec.id
        ? JSON.stringify([spec.id, project, repeat])
        : JSON.stringify([chain, spec.title, file, spec.line ?? null, spec.column ?? null, project, repeat]);
      return {
        identity,
        runId,
        sourceFile: file,
        fullTitle,
        project,
        status: status ?? 'missing',
        reportedOutcome: test.status,
        expectedStatus: test.expectedStatus,
        kind,
        executed,
        results,
        errors: copy(test.errors ?? results.flatMap((result) => result.errors ?? (result.error ? [result.error] : []))) ?? [],
        annotations,
        acceptance: false,
      };
    });
  });
}

export function mergeHistories(...collections) {
  const merged = new Map();
  for (const collection of collections) {
    for (const item of collection ?? []) {
      const prior = merged.get(item.identity);
      if (prior) {
        prior.history.push(copy(item));
      } else {
        merged.set(item.identity, { ...copy(item), history: [copy(item)] });
      }
    }
  }
  return [...merged.values()].map(copy);
}
