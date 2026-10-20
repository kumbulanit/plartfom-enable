// Day 5 labs, step by step, for the handbook (see labs/day1.js for the format).
'use strict';

module.exports = {
  'Lab 1: read the pipeline and its evidence': {
    goal: 'Read what the pipeline did to your last change, and find the evidence it left: test results, a secret scan, an image, a vulnerability report and an SBOM.',
    start: 'Sign in to Gitea and Harbor as studentNN.',
    steps: [
      {
        title: 'Open the latest run on main',
        where: 'Browser: Gitea',
        say: 'Open teamNN/hello → Actions. Click the newest run whose branch is main.',
        see: 'The list of steps, each green, with how long it took.',
      },
      {
        title: 'Read the tests and the secret scan',
        where: 'Browser: Gitea',
        say: 'Click the Unit tests (pytest) step to open its log, then the Secret scan (gitleaks) step.',
        see: '"5 passed" in the tests, and "no leaks found" in the secret scan.',
      },
      {
        title: 'Find the image tag',
        where: 'Browser: Gitea',
        say: 'Open the Build the image and Push to Harbor steps. The tag is the commit id: every image says exactly which code it came from.',
        see: 'harbor.<lab domain>/teamNN/hello:<a 40-character commit id>.',
      },
      {
        title: 'Open the image in Harbor',
        where: 'Browser: Harbor',
        say: 'Open https://harbor.<lab domain> → Projects → teamNN → hello. Click the newest image (its tag is the commit id you just found).',
        see: 'The vulnerability scan with a count by severity (critical, high, medium, low), and the SBOM listed with the image.',
      },
      {
        title: 'Read the ingredients list (SBOM)',
        where: 'Browser: Harbor',
        say: 'Open the SBOM and search the page for "python" (Ctrl+F).',
        see: 'The exact Python version and every package inside your image. Most of the image is not your code.',
      },
      {
        title: 'Write down the evidence',
        where: 'Your team notes',
        say: 'Copy three things: the link to the pipeline run, the image tag, and the vulnerability count.',
        see: 'Three lines for the Day 6 evidence pack.',
      },
    ],
    done: 'You can show, for one change, its tests, secret scan, image, scan report and SBOM.',
  },

  'Lab 2: break the pipeline three ways, and fix it': {
    goal: 'Make three common mistakes on purpose (a wrong test, a password in the code, running as root) and watch the pipeline catch each one before it reaches main.',
    start: 'Your copy of hello, on main and up to date. Keep the pull request page open: each push shows a new result there.',
    steps: [
      {
        title: 'A wrong test',
        where: 'Workspace terminal, then Gitea',
        say: 'Make a branch and change one expected value in the tests from 200 to 201, so a test expects the wrong answer. Push and open a pull request.',
        run: 'cd ~/hello\ngit switch main && git pull\ngit switch -c break-things-$ME\nsed -i \'0,/assert status == 200/s//assert status == 201/\' tests/test_main.py\ngit diff\ngit commit -am "A wrong test"\ngit push -u origin break-things-$ME',
        see: 'The pipeline turns red at Unit tests (pytest). The log names the test, with the actual and the expected value:',
        out: 'FAILED tests/test_main.py::test_root_describes_the_service - assert 200 == 201',
      },
      {
        title: 'Fix the test',
        where: 'Workspace terminal',
        run: 'sed -i \'s/assert status == 201/assert status == 200/\' tests/test_main.py\ngit commit -am "Fix the test"\ngit push',
        see: 'The new run on the pull request is green.',
      },
      {
        title: 'A password in the code',
        where: 'Workspace terminal',
        say: 'Add a made-up password to the code, the kind of thing people do "just to get it working".',
        run: 'echo \'DB_PASSWORD = "hunter2-very-secret-123"\' >> app/main.py\ngit commit -am "Add a database password"\ngit push',
        see: 'Red at Secret scan (gitleaks): "leaks found: 1", with the rule, the file and the line. The value itself shows as REDACTED.',
      },
      {
        title: 'Remove the password',
        where: 'Workspace terminal',
        run: 'sed -i \'/DB_PASSWORD/d\' app/main.py\ngit commit -am "Remove the password"\ngit push',
        see: 'Green again.',
        tip: 'The password is still in this branch\'s history. A real one would now have to be changed, because Git never forgets. That is why the scan runs before anything is merged.',
      },
      {
        title: 'Run as root',
        where: 'Workspace terminal',
        say: 'Change the Dockerfile so the container runs as the administrator.',
        run: 'sed -i \'s/^USER 10001/USER root/\' Dockerfile\ngit commit -am "Run as root"\ngit push',
        see: 'Red at Dockerfile lint (hadolint): "DL3002 warning: Last USER should not be root".',
      },
      {
        title: 'Put it right, add a test, and merge',
        where: 'Workspace terminal, then Gitea',
        say: 'Put USER 10001 back and add one new test, for the health check. Run the tests yourself, push, get an approval and merge.',
        run: 'sed -i \'s/^USER root/USER 10001/\' Dockerfile\ncat >> tests/test_main.py <<\'EOF\'\n\n\ndef test_health_check_says_ok():\n    status, _, body = main.route("/healthz")\n    assert status == 200\n    assert body == "ok\\n"\nEOF\npython3 -m pytest -q\ngit commit -am "Run as an ordinary user again, and test the health check"\ngit push',
        see: '6 passed, a green pipeline, and after the merge the pipeline on main pushes a new image to Harbor.',
      },
    ],
    done: 'You saw three red runs with clear messages, fixed each one, and merged a green change with one more test.',
  },

  'Lab 3: watch the guardrails refuse a bad deployment': {
    goal: 'Try to put a careless deployment straight into your dev environment, read the three refusals, and fix them one by one.',
    start: 'A terminal in your workspace. kubectl already points at your team\'s dev namespace.',
    steps: [
      {
        title: 'Get the guardrails repository and a copy of the bad example',
        where: 'Workspace terminal',
        say: 'platform/policies holds the guardrails and their examples. Work on a copy of the bad example with your team in it, so the repository stays as it is.',
        run: 'cd ~\ngit clone https://gitea.$DOMAIN/platform/policies\ncd policies\nsed "s/team01/$TEAM/g" examples/bad.yaml > ~/shortcut.yaml\ncat ~/shortcut.yaml',
        see: 'A Deployment called shortcut in your dev namespace: image nginx:latest, and no name or owner labels.',
      },
      {
        title: 'Try to deploy it',
        where: 'Workspace terminal',
        run: 'kubectl apply -f ~/shortcut.yaml',
        see: 'Refused by three rules, each saying how to fix it:',
        out: 'Error from server: ... denied the request:\n\nresource Deployment/teamNN-dev/shortcut was blocked due to the following policies\n\npelab-immutable-tags:\n  autogen-no-latest: \'validation error: The "latest" tag is not allowed; use the commit SHA the pipeline tagged the image with. ...\'\npelab-ownership-labels:\n  required-labels: \'validation error: Add the labels app.kubernetes.io/name and app.kubernetes.io/part-of (your team). ...\'\npelab-trusted-registry:\n  autogen-harbor-only: \'validation error: Images must come from harbor.<lab domain>. Build and push them with the golden-path pipeline. ...\'',
      },
      {
        title: 'Fix the image',
        where: 'Workspace terminal',
        say: 'Use an image from the lab registry, with a fixed tag. That answers two of the three rules.',
        run: 'sed -i "s#image: nginx:latest#image: harbor.$DOMAIN/dockerhub/library/python:3.12-slim#" ~/shortcut.yaml\nkubectl apply -f ~/shortcut.yaml',
        see: 'One refusal left: pelab-ownership-labels, the labels.',
      },
      {
        title: 'Add the labels',
        where: 'Workspace editor',
        say: [
          'Open ~/shortcut.yaml in the editor (menu → File → Open File, then type the path /home/studentNN/shortcut.yaml).',
          'In the first metadata block, under namespace, add the two labels below. Use your team, and the same two-space indents. Save, then apply again:',
        ],
        file: { path: '~/shortcut.yaml (the top of the file)', lang: 'yaml', text: 'metadata:\n  name: shortcut\n  namespace: teamNN-dev\n  labels:\n    app.kubernetes.io/name: shortcut\n    app.kubernetes.io/part-of: teamNN' },
        run: 'kubectl apply -f ~/shortcut.yaml',
        see: 'Accepted: deployment.apps/shortcut created.',
      },
      {
        title: 'Clean up, and keep the evidence',
        where: 'Workspace terminal',
        run: 'kubectl -n $TEAM-dev delete deployment shortcut\nrm ~/shortcut.yaml',
        see: 'deployment.apps "shortcut" deleted. Copy the three refusal messages into your team notes for the evidence pack.',
      },
    ],
    done: 'You saw three refusals, fixed them, and removed the test deployment.',
  },

  'Lab 4: test a policy like code, with the Kyverno CLI': {
    goal: 'Check the guardrails without a cluster, the way the policies repository\'s pipeline does, and see that the tests catch a policy that stops working.',
    start: 'Your copy of platform/policies (~/policies) from Lab 3, unchanged (git status shows nothing to commit).',
    steps: [
      {
        title: 'Check a good deployment',
        where: 'Workspace terminal',
        say: 'kyverno apply runs the policies against a file, on your machine. The values file tells it that team01-dev is a team namespace, as on the cluster.',
        run: 'cd ~/policies\nkyverno apply policies/ --resource examples/good.yaml --values-file tests/values.yaml',
        see: 'pass: 4, fail: 0.',
      },
      {
        title: 'Check the bad one',
        where: 'Workspace terminal',
        run: 'kyverno apply policies/ --resource examples/bad.yaml --values-file tests/values.yaml',
        see: 'pass: 1, fail: 3, with the same messages as on the cluster in Lab 3.',
      },
      {
        title: 'Run the policy tests',
        where: 'Workspace terminal',
        say: 'tests/kyverno-test.yaml lists what each example must get: pass, fail or skip. This is exactly what the pipeline runs on every change to the guardrails.',
        run: 'kyverno test tests/',
        see: 'Test Summary: 11 tests passed and 0 tests failed.',
      },
      {
        title: 'Break a test on purpose',
        where: 'Workspace terminal',
        say: 'Pretend the labels rule stopped refusing the shortcut: change its expected result from fail to pass, run the tests, then undo it.',
        run: 'sed -i \'/required-labels.*shortcut/s/result: fail/result: pass/\' tests/kyverno-test.yaml\nkyverno test tests/\ngit checkout tests/kyverno-test.yaml',
        see: '1 test failed: the tests notice when a guardrail does not do what it promises.',
      },
      {
        title: 'Think of one more rule',
        where: 'Your team',
        say: 'What else would you turn into a policy in FMD? Cost (every workload has a budget), naming, data (no production data in dev), resilience (prod has at least two copies)...',
        see: 'One rule per team on the board.',
      },
    ],
    done: 'You ran the policies and their tests on your machine and saw a broken test caught.',
  },

  'Lab 5: ask for an exception, and watch it expire': {
    goal: 'Ask, the proper way, to break one rule for a short time: a written, reviewed, time-limited exception. Then see what happens when it expires.',
    start: 'Your copy of platform/policies (~/policies), on main and up to date. One member of each team drives.',
    steps: [
      {
        title: 'Try the status page',
        where: 'Workspace terminal',
        say: 'examples/status-page.yaml is a ready-made web page from Docker Hub. Make a copy with your team in it and try it.',
        run: 'cd ~/policies\ngit switch main && git pull\nsed "s/team01/$TEAM/g" examples/status-page.yaml > ~/status-page.yaml\nkubectl apply -f ~/status-page.yaml',
        see: 'Refused by pelab-trusted-registry only: the image comes from Docker Hub. Its tag and labels are fine.',
      },
      {
        title: 'Write the exception request',
        where: 'Workspace terminal, then the editor',
        say: [
          'Make a branch and copy the template into exceptions/, with your team and user name filled in.',
          'Then open the new file in the editor and change the two remaining CHANGE values: the reason, in your own words, and pelab.io/expires. Use the date the last command prints: a week from today, at most 30 days.',
        ],
        run: 'git switch -c $TEAM-status-page\ncp examples/exception-template.yaml exceptions/$TEAM-status-page.yaml\nsed -i "s/team01/$TEAM/g; s/student01/$ME/" exceptions/$TEAM-status-page.yaml\ndate -d "+7 days" +%F',
        see: 'A file exceptions/teamNN-status-page.yaml with your team in its name and namespace, your user, your reason and the end date.',
      },
      {
        title: 'Check it the way the pipeline will',
        where: 'Workspace terminal',
        run: 'python3 tests/check-exceptions.py',
        see: '"ok exceptions/teamNN-status-page.yaml ..., until <your date>". Try a date 60 days ahead and run it again: the check refuses it. Put your date back.',
      },
      {
        title: 'Propose it; the platform team approves',
        where: 'Workspace terminal, then Gitea',
        say: 'Commit only your exception file, push, and open a pull request. The instructor reads the reason with you and approves; merge.',
        run: 'git add exceptions/$TEAM-status-page.yaml\ngit commit -m "Exception: status page for $TEAM"\ngit push -u origin $TEAM-status-page',
        see: 'The test pipeline is green. Within two minutes of the merge, the merge commit shows platform/apply "3 policies, 1 exceptions in force" (more if other teams were faster).',
      },
      {
        title: 'Try the status page again',
        where: 'Workspace terminal',
        run: 'kubectl apply -f ~/status-page.yaml\nkubectl -n $TEAM-dev get pods',
        see: 'deployment.apps/status-page created, and its pod running. Allowed by an exception that anyone can read in Git, with a reason and an end date.',
      },
      {
        title: 'End the exception, and watch what happens',
        where: 'Workspace terminal, Gitea, then the terminal again',
        say: [
          'End it early, the proper way: change its end date to yesterday in a pull request. The check reports it as ended. The instructor approves; merge.',
          'Two minutes after the merge (the commit shows platform/apply "expired, not applied: teamNN-status-page"), restart your status page and look:',
        ],
        run: 'cd ~/policies\ngit switch main && git pull\ngit switch -c $TEAM-status-page-end\nsed -i "s/pelab.io\\/expires: .*/pelab.io\\/expires: \\"$(date -d yesterday +%F)\\"/" exceptions/$TEAM-status-page.yaml\npython3 tests/check-exceptions.py\ngit commit -am "End the status page exception for $TEAM"\ngit push -u origin $TEAM-status-page-end',
        then: {
          say: 'After the merge and two minutes:',
          run: 'kubectl -n $TEAM-dev rollout restart deployment status-page\nsleep 20\nkubectl -n $TEAM-dev get replicasets,pods\nkubectl -n $TEAM-dev describe replicasets | grep "Error creating"',
        },
        see: 'The old pod keeps running, but the new ReplicaSet has 0 pods: "Error creating: admission webhook ... denied the request". An expired exception does not switch anything off; it stops anything new starting until the root cause is fixed.',
        tip: 'Clean up: kubectl -n $TEAM-dev delete deployment status-page, then rm ~/status-page.yaml.',
      },
    ],
    done: 'You have seen an exception requested, checked, approved, used and expired, all on record in Git.',
  },
};
