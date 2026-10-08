import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields, inspectQualificationDescriptions } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';
const slug='joette-pierce-and-associates';
const record=JSON.parse(fs.readFileSync('data/provider-publication-manifest.json')).providers.find(row=>row.slug===slug);
const description='Joette Pierce & Associates in Newport Beach offers certified fine-art appraisal valuations. The firm states it is accredited by the American Society of Appraisers.';
test('Joette metadata and provider schema retain attribution without changing reviewed identity',()=>{
  const dom=new JSDOM(fs.readFileSync(`public_site/appraiser/${slug}/index.html`,'utf8'));
  try {
    const document=dom.window.document;
    assert.equal(document.querySelector('meta[name="description"]').content,description);
    assert.equal(document.querySelector('meta[property="og:description"]').content,description);
    assert.deepEqual(inspectProviderFields(record,document).failures,[]);
    const entity=[...document.querySelectorAll('script[type="application/ld+json"]')].map(node=>JSON.parse(node.textContent)).find(node=>node['@type']==='ProfessionalService');
    assert.equal(entity.description,description);
    assert.equal(entity.name,'Joette Pierce & Associates');
    assert.equal(entity.dateModified,'2026-10-01');
    assert.equal(entity.sameAs,'https://www.joettepierceappraisals.com/');
    assert.deepEqual(entity.address,{'@type':'PostalAddress',addressLocality:'Newport Beach',addressRegion:'CA',addressCountry:'US'});
    assert.equal(record.publicationStatus,'verified');
    assert.equal(record.verifiedAt,'2026-10-01');
    assert.equal(record.fieldEvidence.qualification.independentCredentialVerification,false);
    const findings=inspectProviderFields(record,document).scopeFailures.filter(row=>row.code==='published-service-or-specialty-missing-field-evidence');
    assert.deepEqual(findings.map(row=>row.field).sort(),['appraisal_use_cases','specialties']);
  } finally {dom.window.close();}
});
for(const name of ['appraisers.json','directory.json']) {
  test(`${name} retains attributed Joette facts and the original source review`,()=>{
    const items=JSON.parse(fs.readFileSync(`public_site/${name}`)).appraisers.filter(row=>row.slug===slug);
    assert.equal(items.length,1);const item=items[0];
    assert.equal(item.description,description);
    assert.equal(item.source.verifiedAt,'2026-10-01');
    assert.deepEqual(inspectQualificationDescriptions(record,[{source:`feed:${name}`,text:item.description}]).failures,[]);
  });
}
test('old unqualified description fails even if the visible summary is correct',()=>{
  const result=inspectQualificationDescriptions(record,[{source:'schema.description',text:'Newport Beach appraisal firm accredited by the American Society of Appraisers, providing certified fine-art valuations.'}]);
  assert.equal(result.failures[0]?.code,'provider-attributed-qualification-description-lost-attribution');
});
