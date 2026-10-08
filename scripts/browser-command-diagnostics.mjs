import { execFileSync } from 'node:child_process';

const bounded = value => String(value || '').slice(0, 8192).trim();

// Preserve the existing command, timeout and single attempt. Diagnostics must
// never turn a failed command into a passing browser state.
export function runBrowserCommand(session, command, { env, executor = execFileSync, now = () => performance.now() }) {
  const started = now();
  const context = { session, command: [...command] };
  const rejected = (category, cause, stdout = '', stderr = '') => {
    const diagnostic = {
      category, ...context, elapsedMs: Math.round(now() - started),
      code: cause.code || null, status: cause.status ?? null, signal: cause.signal || null,
      killed: cause.killed ?? null, stdout: bounded(stdout), stderr: bounded(stderr),
    };
    const error = new Error(`agent-browser ${command[0]} [${category}]: ${bounded(cause.message)}${diagnostic.stdout ? `\nstdout: ${diagnostic.stdout}` : ''}${diagnostic.stderr ? `\nstderr: ${diagnostic.stderr}` : ''}`, { cause });
    error.browserCommand = diagnostic;
    return error;
  };
  let raw;
  try {
    raw = executor('agent-browser', ['--session', session, '--json', ...command], {
      encoding: 'utf8', timeout: 45000, maxBuffer: 8 * 1024 * 1024, env,
    });
  } catch (cause) {
    const category = cause.code === 'ETIMEDOUT' ? 'process_timeout'
      : cause.signal ? 'process_signal' : Number.isInteger(cause.status) ? 'process_exit' : 'process_error';
    throw rejected(category, cause, cause.stdout, cause.stderr);
  }
  let output;
  try { output = JSON.parse(raw); }
  catch (cause) { throw rejected('invalid_json', cause, raw); }
  if (!output.success) throw rejected('command_error', new Error(output.error || 'CLI rejected command'), raw);
  return output.data;
}
