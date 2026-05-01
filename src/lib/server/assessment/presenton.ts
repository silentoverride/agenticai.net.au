import { env } from '$env/dynamic/private';
import type { AssessmentReportJob } from './types';

export async function generatePresentonDeck(analysisJson: string, job: AssessmentReportJob): Promise<string> {
  const apiKey = env.PRESENTON_API_KEY;
  const apiUrl = env.PRESENTON_API_URL || 'https://api.presenton.ai/v1';

  if (!apiKey) {
    console.warn('PRESENTON_API_KEY not configured, skipping deck generation.');
    return '';
  }

  try {
    const response = await fetch(`${apiUrl}/presentations`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        title: `${job.company || job.customerName || 'AI Business'} Assessment`,
        subtitle: 'Workflow pain points, quick wins, and implementation roadmap',
        content: analysisJson,
        template: 'business-assessment-v1',
        format: 'pptx',
        sections: [
          { type: 'executive_summary', title: 'Executive Summary' },
          { type: 'pain_points', title: 'Pain Points' },
          { type: 'quick_wins', title: 'Quick Wins' },
          { type: 'tools', title: 'Recommended Tools' },
          { type: 'roadmap', title: 'Implementation Roadmap' },
          { type: 'financial_impact', title: 'Financial Impact' }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text().catch(() => '');
      console.error('Presenton generation failed:', response.status, error);
      return '';
    }

    const data = await response.json();
    return data.download_url || data.url || '';
  } catch (error) {
    console.error('Presenton API call failed:', error);
    return '';
  }
}
