// Exports the real, curated project case studies (frontend/src/data/caseStudies.js)
// into a Python-readable JSON file the AI assistant backend can load directly —
// no duplicated project descriptions to keep in sync by hand. Re-run this any
// time a project is added/edited in caseStudies.js:
//
//   node scripts/export_projects.mjs
//
// main.py re-reads data/projects.json on every chat request, so a fresh
// export is picked up immediately, no server restart needed.
//
// Output: data/projects.json — shape:
// {
//   "generatedAt": "...",
//   "index": [ { slug, category, categoryLabel, title, tagline }, ... ],
//   "pointers": { "<slug>": "<full formatted project write-up>", ... }
// }

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const caseStudiesPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'caseStudies.js');
const outputPath = path.join(__dirname, '..', 'data', 'projects.json');

const mod = await import(`file://${caseStudiesPath}`);
const { categories, caseStudies } = mod;

const index = [];
const pointers = {};

for (const categoryKey of Object.keys(categories)) {
  const categoryMeta = categories[categoryKey];
  const studies = caseStudies[categoryKey] || [];

  for (const study of studies) {
    index.push({
      slug: study.slug,
      category: categoryKey,
      categoryLabel: categoryMeta.label,
      title: study.title,
      tagline: study.tagline,
    });

    let text = '';
    text += `PROJECT: ${study.title}\n`;
    text += `Category: ${categoryMeta.label}\n`;
    text += `Tagline: ${study.tagline}\n`;
    text += `Summary: ${study.summary}\n`;
    if (study.tech?.length) text += `Tech stack: ${study.tech.join(', ')}\n`;
    if (study.heroMetrics?.length) {
      text += `Key numbers: ${study.heroMetrics.map((m) => `${m.label}: ${m.value}`).join(' | ')}\n`;
    }
    if (study.github) text += `GitHub: ${study.github}\n`;
    if (study.live) text += `Live: ${study.live}\n`;

    if (study.narrative?.length) {
      text += `\n--- Full write-up ---\n`;
      for (const n of study.narrative) {
        text += `\n[${n.heading}]\n${n.body}\n`;
      }
    }

    if (study.skillsDemonstrated?.length) {
      text += `\n--- Skills demonstrated ---\n`;
      for (const s of study.skillsDemonstrated) text += `- ${s}\n`;
    }

    pointers[study.slug] = text.trim();
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  index,
  pointers,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`Exported ${index.length} projects to ${outputPath}`);
