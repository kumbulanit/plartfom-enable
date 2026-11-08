// Day 5: CI/CD, testing and security
'use strict';
const DOMAIN = '<lab domain>';

module.exports = [
  {
    type: 'title', section: 'Opening',
    title: 'CI/CD, testing and security',
    subtitle: 'Every change is tested and checked automatically before it can ship. Today you open up the pipeline and the guardrails.',
    highlight: ['Pipeline', 'Registry'],
    notes: 'The pipeline has run on every change since Day 2. Today the delegates read it, break it, fix it, and then meet the policies that guard the cluster. This is the brief\'s Lab 5 (secure CI/CD and supply chain) and Lab 6 (policy-as-code) at a beginner level.',
  },
  {
    type: 'goal', section: 'Opening',
    goal: 'Read a pipeline and its results, fix a failing check, and explain how guardrails and evidence protect production.',
    outcomes: [
      'Explain CI/CD, DevSecOps and the software supply chain in plain words',
      'Read the pipeline, make it fail three different ways, and fix it',
      'See the guardrails reject a bad deployment, read a policy, and test one yourself',
    ],
    highlight: ['Pipeline', 'Registry'],
    notes: 'Today has the most scenarios of any day. Each one is a story: an everyday mistake, caught before production.',
  },
  {
    type: 'agenda', section: 'Opening',
    title: "Today's plan",
    bridge: 'Yesterday the template built and deployed your new service without anyone being asked. Today you open up the pipeline that did it, break it on purpose, and meet the guardrails and exceptions.',
    notes: 'The pipeline has run on every change since Day 2; today they read it. Lab 2 is the favourite: three mistakes, three red pipelines, three fixes.',
  },
  {
    type: 'concept', section: 'CI/CD and DevSecOps',
    title: 'CI/CD in plain words',
    icon: 'FiPlay',
    idea: [
      'A pipeline is a checklist that runs itself on every change. Continuous integration: every change is merged often and checked at once. Continuous delivery: every checked change is packaged so it can be deployed at any time.',
      'The checklist is code too (ci.yaml, in the repository), so it is reviewed, versioned and the same for everyone. Runners are the machines that execute it.',
      'On a pull request the pipeline checks; on main it also builds and pushes the image. Nothing reaches the registry without passing every check.',
    ],
    lab: [
      'The pipeline is Gitea Actions; the file is .gitea/workflows/ci.yaml.',
      'Five runners on the lab server execute the jobs for all teams.',
      'The steps: lint, unit tests, secret scan, Dockerfile check, deployment check, build, image scan, push.',
      'Push happens only on main, never from a pull request.',
    ],
    oneLiner: 'A pipeline is a checklist that runs itself on every change, written as code, the same for every team.',
    notes: 'The brief defines CI/CD as workflows that "enforce least privilege, separation of duties, reusable controls, evidence capture, controlled promotion and deterministic rollback". Map each to the lab as you go through the day.',
  },
  {
    type: 'flow', section: 'CI/CD and DevSecOps',
    title: 'What the pipeline does on every change',
    figure: { src: 'pipeline.svg', caption: 'Each step can stop the pipeline; its last step always posts the verdict that the merge gate reads.' },
    steps: ['Checkout', 'Lint', 'Unit tests', { text: 'Secret scan', highlight: true }, 'Dockerfile check', 'Build image', { text: 'Image scan + SBOM', highlight: true }, 'Push (main only)'],
    caption: 'A pull request runs steps 1 to 7 and stops. A merge to main runs all eight; the pushed image is what Argo CD deploys.',
    notes: 'Say what each step would catch: lint catches sloppy code, tests catch broken behaviour, the secret scan catches passwords, the Dockerfile check catches unsafe images, the scan catches known vulnerabilities, and the push only happens for reviewed code on main.',
  },
  {
    type: 'concept', section: 'CI/CD and DevSecOps',
    title: 'DevSecOps and the software supply chain',
    icon: 'FiShield',
    idea: [
      'DevSecOps means the security checks run inside the pipeline on every change, instead of a security review at the end. Problems are found in minutes, by the person who can fix them.',
      'The supply chain is everything that goes into your image: the base image, the packages, your code, the build itself. Most vulnerabilities come from ingredients you did not write.',
      'An SBOM (software bill of materials) is the ingredients list. A vulnerability scan compares the list against known problems. Together they answer "what is inside, and is any of it known to be bad?"',
    ],
    lab: [
      'gitleaks looks for secrets in the code and its history.',
      'hadolint checks the Dockerfile against good practice.',
      'Trivy scans the built image; Harbor scans it again on push and generates the SBOM.',
      'Signing (optional) proves the pipeline, not a person, produced the image.',
    ],
    oneLiner: 'DevSecOps puts the security checks in the pipeline; the SBOM and scan tell you what is in your image and whether it is safe.',
    notes: 'The brief\'s Lab 5 lists: test gates, dependency scanning, secret detection, SBOM, signing, provenance, promotion, exception handling. All but provenance appear today; signing is an optional exercise.',
  },
  {
    type: 'code', section: 'CI/CD and DevSecOps',
    title: 'The pipeline file, shortened',
    code: `# .gitea/workflows/ci.yaml  (the shape of it)
on: push to main, pull_request, workflow_dispatch
runs-on: pelab-host
env:
  IMAGE: <registry>/<team>/<repo>:<commit id>
steps:
  - Checkout
  - Lint:             ruff check . && ruff format --check .
  - Unit tests:       pytest -q
  - Secret scan:      gitleaks git --redact --verbose .
  - Dockerfile check: hadolint Dockerfile
  - Deploy check:     kubectl kustomize deploy/<env>
  - Build:            docker build -t $IMAGE .
  - Image scan:       trivy image $IMAGE
  - Push:             docker push $IMAGE    (main only)`,
    notesRight: [
      'on: when it runs. workflow_dispatch means you can also run it by hand.',
      'IMAGE: the registry, your repository name and the commit id. That is the tag.',
      'Each step is one tool with one job. If any step fails, the run is red and the push never happens.',
      'The real file is about 60 lines; this is the shape of it.',
    ],
    notes: 'Open the real ci.yaml beside this slide. Delegates do not need to write pipelines in this course; they need to read one, know what each step guards against, and know where to look when it fails.',
  },
  {
    type: 'steps', section: 'Lab 1: read and run the pipeline', time: '30 min',
    title: 'Lab 1: read the pipeline and its evidence',
    steps: [
      { do: 'In Gitea, open teamNN/hello, then Actions. Click the latest run on main.', expect: 'The list of steps, each green, with timings.' },
      { do: 'Open the Unit tests step and the Secret scan step and read the logs.', expect: '"6 passed" and "no leaks found".' },
      { do: 'Open the Build step and find the image tag at the end.', expect: 'harbor.../teamNN/hello:<commit id>.' },
      { do: `Open Harbor (sign in as studentNN with your lab password), project teamNN, repository hello, newest image.`, expect: 'The Vulnerabilities tab with a count by severity; the SBOM as an attached artefact.' },
      { do: 'Open the SBOM and search for "python".', expect: 'The exact Python version and packages inside your image: the ingredients list.' },
      { do: 'Write down: the run link, the tag, the vulnerability count. This is evidence.', expect: 'Three lines in your team notes.' },
    ],
    notes: 'Most delegates have never looked inside an image. The SBOM makes the supply chain real: they can see that most of the image is not their code. Discuss what a "critical" finding in the base image would mean and who fixes it (the platform team updates the base image in the template; every service gets the fix on its next build).',
  },
  {
    type: 'steps', section: 'Lab 2: break it on purpose', time: '45 min',
    title: 'Lab 2: break the pipeline three ways, and fix it',
    steps: [
      { do: 'Branch: git switch -c break-things. In tests/test_main.py change an expected value so a test is wrong. Commit, push, open a pull request.', expect: 'Red at Unit tests: "FAILED tests/test_main.py::... assert 200 == 201", the test\'s name with actual and expected.' },
      { do: 'Fix the test, commit and push again.', expect: 'The run goes green. The pull request shows the new result.' },
      { do: 'In app/main.py add a line: DB_PASSWORD = "hunter2-very-secret-123". Commit and push.', expect: 'Red at Secret scan: "leaks found: 1", with the rule, the file and the line. The value shows as REDACTED.' },
      { do: 'Remove the line, commit and push.', expect: 'Green again. Note that the secret is still in the branch history: a real one would need rotating.' },
      { do: 'Change the Dockerfile\'s USER 10001 to USER root. Commit and push.', expect: 'Red at Dockerfile check: "DL3002 warning: Last USER should not be root".' },
      { do: 'Put USER 10001 back. Add one new test for /healthz in tests/test_main.py. Push, get it approved, merge.', expect: 'Green, 7 passed, and the pipeline on main pushes a new image.' },
    ],
    notes: 'Each failure is a story from the scenarios slide. Make the point in step 4: the scan caught the secret before merge, so it never reached main; if it had, the password would need changing, because Git never forgets. That is why the check runs on the pull request, not after.',
  },
  {
    type: 'concept', section: 'Lab 2: break it on purpose',
    title: 'Testing basics, for people who are not developers',
    icon: 'FiCheckSquare',
    idea: [
      'A unit test is a small automatic check with a known answer: call /healthz, expect 200 and "ok". pytest runs every test and reports green or red.',
      'Tests are the safety net that lets anyone change code: if the change breaks something, a test says so in seconds, before a reviewer spends time.',
      'One test per behaviour, named for what it checks. The template ships with five; every new behaviour deserves one more.',
    ],
    labCode: `def test_healthz_is_ok(client):
    code, body = client.get("/healthz")
    assert code == 200
    assert body == "ok"`,
    lab: [
      'Run them locally: python3 -m pytest -q',
      'The pipeline runs the same command on every change.',
    ],
    oneLiner: 'A test is a check with a known answer that runs itself; green means the behaviour still holds.',
    notes: 'Non-developers in the room should leave able to read a test and a test failure, and to ask "where is the test for this?" in a review. That is enough.',
  },
  {
    type: 'section', section: 'Policy-as-code',
    title: 'Policy-as-code',
    subtitle: 'The rules a bank would put in a policy document, written as files, kept in Git, tested, and enforced by the platform. You watch them refuse a bad deployment (Lab 3), then test them like code (Lab 4).',
    notes: 'The pipeline guards what gets built. Policies guard what gets to run. Both are code.',
  },
  {
    type: 'concept', section: 'Policy-as-code',
    title: 'Policy-as-code in plain words',
    figure: { src: 'guardrails.svg', caption: 'Kyverno checks every Pod at the API server, whoever applies it; an approved exception lets one workload through until its date.' },
    icon: 'FiLock',
    idea: [
      'A policy document says "only approved images may run in production". A policy as code says the same thing in a file the cluster reads, and refuses anything that breaks it, every time, with a message that says how to fix it.',
      'Because the rule is a file in Git, it is reviewed like any change, tested like code (a good example must pass, a bad one must fail), and versioned. The decision is explainable: the message names the rule.',
      'The rule says no, not a person. That removes arguments, late-night exceptions and inconsistency.',
    ],
    lab: [
      'Kyverno checks every deployment before the cluster accepts it.',
      'Three rules guard the team environments: images must come from Harbor; tags must be fixed (never "latest"); every service must carry its name and owner labels.',
      'Each refusal message says which rule and how to fix it.',
      'A rule change is a pull request to the platform team.',
    ],
    oneLiner: 'Policy-as-code turns a rule in a document into a file the platform enforces, explains and keeps in Git.',
    notes: 'Brief Lab 6 pass criteria: "policies are deterministic, versioned, tested and produce usable remediation guidance". Each of the four words maps to a bullet on this slide. Mention that the same idea applies to cost rules, naming rules and data rules; the lab shows three security rules because they are the easiest to see.',
  },
  {
    type: 'code', section: 'Policy-as-code',
    title: 'What a policy looks like: the trusted-registry rule',
    code: `# platform/policies: policies/pelab-trusted-registry.yaml
# In plain words: for every Pod in a team environment, every
# image must come from harbor.${DOMAIN}. If not, refuse it.

apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: pelab-trusted-registry
spec:
  rules:
    - name: harbor-only
      match:
        any:
          - resources:
              kinds: [Pod]
              namespaceSelector:
                matchLabels: { pelab.io/tier: team }
      validate:
        failureAction: Enforce
        message: Images must come from harbor.${DOMAIN}.
          Build and push them with the golden-path pipeline.
        pattern:
          spec:
            containers:
              - image: "harbor.${DOMAIN}/*"`,
    fontSize: 10.5,
    notesRight: [
      'match: where the rule applies: Pods in namespaces labelled as team environments.',
      'validate: what must be true: every container image starts with the Harbor address.',
      'failureAction Enforce: refuse, not just warn.',
      'message: what the person sees. Usable remediation guidance, as the brief puts it.',
      'The other two policies have the same shape: a tag that is not "latest"; labels for name and owner.',
      'Kyverno also checks Deployments with an automatic copy of each Pod rule, named autogen-harbor-only.',
    ],
    notes: 'Read the plain-words comment first, then the YAML. Delegates do not write policies in this course; they read one, test one with the CLI, and see what it does to a bad deployment.',
  },
  {
    type: 'steps', section: 'Lab 3: the guardrails', time: '35 min',
    title: 'Lab 3: watch the guardrails refuse a bad deployment',
    steps: [
      { do: `git clone https://gitea.${DOMAIN}/platform/policies && cd policies. Copy examples/bad.yaml to ~/shortcut.yaml with your team in place of team01.`, expect: 'A Deployment named shortcut: image nginx:latest, no labels.' },
      { do: 'kubectl apply -f ~/shortcut.yaml', expect: 'Refused by three policies: harbor-only (not from the lab registry), no-latest, required-labels. Each says how to fix it.' },
      { do: `Fix the image: harbor.${DOMAIN}/dockerhub/library/python:3.12-slim. Apply again.`, expect: 'One refusal left: the labels.' },
      { do: 'Add the labels app.kubernetes.io/name: shortcut and app.kubernetes.io/part-of: teamNN under metadata. Apply again.', expect: 'Accepted: deployment.apps/shortcut created.' },
      { do: 'kubectl -n teamNN-dev delete deployment shortcut, and rm ~/shortcut.yaml', expect: 'Cleaned up. Keep the three refusal messages for the evidence pack.' },
    ],
    notes: 'The refusals come with fix-it messages, which is the point: a guardrail that only says "no" sends people around it. Each message names the rule, so an exception request can name it too.',
  },
  {
    type: 'steps', section: 'Lab 3: the guardrails', time: '25 min',
    title: 'Lab 4: test a policy like code, with the Kyverno CLI',
    steps: [
      { do: 'In the policies folder: kyverno apply policies/ --resource examples/good.yaml --values-file tests/values.yaml', expect: 'pass: 4, fail: 0. The values file tells the command line that team01-dev is a team namespace.' },
      { do: 'The same with examples/bad.yaml', expect: 'pass: 1, fail: 3, with the same messages as on the cluster.' },
      { do: 'kyverno test tests/', expect: 'Test Summary: 11 tests passed and 0 tests failed. The pipeline runs exactly this on every change.' },
      { do: 'Break a test: in tests/kyverno-test.yaml change one shortcut result from fail to pass. Run kyverno test tests/ again, then undo it.', expect: '1 test failed: the tests catch a policy that stops refusing.' },
      { do: 'Discuss: what else would you turn into a policy? One idea per team.', expect: 'One rule per team on the board (cost, naming, data, resilience).' },
    ],
    notes: 'This is the brief\'s "policy source, tests, decision log" evidence in miniature: the policy files, the good and bad test cases, and the CLI output. The policies live in platform/policies; its pipeline runs kyverno test tests/ on every pull request, and the platform applies main to the cluster within two minutes. Why the values file: the policies only apply in namespaces labelled pelab.io/tier=team; the cluster knows the labels, the command line does not.',
  },
  {
    type: 'section', section: 'Scenarios and exceptions',
    title: 'Scenarios and exceptions',
    subtitle: 'The pipeline and the guardrails both say no. Next: the everyday mistakes they catch, and how the platform says yes safely, with a time-limited exception (Lab 5).',
    notes: 'Recap the morning in the scenarios, then the exception: a real platform needs a safe way to say yes.',
  },
  {
    type: 'scenarios', section: 'Scenarios and exceptions',
    title: 'Scenarios: everyday mistakes the pipeline catches',
    items: [
      { n: 1, icon: 'FiKey', color: 'accent3', name: 'The password in the code', does: 'A developer pastes a database password into main.py to get something working, and opens a pull request.', platform: 'The secret scan fails the pipeline and names the file and line. The reviewer sees a red pull request and does not approve it, so the password never reaches main.', rule: 'No secrets in source code.' },
      { n: 4, icon: 'FiPackage', color: 'accent2', name: 'What is inside the image', does: 'A reviewer asks whether the service is affected by a newly announced vulnerability in a common library.', platform: 'Harbor\'s SBOM lists every package and version in the image; the scan shows whether the vulnerability applies and how severe it is. Answer in a minute, not a week.', rule: 'Know what is inside every image.' },
      { n: 5, icon: 'FiUserX', color: 'accent3', name: 'Running as root', does: 'A Dockerfile is changed to run as root because "permissions were annoying".', platform: 'The Dockerfile check warns in the pipeline. If it were deployed anyway, the environment refuses to start a container as root.', rule: 'Least privilege for containers.' },
    ],
    notes: 'Delegates have now done scenarios 1 and 5 themselves in Lab 2 and seen scenario 4 in Lab 1. Ask the room for a real story that matches each one.',
  },
  {
    type: 'scenarios', section: 'Scenarios and exceptions',
    title: 'Scenarios: what the guardrails do',
    items: [
      { n: 3, icon: 'FiXCircle', color: 'accent3', name: 'The unknown image', does: 'Someone deploys nginx:latest from the internet into dev, "just to test something".', platform: 'The guardrail refuses it three times: not from Harbor, tag "latest", no owner label. Each message says how to fix it. Nothing ran.', rule: 'Only trusted, versioned, owned images run.' },
      { n: 7, icon: 'FiFileText', color: 'accent2', name: 'Asking for an exception', does: 'A team needs an image that is not in Harbor, for a good reason and for two weeks.', platform: 'They open a pull request to the platform team with the reason and an end date. Once approved, the exception applies to that image only, and expires on its own.', rule: 'Exceptions are written down, approved and temporary.' },
      { n: 8, icon: 'FiAward', color: 'accent4', name: 'The unsigned image (optional)', does: 'Someone pushes an image to Harbor by hand, skipping the pipeline.', platform: 'With signing switched on, the pipeline signs every image it builds. The signed-images policy reports an image nobody signed.', rule: 'Only the pipeline produces production images.' },
    ],
    notes: 'Scenario 7 is the brief\'s "waiver workflow", and Lab 5 does it for real. The brief\'s section 8.4 lists what an exception must record: scope, rationale, affected assets, residual risk, compensating controls, owner, approver, expiry and remediation plan. The lab\'s request carries the core of that (who, why, which rule, which workload, until when) and the pipeline refuses a request without them.',
  },
  {
    type: 'concept', section: 'Scenarios and exceptions',
    title: 'Saying yes safely: exceptions',
    icon: 'FiClipboard',
    idea: [
      'A guardrail that can never be lifted gets worked around. A guardrail that can be lifted by anyone is not a guardrail. The answer is an exception that is written down, approved by the right person, limited in scope, and temporary.',
      'As code, an exception is one more file in Git: which rule, for which workload, why, who approved, and when it expires. The platform applies it and removes it on the date.',
      'The brief asks for exactly this: every exception must record scope, rationale, affected assets, residual risk, compensating controls, owner, approver, expiry and remediation plan.',
    ],
    lab: [
      'Request: a pull request adding exceptions/<team>-<what>.yaml to platform/policies.',
      'Contents: who, why, which rule, which workload, until when (at most 30 days).',
      'Checks: the pipeline refuses a request without those, or for a platform namespace.',
      'Approval: only the platform team; the platform applies it within two minutes.',
      'Expiry: after the date it is removed. Running pods keep running; new ones are refused.',
    ],
    oneLiner: 'An exception is a recorded, approved, temporary yes; without an end date it is a policy change.',
    notes: 'This closes the policy-as-code story. Governance people in the room will recognise their own exception register; the difference is that here the register is the mechanism, not a spreadsheet next to it.',
  },
  {
    type: 'steps', section: 'Lab 5: ask for an exception', time: '25 min · per team',
    title: 'Lab 5: ask for an exception, and watch it expire',
    steps: [
      { do: 'In the policies folder, copy examples/status-page.yaml to ~/status-page.yaml with your team in it, then kubectl apply -f ~/status-page.yaml', expect: 'Refused by harbor-only only: the image comes from Docker Hub. The tag and labels are fine.' },
      { do: 'git switch -c teamNN-status-page. Copy examples/exception-template.yaml to exceptions/teamNN-status-page.yaml and fill in every CHANGE.', expect: 'Your team in the name and namespace, your user, a reason, an end date at most 30 days ahead.' },
      { do: 'python3 tests/check-exceptions.py', expect: '"ok exceptions/teamNN-status-page.yaml ..., until <date>". Try a date 60 days ahead: the check refuses it.' },
      { do: 'Commit, push and open a pull request. Play the platform team: as platform-approver, in a private window, read the reason and approve. Merge.', expect: 'The test pipeline is green; within two minutes the merge commit gets platform/apply: "3 policies, 1 exceptions in force".' },
      { do: 'kubectl apply -f ~/status-page.yaml again', expect: 'deployment.apps/status-page created: allowed, by an exception anyone can read in Git.' },
      { do: 'End it: one of you sets the end date to yesterday in a pull request, and the platform team approves. Then: kubectl -n teamNN-dev rollout restart deployment status-page', expect: 'The exception is gone. The old pod keeps running, but the new pods are refused. Clean up: kubectl -n teamNN-dev delete deployment status-page' },
    ],
    notes: 'Every step here was rehearsed on Kyverno 1.19. In step 6 the delegate opens the pull request that ends their exception and approves it as platform-approver: Gitea does not let anyone approve their own pull request, and only the platform team (pelab-admin, or the delegate playing platform-approver) may approve here. The check accepts a date in the past (it reports the exception as ended). The point of the last step: an expired exception does not switch anything off, it stops anything new from starting, so the team must fix the root cause before its next release. The platform applier removes expired exceptions on its own; the commit status names them ("expired, not applied: ..."). Exceptions only count in the pelab-exceptions namespace, which only the platform writes to, so a delegate cannot grant themselves one with kubectl.',
  },
  {
    type: 'quiz', section: 'Close',
    questions: [
      'What is the difference between continuous integration and continuous delivery?',
      'Name three checks the pipeline runs and what mistake each one catches.',
      'What is an SBOM, and what question does it answer in a hurry?',
      'What makes a policy "as code" rather than a rule in a document?',
      'What must an exception always have, and why?',
    ],
    notes: 'Answers. 1: CI merges and checks every change at once; CD packages every checked change so it can be deployed at any time. 2: Any three of: lint (sloppy code), tests (broken behaviour), secret scan (passwords), Dockerfile check (unsafe images), image scan (known vulnerabilities). 3: The ingredients list of an image; "are we affected by this vulnerability?" 4: It is a file in Git, reviewed, tested with good and bad examples, enforced automatically, with an explainable message. 5: A scope, a reason, an approver and an end date; without the end date it is a permanent change to the rule.',
  },
  {
    type: 'recap', section: 'Close',
    highlight: ['Workspace', 'Portal', 'Template', 'Repository', 'Pipeline', 'Registry', 'GitOps', 'Environments'],
    built: [
      'Explain CI/CD, DevSecOps and the supply chain in plain words',
      'Read a pipeline run and find the image tag, the scan and the SBOM',
      'Make the pipeline fail with a bad test, a secret and a root user, and fix each',
      'Watch the guardrails refuse a bad deployment, and test a policy with the CLI',
      'Ask for a time-limited exception, get it approved, and see it expire',
    ],
    tomorrow: 'Deploy, observe and the capstone. You will promote hello to staging and then prod by pull request, read the dashboard, load-test staging, break and recover a service, and present your team\'s service with its evidence pack.',
    notes: 'Every piece of the platform except Observe has now been used and explained. Tomorrow completes the path and the course.',
  },
];
