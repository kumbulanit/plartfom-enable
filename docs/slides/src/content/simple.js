// Extra sections for the short step lists (labs/dayN/simple-instruction.md), by topic:
// Git, Infrastructure as Code, pipelines (CI/CD) and guardrails. Each section is
// shown before that day's labs, or after them with after: true. Steps have the
// same shape as a lab step: title, do (text, or { text, cmd }).
'use strict';

const GET_TEMPLATES = 'cd ~\ngit clone https://gitea.$DOMAIN/platform/pipeline-templates 2>/dev/null || git -C pipeline-templates pull\nls ~/pipeline-templates/workflows';

module.exports = {
  2: [
    {
      title: 'Git: change hello, see it, send it to Gitea',
      say: 'A first pass through the whole Git loop, together. Lab 2 then does it again, properly, with a pull request.',
      steps: [
        { title: 'Get the latest main', do: [{ text: 'Go into your copy of hello and update main.', cmd: 'cd ~/hello\ngit switch main\ngit pull' }] },
        { title: 'Make a branch', do: [{ text: 'A branch of your own, named after you.', cmd: 'git switch -c warm-up-$ME' }] },
        {
          title: 'Change something you can see',
          do: [
            { text: 'Change the greeting on line 22 of app/main.py to your own name. In the editor, or with this command:', cmd: 'sed -i "s/Hello from the PE Lab golden path/Hello from $ME/" app/main.py' },
            { text: 'Check the line changed.', cmd: 'grep -n "GREETING =" app/main.py' },
          ],
        },
        {
          title: 'See it working',
          do: [
            { text: 'Start hello. This terminal stays busy.', cmd: 'python3 -m app.main' },
            { text: 'In a second terminal (+ at the top right of the terminal panel), call it.', cmd: 'curl -s localhost:8081/' },
            { text: 'Print the browser address, then Ctrl+click it (Cmd+click on a Mac): the page shows your greeting.', cmd: 'echo "https://$ME.$DOMAIN/proxy/8081/"' },
            'Back in the first terminal, stop hello with Ctrl+C.',
          ],
        },
        { title: 'Look at what changed', do: [{ text: 'Git shows the changed file, then the old and new line.', cmd: 'git status\ngit diff' }] },
        { title: 'Commit it', do: [{ text: 'Stage the file and save it as a commit.', cmd: 'git add app/main.py\ngit commit -m "Say hello from $ME"\ngit log --oneline -3' }] },
        { title: 'Push the branch to Gitea', do: [{ text: 'Send your branch to Gitea (Username: your user name; Password: from cat /etc/pelab/logins.md).', cmd: 'git push -u origin warm-up-$ME' }] },
        {
          title: 'Find it in Gitea',
          do: [
            { text: 'Open your team\'s hello in Gitea: Ctrl+click the address this prints.', cmd: 'echo "https://gitea.$DOMAIN/$TEAM/hello/src/branch/warm-up-$ME"' },
            'Click app/main.py: line 22 has your greeting. Switch the branch menu to main: main still has the old one.',
          ],
        },
        { title: 'Back to main', do: [{ text: 'Leave the warm-up branch as it is: it is not merged. Lab 2 starts from main.', cmd: 'git switch main' }] },
      ],
    },
    {
      title: 'Pipelines: your first pipeline, from a template',
      say: 'A pipeline is a list of steps that a runner does for you on every change. The platform team keeps ready-made ones in platform/pipeline-templates: copy one into hello with the same Git loop, and watch it run on your pull request.',
      steps: [
        { title: 'Get the templates', do: [{ text: 'Copy the templates repository into your workspace and list the templates.', cmd: GET_TEMPLATES }] },
        { title: 'Read the first pipeline', do: [{ text: 'Three steps, each a "- name:": get the code, show what is there, run the tests. on: says when it runs.', cmd: 'cat ~/pipeline-templates/workflows/first-pipeline.yaml' }] },
        { title: 'Make a branch in hello', do: [{ text: 'Start from the latest main.', cmd: 'cd ~/hello\ngit switch main\ngit pull\ngit switch -c first-pipeline-$ME' }] },
        { title: 'Copy the template in', do: [{ text: 'Pipelines live in .gitea/workflows. hello already has one there: ci.yaml.', cmd: 'cp ~/pipeline-templates/workflows/first-pipeline.yaml .gitea/workflows/\nls .gitea/workflows\ngit status' }] },
        { title: 'Commit and push', do: [{ text: 'The same loop as the warm-up.', cmd: 'git add .gitea/workflows/first-pipeline.yaml\ngit commit -m "Add the first pipeline from the platform template"\ngit push -u origin first-pipeline-$ME' }] },
        {
          title: 'Open a pull request',
          do: [
            'In what git push printed, Ctrl+click (Cmd+click on a Mac) the address that ends in /pulls/new/first-pipeline-studentNN.',
            { text: 'Gitea opens the new pull request form: your branch into main. Click Create Pull Request.', shot: { src: 'gitea-02-new-pr-form.png', caption: 'The new pull request form (this one is from Lab 3, with a greeting change): which branch goes into which, the title, and the box to write why. Yours shows first-pipeline-studentNN and your commit.' } },
          ],
        },
        {
          title: 'Watch it run',
          do: [
            { text: 'At the bottom of the pull request, the checks start: golden-path / build (the pipeline hello came with) and first-pipeline / check (yours).', shot: { src: 'gitea-03-pr-created.png', caption: 'A pull request just created (this one from Lab 3): at the bottom, the checks starting, a yellow dot while they run. Yours lists first-pipeline / check as well.' } },
            { text: 'Click Details next to first-pipeline, then open each step: Get the code, Show what is here, Run the tests.', shot: { src: 'gitea-18-smoke-test-green.png', caption: 'A pipeline run, step by step (this one is the smoke test from Day 4). Click a step to open its output. Yours has three steps: Get the code, Show what is here, Run the tests.' } },
          ],
        },
        {
          title: 'Close it, and go back to main',
          do: [
            'Close the pull request without merging (Close at the bottom): the template stays out of main.',
            { text: 'In the terminal:', cmd: 'git switch main' },
          ],
        },
      ],
    },
  ],
  3: [
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
        { title: 'List its steps', do: [{ text: 'Each "- name:" is one step of the pipeline.', cmd: 'grep -n "name:" .gitea/workflows/plan.yaml' }] },
        { title: 'Run its first check yourself', do: [{ text: 'The Format check step. No output means every file is formatted.', cmd: 'tofu fmt -check -recursive -diff' }] },
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
            'When golden-path is green, the reviewer approves (private window, as on Day 2) and you merge.',
          ],
        },
        {
          title: 'Run it now',
          do: [
            'In your team\'s rates, click Actions, then nightly-scan, then Run Workflow.',
            'Open the run. Green: no fixable HIGH or CRITICAL weaknesses. Red: the Scan it step lists them.',
          ],
        },
      ],
    },
  ],
};
