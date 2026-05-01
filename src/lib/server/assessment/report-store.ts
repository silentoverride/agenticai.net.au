import { env } from '$env/dynamic/private';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AssessmentReportJob, SavedReport } from './types';
import { toMarkdown } from './report-markdown';

const REPORTS_DIR = env.REPORTS_DIR || './app_data/reports';

function reportsDir() {
  const dir = path.resolve(REPORTS_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function reportId(job: AssessmentReportJob) {
  const base = job.callId || job.sessionId || Date.now().toString();
  return `${Date.now()}-${base}`;
}

export function saveReport(job: AssessmentReportJob, analysis: string, deckUrl?: string): SavedReport {
  const dir = reportsDir();
  const id = reportId(job);
  const subDir = path.join(dir, id);
  fs.mkdirSync(subDir, { recursive: true });

  const jsonPath = path.join(subDir, 'analysis.json');
  const mdPath = path.join(subDir, 'report.md');

  fs.writeFileSync(jsonPath, analysis, 'utf-8');
  fs.writeFileSync(mdPath, toMarkdown(job, analysis), 'utf-8');

  if (job.transcript) {
    fs.writeFileSync(path.join(subDir, 'transcript.txt'), job.transcript, 'utf-8');
  }

  const meta = {
    id,
    job: {
      callId: job.callId,
      sessionId: job.sessionId,
      source: job.source,
      customerName: job.customerName,
      customerEmail: job.customerEmail,
      customerPhone: job.customerPhone,
      company: job.company,
      receivedAt: job.receivedAt
    },
    deckUrl: deckUrl || null,
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(subDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');

  console.info('Report saved locally', { id, jsonPath, mdPath });
  return { id, dir: subDir, jsonPath, mdPath, deckUrl };
}

export function listReports(): SavedReport[] {
  const dir = reportsDir();
  if (!fs.existsSync(dir)) return [];

  const items = fs.readdirSync(dir)
    .map((name: string) => {
      const subDir = path.join(dir, name);
      if (!fs.statSync(subDir).isDirectory()) return null;
      const metaPath = path.join(subDir, 'meta.json');
      if (!fs.existsSync(metaPath)) return null;
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        return {
          id: meta.id || name,
          dir: subDir,
          jsonPath: path.join(subDir, 'analysis.json'),
          mdPath: path.join(subDir, 'report.md'),
          deckUrl: meta.deckUrl || undefined
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as SavedReport[];

  return items.sort((a, b) => b.id.localeCompare(a.id));
}

export function getReport(id: string): SavedReport | null {
  const dir = path.resolve(reportsDir(), id);
  if (!fs.existsSync(dir)) return null;
  if (!fs.existsSync(path.join(dir, 'analysis.json'))) return null;
  const metaPath = path.join(dir, 'meta.json');
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    : {};
  return {
    id,
    dir,
    jsonPath: path.join(dir, 'analysis.json'),
    mdPath: path.join(dir, 'report.md'),
    deckUrl: meta.deckUrl || undefined
  };
}
