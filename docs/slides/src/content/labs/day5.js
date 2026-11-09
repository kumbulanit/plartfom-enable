// Day 5 labs, step by step, for the handbook (see labs/day1.js for the format).
// Pipeline, scanner and policy outputs were checked with the lab's tool
// versions (pytest, gitleaks, hadolint, Kyverno CLI 1.19, the exception check).
'use strict';

const { TERMINAL, OPEN_LINK, PRIVATE_WINDOW, privateWindowAs } = require('./common');

module.exports = {
  'Lab 1: read the pipeline and its evidence': {
    goal: 'Read what the pipeline did to your last change, and find the evidence it left: test results, a secret scan, an image, a vulnerability report and an SBOM.',
    learn: [
      'What the pipeline checks on every change, step by step.',
      'Where the evidence of each check is kept, so you can show it to a reviewer or an auditor.',
    ],
    words: [
      ['Pipeline run', 'One execution of the pipeline for one commit, with the log of every step.'],
      ['Secret scan', 'A check (gitleaks) that no password or key was written into the code.'],
      ['Vulnerability scan', 'A check (trivy in the pipeline, and Harbor again) of the image against lists of known weaknesses (CVEs).'],
      ['SBOM', 'Software Bill of Materials: the list of every package inside an image, with its version. The ingredients list.'],
    ],
    start: [
      'Sign in to Gitea (https://gitea.<lab domain>) and to Harbor (https://harbor.<lab domain>) as yourself: studentNN and your password, the same for both.',
      'Have a notes page ready: you copy three things at the end.',
    ],
    steps: [
      {
        title: 'Open the latest run on main',
        where: 'Browser: Gitea',
        why: 'The runs on main are the ones that build what gets deployed: their logs are the evidence for what is running.',
        do: [
          'Open teamNN/hello and click the Actions tab.',
          'In the list of runs, find the newest one whose label (on the right) is main, and click its title.',
          'On the left you see the job build; on the right, its steps. Each line is one check.',
        ],
        see: 'A list of steps, each with a green tick and how long it took: Check out, Lint (ruff), Unit tests (pytest), Secret scan (gitleaks), Dockerfile lint (hadolint), Validate the manifests (kustomize), Build the image, Vulnerability scan (trivy), Push to Harbor, Clean up, and Post the verdict.',
        read: [
          'Sign the image (cosign) is grey, skipped: image signing is an option the platform team has not switched on.',
          'Set up job and Complete job, at the top and bottom, are Gitea\'s own steps.',
        ],
      },
      {
        title: 'Read the tests and the secret scan',
        where: 'Browser: Gitea',
        why: 'These two steps answer "does it work?" and "did anyone leak a password?" for every single change.',
        do: [
          'Click the step Unit tests (pytest): its log unfolds under it.',
          'Then click Secret scan (gitleaks).',
        ],
        see: 'In the tests, "6 passed"; in the secret scan, "no leaks found":',
        out: '......                                                                   [100%]\n6 passed in 0.57s\n...\nINF scanned ~20739 bytes (20.74 KB) in 138ms\nINF no leaks found',
      },
      {
        title: 'Find the image tag',
        where: 'Browser: Gitea',
        why: 'The image is tagged with the commit id: from any running image you can find the exact code, the pull request and the review behind it.',
        do: [
          'Click the step Push to Harbor and read its last lines.',
        ],
        see: 'The address of the image, ending with a 40-character commit id:',
        out: 'Pushed harbor.<lab domain>/team03/hello:b70e47f7a1c2.... Argo CD deploys it to dev within a minute or two.',
        read: [
          'The same commit id appears at the top of the run, next to the commit\'s message. Write it down for step 4.',
        ],
      },
      {
        title: 'Open the image in Harbor',
        where: 'Browser: Harbor',
        why: 'Harbor keeps every image the pipeline pushed, scans it again on arrival, and records its ingredients list.',
        do: [
          'Open https://harbor.<lab domain> in a new tab. On the sign-in page, type your studentNN in Username and your own password in Password (the same as Gitea), and click LOG IN.',
          'On the Projects page, click your team name, teamNN, in the Project Name column.',
          'On the Repositories tab, click teamNN/hello.',
          'In the artifacts list, find the line whose Tags column shows the commit id from step 3. The newest is usually at the top (look at Push Time). If the tag is cut short, move the mouse over it to see it whole.',
          'On that line, move the mouse over the coloured bar in the Vulnerabilities column: a box shows the counts by severity.',
        ],
        see: 'The image with its tag, its size, a vulnerability summary (a count by severity: critical, high, medium, low) and its SBOM.',
        read: [
          'A vulnerability is a known weakness in one of the packages inside, usually in the base image (Python and Debian), not in your code.',
          'The pipeline\'s trivy step reports them but does not stop the build: deciding what is acceptable is a policy decision (Day 5 afternoon).',
        ],
      },
      {
        title: 'Read the ingredients list (SBOM)',
        where: 'Browser: Harbor',
        why: 'When a new weakness is announced, the SBOM answers in seconds: "are we affected, and where?"',
        do: [
          'On the same line of the artifacts list, find the SBOM column and click its link: the ingredients list opens. (If your Harbor shows no SBOM column, click the digest, sha256:..., to open the image, and open its SBOM tab.)',
          'The SBOM is a table, one line per package: its name and its version.',
          'Search the page for python (Ctrl+F, on a Mac Cmd+F).',
          'To see the weaknesses themselves, go back, click the digest (sha256:...) and open the Vulnerabilities tab: one line per weakness, with its ID (CVE-...), its severity, the package it is in, and the version that fixes it (if there is one).',
        ],
        see: 'The exact Python version and every package inside your image, each with its version. Most of the image is not your code.',
      },
      {
        title: 'Write down the evidence',
        where: 'Your notes',
        why: 'An evidence pack shows, for one change, every check it passed. You assemble it for the Day 6 capstone.',
        do: [
          'Copy three things into your notes: the link to the pipeline run (from the browser\'s address bar), the image tag (the commit id), and the vulnerability counts.',
        ],
        see: 'Three lines for the Day 6 evidence pack.',
      },
    ],
    done: 'You can show, for one change, its tests, secret scan, image, scan report and SBOM.',
  },

  'Lab 2: break the pipeline three ways, and fix it': {
    goal: 'Make three common mistakes on purpose (a wrong test, a password in the code, running as root) and watch the pipeline catch each one before it reaches main.',
    learn: [
      'How to read a red pipeline: which step failed, and what its log says.',
      'Three things the pipeline catches before anything is merged: broken code, leaked secrets, unsafe containers.',
      'That fixing means a new commit: push again, and the pipeline runs again.',
    ],
    words: [
      ['Red / green', 'A failed / passed pipeline run.'],
      ['Assert', 'The line in a test that states what must be true, for example assert status == 200.'],
      ['Root', 'The administrator account. A container should never run as root.'],
    ],
    start: [
      ...TERMINAL,
      'Your copy of hello in ~/hello.',
      'After step 1 you open a pull request; keep its page open in the browser. Every push in this lab shows a new pipeline result there, at the bottom of the Conversation tab.',
    ],
    steps: [
      {
        title: 'A wrong test',
        where: 'Workspace terminal, then Gitea',
        why: 'A test that expects the wrong answer is like a bug in the code: the pipeline must stop it.',
        do: [
          'Paste the box. It makes a branch, changes one expected value in the tests from 200 to 201, shows the change, commits and pushes.',
          'Open the pulls/new link that git push prints and click Create Pull Request. ' + OPEN_LINK,
          'Wait for the check to turn red (a red cross), click Details, and open the step Unit tests (pytest).',
        ],
        run: 'cd ~/hello\ngit switch main && git pull\ngit switch -c break-things-$ME\nsed -i \'0,/assert status == 200/s//assert status == 201/\' tests/test_main.py\ngit diff\ngit commit -am "A wrong test"\ngit push -u origin break-things-$ME',
        explain: [
          ['git switch -c break-things-$ME', 'a branch of your own for this lab.'],
          ['sed -i \'0,/assert status == 200/s//assert status == 201/\' tests/test_main.py', 'in the tests, change the first "assert status == 200" into "assert status == 201": the test now expects the wrong answer. (0,/.../ means "only the first time".)'],
          ['git diff', 'show the change: one line red, one green.'],
        ],
        see: 'The pipeline is red at Unit tests (pytest). The log names the test and shows the actual and the expected value:',
        out: 'FAILED tests/test_main.py::test_root_describes_the_service - assert 200 == 201\n1 failed, 5 passed in 0.58s',
        read: [
          'assert 200 == 201: the service answered 200 (OK), the test expected 201. Here the test is wrong; often it is the code.',
          'The steps after the failure did not run: nothing was built from broken code.',
          'The pull request says "Some required checks failed": it cannot be merged.',
        ],
      },
      {
        title: 'Fix the test',
        where: 'Workspace terminal',
        why: 'A fix is a new commit on the same branch. Pushing it runs the pipeline again on the pull request.',
        run: 'sed -i \'s/assert status == 201/assert status == 200/\' tests/test_main.py\ngit commit -am "Fix the test"\ngit push',
        explain: [
          ['sed -i \'s/assert status == 201/assert status == 200/\' tests/test_main.py', 'put the expected value back to 200.'],
          ['git commit -am "Fix the test", git push', 'commit and push: the pull request updates itself and a new run starts.'],
        ],
        see: 'The new run on the pull request turns green.',
      },
      {
        title: 'A password in the code',
        where: 'Workspace terminal',
        why: 'People write passwords into code "just to get it working". Once pushed, a password is in the history for ever; the secret scan stops it before it reaches main.',
        run: 'echo \'DB_PASSWORD = "hunter2-very-secret-123"\' >> app/main.py\ngit commit -am "Add a database password"\ngit push',
        explain: [
          ['echo \'DB_PASSWORD = "..."\' >> app/main.py', 'add a line with a made-up password at the end of the code (>> adds to the end of the file).'],
        ],
        see: 'Red at Secret scan (gitleaks), with the rule, the file and the line. The value itself is shown as REDACTED:',
        out: 'Finding:     DB_PASSWORD = "REDACTED"\nRuleID:      generic-api-key\nFile:        app/main.py\nLine:        110\n...\nWRN leaks found: 1',
        read: [
          'Lint and the tests were still green: the code works. Only the secret scan knows a password must not be there.',
          'The scan hides the value (REDACTED), so the log itself does not leak it.',
        ],
      },
      {
        title: 'Remove the password',
        where: 'Workspace terminal',
        why: 'Take the password out, and push again.',
        run: 'sed -i \'/DB_PASSWORD/d\' app/main.py\ngit commit -am "Remove the password"\ngit push',
        explain: [
          ['sed -i \'/DB_PASSWORD/d\' app/main.py', 'delete (d) every line of the file that contains DB_PASSWORD.'],
        ],
        see: 'Green again: "no leaks found".',
        tip: 'The password is still in this branch\'s history: the pipeline only scans the newest commit, but anyone can read the old one. A real password would now have to be changed, because Git never forgets. That is why the scan runs before anything is merged.',
      },
      {
        title: 'Run as root',
        where: 'Workspace terminal',
        why: 'A container running as root gives an attacker the keys if it is broken into. The Dockerfile check refuses it.',
        run: 'sed -i \'s/^USER 10001/USER root/\' Dockerfile\ngit commit -am "Run as root"\ngit push',
        explain: [
          ['sed -i \'s/^USER 10001/USER root/\' Dockerfile', 'change the Dockerfile line USER 10001 (an ordinary user) into USER root (the administrator).'],
        ],
        see: 'Red at Dockerfile lint (hadolint):',
        out: 'Dockerfile:16 DL3002 warning: Last USER should not be root\nDockerfile:16 DL3066 info: Non-numeric user-id may not be resolvable by host system',
        read: [
          'DL3002 is the rule\'s number: search for it to learn more. The pipeline treats every hadolint finding as a failure.',
        ],
      },
      {
        title: 'Put it right, add a test, and merge',
        where: 'Workspace terminal, then Gitea',
        why: 'Finish with a clean change that also adds a test, so the pipeline now checks one more thing on every future change.',
        do: [
          'Paste the box. It puts USER 10001 back, adds a new test for the health check, runs the tests (7 now), commits and pushes.',
          'In the pull request, wait for green. Approve it as reviewer in a private window, then merge as yourself with Create squash commit.',
        ],
        run: 'sed -i \'s/^USER root/USER 10001/\' Dockerfile\ncat >> tests/test_main.py <<\'EOF\'\n\n\ndef test_health_check_says_ok():\n    status, _, body = main.route("/healthz")\n    assert status == 200\n    assert body == "ok\\n"\nEOF\npytest -q\ngit commit -am "Run as an ordinary user again, and test the health check"\ngit push',
        explain: [
          ['sed -i \'s/^USER root/USER 10001/\' Dockerfile', 'put the ordinary user back.'],
          ['cat >> tests/test_main.py <<\'EOF\' ... EOF', 'add a new test at the end of the tests file: it calls /healthz and checks the answer is 200 with the body ok. (The two empty lines before def are the Python style the lint step expects.)'],
          ['pytest -q', 'run the tests yourself before you push.'],
        ],
        see: '7 passed, then a green pipeline; after the merge, the run on main pushes a new image to Harbor:',
        out: '.......                                                                  [100%]\n7 passed in 0.56s',
        ifnot: [
          ['Lint (ruff) is red after this push', 'the new test was pasted with different spacing. Run ruff format . then git commit -am "Format" and git push.'],
        ],
        tip: 'Approving as reviewer: ' + PRIVATE_WINDOW,
      },
    ],
    done: 'You saw three red runs with clear messages, fixed each one, and merged a green change with one more test.',
  },

  'Lab 3: watch the guardrails refuse a bad deployment': {
    goal: 'Try to put a careless deployment straight into your dev environment, read the three refusals, and fix them one by one.',
    learn: [
      'What a guardrail (policy) is: a rule the cluster checks for every deployment, for every team.',
      'How to read a refusal and fix exactly what it names.',
    ],
    words: [
      ['Guardrail (policy)', 'A rule, written as code, that the platform checks automatically. Here enforced by Kyverno.'],
      ['Kyverno', 'The tool in the cluster that checks every new or changed resource against the policies, and refuses what breaks them.'],
      ['Deployment', 'The Kubernetes description of a service to run: which image, how many copies.'],
      ['kubectl apply', 'Ask the cluster to create or update what a file describes.'],
    ],
    start: [
      ...TERMINAL,
      'kubectl already points at your dev namespace (try kubectl get pods).',
    ],
    steps: [
      {
        title: 'Get the guardrails repository and a copy of the bad example',
        where: 'Workspace terminal',
        why: 'platform/policies holds the guardrails and their examples. You work on a copy of the bad example, with your team name in it, so the repository stays as it is.',
        run: 'cd ~\ngit clone https://gitea.$DOMAIN/platform/policies\ncd policies\nsed "s/team01/$TEAM/g" examples/bad.yaml > ~/shortcut.yaml\ncat ~/shortcut.yaml',
        explain: [
          ['git clone https://gitea.$DOMAIN/platform/policies', 'copy the guardrails repository into ~/policies.'],
          ['sed "s/team01/$TEAM/g" examples/bad.yaml > ~/shortcut.yaml', 'copy the bad example to ~/shortcut.yaml in your home folder, with your team name instead of team01.'],
          ['cat ~/shortcut.yaml', 'show it.'],
        ],
        see: 'A Deployment called shortcut in your dev namespace, with image nginx:latest and no name or owner labels.',
        read: [
          'Three things are wrong with it, as its comment says: the image is not from the lab\'s Harbor, it uses the tag latest (which can change under you), and nobody can tell who owns it (no labels).',
        ],
      },
      {
        title: 'Try to deploy it',
        where: 'Workspace terminal',
        why: 'Try the shortcut: deploy straight to the cluster, skipping the golden path.',
        run: 'kubectl apply -f ~/shortcut.yaml',
        explain: [
          ['kubectl apply -f ~/shortcut.yaml', 'ask the cluster to create what the file (-f) describes.'],
        ],
        see: 'Refused by three rules, each saying how to fix it:',
        out: 'Error from server: ... denied the request:\n\nresource Deployment/teamNN-dev/shortcut was blocked due to the following policies\n\npelab-immutable-tags:\n  autogen-no-latest: \'validation error: The "latest" tag is not allowed; use the commit SHA the pipeline tagged the image with. ...\'\npelab-ownership-labels:\n  required-labels: \'validation error: Add the labels app.kubernetes.io/name and app.kubernetes.io/part-of (your team). ...\'\npelab-trusted-registry:\n  autogen-harbor-only: \'validation error: Images must come from harbor.<lab domain>. Build and push them with the golden-path pipeline. ...\'',
        read: [
          'Each block is one policy (pelab-...) and its rule, with a message written for you: what is wrong and what to do.',
          'Lines starting with "Warning: would violate PodSecurity" may come first: those are Kubernetes\' own advice for a stricter level (warnings only, here). This lab is about the three refusals.',
        ],
      },
      {
        title: 'Fix the image',
        where: 'Workspace terminal',
        why: 'An image from the lab\'s Harbor, with a fixed tag, answers two of the three rules at once.',
        run: 'sed -i "s#image: nginx:latest#image: harbor.$DOMAIN/dockerhub/library/python:3.12-slim#" ~/shortcut.yaml\nkubectl apply -f ~/shortcut.yaml',
        explain: [
          ['sed -i "s#image: nginx:latest#image: harbor.$DOMAIN/...:3.12-slim#" ~/shortcut.yaml', 'replace the image line with an image from the lab\'s Harbor, with a fixed tag. (# separates the parts here, because the image address contains /.)'],
        ],
        see: 'One refusal left: pelab-ownership-labels, the labels.',
      },
      {
        title: 'Add the labels',
        where: 'Workspace editor',
        why: 'Labels say what a workload is and who owns it, so anyone can find the owner of anything running in the cluster.',
        do: [
          'In the Explorer on the left, click shortcut.yaml (it is in your home folder) to open it.',
          'Find the first metadata block at the top: the lines name: shortcut and namespace: teamNN-dev.',
          'Under the namespace line, add the three lines labels:, app.kubernetes.io/name: shortcut and app.kubernetes.io/part-of: teamNN (your team name), with exactly the spaces shown below: 2 spaces before labels, 4 before the two labels. Save with Ctrl+S (Mac Cmd+S).',
          'Apply again (the box).',
        ],
        change: {
          file: '~/shortcut.yaml',
          how: 'three new lines under namespace, with your team name. Spaces, not tabs.',
          before: 'metadata:\n  name: shortcut\n  namespace: teamNN-dev',
          after: 'metadata:\n  name: shortcut\n  namespace: teamNN-dev\n  labels:\n    app.kubernetes.io/name: shortcut\n    app.kubernetes.io/part-of: teamNN',
        },
        run: 'kubectl apply -f ~/shortcut.yaml',
        see: 'Accepted:',
        out: 'deployment.apps/shortcut created',
        read: [
          'All three rules are now satisfied. The pod itself may not start properly (it is a bare Python image with nothing to run): that does not matter here, the guardrails\' job was to decide what may be deployed.',
        ],
        ifnot: [
          ['error converting YAML to JSON', 'the spaces are not right. Compare your lines with the After box: 2 spaces before labels, 4 before each label, no tabs.'],
          ['Still refused by pelab-ownership-labels', 'check that part-of says your own team, and that you saved the file.'],
        ],
        tip: 'Rather not use the editor? This command adds the same three lines: sed -i "0,/^  namespace: $TEAM-dev\\$/s//  namespace: $TEAM-dev\\n  labels:\\n    app.kubernetes.io\\/name: shortcut\\n    app.kubernetes.io\\/part-of: $TEAM/" ~/shortcut.yaml',
      },
      {
        title: 'Clean up, and keep the evidence',
        where: 'Workspace terminal, then your notes',
        why: 'Remove the test deployment, and keep the refusals: they prove the guardrails work.',
        run: 'kubectl -n $TEAM-dev delete deployment shortcut\nrm ~/shortcut.yaml',
        explain: [
          ['kubectl -n $TEAM-dev delete deployment shortcut', 'remove the test deployment from your dev namespace.'],
          ['rm ~/shortcut.yaml', 'delete your copy of the file.'],
        ],
        see: 'deployment.apps "shortcut" deleted. Copy the three refusal messages from step 2 into your notes for the evidence pack.',
      },
    ],
    done: 'You saw three refusals, fixed them, and removed the test deployment.',
  },

  'Lab 4: test a policy like code, with the Kyverno CLI': {
    goal: 'Check the guardrails without a cluster, the way the policies repository\'s pipeline does, and see that the tests catch a policy that stops working.',
    learn: [
      'That policies are code: they can be run and tested on your own machine, before they reach the cluster.',
      'How a test suite protects a guardrail from being weakened by accident.',
    ],
    words: [
      ['Kyverno CLI', 'The kyverno command: runs the policies against files, without a cluster.'],
      ['Policy test', 'A list of examples and the result each must get (pass or fail). If a policy changes its behaviour, a test fails.'],
    ],
    start: [
      'Your copy of platform/policies (~/policies) from Lab 3, unchanged: cd ~/policies && git status shows "nothing to commit".',
    ],
    steps: [
      {
        title: 'Check a good deployment',
        where: 'Workspace terminal',
        why: 'Run the guardrails against a file on your machine: the fastest way to know if a deployment will be accepted.',
        run: 'cd ~/policies\nkyverno apply policies/ --resource examples/good.yaml --values-file tests/values.yaml',
        explain: [
          ['kyverno apply policies/', 'run every policy in the policies folder...'],
          ['--resource examples/good.yaml', '...against this file...'],
          ['--values-file tests/values.yaml', '...and treat team01-dev as a team namespace, as on the cluster (the policies only apply to team namespaces).'],
        ],
        see: 'No failures:',
        out: 'Applying 10 policy rule(s) to 1 resource(s)...\n\npass: 4, fail: 0, warn: 0, error: 0, skip: 0',
        read: [
          'Ignore the lines "Warning: ... ClusterPolicy is deprecated": a newer policy format exists; these policies work as they are.',
        ],
      },
      {
        title: 'Check the bad one',
        where: 'Workspace terminal',
        why: 'The same three refusals as on the cluster in Lab 3, found before anything is deployed.',
        run: 'kyverno apply policies/ --resource examples/bad.yaml --values-file tests/values.yaml',
        see: 'Three rules fail, with the same messages as on the cluster:',
        out: 'policy pelab-immutable-tags -> resource team01-dev/Deployment/shortcut failed:\n1 - autogen-no-latest validation error: The "latest" tag is not allowed; ...\npolicy pelab-ownership-labels -> resource team01-dev/Deployment/shortcut failed:\n1 - required-labels validation error: Add the labels app.kubernetes.io/name and app.kubernetes.io/part-of (your team). ...\npolicy pelab-trusted-registry -> resource team01-dev/Deployment/shortcut failed:\n1 - autogen-harbor-only validation error: Images must come from harbor.<lab domain>. ...\n\npass: 1, fail: 3, warn: 0, error: 0, skip: 0',
      },
      {
        title: 'Run the policy tests',
        where: 'Workspace terminal',
        why: 'tests/kyverno-test.yaml lists, for every example, the result each rule must give. This is exactly what the policies repository\'s pipeline runs on every change to the guardrails.',
        run: 'kyverno test tests/',
        explain: [
          ['kyverno test tests/', 'run the test suite in the tests folder.'],
        ],
        see: 'A table of results, ending with:',
        out: 'Test Summary: 11 tests passed and 0 tests failed',
      },
      {
        title: 'Break a test on purpose',
        where: 'Workspace terminal',
        why: 'Pretend someone weakened the labels rule, so it no longer refuses the shortcut. The tests must notice.',
        run: 'sed -i \'/required-labels.*shortcut/s/result: fail/result: pass/\' tests/kyverno-test.yaml\nkyverno test tests/\ngit checkout tests/kyverno-test.yaml',
        explain: [
          ['sed -i \'/required-labels.*shortcut/s/result: fail/result: pass/\' tests/kyverno-test.yaml', 'on the test line for the labels rule and the shortcut, change the expected result from fail to pass.'],
          ['kyverno test tests/', 'run the tests again.'],
          ['git checkout tests/kyverno-test.yaml', 'undo the change.'],
        ],
        see: 'One test fails, then Git puts the file back:',
        out: 'Test Summary: 10 tests passed and 1 tests failed\n\nError: 1 tests failed\nUpdated 1 path from the index',
        read: [
          'The tests notice when a guardrail does not do what it promises: nobody can quietly weaken one.',
        ],
      },
      {
        title: 'Think of one more rule',
        where: 'On your own',
        why: 'Guardrails turn a written rule into one that is checked every time. Which of FMD\'s rules would you automate first?',
        do: [
          'Choose one more rule you would turn into a policy, and say in one sentence what it would refuse. Compare with your neighbour.',
          'Ideas: cost (every workload has a budget), naming, data (no production data in dev), resilience (prod runs at least two copies).',
        ],
        see: 'One rule per person on the board.',
      },
    ],
    done: 'You ran the policies and their tests on your machine and saw a broken test caught.',
  },

  'Lab 5: ask for an exception, and watch it expire': {
    goal: 'Ask, the proper way, to break one rule for a short time: a written, reviewed, time-limited exception. Then see what happens when it expires.',
    learn: [
      'How a platform says yes safely: an exception that is written down, reviewed, limited in time and visible to all.',
      'What happens when an exception ends.',
    ],
    words: [
      ['Exception', 'Written permission to break one rule, for one workload, until a date. It lives in Git, in platform/policies/exceptions.'],
      ['ReplicaSet', 'The part of a Deployment that starts its pods. When an exception has ended, new ReplicaSets cannot start pods.'],
    ],
    start: [
      ...TERMINAL,
      'Your copy of platform/policies (~/policies).',
    ],
    steps: [
      {
        title: 'Try the status page',
        where: 'Workspace terminal',
        why: 'examples/status-page.yaml is a ready-made web page straight from Docker Hub. You "need it for a demo": see what the guardrails say.',
        run: 'cd ~/policies\ngit switch main && git pull\nsed "s/team01/$TEAM/g" examples/status-page.yaml > ~/status-page.yaml\nkubectl apply -f ~/status-page.yaml',
        explain: [
          ['sed "s/team01/$TEAM/g" examples/status-page.yaml > ~/status-page.yaml', 'copy the example to your home folder, with your team name in it.'],
          ['kubectl apply -f ~/status-page.yaml', 'try to deploy it to your dev namespace.'],
        ],
        see: 'Refused by one rule only, pelab-trusted-registry: the image comes from Docker Hub. Its tag and labels are fine.',
      },
      {
        title: 'Write the exception request',
        where: 'Workspace terminal, then the editor',
        why: 'An exception is a request in writing: who asks, why, and until when. It is a file in Git, so it is reviewed like any change.',
        do: [
          'Paste the box. It makes a branch, copies the template under your team name, fills in your team name and your user name, sets the end date to one week from today, and shows the file.',
          'Open the file in the editor (Explorer → policies → exceptions → teamNN-status-page.yaml) and rewrite the reason, under pelab.io/reason, in your own words: why the golden path cannot be used, in one or two sentences. Keep the same indentation. Save.',
        ],
        run: 'git switch -c $TEAM-status-page\ncp examples/exception-template.yaml exceptions/$TEAM-status-page.yaml\nsed -i "s/team01/$TEAM/g; s/student01/$ME/" exceptions/$TEAM-status-page.yaml\nsed -i "s/pelab.io\\/expires: .*/pelab.io\\/expires: \\"$(date -d \'+7 days\' +%F)\\"/" exceptions/$TEAM-status-page.yaml\ncat exceptions/$TEAM-status-page.yaml',
        explain: [
          ['git switch -c $TEAM-status-page', 'a branch for the request.'],
          ['cp examples/exception-template.yaml exceptions/$TEAM-status-page.yaml', 'copy the template into the exceptions folder, named after your team name.'],
          ['sed -i "s/team01/$TEAM/g; s/student01/$ME/" ...', 'put your team name and your user name in it.'],
          ['sed -i "s/pelab.io\\/expires: .*/pelab.io\\/expires: \\"$(date -d \'+7 days\' +%F)\\"/" ...', 'set the end date (pelab.io/expires) to one week from today. $(date -d \'+7 days\' +%F) is replaced by that date, for example 2026-11-09.'],
          ['cat exceptions/$TEAM-status-page.yaml', 'show the request.'],
        ],
        see: 'Your request: your team name in its name and namespace, your user name, a reason and an end date a week ahead:',
        out: 'metadata:\n  name: team03-status-page            # CHANGE: <team>-<what>, lowercase\n  namespace: pelab-exceptions       # exceptions only count in this namespace\n  annotations:\n    pelab.io/requested-by: student12  # CHANGE: your user name\n    pelab.io/reason: >-               # CHANGE: why the golden path cannot be used, in one or two sentences\n      We need a status page for the demo this week and there is no\n      golden-path image for it yet.\n    pelab.io/expires: "2026-11-09"\n...\n          namespaces: [team03-dev]    # CHANGE: your team\'s namespace\n          names: [status-page*]       # CHANGE: the workload\'s name (pods add a suffix)',
        read: [
          'The # CHANGE comments mark what a request must fill in; the commands filled in all of them except the reason, which is yours to write.',
          'namespaces and names limit the exception to exactly this workload in your dev namespace: nothing else gets the permission.',
        ],
      },
      {
        title: 'Check it the way the pipeline will',
        where: 'Workspace terminal',
        why: 'The policies pipeline checks every request: an owner, a reason, and an end date at most 30 days ahead. Check yours first.',
        do: [
          'Run the check (the box).',
          'Then paste the second box: it sets a date 60 days ahead and checks (refused), then puts the one-week date back and checks again (ok).',
        ],
        run: 'python3 tests/check-exceptions.py',
        explain: [
          ['python3 tests/check-exceptions.py', 'run the same check the pipeline runs on every exception file.'],
        ],
        then: {
          say: 'To see a refusal, set the date 60 days ahead, check, then set it back to 7 days:',
          run: 'sed -i "s/pelab.io\\/expires: .*/pelab.io\\/expires: \\"$(date -d \'+60 days\' +%F)\\"/" exceptions/$TEAM-status-page.yaml\npython3 tests/check-exceptions.py\nsed -i "s/pelab.io\\/expires: .*/pelab.io\\/expires: \\"$(date -d \'+7 days\' +%F)\\"/" exceptions/$TEAM-status-page.yaml\npython3 tests/check-exceptions.py',
        },
        see: 'ok with your date; FAIL for a date too far ahead; ok again once it is put back:',
        out: 'ok   exceptions/team03-status-page.yaml (team03-status-page), until 2026-11-09\nFAIL exceptions/team03-status-page.yaml (team03-status-page):\n  - expires 2026-12-31: at most 30 days ahead (2026-12-02)\nok   exceptions/team03-status-page.yaml (team03-status-page), until 2026-11-09',
      },
      {
        title: 'Propose it; the platform team approves',
        where: 'Workspace terminal, then Gitea',
        why: 'Only the platform team may approve an exception: the team that asks is not the team that allows.',
        do: [
          'Paste the box: it commits only your exception file and pushes.',
          'Open the pulls/new link it prints and click Create Pull Request (title: Exception: status page for teamNN).',
          'Now play the platform team: ' + privateWindowAs('platform-approver') + ' In Files Changed, read who asks, why and until when, as a reviewer would, then Review → Approve.',
          'When the test pipeline is green and the approval is there, merge in your own window.',
          'Two minutes later, open platform/policies → Commits and click the tick next to your merge commit.',
        ],
        run: 'git add exceptions/$TEAM-status-page.yaml\ngit commit -m "Exception: status page for $TEAM"\ngit push -u origin $TEAM-status-page',
        explain: [
          ['git add exceptions/$TEAM-status-page.yaml', 'put only your exception file into the commit.'],
        ],
        see: 'The test pipeline is green. After the merge, platform/apply on the merge commit says "3 policies, 1 exceptions in force".',
      },
      {
        title: 'Try the status page again',
        where: 'Workspace terminal',
        why: 'With the exception in force, the same file that was refused is now allowed, and anyone can read why in Git.',
        run: 'kubectl apply -f ~/status-page.yaml\nkubectl -n $TEAM-dev get pods',
        explain: [
          ['kubectl -n $TEAM-dev get pods', 'list the pods in your dev namespace.'],
        ],
        see: 'deployment.apps/status-page created, and its pod running (your pod names end differently):',
        out: 'deployment.apps/status-page created\nNAME                           READY   STATUS    RESTARTS   AGE\nhello-6d9f8b7c5d-x2k8p         1/1     Running   0          2d\nstatus-page-7c9d6b5f8-q4m2n    1/1     Running   0          10s',
      },
      {
        title: 'End the exception, and watch what happens',
        where: 'Workspace terminal, Gitea, then the terminal again',
        why: 'Exceptions end. Ending one early is the proper way to stop it: a change in Git, reviewed, on record.',
        do: [
          'Paste the first box: it makes a branch that sets the end date to yesterday, checks it (it reports "ended"), commits and pushes.',
          'Open its pull request (Ctrl+click the pulls/new link that git push prints, then Create Pull Request). Get the platform team\'s approval as in step 4: in a private window, sign in as platform-approver, open the pull request, Files Changed → Review → Approve, and close the window. Then merge it in your own window.',
          'Two minutes after the merge, platform/apply on the commit says "expired, not applied: teamNN-status-page". Then paste the second box.',
        ],
        run: 'cd ~/policies\ngit switch main && git pull\ngit switch -c $TEAM-status-page-end\nsed -i "s/pelab.io\\/expires: .*/pelab.io\\/expires: \\"$(date -d yesterday +%F)\\"/" exceptions/$TEAM-status-page.yaml\npython3 tests/check-exceptions.py\ngit commit -am "End the status page exception for $TEAM"\ngit push -u origin $TEAM-status-page-end',
        explain: [
          ['sed -i "s/pelab.io\\/expires: .*/pelab.io\\/expires: \\"$(date -d yesterday +%F)\\"/" ...', 'set the end date to yesterday.'],
          ['python3 tests/check-exceptions.py', 'the check accepts a past date and reports the exception as ended.'],
        ],
        then: {
          say: 'After the merge and two minutes, restart the status page and look:',
          run: 'kubectl -n $TEAM-dev rollout restart deployment status-page\nsleep 20\nkubectl -n $TEAM-dev get replicasets,pods\nkubectl -n $TEAM-dev get events | grep "Error creating" | tail -1',
          explain: [
            ['kubectl -n $TEAM-dev rollout restart deployment status-page', 'ask Kubernetes to replace the status page\'s pods with new ones, as any change would.'],
            ['sleep 20', 'give it twenty seconds.'],
            ['kubectl -n $TEAM-dev get replicasets,pods', 'show the ReplicaSets (old and new) and the pods.'],
            ['kubectl -n $TEAM-dev get events | grep "Error creating" | tail -1', 'list what happened in your namespace lately (its events) and keep the last line about a pod that could not be created: the reason the new ReplicaSet has no pods.'],
          ],
        },
        see: 'The check says ended; later, the old pod keeps running, but the new ReplicaSet has 0 pods:',
        out: 'ended exceptions/team03-status-page.yaml (team03-status-page), on 2026-11-02: the platform no longer applies it\n...\nNAME                                     DESIRED   CURRENT   READY   AGE\nreplicaset.apps/status-page-6b87f7cbc7   1         0         0       20s\nreplicaset.apps/status-page-77ffdd9665   1         1         1       3m\n...\n15s   Warning   FailedCreate   replicaset/status-page-6b87f7cbc7   Error creating: admission webhook "validate.kyverno.svc-fail" denied the request: ...',
        read: [
          'An expired exception does not switch anything off: what runs keeps running. It stops anything new starting, until the real cause (an image from Docker Hub) is fixed.',
        ],
        tip: 'Clean up: kubectl -n $TEAM-dev delete deployment status-page, then rm ~/status-page.yaml.',
      },
    ],
    done: 'You have seen an exception requested, checked, approved, used and expired, all on record in Git.',
  },
};
