/** FAQ data shared between /faq page and /services accordion.
 *  Keep in sync with docs/company-faq.md (single source of truth).
 *  When editing answers, update both files.
 */
export interface FaqItem {
	id: string;
	question: string;
	answer: string;
	category?: string;
}

export const faqItems: FaqItem[] = [
	{
		id: 'included',
		question: 'What does the $1,200 include?',
		answer:
			`The AI Business Assessment includes a 20–30 minute discovery call with Annie, a workflow audit, tool recommendations matched to your gaps, an implementation roadmap, financial impact analysis, a polished RevealDeck report (PDF-exportable), permanent portal access, and a complimentary 30-minute follow-up consultation. It's a one-time fee — no subscriptions, no hidden costs.` },
	{
		id: 'timeline',
		question: 'How long does the report take?',
		answer:
			`Reports are typically ready within 48 hours of payment. The pipeline runs automatically after Stripe confirms payment, producing your tailored RevealDeck report. During busy periods this may extend to 72 hours. If you're on a tight deadline, mention it during the call and we'll prioritise.` },
	{
		id: 'after',
		question: 'What happens after the assessment?',
		answer:
			`You have four paths: (A) Self-implementation using the report and roadmap. (B) Done-with-you implementation — we guide setup and configuration. (C) Done-for-you — our team implements everything end-to-end. (D) Start with quick wins only, then return for deeper phases later. There's no obligation to proceed with implementation — the report is yours to keep.` },
	{
		id: 'share',
		question: 'Can I share the report with my team?',
		answer:
			`Yes. Your RevealDeck report can be downloaded as a PDF, printed, screenshotted, or forwarded by email. You can also request additional portal accounts for team members at no extra cost. For enterprise teams (10+), we offer white-label reports with your company branding.` },
	{
		id: 'implement',
		question: 'Do you implement the recommendations?',
		answer:
			`Yes — implementation is available as a separate engagement, not included in the $1,200 assessment fee. We scope the work in your complimentary 30-minute follow-up call and provide a fixed-price or retainer proposal. Typical timelines: quick wins 1–2 weeks, Phase 1 core automations 4–6 weeks, full roadmap 3–6 months.` },
	{
		id: 'who',
		question: 'Who is the assessment for?',
		answer:
			`Australian SMEs with 3–50 staff who spend significant time on manual, repeated tasks and use multiple tools that don't talk to each other. Common industries: professional services, trades, e-commerce, SaaS, and healthcare. Not suited for large enterprises with dedicated IT departments or businesses needing only one simple automation.` },
	{
		id: 'privacy',
		question: 'Is my data safe? What about privacy?',
		answer:
			`Yes. Call data is stored in Cloudflare's Australian data centres. We do not sell or train AI models on your data. Payments are processed by Stripe (PCI-DSS Level 1). Your portal uses bank-grade Clerk authentication. We comply with the Australian Privacy Principles. You can request full data deletion within 7 business days via hello@agenticai.net.au.` },
	{
		id: 'refund',
		question: 'What if I change my mind after payment?',
		answer:
			`Full refund available within 14 days if the call has not been conducted. After the call, the fee is non-refundable because the analysis pipeline and human review consume resources. If the report is materially incomplete or inaccurate, we will re-run the analysis and provide a revised report at no cost. Technical failures (dropped call, audio issues) are re-scheduled free of charge.` },
	{
		id: 'consultant',
		question: 'How is this different from hiring a consultant?',
		answer:
			`Faster (48 hours vs 2–4 weeks), cheaper ($1,200 vs $5,000–$15,000), and more structured. The assessment uses an AI-driven discovery call, automated tool research across 200+ platforms, and produces an interactive RevealDeck with charts and roadmaps. Traditional consulting suits deep organisational change; our assessment is ideal when you need a clear, ranked action plan quickly.` },
	{
		id: 'industry',
		question: 'What if Annie doesn\'t understand my industry?',
		answer:
			`Annie handles trades, professional services, e-commerce, SaaS, and healthcare. If she encounters something unfamiliar, she asks clarifying questions and flags gaps for human review. Every report is quality-checked before delivery. For highly specialised industries, we may recommend a hybrid assessment: Annie for discovery, plus a domain specialist follow-up call.` },
	{
		id: 'nocall',
		question: 'Can I do the assessment without the voice call?',
		answer:
			`The standard assessment requires a voice call with Annie (20–30 minutes). If you have a hearing impairment, operate in a noisy environment, or strongly prefer text, email hello@agenticai.net.au with "Text-based Assessment Request" and we can arrange a structured questionnaire, async video answers, or a live chat assessment (currently in beta).` },
	{
		id: 'start',
		question: 'How do I get started?',
		answer:
			`Click "Start AI Business Assessment" on our homepage or services page. This opens a browser-based voice call with Annie — no download required. The call takes 20–30 minutes. After verbal approval and payment, your report is generated automatically and delivered to your portal within 48 hours.` }
];

export const faqCategories = Array.from(new Set(faqItems.map((i) => i.category).filter(Boolean))) as string[];
