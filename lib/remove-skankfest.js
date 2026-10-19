'use strict';

/**
 * Takes Skankfest off the site, once.
 *
 * The name had spread from the biography into the SEO copy, the FAQ answers and
 * the credits list. Each rule below rewrites one phrasing that is on the live
 * site, so the sentence still reads when the name comes out of it. Anything the
 * rules do not cover is logged rather than guessed at.
 *
 * It runs once, so adding the name back in the panel later is never undone.
 */

const RULES = [
  [/won the (\d{4} )?Roast Battle at Skankfest/gi, (m, year) => `won ${year ? 'a ' + year : 'a'}Roast Battle`],
  [/(\d{4} )?Skankfest Roast Battle winner/gi, (m, year) => `${year || ''}Roast Battle winner`],
  [/(\d{4} )?Skankfest Roast Battle/gi, (m, year) => `${year || ''}Roast Battle`],
  [/Skankfest Battle Winner/gi, 'Roast Battle Winner'],
  [/\s+at Skankfest\b/gi, ''],
  [/\bSkankfest,\s*/gi, ''],
  [/,?\s*(?:and\s+)?Skankfest\b/gi, '']
];

const PATTERN = /skankfest/i;
const MARKER = 'removeSkankfest@1';

function scrub(text) {
  let out = text;
  for (const [pattern, replacement] of RULES) {
    if (!PATTERN.test(out)) break;
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** Every string in the document, rewritten in place. Returns what changed. */
function walk(node, path, changes) {
  if (Array.isArray(node)) {
    node.forEach((value, i) => {
      if (typeof value === 'string') {
        if (PATTERN.test(value)) { node[i] = scrub(value); changes.push({ path: `${path}.${i}`, from: value, to: node[i] }); }
      } else walk(value, `${path}.${i}`, changes);
    });
  } else if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      if (key === 'meta') continue;
      const value = node[key];
      const at = path ? `${path}.${key}` : key;
      if (typeof value === 'string') {
        if (PATTERN.test(value)) { node[key] = scrub(value); changes.push({ path: at, from: value, to: node[key] }); }
      } else walk(value, at, changes);
    }
  }
  return changes;
}

function alreadyRun(site) {
  return Array.isArray((site.meta || {}).repairs) && site.meta.repairs.includes(MARKER);
}

function apply(site) {
  const changes = walk(site, '', []);
  site.meta = site.meta || {};
  site.meta.repairs = [...new Set([...(site.meta.repairs || []), MARKER])];
  return { changes };
}

async function run(store) {
  try {
    const current = await store.readSite();
    if (alreadyRun(current)) return null;
    let report = null;
    await store.update((site) => {
      if (alreadyRun(site)) return site;
      report = apply(site);
      return site;
    });
    if (report) {
      for (const c of report.changes) {
        console.log(`[content] ${c.path}: Skankfest removed`);
        if (PATTERN.test(c.to)) console.log(`[content] ${c.path} still names it, edit by hand`);
      }
    }
    return report;
  } catch (err) {
    console.error(`[content] Skankfest removal skipped: ${err.message}`);
    return null;
  }
}

module.exports = { apply, run, scrub, alreadyRun, MARKER };
