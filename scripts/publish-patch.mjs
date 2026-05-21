#!/usr/bin/env node
import { runDirectorySiteUtil } from './run-directory-site-util.mjs';

runDirectorySiteUtil('publish-patch.mjs', [
  '--release-root',
  '/mnt/srv-storage/art-appraisers-directory/releases',
  '--container',
  'art-appraisers-directory',
]);
