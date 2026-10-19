'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const rm = require('../lib/remove-skankfest');

/** The phrasings on the live site when it was removed. */
function live() {
  return {
    seo: { description: 'Taylor Drew is a New York City stand-up comedian, 2025 Skankfest Roast Battle winner and creator of Pins & Needles Comedy. Dates, clips and booking.' },
    about: {
      body: ['Taylor Drew is a stand-up comedian based in New York City. She performs regularly at clubs across the city, has been featured at the Comedy Store in Los Angeles, and won the 2025 Roast Battle at Skankfest. Her festival appearances include the Edinburgh Fringe and Laughing Buddha.'],
      credits: [{ title: 'Skankfest Roast Battle — Winner' }],
      faqs: [{ a: 'She performs regularly at clubs across New York City and at festivals including Skankfest, the Edinburgh Fringe and Laughing Buddha.' }]
    },
    meta: {}
  };
}

test('every mention comes out and the sentences still read', () => {
  const site = live();
  const { changes } = rm.apply(site);
  assert.equal(changes.length, 4);
  assert.doesNotMatch(JSON.stringify({ ...site, meta: undefined }), /skankfest/i);
  assert.equal(site.seo.description, 'Taylor Drew is a New York City stand-up comedian, 2025 Roast Battle winner and creator of Pins & Needles Comedy. Dates, clips and booking.');
  assert.match(site.about.body[0], /and won a 2025 Roast Battle\. Her festival/);
  assert.equal(site.about.credits[0].title, 'Roast Battle — Winner');
  assert.equal(site.about.faqs[0].a, 'She performs regularly at clubs across New York City and at festivals including the Edinburgh Fringe and Laughing Buddha.');
});

test('it runs once, so the name can be added back in the panel', async () => {
  let doc = live();
  const store = {
    readSite: async () => doc,
    update: async (fn) => { doc = (await fn(doc)) || doc; return doc; }
  };
  assert.ok(await rm.run(store));
  doc.seo.description = 'Skankfest';
  assert.equal(await rm.run(store), null);
  assert.equal(doc.seo.description, 'Skankfest');
});
