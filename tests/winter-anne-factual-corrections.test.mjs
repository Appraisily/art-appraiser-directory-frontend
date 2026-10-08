import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields, providerSchemas } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';
import { assertProviderHandoff, captureProviderHandoff } from '../scripts/provider-handoff-contract.mjs';
const root=new URL('../',import.meta.url),origin='https://art-appraisers-directory.appraisily.com';
const read=file=>fs.readFileSync(new URL(file,root),'utf8');
const records=JSON.parse(read('data/provider-publication-manifest.json')).providers;
const slugs=['winter-associates','anne-kelly-lewis'];
const record=slug=>records.find(row=>row.slug===slug);
const fairWinter='https://fairappraisers.org/appraisers/ms-linda-stamm/#professionalservice';
const fairAnne='https://fairappraisers.org/appraisers/anne-kelly-lewis-fort-worth-tx/#person';
function document(file,fn){const dom=new JSDOM(read(file),{url:origin});try{fn(dom.window.document);}finally{dom.window.close();}}
for(const slug of slugs) {
  test(`${slug}: separately dated fields preserve limited status and old review`,()=>{
    const row=record(slug);assert.equal(row.publicationStatus,'limited');assert.equal(row.verifiedAt,'2026-08-30');
    assert.equal(row.canonicalProviderId,`provider:${slug}`);assert.equal(row.previousUrl,`${origin}/appraiser/${slug}/`);
    const evidence=row.fieldEvidence?.primary_location;assert.ok(evidence,'Missing separately scoped location decision');
    assert.equal(evidence.checkedAt,'2026-10-08');assert.equal(evidence.independentCredentialVerification,false);
    assert.ok(evidence.sourceSnapshots.length>=1);assert.ok(!row.claimScope.includes('qualification'));
    for(const source of evidence.sourceSnapshots){assert.match(source.bodySha256,/^[a-f0-9]{64}$/);assert.equal(source.retrievedAt.slice(0,10),'2026-10-08');}
  });
  test(`${slug}: authored initial HTML, metadata and native handoff agree`,()=>document(`public_site/appraiser/${slug}/index.html`,doc=>{
    const row=record(slug),node=providerSchemas(doc)[0];assert.equal(providerSchemas(doc).length,1);
    assert.equal(node.name,row.name);assert.equal(node.dateModified,'2026-08-30');
    assert.equal(doc.querySelector('meta[name="appraisily:provider-source"]').content,row.sourceUrl);
    assert.equal(doc.querySelector('[data-gtm-cta="website"]').href,row.sourceUrl);
    assert.equal(doc.querySelector('[data-provider-publication-status]').dataset.providerPublicationStatus,'limited');
    assert.match(doc.querySelector('[data-provider-field-review]').textContent,/October 8, 2026/);
    const about=doc.querySelector('[data-provider-specific-about]');assert.ok(about);
    assert.doesNotMatch(about.textContent,/retained as a directory record|Expert Art Valuation|certified|USPAP|IRS standards/);
    assert.equal(doc.querySelector('nav a[href="/appraiser/"]').textContent.trim(),'Art appraisers');
    assert.equal(doc.querySelector('nav a[href^="/location/"]'),null);
    assert.doesNotMatch(doc.title,/Hartford|Fort Worth|Expert Art Valuation/);
    for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])assert.equal(doc.querySelector(selector).content,doc.title);
    const description=doc.querySelector('meta[name="description"]').content;assert.equal(node.description,description);
    for(const selector of ['meta[property="og:description"]','meta[name="twitter:description"]'])assert.equal(doc.querySelector(selector).content,description);
    assert.deepEqual(inspectProviderFields(row,doc),{failures:[],reviewFlags:[],scopeFailures:[]});
    assertProviderHandoff(captureProviderHandoff(doc,origin),row);
  }));
}
test('Winter contact locality is Plainville, not a new city page or credential approval',()=>{
  const evidence=record(slugs[0]).fieldEvidence?.primary_location;assert.deepEqual(evidence?.value,{city:'Plainville',region:'CT',country:'US'});
  assert.equal(evidence.locationRole,'practice_contact');assert.equal(evidence.sourceUrl,'https://www.auctionsappraisers.com/');
  assert.equal(evidence.sourceSnapshots[0].bodySha256,'e7216e721b145c02cec78126831a18988aea6fe8d27acf411117ad00371c73b7');
  assert.equal(fs.existsSync(new URL('public_site/location/plainville/index.html',root)),false);
  document(`public_site/appraiser/${slugs[0]}/index.html`,doc=>{
    const node=providerSchemas(doc)[0];assert.equal(node['@type'],'ProfessionalService');assert.deepEqual(node.address,{'@type':'PostalAddress',addressLocality:'Plainville',addressRegion:'CT',addressCountry:'US'});
    assert.deepEqual(node.sameAs,['https://www.auctionsappraisers.com/',fairWinter]);assert.equal(doc.querySelector('meta[name="appraisily:fair-profile"]').content,fairWinter);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent,/auction business/);assert.match(doc.querySelector('[data-provider-specific-about]').textContent,/auction estimate.*appraisal report/);
  });
});
test('Anne is a named person with a practice relationship, not a Fort Worth office or company equivalence',()=>{
  const row=record(slugs[1]);assert.equal(row.fieldEvidence?.primary_location?.decision,'omit');
  assert.equal(row.fieldEvidence.company_relationship.value.name,'Fine Art Appraisal, L.L.C.');
  assert.equal(row.fieldEvidence.company_relationship.sourceSnapshots[0].bodySha256,'cfdf2fa5a198ec50196b192f8f39ac103da9f09f9c693c990c38195f713dd4a9');
  document(`public_site/appraiser/${slugs[1]}/index.html`,doc=>{
    const node=providerSchemas(doc)[0];assert.equal(node['@type'],'Person');assert.equal(node.address,undefined);assert.equal(node.serviceType,undefined);
    assert.deepEqual(node.sameAs,[fairAnne]);assert.deepEqual(node.worksFor,{'@type':'Organization',name:'Fine Art Appraisal, L.L.C.',url:'https://www.fineartappraisalllc.com/'});
    assert.equal(node.worksFor.address,undefined);assert.equal(doc.querySelector('meta[name="appraisily:fair-profile"]').content,fairAnne);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent,/owner and president/);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent,/inspection arrangements/);
  });
});
test('provider and location hubs publish exact reviewed labels and filter facets',()=>{
  document('public_site/appraiser/index.html',doc=>{
    for(const [slug,facet,text] of [[slugs[0],'Plainville, CT','Provider contact: Plainville, CT'],[slugs[1],'Location not listed','Location not listed for this individual']]){
      const row=doc.querySelector(`a[href="/appraiser/${slug}/"]`).closest('[data-browse-item]');assert.equal(row.dataset.browseFacet,facet);assert.ok(row.textContent.includes(text));
    }
    const facets=new Set([...doc.querySelectorAll('[data-browse-item]')].map(row=>row.dataset.browseFacet).filter(Boolean));
    const options=new Set([...doc.querySelectorAll('select[data-browse-facet] option')].map(row=>row.value).filter(Boolean));assert.deepEqual(options,facets);
  });
  document('public_site/location/index.html',doc=>{
    const collection=[...doc.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)).find(n=>n['@type']==='CollectionPage');
    for(const [slug,name] of [[slugs[0],'Winter Associates — Plainville contact, CT'],[slugs[1],'Anne Kelly Lewis — location not listed']]){
      assert.equal(doc.querySelector(`a[href="/appraiser/${slug}/"]`).textContent,name);
      assert.equal(collection.mainEntity.itemListElement.find(row=>row.url===`${origin}/appraiser/${slug}/`).name,name);
    }
  });
});
for(const file of ['public_site/appraisers.json','public_site/directory.json'])test(`${file}: both corrected facts propagate without provider promotion`,()=>{
  const rows=JSON.parse(read(file)).appraisers;assert.equal(rows.length,209);
  const winter=rows.find(row=>row.slug===slugs[0]),anne=rows.find(row=>row.slug===slugs[1]);
  assert.deepEqual(winter.address,{city:'Plainville',region:'CT',country:'US'});assert.equal(anne.address,undefined);
  for(const row of [winter,anne]){assert.equal(row.source.verifiedAt,'2026-08-30');assert.equal(row.website,record(row.slug).sourceUrl);assert.doesNotMatch(row.description,/Hartford|Fort Worth|Expert Art Valuation/);}
  assert.match(anne.description,/Fine Art Appraisal/);assert.equal(anne.serviceType,undefined);
});
test('negative fixtures retain strict protection against old, borrowed and unsupported facts',()=>{
  for(const slug of slugs)document(`public_site/appraiser/${slug}/index.html`,doc=>{
    const row=structuredClone(record(slug)),script=doc.querySelector('script[type="application/ld+json"]'),nodes=JSON.parse(script.textContent);
    nodes[0].address={'@type':'PostalAddress',addressLocality:slug===slugs[0]?'Hartford':'Fort Worth',addressRegion:slug===slugs[0]?'CT':'TX',addressCountry:'US'};script.textContent=JSON.stringify(nodes);
    assert.ok(inspectProviderFields(row,doc).failures.some(f=>f.code===(slug===slugs[0]?'primary-location-evidence-mismatch':'omitted-location-still-published')));
    delete row.fieldEvidence.primary_location;assert.ok(inspectProviderFields(row,doc).scopeFailures.some(f=>f.code==='published-location-missing-field-evidence'));
  });
});
