// Extra sections for the short step lists (labs/dayN/simple-instruction.md), by topic:
// Git, Infrastructure as Code, pipelines (CI/CD) and guardrails. Each section is
// shown before that day's labs, or after them with after: true. Steps have the
// same shape as a lab step: title, do (text, or { text, cmd }).
'use strict';

const FIRST_PIPELINE = require('fs').readFileSync(require('path').resolve(__dirname, '../../../../labs/day4/pipeline-templates/workflows/first-pipeline.yaml'), 'utf8');
const GET_TEMPLATES = 'cd ~\ngit clone https://gitea.$DOMAIN/platform/pipeline-templates 2>/dev/null || git -C pipeline-templates pull\nls ~/pipeline-templates/workflows';

// Day 5, DevSecOps: the security checks run by pipelines, from two templates in
// platform/pipeline-templates. Their steps were tested on 10 November 2026 against a
// service made from the golden path (semgrep 1.176, trivy 0.74), clean, with the
// change below (both checks red), and fixed (both green).
const SECURITY_CHECKS = require('fs').readFileSync(require('path').resolve(__dirname, '../../../../labs/day4/pipeline-templates/workflows/security-checks.yaml'), 'utf8');
const SEC_ADD = 'cd ~/rates\ngit switch main && git pull\ngit switch -c security-checks-$ME\ncp ~/pipeline-templates/workflows/security-checks.yaml ~/pipeline-templates/workflows/dast.yaml .gitea/workflows/\ngit add .gitea/workflows\ngit commit -m "Add the security checks and DAST from the platform templates"\ngit push -u origin security-checks-$ME';
const SEC_DANGER = String.raw`cd ~/rates
cat >> app/main.py <<'EOF'


def calculate(text: str) -> object:
    """Work out a sum a user typed, such as 2 + 3."""
    return eval(text)
EOF
printf 'PyYAML==5.3.1\n' > requirements.txt
git add app/main.py requirements.txt
git commit -m "Add a calculator and a YAML library"
git push`;
const SEC_FIX = 'cd ~/rates\ngit checkout main -- app/main.py\nsed -i \'s/PyYAML==5.3.1/PyYAML==6.0.3/\' requirements.txt\ngit commit -am "Remove eval, and move PyYAML to 6.0.3, which fixes CVE-2020-14343"\ngit push';

