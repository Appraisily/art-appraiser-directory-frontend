import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const load = () => import('../scripts/browser-command-diagnostics.mjs');
const session = 'art-diagnostics-fixture';
const env = { AGENT_BROWSER_SOCKET_DIR: '/tmp/art-diagnostics-fixture', AGENT_BROWSER_ARGS: '--no-sandbox' };
function failure(fields) { return Object.assign(new Error('fixture failure'), fields); }
function invoke(runBrowserCommand, error) {
  let calls = 0;
  let tick = 0;
  try {
    runBrowserCommand(session, ['wait', '1500'], { env, now: () => tick++ * 45001, executor: () => { calls++; throw error; } });
  } catch (caught) { return { error: caught, calls }; }
  throw new Error('Failed command was incorrectly accepted');
}
test('successful CLI arguments, process timeout and data remain unchanged', async () => {
  const { runBrowserCommand } = await load();
  const value = { waited: 'timeout', ms: 1500 };
  const data = runBrowserCommand(session, ['wait', '1500'], { env, executor: (file, args, options) => {
    assert.equal(file, 'agent-browser');
    assert.deepEqual(args, ['--session', session, '--json', 'wait', '1500']);
    assert.deepEqual(options, { encoding: 'utf8', timeout: 45000, maxBuffer: 8 * 1024 * 1024, env });
    return JSON.stringify({ success: true, data: value });
  } });
  assert.deepEqual(data, value);
});
for (const [name, fields, category] of [
  ['timeout', { code: 'ETIMEDOUT', status: null, signal: 'SIGTERM', killed: true }, 'process_timeout'],
  ['signal', { status: null, signal: 'SIGKILL' }, 'process_signal'],
  ['exit', { status: 1, signal: null }, 'process_exit'],
  ['launch', { code: 'ENOENT', status: null, signal: null }, 'process_error'],
]) test(`${name}: preserve independent stdout/stderr, process details and cause without retry`, async () => {
  const { runBrowserCommand } = await load();
  const cause = failure({ ...fields, stdout: 'partial JSON output', stderr: 'transport detail' });
  const { error, calls } = invoke(runBrowserCommand, cause);
  assert.equal(calls, 1);
  assert.equal(error.cause, cause);
  assert.deepEqual(error.browserCommand, {
    category, session, command: ['wait', '1500'], elapsedMs: 45001,
    code: fields.code || null, status: fields.status ?? null, signal: fields.signal || null,
    killed: fields.killed ?? null, stdout: 'partial JSON output', stderr: 'transport detail',
  });
});
test('failed output buffers are bounded and both channels survive', async () => {
  const { runBrowserCommand } = await load();
  const { error } = invoke(runBrowserCommand, failure({ status: 1, stdout: Buffer.from('a'.repeat(20000)), stderr: Buffer.from('b'.repeat(20000)) }));
  assert.equal(error.browserCommand.stdout.length, 8192);
  assert.equal(error.browserCommand.stderr.length, 8192);
});
for (const [name, raw, category] of [
  ['malformed JSON', 'not JSON', 'invalid_json'],
  ['rejected command', JSON.stringify({ success: false, error: 'Wait timed out' }), 'command_error'],
]) test(`${name}: failure is distinct from a process timeout`, async () => {
  const { runBrowserCommand } = await load();
  assert.throws(() => runBrowserCommand(session, ['wait', '1500'], { env, executor: () => raw }), error => {
    assert.equal(error.browserCommand.category, category);
    assert.equal(error.browserCommand.stdout, raw);
    return true;
  });
});
test('the full browser receipt retains process diagnostics at row and top level', () => {
  const source = fs.readFileSync(new URL('../scripts/test-settled-browser-contract.mjs', import.meta.url), 'utf8');
  assert.match(source, /row\.commandFailure = error\.browserCommand/);
  assert.match(source, /result\.commandFailure = error\.browserCommand/);
});
