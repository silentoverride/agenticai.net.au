#!/usr/bin/env node
/**
 * Compute evaluation corpus statistics from the structured annotation data.
 *
 * Usage: npx tsx _bmad-output/evaluation-corpus/scripts/stats.ts
 *
 * Reads corpus.ts and prints summary statistics to stdout.
 */

import { CORPUS, computeCorpusStats } from '../corpus.js';

const stats = computeCorpusStats(CORPUS);

console.log('=== Evaluation Corpus Statistics ===\n');
console.log(`Corpus size: ${stats.corpusSize} reports\n`);

console.log('Dimension Averages (1-10):');
const dims = [
  'evidence_grounding',
  'recommendation_credibility',
  'client_specificity',
  'financial_honesty',
  'tone_communication',
  'safety',
  'overall_quality'
];
for (const dim of dims) {
  const avg = stats.dimensionAverages[dim].toFixed(1);
  const bar = '█'.repeat(Math.round(stats.dimensionAverages[dim]));
  const padLen = Math.max(0, 32 - dim.length);
  console.log(`  ${dim}${' '.repeat(padLen)} ${bar} ${avg}`);
}

console.log(`\nWeakest dimension: ${stats.weakestDimension} (${stats.dimensionAverages[stats.weakestDimension].toFixed(1)})`);
console.log(`Strongest dimension: ${stats.strongestDimension} (${stats.dimensionAverages[stats.strongestDimension].toFixed(1)})`);
console.log(`Overall quality range: ${stats.overallQualityRange.min}–${stats.overallQualityRange.max}`);

console.log('\nPBW Pattern Flag Rates:');
for (const [flag, rate] of Object.entries(stats.pbwFlagRates)) {
  const pct = (rate * 100).toFixed(0);
  const marker = rate > 0 ? '⚠️' : '✅';
  console.log(`  ${marker} ${flag}: ${pct}%`);
}

console.log('\nTranscript Quality Distribution:');
console.log(`  rich:     ${stats.transcriptQualityDistribution.rich}`);
console.log(`  adequate: ${stats.transcriptQualityDistribution.adequate}`);
console.log(`  sparse:   ${stats.transcriptQualityDistribution.sparse}`);

console.log('\nOverall Quality by Transcript Quality:');
for (const [tq, avg] of Object.entries(stats.overallQualityByTranscriptQuality)) {
  const val = avg.toFixed(1);
  console.log(`  ${tq}: ${val}`);
}

console.log('\n=== Per-Report Summary ===\n');
for (const r of CORPUS) {
  const pbwCount = Object.values(r.pbwFlags).filter(Boolean).length;
  const pbwTag = pbwCount > 0 ? ` ⚠️ ${pbwCount} PBW` : ' ✅ No PBW';
  const padLen = Math.max(0, 50 - r.label.length);
  console.log(`  ${r.label}${' '.repeat(padLen)} overall=${r.dimensions.overall_quality} | transcript=${r.transcriptQuality}${pbwTag}`);
}

console.log('\n=== Expansion Targets ===');
console.log(`  Current: ${stats.corpusSize} reports`);
console.log(`  Sprint target: 15 reports (need ${15 - stats.corpusSize} more)`);
console.log(`  Epic target: 30 reports (need ${30 - stats.corpusSize} more)`);
console.log(`  Second annotator needed for inter-rater reliability at >10 reports`);
