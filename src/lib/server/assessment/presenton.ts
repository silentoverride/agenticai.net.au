import { env } from '$env/dynamic/private';
import type { AssessmentReportJob } from './types';

function presentonBaseUrl() {
  const configured = env.PRESENTON_API_URL || 'https://api.presenton.ai';
  return configured
    .replace(/\/+$/, '')
    .replace(/\/api\/v\d+$/, '')
    .replace(/\/v\d+$/, '');
}

export async function generatePresentonDeck(analysisJson: string, job: AssessmentReportJob): Promise<string> {
  const apiKey = env.PRESENTON_API_KEY;
  const apiUrl = presentonBaseUrl();

  if (!apiKey) {
    console.warn('PRESENTON_API_KEY not configured, skipping deck generation.');
    return '';
  }

  try {
    const response = await fetch(`${apiUrl}/api/v3/presentation/generate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        title: `${job.company || job.customerName || 'AI Business'} Assessment`,
        content: `Create a concise AI Business Assessment slide deck for ${job.company || job.customerName || 'the business'} using this structured report JSON:\n\n${analysisJson}`,
        n_slides: 6,
        language: 'English',
        standard_template: env.PRESENTON_TEMPLATE || 'general',
        export_as: 'pptx'
      })
    });

    if (!response.ok) {
      const error = await response.text().catch(() => '');
      console.error('Presenton generation failed:', response.status, error);
      return '';
    }

    const data = await response.json();
    return data.path || data.download_url || data.url || '';
  } catch (error) {
    console.error('Presenton API call failed:', error);
    return '';
  }
}
