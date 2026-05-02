import { env } from '$env/dynamic/private';
import type { AssessmentReportJob } from './types';
import { buildTemplateSlides } from './template-mapper';

function presentonBaseUrl() {
  const configured = env.PRESENTON_API_URL || 'https://api.presenton.ai';
  return configured
    .replace(/\/+$/, '')
    .replace(/\/api\/v\d+$/, '')
    .replace(/\/v\d+$/, '');
}

/**
 * Convert template-mapped slides into a detailed markdown prompt for Presenton /generate.
 * Each slide becomes a section with title and bullet points.
 */
function slidesToMarkdown(slides: any[]): string {
  return slides.map((slide, i) => {
    const lines: string[] = [];
    lines.push(`## Slide ${i + 1}: ${slide.title || 'Untitled'}`);
    if (slide.subtitle) lines.push(`_Subtitle: ${slide.subtitle}_`);
    if (Array.isArray(slide.bullets)) {
      slide.bullets.forEach((b: string) => lines.push(`- ${b}`));
    }
    return lines.join('\n');
  }).join('\n\n---\n\n');
}

export async function generatePresentonDeck(analysisJson: string, job: AssessmentReportJob): Promise<string> {
  const apiKey = env.PRESENTON_API_KEY;
  const apiUrl = presentonBaseUrl();

  if (!apiKey) {
    console.warn('PRESENTON_API_KEY not configured, skipping deck generation.');
    return '';
  }

  // Build structured slides from template mapper
  const slides = buildTemplateSlides(analysisJson, job);
  const content = slidesToMarkdown(slides);

  const company = job.company || job.customerName || 'the business';

  try {
    const response = await fetch(`${apiUrl}/api/v3/presentation/generate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        title: `${company} — AI Business Assessment`,
        content: `Create a professional AI Business Assessment presentation for ${company}. Follow the exact slide structure below. Create one slide per section. Use clean, modern layouts with plenty of white space.

${content}`,
        n_slides: slides.length,
        language: 'English',
        standard_template: env.PRESENTON_TEMPLATE || 'neo-general',
        export_as: 'pptx',
        tone: 'professional',
        verbosity: 'standard',
        include_title_slide: true,
        include_table_of_contents: false
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
