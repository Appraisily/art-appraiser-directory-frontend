#!/usr/bin/env node
import { runDirectorySiteUtil } from './run-directory-site-util.mjs';

runDirectorySiteUtil('check-indexing-contract.mjs', [
  '--origin',
  'https://art-appraisers-directory.appraisily.com',
]);
