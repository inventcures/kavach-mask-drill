import { validateScenario, type Scenario } from '../../engine/scenario';
import nipah from './nipah-kerala-01.json';

/**
 * Checks a bundled scenario once, when the app loads. The same check runs in the
 * unit tests, so a broken scenario fails the build long before it reaches a phone.
 */
function load(raw: unknown, langs: readonly string[]): Scenario {
  const result = validateScenario(raw, { langs });
  if (!result.ok) throw new Error(`Scenario is not valid:\n${result.errors.join('\n')}`);
  return result.scenario;
}

/** The drill played from the home screen. Add scenarios here as they are written. */
export function defaultScenario(langs: readonly string[]): Scenario {
  return load(nipah, langs);
}