module.exports = {
  2: [
    {
      title: 'Git: change hello, see it, send it to Gitea',
      say: 'A first pass through the whole Git loop, together. Lab 2 then does it again, properly, with a pull request.',
      steps: [
        { title: 'Get the latest main', do: [{ text: 'Go into your copy of hello and update main.', cmd: 'cd ~/hello\ngit switch main\ngit pull', out: "Already on 'main'\nYour branch is up to date with 'origin/main'.\nAlready up to date." }] },
        { title: 'Make a branch', do: [{ text: 'A branch of your own, named after you.', cmd: 'git switch -c warm-up-$ME', out: "Switched to a new branch 'warm-up-student01'" }] },
        {
          title: 'Change something you can see',
          do: [
            { text: 'Change the greeting on line 22 of app/main.py to your own name. In the editor, or with this command:', cmd: 'sed -i "s/Hello from the PE Lab golden path/Hello from $ME/" app/main.py', out: '' },
            { text: 'Check the line changed.', cmd: 'grep -n "GREETING =" app/main.py', out: '22:GREETING = os.environ.get("GREETING", "Hello from student01")' },
          ],
        },
        {
          title: 'See it working',
          do: [
            { text: 'Start hello. This terminal stays busy.', cmd: 'python3 -m app.main', out: '{"event": "started", "app": "hello", "env": "local", "version": "dev", "port": 8081}' },
            { text: 'In a second terminal (+ at the top right of the terminal panel), call it.', cmd: 'curl -s localhost:8081/', out: '{"app": "hello", "version": "dev", "environment": "local", "message": "Hello from student01"}' },
            { text: 'Print the browser address, then Ctrl+click it (Cmd+click on a Mac): the page shows your greeting.', cmd: 'echo "https://$ME.$DOMAIN/proxy/8081/"', out: 'https://student01.<lab domain>/proxy/8081/', shot: { src: 'hello-local-warm-up.png', caption: 'Your change, running: LOCAL in grey, and your greeting under it.' } },
            'Back in the first terminal, stop hello with Ctrl+C.',
          ],
        },
        { title: 'Look at what changed', do: [{ text: 'Git shows the changed file, then the old and new line.', cmd: 'git status\ngit diff', out: 'On branch warm-up-student01\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n        modified:   app/main.py\n\nno changes added to commit (use "git add" and/or "git commit -a")\ndiff --git a/app/main.py b/app/main.py\nindex f4ac1d0..6806120 100644\n--- a/app/main.py\n+++ b/app/main.py\n@@ -19,7 +19,7 @@ from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer\n APP_NAME = os.environ.get("APP_NAME", "hello")\n APP_VERSION = os.environ.get("APP_VERSION", "dev")\n APP_ENV = os.environ.get("APP_ENV", "local")\n-GREETING = os.environ.get("GREETING", "Hello from the PE Lab golden path")\n+GREETING = os.environ.get("GREETING", "Hello from student01")\n \n STARTED_AT = time.time()\n REQUESTS: Counter[tuple[str, int]] = Counter()' }] },
        { title: 'Commit it', do: [{ text: 'Stage the file and save it as a commit.', cmd: 'git add app/main.py\ngit commit -m "Say hello from $ME"\ngit log --oneline -1', out: '[warm-up-student01 227b9ef] Say hello from student01\n 1 file changed, 1 insertion(+), 1 deletion(-)\n227b9ef Say hello from student01' }] },
        { title: 'Push the branch to Gitea', do: [{ text: 'Send your branch to Gitea (Username: your user name; Password: from cat /etc/pelab/logins.md).', cmd: 'git push -u origin warm-up-$ME', out: "remote: \nremote: Create a new pull request for 'warm-up-student01':\nremote:   https://gitea.<lab domain>/team01/hello/pulls/new/warm-up-student01\nremote: \nTo https://gitea.<lab domain>/team01/hello\n * [new branch]      warm-up-student01 -> warm-up-student01\nbranch 'warm-up-student01' set up to track 'origin/warm-up-student01'." }] },
        {
          title: 'Find it in Gitea',
          do: [
            { text: 'Open your hello in Gitea: Ctrl+click the address this prints.', cmd: 'echo "https://gitea.$DOMAIN/$TEAM/hello/src/branch/warm-up-$ME"', out: 'https://gitea.<lab domain>/team01/hello/src/branch/warm-up-student01' },
            { text: 'Click app/main.py: line 22 has your greeting. Switch the branch menu to main: main still has the old one.', shot: { src: 'gitea-21-warm-up-branch.png', caption: 'Your branch in Gitea: the branch menu says warm-up-studentNN, the last commit is yours ("Say hello from studentNN"), and line 22 has your greeting. The green bar offers a pull request: not today, Lab 2 does that.' } },
          ],
        },
        { title: 'Back to main', do: [{ text: 'Leave the warm-up branch as it is: it is not merged. Lab 2 starts from main.', cmd: 'git switch main', out: "Switched to branch 'main'\nYour branch is up to date with 'origin/main'." }] },
      ],
    },
    {
      title: 'Pipelines: your first pipeline, from a template',
      say: 'A pipeline is a list of steps that a runner does for you on every change. The platform team keeps ready-made ones in platform/pipeline-templates: copy one into hello with the same Git loop, and watch it run on your pull request.',
      steps: [
        { title: 'Get the templates', do: [{ text: 'Copy the templates repository into your workspace and list the templates.', cmd: GET_TEMPLATES, out: 'dast.yaml\nfirst-pipeline.yaml\nnightly-scan.yaml\nsecurity-checks.yaml\nsmoke-test.yaml', shot: { src: 'gitea-20-pipeline-templates-list.png', caption: 'The same templates in Gitea: platform/pipeline-templates, folder workflows. One file each, owned by the platform team.' } }] },
        {
          title: 'Only if first-pipeline.yaml is not in the list: add it in Gitea',
          do: [
            'The instructor does this once for everyone: a student account cannot change the platform repositories.',
            'Sign in to Gitea as the Gitea admin, and open platform → pipeline-templates → workflows.',
            'Click Add File → New File, and name it first-pipeline.yaml.',
            'Paste in the file below. Leave "Commit directly to the main branch" ticked, and click Commit Changes.',
            'Back in the terminal, run Get the templates again: the list now has first-pipeline.yaml.',
          ],
          file: { path: 'workflows/first-pipeline.yaml', text: FIRST_PIPELINE, lang: 'yaml' },
        },
        { title: 'Read the first pipeline', do: [{ text: 'Three steps, each a "- name:": get the code, show what is there, run the tests. on: says when it runs.', cmd: 'cat ~/pipeline-templates/workflows/first-pipeline.yaml', out: FIRST_PIPELINE }] },
        { title: 'Make a branch in hello', do: [{ text: 'Start from the latest main.', cmd: 'cd ~/hello\ngit switch main\ngit pull\ngit switch -c first-pipeline-$ME', out: "Already on 'main'\nYour branch is up to date with 'origin/main'.\nAlready up to date.\nSwitched to a new branch 'first-pipeline-student01'" }] },
        { title: 'Copy the template in', do: [{ text: 'Pipelines live in .gitea/workflows. hello already has one there: ci.yaml.', cmd: 'cp ~/pipeline-templates/workflows/first-pipeline.yaml .gitea/workflows/\nls .gitea/workflows\ngit status', out: 'ci.yaml\nfirst-pipeline.yaml\nOn branch first-pipeline-student01\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n        .gitea/workflows/first-pipeline.yaml\n\nnothing added to commit but untracked files present (use "git add" to track)' }] },
        { title: 'Commit and push', do: [{ text: 'The same loop as the warm-up.', cmd: 'git add .gitea/workflows/first-pipeline.yaml\ngit commit -m "Add the first pipeline from the platform template"\ngit push -u origin first-pipeline-$ME', out: "[first-pipeline-student01 b271116] Add the first pipeline from the platform template\n 1 file changed, 31 insertions(+)\n create mode 100644 .gitea/workflows/first-pipeline.yaml\nremote: \nremote: Create a new pull request for 'first-pipeline-student01':\nremote:   https://gitea.<lab domain>/team01/hello/pulls/new/first-pipeline-student01\nremote: \nTo https://gitea.<lab domain>/team01/hello\n * [new branch]      first-pipeline-student01 -> first-pipeline-student01\nbranch 'first-pipeline-student01' set up to track 'origin/first-pipeline-student01'." }] },
        {
          title: 'Open a pull request',
          do: [
            'In what git push printed, Ctrl+click (Cmd+click on a Mac) the address that ends in /pulls/new/first-pipeline-studentNN.',
            { text: 'Gitea opens the new pull request form: your branch into main. Click Create Pull Request.', shot: { src: 'gitea-22-first-pipeline-pr-form.png', caption: 'The new pull request: merge into main, pull from first-pipeline-studentNN, and the title from your commit. Scroll down for Create Pull Request.' } },
          ],
        },
        {
          title: 'Watch it run',
          do: [
            { text: 'At the bottom of the pull request, the checks start: golden-path / build (the pipeline hello came with) and first-pipeline / check (yours).', shot: { src: 'gitea-23-first-pipeline-checks.png', caption: 'A few minutes later, all green: pipeline (the required verdict), golden-path / build, and first-pipeline / check, your new one. Merging would still need a reviewer\'s approval.' } },
            { text: 'Click Details next to first-pipeline, then open each step: Get the code, Show what is here, Run the tests.', shot: { src: 'gitea-24-first-pipeline-run.png', caption: 'The run of first-pipeline: the steps of the template, each green. Get the code says which commit it checked; Run the tests ends in "6 passed".' } },
          ],
        },
        {
          title: 'Only if golden-path / build fails at docker build: fix the runner',
          do: [
            'Click Details next to golden-path / build, and open Build the image. The fix below is for this error only: "failed to mount ... overlay ... invalid argument", at WORKDIR /srv.',
            'The instructor does this once for everyone, on the lab host (not in the workspace): it switches the runner\'s Docker to a store that works there.',
            { text: 'Get the latest setup:', cmd: 'git pull', where: 'Lab host terminal (sarb checkout)' },
            { text: 'Run the runner part of the setup again. Its task "Check Docker can build images in each runner" says changed when it switches a runner.', cmd: 'cd prelab-setup && ansible-playbook site.yml --tags runners', where: 'Lab host terminal (sarb checkout)' },
            'Back on the pull request, open the failed run and click Re-run all jobs: golden-path / build gets past WORKDIR /srv.',
          ],
        },
        {
          title: 'Close it, and go back to main',
          do: [
            { text: 'Close the pull request without merging: Close Pull Request, under the comment box at the bottom. The template stays out of main.', shot: [{ src: 'gitea-25-close-pr-button.png', caption: 'Close Pull Request sits under the comment box, at the bottom of the Conversation tab.' }, { src: 'gitea-26-pr-closed.png', caption: 'Closed: the red label at the top, and "closed this pull request" in the history. Nothing reached main.' }] },
            { text: 'In the terminal:', cmd: 'git switch main', out: "Switched to branch 'main'\nYour branch is up to date with 'origin/main'." },
          ],
        },
      ],
    },
  ],
  3: [
    {
      title: 'Before the class: bring the lab up to date (instructor)',
      say: 'Once, before Day 3, on the lab host (not in a workspace). It gets the latest setup and runs its platform part again: the newest pipelines in the platform repositories, and a Gitea token with every scope Argo CD needs. Participants skip this section.',
      steps: [
        {
          title: 'Update the lab',
          do: [
            { text: 'Get the latest setup, in your checkout of the course repository:', cmd: 'git pull', where: 'Lab host terminal (sarb checkout)' },
            { text: 'Run the platform part of the setup again. It takes a few minutes and ends with failed=0.', cmd: 'cd prelab-setup && ansible-playbook site.yml --tags golden_path', where: 'Lab host terminal (sarb checkout)' },
          ],
        },
      ],
    },
    {
      title: 'Infrastructure as Code: the idea in four lines',
      say: [
        'You write what you want in files (OpenTofu), not by clicking or typing commands on a server.',
        'Git keeps the files: every change is a branch, a commit and a pull request, as on Day 2.',
        'A pipeline checks every pull request: format, then tofu plan, which shows what would change. Lab 2, step 3.',
        'The platform team approves, you merge, and the platform applies main.',
      ],
    },
    {
      after: true,
      title: 'Pipelines: the one that checked your request',
      say: 'Your request in Lab 2 was checked by a pipeline the environments repository came with. Read it, and run its first check yourself.',
      steps: [
        { title: 'Get the latest environments', do: [{ text: 'Your copy from Lab 2.', cmd: 'cd ~/environments\ngit switch main\ngit pull' }] },
        { title: 'List its steps', do: [{ text: 'Each "- name:" is one step of the pipeline.', cmd: 'grep -n "name:" .gitea/workflows/plan.yaml', out: '7:name: plan\n20:      - name: Check out\n28:      - name: Format check\n31:      - name: Plan\n46:      - name: Post the verdict (the required check for merging)' }] },
        { title: 'Run its first check yourself', do: [{ text: 'The Format check step. No output means every file is formatted.', cmd: 'tofu fmt -check -recursive -diff', out: '' }] },
        {
          title: 'Find its runs in Gitea',
          do: [
            'Open https://gitea.<lab domain>/platform/environments, then the Actions tab, then plan.',
            'Open your run from Lab 2 and read the last lines of the Plan step.',
          ],
        },
      ],
    },
  ],
  4: [
    {
      title: 'Pipelines: two ways to get one from a template',
      say: [
        'Create a service from the golden-path template: it comes with its whole pipeline, .gitea/workflows/ci.yaml. Lab 3.',
        'Copy a small pipeline from platform/pipeline-templates into a service you have. Lab 5 (the smoke test).',
      ],
    },
  ],
  5: [
    {
      title: 'Start of the day: bring your lab up to date',
      say: 'Do this first, once, on your VM: the machine you built the lab on, not the workspace. It takes about five minutes.',
      steps: [
        {
          title: 'Get the newest course files',
          where: 'Your VM\'s terminal (not the workspace)',
          do: [{ text: 'Paste the box. It gets the newest version of the course project.', cmd: 'cd ~/plartfom-enable\ngit pull', where: 'Your VM\'s terminal' }],
        },
        {
          title: 'Run the setup again for today\'s pipelines',
          where: 'Your VM\'s terminal (not the workspace)',
          do: [
            { text: 'Paste the box. It runs two parts of the setup again: the runners, so every pipeline can build its image, and the platform, with the two new pipeline templates for the end of today. Wait for the last line: it says failed=0.', cmd: 'cd ~/plartfom-enable/prelab-setup\nansible-playbook site.yml --tags runners,golden_path', where: 'Your VM\'s terminal' },
            'It stops with "sudo: a password is required"? Paste the box again with -K at the end, and type your VM password when it asks.',
          ],
        },
        {
          title: 'Check the new templates',
          where: 'Browser: Gitea',
          do: ['Open https://gitea.<lab domain>/platform/pipeline-templates and click workflows.'],
          see: 'Five templates, among them security-checks.yaml and dast.yaml.',
        },
      ],
    },
    {
      title: 'CI/CD and guardrails: where the pipelines are today',
      say: [
        'hello and rates: ci.yaml runs on every pull request and on main: lint, tests, secret scan, build, scan, push. Labs 1 and 2.',
        'platform/policies: its own pipeline (test.yaml) tests the guardrails and every exception request. Labs 4 and 5.',
        'The guardrails themselves run in the cluster (Kyverno): they refuse a bad deployment even when every pipeline was green. Lab 3.',
      ],
    },
    {
      after: true,
      title: 'Pipelines: add the nightly scan to rates, from a template',
      say: 'The same copy-a-template loop as the smoke test on Day 4, this time with Git in the terminal. The nightly scan scans the image of main again every night: new weaknesses are found every day.',
      steps: [
        { title: 'Get the templates', do: [{ text: 'Copy them, or update your copy from Day 2.', cmd: GET_TEMPLATES }] },
        { title: 'Make a branch in rates', do: [{ text: 'Your copy of rates from Day 4.', cmd: 'cd ~/rates\ngit switch main\ngit pull\ngit switch -c nightly-scan-$ME' }] },
        { title: 'Copy the template in, commit, push', do: [{ text: 'One file, unchanged.', cmd: 'cp ~/pipeline-templates/workflows/nightly-scan.yaml .gitea/workflows/\ngit add .gitea/workflows/nightly-scan.yaml\ngit commit -m "Add the nightly scan from the platform template"\ngit push -u origin nightly-scan-$ME' }] },
        {
          title: 'Pull request, review, merge',
          do: [
            'Ctrl+click the /pulls/new/ address git push printed, then Create Pull Request.',
            { text: 'When golden-path is green, the reviewer approves (private window, as on Day 2) and you merge.', shot: { src: 'gitea-45-nightly-scan-merged.png', caption: 'Merged: the reviewer approved, and the nightly scan is now on main. Your names and numbers are your own.' } },
          ],
        },
        {
          title: 'Run it now',
          do: [
            { text: 'In your rates (teamNN/rates), click Actions, then nightly-scan, then Run Workflow, and Run Workflow again in the box.', shot: { src: 'gitea-27-run-nightly-scan.png', caption: 'nightly-scan in the list on the left, and the Run Workflow box: use the workflow from main.' } },
            { text: 'Open the run, then the Scan it (trivy) step. Green: no fixable HIGH or CRITICAL weaknesses. Red: the step lists them.', shot: { src: 'gitea-28-nightly-scan-result.png', caption: 'A green nightly scan: trivy\'s report summary, 0 vulnerabilities in the operating system (debian) and in the Python packages. In the lab the image name starts with harbor.<lab domain>.' } },
          ],
        },
      ],
    },
    {
      after: true,
      title: 'DevSecOps: security checks in the pipeline (SAST, CVEs, DAST)',
      say: [
        'Extra, if you have time (about 30 minutes): the same copy-a-template loop as the nightly scan above, with two more templates.',
        'DevSecOps: the security checks run in the pipeline, on every change, not by hand at the end. A dangerous change is stopped at its pull request, before anyone merges it.',
        'SAST (static testing) reads the code without running it and points at dangerous lines (semgrep, with the security team\'s rules). The CVE scan checks the libraries against the public list of known weaknesses (trivy). DAST (dynamic testing) attacks the running service from the outside, as a stranger would.',
        'Two templates in platform/pipeline-templates: security-checks.yaml (SAST and the CVE scan, on every pull request) and dast.yaml (DAST against dev, staging or prod, when you click Run Workflow).',
      ],
      steps: [
        {
          title: 'Get the templates',
          where: 'Workspace terminal',
          do: [
            { text: 'Paste the box. The list has two new templates: dast.yaml and security-checks.yaml. (Not there? Do the first section of today, Start of the day, then this box again.)', cmd: GET_TEMPLATES },
            { text: 'Paste the box. The top of security-checks.yaml says what it checks and when.', cmd: 'head -14 ~/pipeline-templates/workflows/security-checks.yaml', out: SECURITY_CHECKS.split('\n').slice(0, 14).join('\n') },
          ],
        },
        {
          title: 'Add both to rates, on a new branch',
          where: 'Workspace terminal',
          do: [{ text: 'Paste the box. The two files, unchanged, go into a new branch of your rates (from Day 4), which is pushed to Gitea.', cmd: SEC_ADD }],
        },
        {
          title: 'Open the pull request: two pipelines, both green',
          where: 'Browser: Gitea',
          do: [
            'Ctrl+click the /pulls/new/ address git push printed, then Create Pull Request. Do not merge it yet.',
            'Wait a few minutes. Two pipelines run on the pull request: golden-path and security-checks. Both go green: rates has no dangerous line and no library with a known CVE.',
          ],
        },
        {
          title: 'Sneak in a dangerous change',
          where: 'Workspace terminal',
          do: [{ text: 'Paste the box. On the same branch: a calculator that uses eval (anyone could run code with it), and a list of libraries with PyYAML 5.3.1, which has a CRITICAL CVE. Both look harmless: lint and tests still pass.', cmd: SEC_DANGER }],
        },
        {
          title: 'Watch the pipeline stop it',
          where: 'Browser: Gitea',
          do: [
            'Reload the pull request. After a few minutes: golden-path is green (lint, tests and build all pass), security-checks is red.',
            'Click Details next to security-checks, then open its steps.',
            'SAST (semgrep): eval-runs-any-code, on the line return eval(text) in app/main.py.',
            'CVE scan of the libraries (trivy): CVE-2020-14343, CRITICAL, in PyYAML 5.3.1, fixed in 5.4.',
            'Nobody had to remember to check: the pipeline did, at the pull request, before the merge. The reviewer does not approve a red pull request.',
          ],
          see: 'security-checks red, with both findings: the eval line and the CVE.',
        },
        {
          title: 'Fix it, and go green',
          where: 'Workspace terminal, then Gitea',
          do: [
            { text: 'Paste the box. It puts app/main.py back as it is on main, and moves PyYAML to 6.0.3, a version without the CVE.', cmd: SEC_FIX },
            'Reload the pull request after a few minutes: security-checks is green again. The reviewer approves (private window, as on Day 2) and you merge.',
          ],
        },
        {
          title: 'Attack dev with DAST',
          where: 'Browser: Gitea',
          do: [
            'In your rates, click Actions, then dast on the left, then Run Workflow. Leave dev and click Run Workflow.',
            'Reload after a few seconds, open the run and click each step.',
            'What it tells every visitor: the Server line (FOUND) and four MISSING headers. It reports them and stays green: the platform can add those headers once, at the ingress (Traefik), for every service.',
            'Path traversal, Cross-site scripting and Unexpected methods: ok on every line. None of the attacks worked.',
          ],
          see: 'dast green: three attacks, each one ok, and a report of what the service tells every visitor.',
        },
      ],
    },
  ],
  6: [
    {
      after: true,
      title: 'The week on one page: how the pieces come together',
      figure: { src: 'platform-week.svg', caption: 'Everything you did this week, as three flows through the platform. The yellow tags say which day. Grey: you do it; blue: the platform does it by itself.' },
      say: [
        'A: a change to a service (Days 2, 4, 5, 6). Today you finished it: released to staging and prod, and watched it in Grafana.',
        'B: an environment (Day 3). C: an exception to a rule (Day 5). The same five moves each time: template, change, pull request, pipeline, the platform applies main.',
        'The capstone took your service through flow A, end to end, and the evidence pack is what each box left on record.',
      ],
    },
    {
      after: true,
      title: 'Platform engineering: where it was, is, and can go',
      figure: { src: 'platform-why.svg', caption: 'Where it was (every team does everything), where it is now (one paved road, built once by a platform team), what that gives the bank, and where the same road can go next. Dashed: not built yet.' },
      say: [
        'Where it was: every team set up every tool itself, and waited on tickets for servers, access and firewalls. Day 1, Lab 1.',
        'Where it is now: one way in for every team (the portal, templates and a pull request), with tests, scans and guardrails that run by themselves.',
        'What it gives the bank: faster, safer, consistent, less to learn, and evidence on every change.',
        'Where it can go next: single sign-on, signed images, canary releases, APIs and events, and cost per team. Each is one more piece of the same road.',
      ],
    },
  ],
};
