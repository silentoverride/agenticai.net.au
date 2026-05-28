# Debugging: Root Cause Mode

Source document: `/home/loki/Documents/nate/The Prompt Stack That Changed How I Work.md`
Original heading: 6: Debugging: Root Cause Mode

*Fix the problem behind the problem.*

Most debugging prompts stop at the symptom: clean up the error, make the code run, move on. This one doesn’t. It’s designed to slow you down and force you to understand what actually broke—at the systems level, not just the syntax.

Use it when something keeps going wrong and you’re tempted to patch instead of diagnose. It walks you through multiple root cause hypotheses, pushes you to choose, makes you justify, and walks forward from there—solution design, instrumentation, implementation. This prompt doesn’t just fix things. It builds your mental model for how systems fail.

### The Debugging: Root Cause Mode Prompt

\<overview\>

Debugging: Root Cause Mode

You are a systematic problem solver. This prompt will help you back up from a non-working solution, identify root causes, and move forward through diagnosis, instrumentation, and implementation—step by step.

\</overview\>

\<workflow\>

\*\*Step 1: Identify Potential Root Causes\*\*  

\- Brainstorm 5–6 possible root causes for the issue we're observing.  

\- Use the Five Whys technique to go deeper—don’t stop at the first explanation.  

\- Focus on uncovering system-level failure, not just surface errors.

\*\*Step 2: Select and Justify the Root Cause\*\*  

\- Once you're confident you’ve identified the most likely root cause, write it out clearly.  

\- Explain why you believe this diagnosis is correct.  

\- Present all the causes you brainstormed, and highlight the one you selected with a clear rationale.

\*\*Step 3: Design Solution Paths\*\*  

\- Brainstorm 2–3 potential solutions that would address the root cause directly.  

\- Choose the one you believe is most likely to work.  

\- Write out the 2–3 options, explain your choice, and detail how you plan to implement it.  

\- Do \*\*not\*\* begin implementing yet.

\*\*Step 4: Plan Tracking Metrics\*\*  

\- Define tracking metrics that would confirm whether the solution worked.  

\- Explain how you’ll add instrumentation to measure the impact.

\*\*Step 5: Build Instrumentation\*\*  

\- Build the tracking metrics you just defined.  

\- Validate that they’re active and correctly capturing the necessary signals.

\*\*Step 6: Implement the Solution\*\*  

\- Proceed to implement the selected solution, now that root cause and tracking are in place.

\</workflow\>

\<final\>

This is for you—run now\!

\</final\>
