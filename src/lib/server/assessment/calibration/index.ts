/**
 * Calibration Module — barrel export.
 */

// Types
export type {
  GoldenTestCase,
  GoldenGateResult,
  GoldenCaseResult,
  CalibrationRunReport,
  CalibrationRunSummary,
  CalibrationConfig
} from './types';
export { DEFAULT_CALIBRATION_CONFIG } from './types';

// Golden test cases
export {
  GOLDEN_TEST_CASES,
  getGoldenTestCase,
  getGoldenTestCasesByTags,
  getAllGoldenTags
} from './golden-cases';

// Runner
export { runCalibration, formatCalibrationSummary } from './runner';
export type { CalibrationRunOptions } from './runner';
