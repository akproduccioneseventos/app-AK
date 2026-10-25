import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const file = path.join(process.cwd(), 'src/app/evento/buzon/[fiestaId]/page.tsx');
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler: ts.ArrowFunction;
const visit = (node: ts.Node) => {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'handleStartVideoWithCountdown') {
    handler = node.initializer as ts.ArrowFunction;
  }
  ts.forEachChild(node, visit);
};
visit(source);

function setup(recording = false) {
  const setCountdown = jest.fn();
  const start = jest.fn();
  let tick: () => void = () => {};
  const ref = { current: null as number | null };
  const interval = jest.fn((fn: () => void) => { tick = fn; return 7; });
  const js = ts.transpileModule(`const callback = ${handler.getText(source)};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const callback = new Function('videoCountdownRef', 'countdown', 'videoState', 'vhsRecorderRef',
    'setVideoRecordingError', 'setCountdown', 'setInterval', 'clearInterval', 'startLiveVideoRecording',
    `${js}; return callback;`)(ref, null, 'recording', { current: recording ? { state: 'recording' } : null },
      jest.fn(), setCountdown, interval, jest.fn(), start);
  return { callback, setCountdown, interval, start, tick: () => tick() };
}

test('la vista previa de la camara permite iniciar la cuenta una sola vez', () => {
  const qa = setup();
  qa.callback();
  qa.callback();
  expect(qa.setCountdown).toHaveBeenCalledWith(3);
  expect(qa.interval).toHaveBeenCalledTimes(1);
  qa.tick(); qa.tick(); qa.tick();
  expect(qa.start).toHaveBeenCalledTimes(1);
});

test('un grabador activo no inicia otra cuenta ni otra grabacion', () => {
  const qa = setup(true);
  qa.callback();
  expect(qa.interval).not.toHaveBeenCalled();
  expect(qa.start).not.toHaveBeenCalled();
});
