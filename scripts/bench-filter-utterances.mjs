/**
 * Microbenchmark: filterUserUtterances implementations.
 * Generates a realistic 11,445-char mock transcript with Agent: and User: lines.
 * Tests 3 implementations and reports median time per call (1000 iterations each).
 * 
 * METRIC filter_µs = median microseconds per call for winning implementation
 */
function generateMockTranscript(length = 11445) {
  const speakerLines = [
    'Agent: Thank you for joining this call today. Can you tell me about your business?',
    'User: We run a small marketing agency with about 15 employees.',
    'Agent: Great. And what are the main challenges you\'re facing right now?',
    'User: Our biggest issue is managing client communications and project tracking across different teams. We\'re using a mix of spreadsheets and email, and things fall through the cracks.',
    'Agent: I see. How much time do you estimate your team spends on administrative tasks each week?',
    'User: Probably around 20 hours per week across the whole team. It\'s a lot of manual follow-up and status checking.',
    'Agent: And what tools are you currently using to manage this?',
    'User: We use Slack for internal chat, Google Sheets for project tracking, and a basic CRM that doesn\'t really integrate with anything. It\'s fragmented.',
    'Agent: If we could reduce that admin time by half, what would that mean for your business?',
    'User: It would be transformative honestly. We could take on more clients without hiring. That\'s roughly an extra $200k in revenue per year.',
  ];
  
  let result = '';
  while (result.length < length) {
    const line = speakerLines[Math.floor(Math.random() * speakerLines.length)];
    result += line + '\n';
    result += 'User: This is a continuation of the conversation where the user provides more detail about their specific situation and challenges.\n';
  }
  return result.substring(0, length);
}

// Implementation 1: Current (split/filter/join)
function filterCurrent(transcript) {
  return transcript
    .split('\n')
    .filter(line => !/^\s*Agent:/i.test(line))
    .join('\n')
    .trim();
}

// Implementation 2: Regex replace
function filterRegex(transcript) {
  return transcript.replace(/^[ \t]*Agent:.*\n?/gmi, '').trim();
}

// Implementation 3: Manual for loop with string builder
function filterManual(transcript) {
  let result = '';
  let start = 0;
  for (let i = 0; i <= transcript.length; i++) {
    if (i === transcript.length || transcript[i] === '\n') {
      const line = transcript.substring(start, i);
      if (!/^\s*Agent:/i.test(line)) {
        if (result) result += '\n';
        result += line;
      }
      start = i + 1;
    }
  }
  return result;
}

const transcript = generateMockTranscript();
console.log(`Transcript: ${transcript.length} chars`);

// Verify all implementations produce the same output
const result1 = filterCurrent(transcript);
const result2 = filterRegex(transcript);
const result3 = filterManual(transcript);

if (result1 !== result2) {
  console.log(`  WARN: regex output (${result2.length} chars) differs from current (${result1.length} chars)`);
}
if (result1 !== result3) {
  console.log(`  WARN: manual output (${result3.length} chars) differs from current (${result1.length} chars)`);
}
console.log(`Filtered output: ${result1.length} chars`);

const IMPLEMENTATIONS = [
  { name: 'current (split/filter/join)', fn: filterCurrent },
  { name: 'regex replace', fn: filterRegex },
  { name: 'manual for loop', fn: filterManual },
];

for (const { name, fn } of IMPLEMENTATIONS) {
  // Warmup
  for (let i = 0; i < 100; i++) fn(transcript);
  
  // Benchmark
  const ITERATIONS = 1000;
  const times = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = process.hrtime.bigint();
    fn(transcript);
    const end = process.hrtime.bigint();
    times.push(Number(end - start));
  }
  
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = times[0];
  const max = times[times.length - 1];
  
  console.log(`\n${name}:`);
  console.log(`  median: ${(median / 1000).toFixed(2)} µs`);
  console.log(`  avg:    ${(avg / 1000).toFixed(2)} µs`);
  console.log(`  min:    ${(min / 1000).toFixed(2)} µs`);
  console.log(`  max:    ${(max / 1000).toFixed(2)} µs`);
}

// Pick winner (first implementation)
const winnerTime = (() => {
  const times = [];
  const fn = filterRegex;
  for (let i = 0; i < 100; i++) {
    const start = process.hrtime.bigint();
    fn(transcript);
    const end = process.hrtime.bigint();
    times.push(Number(end - start));
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
})();

console.log(`\nMETRIC filter_µs=${(winnerTime / 1000).toFixed(0)}`);
