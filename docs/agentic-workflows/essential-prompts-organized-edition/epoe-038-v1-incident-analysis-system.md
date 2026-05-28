# Incident Analysis System

Source document: `/home/loki/Documents/nate/The 39 Essential Prompts - Organized Edition.md`
Original heading: 38. Incident Analysis System

**Purpose:** Conduct blame-free post-mortems to find root causes and prevent recurrence.

**When to use:** After any failure, incident, or unexpected outcome.

**Input needed:**

* What happened with timeline  
* Impact and duration  
* Initial response actions  
* Current status

---

### **Your Input**

**Incident Description:** \[What happened \- factual summary\]

**Timeline of Events:**

* \[Time\]: \[What occurred\]  
* \[Time\]: \[What occurred\] \[Continue chronologically\]

**Severity Level:** \[High/Medium/Low\]

**Duration:**

* Detection time: \[When noticed\]  
* Resolution time: \[When fixed\]  
* Total duration: \[Hours/days\]

**Impact:**

* Who affected: \[Users/systems/teams\]  
* How affected: \[Specific impacts\]  
* Scope: \[Number/percentage affected\]

**Initial Response:** \[What was done immediately\]

**Current Status:** \[Resolved/Monitoring/Ongoing\]

---

### **Instructions**

Analyze systematically without blame:

#### **Step 1: Incident Summary**

Confirm the facts and timeline (2-3 sentences).

#### **Step 2: Timeline Deep Dive**

**Pre-Incident Phase**

* Warning signs missed:  
  1. \[Signal that something was wrong\]  
  2. \[Another ignored indicator\]  
* Why missed: \[Systems or human factors\]  
* Could have noticed at: \[When detection was possible\]

**Detection Phase**

* How discovered: \[Automated/reported/stumbled upon\]  
* Time to detection: \[From start to awareness\]  
* Detection effectiveness: \[Good/poor \- why\]

**Response Phase**

* First action: \[What\] \- Time: \[When\] \- Effect: \[Result\]  
* Second action: \[What\] \- Time: \[When\] \- Effect: \[Result\] \[Continue for all major actions\]  
* What worked well: \[Effective responses\]  
* What didn't help: \[Ineffective attempts\]

**Resolution Phase**

* Ultimate fix: \[What resolved it\]  
* Why it worked: \[Root cause addressed\]  
* Time to implement: \[How long\]

#### **Step 3: Five Whys Analysis**

Start with surface problem and dig deeper:

**Problem Statement:** \[What went wrong\]

**Why 1:** Why did \[problem\] happen?

* Answer: \[Immediate cause\]  
* Evidence: \[How we know this\]

**Why 2:** Why did \[answer 1\] occur?

* Answer: \[Deeper cause\]  
* Evidence: \[Supporting facts\]

**Why 3:** Why did \[answer 2\] occur?

* Answer: \[Deeper still\]  
* Evidence: \[Data/observations\]

**Why 4:** Why did \[answer 3\] occur?

* Answer: \[Systemic issue\]  
* Evidence: \[Patterns/history\]

**Why 5:** Why did \[answer 4\] exist?

* Answer: \[Root cause \- often organizational\]  
* Evidence: \[Cultural/systematic factors\]

**True Root Cause:** \[Summary statement\]

#### **Step 4: Contributing Factors Map**

**Technical Factors:**

* System design: \[What made failure possible\]  
* Monitoring gaps: \[What we couldn't see\]  
* Technical debt: \[Shortcuts that hurt us\]  
* Complexity: \[What made it hard to diagnose\]

**Process Factors:**

* Documentation: \[Missing/outdated/unclear\]  
* Communication: \[Breakdowns between teams\]  
* Procedures: \[Gaps in runbooks\]  
* Training: \[Knowledge gaps\]

**Human Factors:** (No blame \- system focus)

* Cognitive load: \[Too much to track\]  
* Time pressure: \[Rushing led to...\]  
* Unclear ownership: \[Who was responsible\]  
* Competing priorities: \[What distracted\]

**Organizational Factors:**

* Resource constraints: \[Understaffing/budget\]  
* Cultural issues: \[Fear of speaking up?\]  
* Incentive misalignment: \[Rewards speed over safety?\]  
* Leadership gaps: \[Missing support/direction\]

#### **Step 5: Corrective Actions**

**Immediate Fixes** (This week)

1. **Action:** \[Specific fix\]

   * Owner: \[Name/role\]  
   * Deadline: \[Date\]  
   * Success metric: \[How we'll know it's done\]  
2. **Action:** \[Another fix\] \[Same format\]

**Short-term Improvements** (Next month)

1. **Action:** \[Process improvement\]  
   * Owner: \[Name/role\]  
   * Resources needed: \[Time/money/people\]  
   * Success metric: \[Measurable outcome\]

\[List 3-5 improvements\]

**Long-term Prevention** (Next quarter)

1. **Action:** \[Systematic change\]  
   * Owner: \[Senior sponsor needed\]  
   * Investment required: \[Realistic estimate\]  
   * Expected outcome: \[How this prevents recurrence\]

\[List 2-3 major changes\]

#### **Step 6: Success Metrics**

**How we'll know we've improved:**

*Leading Indicators:*

* Metric 1: \[What to measure weekly\]  
* Metric 2: \[What shows early warning\]  
* Target: \[Specific improvement goal\]

*Lagging Indicators:*

* Incident frequency: \[Current → Target\]  
* Time to detection: \[Current → Target\]  
* Time to resolution: \[Current → Target\]

*Review Schedule:*

* Weekly: \[Quick metric check\]  
* Monthly: \[Deeper review\]  
* Quarterly: \[Full assessment\]

---

### **Output Format**

Your incident analysis includes:

* Blame-Free Timeline  
* Five Whys Analysis  
* Contributing Factors Map  
* Prioritized Corrective Actions  
* Success Metrics  
* Review Schedule  
* Lessons Learned Summary  
* Communication Plan

---
