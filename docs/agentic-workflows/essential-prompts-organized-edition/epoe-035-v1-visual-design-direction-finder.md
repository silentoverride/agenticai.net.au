# Visual Design Direction Finder

Source document: `/home/loki/Documents/nate/The 39 Essential Prompts - Organized Edition.md`
Original heading: 35. Visual Design Direction Finder

**Purpose:** Generate cohesive visual design directions with specific colors, fonts, and styling.

**When to use:** Starting a design project and need aesthetic direction.

**Input needed:**

* Project name/description  
* Brand attributes (3-5 adjectives)  
* Target audience  
* Accessibility requirements

---

### **Your Input**

**Project:** \[Name and brief description\]

**Brand Attributes:** \[3-5 adjectives like "modern, warm, professional"\]

**Target Audience:** \[Demographics, preferences, context of use\]

**Accessibility Requirements:** \[WCAG AA/AAA, specific needs\]

**Design Constraints:** \[Platform, technical limitations, brand guidelines\]

---

### **Instructions**

Create comprehensive design directions following these steps:

#### **Step 1: Design Brief Summary**

Confirm understanding of project needs and constraints (2-3 sentences).

#### **Step 2: Generate Color Palettes**

Create exactly 3 distinct palettes:

**Palette 1: \[Name reflecting mood\]**

* **Primary:** \#HEX \- \[Color name\] \- Use for: \[Specific uses\]  
* **Secondary:** \#HEX \- \[Color name\] \- Use for: \[Specific uses\]  
* **Accent:** \#HEX \- \[Color name\] \- Use for: \[Specific uses\]  
* **Neutral Dark:** \#HEX \- \[Color name\] \- Use for: \[Specific uses\]  
* **Neutral Light:** \#HEX \- \[Color name\] \- Use for: \[Specific uses\]  
* **Accessibility:** Contrast ratios between key pairs  
* **Emotional Impact:** What this palette conveys  
* **Best For:** When to use this palette

\[Repeat for Palettes 2 and 3\]

#### **Step 3: Typography Pairings**

Provide 3 font combinations:

**Pairing 1: \[Style name\]**

* **Heading Font:** \[Font name\] \- Where to find: \[Google Fonts/Adobe/etc.\]  
* **Body Font:** \[Font name\] \- Where to find: \[Source\]  
* **Why They Work:** \[2-3 sentences on compatibility\]  
* **Personality:** What they communicate  
* **Usage Guidelines:** Size ratios, weight variations

\[Repeat for Pairings 2 and 3\]

#### **Step 4: Micro-Interaction Patterns**

Define interaction design elements:

**Button Behaviors**

* Default state  
* Hover effect  
* Active/pressed state  
* Disabled state  
* Transition timing

**Loading States**

* Skeleton screens  
* Progress indicators  
* Animation style

**Feedback Patterns**

* Success messages  
* Error states  
* Tooltips  
* Form validation

#### **Step 5: Implementation Guide**

Provide ready-to-use CSS:

/\* CSS Variables for chosen direction */*  
 *:root {*  
 */* Colors */*  
 *\--primary: \#HEX;*  
 *\--secondary: \#HEX;*  
 */* ... rest of palette \*/

/\* Typography \*/  
 \--font-heading: 'Font Name', fallback;  
 \--font-body: 'Font Name', fallback;

/\* Spacing \*/  
 \--space-unit: 8px;

/\* Transitions \*/  
 \--transition-base: 200ms ease;  
 }

---

### **Output Format**

Present as:

* Design Understanding  
* 3 Color Palettes (with accessibility checks)  
* 3 Typography Pairings  
* Micro-interaction Specifications  
* Implementation Code  
* Quick Decision Matrix  
* Next Steps Checklist

---
