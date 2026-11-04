// Screenshots added to existing lab steps, laid over the labs after beginner.js
// (labs.js). Keyed by lab title, then step number and instruction number (both
// from 1, as the handbook shows them). Taken in a test Gitea built from this
// repository's templates and pipelines, walking the labs as student01.
'use strict';

const own = 'Your names, team, numbers and times are your own.';

module.exports = {
  'Lab 3: run hello by hand, and count the steps': {
    3: { 4: { src: 'hello-local.png', caption: 'hello in the browser, started by hand: the environment\'s name in big letters (grey for local), the greeting, and version dev.' } },
    4: { 4: { src: 'hello-local-staging.png', caption: 'The same program with three other settings: STAGING in yellow and "Hello from staging".' } },
  },
  'Lab 5: resolve a merge conflict': {
    1: { 3: { src: 'gitea-30-two-conflict-prs.png', caption: `The two pull requests, A and B, both green, both changing line 22. ${own}` } },
    5: { 3: { src: 'gitea-33-conflict-resolved.png', caption: `B after the merge commit: no conflict message any more, and the checks run again (yellow dot). Because the line kept is A's, Gitea notes that the branch adds nothing new. ${own}` } },
  },
  'Lab 3: create a new service from the template': {
    2: { 6: { src: 'gitea-41-new-repo-from-template.png', caption: 'The New Repository form, filled in: owner team01 (your team), name rates, template golden-path, and Git Content and Branch Protection ticked. Then Create Repository.' } },
    3: { 3: { src: 'gitea-42-run-golden-path.png', caption: 'The Run Workflow box of golden-path: use the workflow from main. Your list of runs is empty the first time.' } },
    8: { 2: { src: 'gitea-46-rates-ci-yaml.png', caption: 'rates/.gitea/workflows/ci.yaml: the same file, line for line, as in hello and in the template, from the template\'s first commit.' } },
  },
  'Lab 4: a first change to the new service': {
    3: { 4: { src: 'gitea-37-rates-ready-to-merge.png', caption: `Ready to merge: the reviewer approved ("Looks good"), and both checks are green. ${own}` } },
    5: { 1: { src: 'gitea-43-rates-readme.png', caption: 'The README rates got from the golden path: its addresses in dev, staging and prod, its pipeline, deployments, images, dashboard and portal entry, then how to run it.' } },
  },
  'Lab 5: add a pipeline from a template': {
    2: { 5: { src: 'gitea-44-smoke-test-file.png', caption: 'smoke-test.yaml in platform/pipeline-templates: the comment says how to use it, on: says when it runs. The Copy content button is the two small squares above the file, right of the download arrow.' } },
    4: { 4: { src: 'gitea-38-smoke-test-pr-ready.png', caption: `The smoke test's pull request, approved and green, ready to merge. ${own}` } },
  },
  'Lab 1: read the pipeline and its evidence': {
    1: {
      2: { src: 'gitea-34-actions-main-run.png', caption: `hello's Actions tab: each run with its commit, and on the right where it came from: main, or a pull request number. ${own}` },
      3: { src: 'gitea-35-main-run-steps.png', caption: 'A run on main: the job build and its steps, in the order of ci.yaml. Sign the image is skipped (grey) unless the platform turned signing on.' },
    },
    2: { 2: { src: 'gitea-36-tests-and-secret-scan.png', caption: 'The two steps opened: Unit tests says "6 passed"; Secret scan says how much it read and "no leaks found".' } },
  },
  'Lab 2: break the pipeline three ways, and fix it': {
    1: {
      3: [
        { src: 'gitea-31-wrong-test-red.png', caption: `The pull request goes red: both checks failed, and merging is blocked. ${own}` },
        { src: 'gitea-32-wrong-test-log.png', caption: 'Details → Unit tests (pytest): the test that failed, the line (assert status == 201) and why (assert 200 == 201), then "1 failed, 5 passed".' },
      ],
    },
  },
  'Lab 5: ask for an exception, and watch it expire': {
    4: { 4: { src: 'gitea-40-exception-pr-approved.png', caption: `The exception's pull request in platform/policies: approved by platform-approver, and the test pipeline (policy tests and exception checks) green. ${own}` } },
  },
  'Lab 1: promote hello to staging, then prod': {
    3: { 2: { src: 'gitea-39-release-files-changed.png', caption: `Files Changed of the release: in deploy/staging/kustomization.yaml, newTag becomes the commit id and count goes from 0 to 1. Nothing else. ${own}` } },
  },
};
