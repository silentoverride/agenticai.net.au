/**
 * Gate Mode Configuration — env-var-driven gate promotion framework.
 *
 * Each gate type can operate in one of two modes:
 * - `shadow` — gates log verdicts but pipeline continues regardless of result
 * - `blocking` — gates can halt the pipeline on block/escalate verdicts
 *
 * Mode is controlled via env vars, so promoting from shadow → blocking
 * requires zero code changes — just deploy with updated env vars.
 *
 * Env var naming convention:
 *   GATE_{UPPER_TYPE}_ENABLED  — set to 'true' to enable the gate
 *   GATE_{UPPER_TYPE}_KILL     — set to 'true' to kill-switch and disable
 *   GATE_MODE                  — 'shadow' (default) or 'blocking'
 *   GATE_MAX_RETRIES           — max retries for 'retry' verdict (default: 2)
 */

export type GateMode = 'shadow' | 'blocking';

export function normalizeGateType(gateType: string): string {
  return gateType.toUpperCase().replace(/-/g, '_');
}

/**
 * Get the effective env var values for a gate type from env overrides.
 */
export function getGateEnvVars(
  gateType: string,
  envOverrides?: Record<string, string | undefined>
): {
  enabled: boolean;
  kill: boolean;
} {
  const key = normalizeGateType(gateType);
  const env = envOverrides || (typeof process !== 'undefined' ? process.env : {}) || {};

  const enabledVar = env[`GATE_${key}_ENABLED`];
  const killVar = env[`GATE_${key}_KILL`];

  const enabled = enabledVar === undefined ? true : (enabledVar === 'true' || enabledVar === '1');
  const kill = killVar === 'true' || killVar === '1';

  return { enabled, kill };
}

/**
 * Get the global gate mode. Defaults to 'shadow' unless GATE_MODE is set to 'blocking'.
 */
export function getGateMode(envOverrides?: Record<string, string | undefined>): GateMode {
  const env = envOverrides || (typeof process !== 'undefined' ? process.env : {}) || {};
  const mode = env['GATE_MODE'];
  if (mode === 'blocking' || mode === 'shadow') {
    return mode;
  }
  // Default to shadow mode for safety
  return 'shadow';
}

/**
 * Get the maximum retry count for 'retry' verdicts.
 * Default: 2 retries.
 */
export function getGateMaxRetries(envOverrides?: Record<string, string | undefined>): number {
  const env = envOverrides || (typeof process !== 'undefined' ? process.env : {}) || {};
  const val = env['GATE_MAX_RETRIES'];
  if (val !== undefined) {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }
  return 2;
}

/**
 * Determine whether a gate is active for the given gate type.
 * A gate is active if:
 *   - GATE_{TYPE}_KILL is NOT set to 'true'/'1'
 *   - GATE_{TYPE}_ENABLED IS set to 'true'/'1' (or not set, which defaults to enabled)
 */
export function isGateActive(
  gateType: string,
  envOverrides?: Record<string, string | undefined>
): boolean {
  const { enabled, kill } = getGateEnvVars(gateType, envOverrides);
  return enabled && !kill;
}
