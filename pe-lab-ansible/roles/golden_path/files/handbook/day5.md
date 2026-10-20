# Day 5: CI/CD, testing and security

**Goal:** Read a pipeline and its results, fix a failing check, and explain how guardrails and evidence protect production.

By the end of the day you can:

- Explain CI/CD, DevSecOps and the software supply chain in plain words
- Read the pipeline, make it fail three different ways, and fix it
- See the guardrails reject a bad deployment, read a policy, and test one yourself

## CI/CD

### CI/CD in plain words

A pipeline is a checklist that runs itself on every change. Continuous integration: every change is merged often and checked at once. Continuous delivery: every checked change is packaged so it can be deployed at any time.

The checklist is code too (ci.yaml, in the repository), so it is reviewed, versioned and the same for everyone. Runners are the machines that execute it.

On a pull request the pipeline checks; on main it also builds and pushes the image. Nothing reaches the registry without passing every check.

> **In one sentence:** A pipeline is a checklist that runs itself on every change, written as code, the same for every team.

**In the lab**

- The pipeline is Gitea Actions; the file is .gitea/workflows/ci.yaml.
- Five runners on the lab server execute the jobs for all teams.
- The steps: lint, unit tests, secret scan, Dockerfile check, deployment check, build, image scan, push.
- Push happens only on main, never from a pull request.

### What the pipeline does on every change

1. Checkout
2. Lint
3. Unit tests
4. Secret scan
5. Dockerfile check
6. Build image
7. Image scan + SBOM
8. Push (main only)

A pull request runs steps 1 to 7 and stops. A merge to main runs all eight; the pushed image is what Argo CD deploys.

## DevSecOps

### DevSecOps and the software supply chain

DevSecOps means the security checks run inside the pipeline on every change, instead of a security review at the end. Problems are found in minutes, by the person who can fix them.

The supply chain is everything that goes into your image: the base image, the packages, your code, the build itself. Most vulnerabilities come from ingredients you did not write.

An SBOM (software bill of materials) is the ingredients list. A vulnerability scan compares the list against known problems. Together they answer "what is inside, and is any of it known to be bad?"

> **In one sentence:** DevSecOps puts the security checks in the pipeline; the SBOM and scan tell you what is in your image and whether it is safe.

**In the lab**

- gitleaks looks for secrets in the code and its history.
- hadolint checks the Dockerfile against good practice.
- Trivy scans the built image; Harbor scans it again on push and generates the SBOM.
- Signing (optional) proves the pipeline, not a person, produced the image.

## CI/CD

### The pipeline file, shortened

```
# .gitea/workflows/ci.yaml  (the shape of it)
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
  - Push:             docker push $IMAGE    (main only)
```

- on: when it runs. workflow_dispatch means you can also run it by hand.
- IMAGE: the registry, your repository name and the commit id. That is the tag.
- Each step is one tool with one job. If any step fails, the run is red and the push never happens.
- The real file is about 60 lines; this is the shape of it.

## Lab 1: read and run the pipeline

### Lab 1: read the pipeline and its evidence

*30 min*

**What you do:** Read what the pipeline did to your last change, and find the evidence it left: test results, a secret scan, an image, a vulnerability report and an SBOM.

**Before you start:** Sign in to Gitea and Harbor as studentNN.

#### Step 1. Open the latest run on main

*Where: Browser: Gitea*

Open teamNN/hello → Actions. Click the newest run whose branch is main.

**You should see:** The list of steps, each green, with how long it took.

#### Step 2. Read the tests and the secret scan

*Where: Browser: Gitea*

Click the Unit tests (pytest) step to open its log, then the Secret scan (gitleaks) step.

**You should see:** "5 passed" in the tests, and "no leaks found" in the secret scan.

#### Step 3. Find the image tag

*Where: Browser: Gitea*

Open the Build the image and Push to Harbor steps. The tag is the commit id: every image says exactly which code it came from.

**You should see:** harbor.<lab domain>/teamNN/hello:&lt;a 40-character commit id>.

#### Step 4. Open the image in Harbor

*Where: Browser: Harbor*

Open https://harbor.<lab domain> → Projects → teamNN → hello. Click the newest image (its tag is the commit id you just found).

**You should see:** The vulnerability scan with a count by severity (critical, high, medium, low), and the SBOM listed with the image.

#### Step 5. Read the ingredients list (SBOM)

*Where: Browser: Harbor*

Open the SBOM and search the page for "python" (Ctrl+F).

**You should see:** The exact Python version and every package inside your image. Most of the image is not your code.

#### Step 6. Write down the evidence

*Where: Your team notes*

Copy three things: the link to the pipeline run, the image tag, and the vulnerability count.

**You should see:** Three lines for the Day 6 evidence pack.

**Done when:** You can show, for one change, its tests, secret scan, image, scan report and SBOM.

**If you are stuck**

- Harbor shows a sign-in page: sign in as studentNN with your lab password.
- No SBOM yet: Harbor makes it shortly after the image is pushed. Refresh after a minute.

## Lab 2: break it on purpose

### Lab 2: break the pipeline three ways, and fix it

*45 min*

**What you do:** Make three common mistakes on purpose (a wrong test, a password in the code, running as root) and watch the pipeline catch each one before it reaches main.

**Before you start:** Your copy of hello, on main and up to date. Keep the pull request page open: each push shows a new result there.

#### Step 1. A wrong test

*Where: Workspace terminal, then Gitea*

Make a branch and change one expected value in the tests from 200 to 201, so a test expects the wrong answer. Push and open a pull request.

```bash
cd ~/hello
git switch main && git pull
git switch -c break-things-$ME
sed -i '0,/assert status == 200/s//assert status == 201/' tests/test_main.py
git diff
git commit -am "A wrong test"
git push -u origin break-things-$ME
```

**You should see:** The pipeline turns red at Unit tests (pytest). The log names the test, with the actual and the expected value:

```
FAILED tests/test_main.py::test_root_describes_the_service - assert 200 == 201
```

#### Step 2. Fix the test

*Where: Workspace terminal*

```bash
sed -i 's/assert status == 201/assert status == 200/' tests/test_main.py
git commit -am "Fix the test"
git push
```

**You should see:** The new run on the pull request is green.

#### Step 3. A password in the code

*Where: Workspace terminal*

Add a made-up password to the code, the kind of thing people do "just to get it working".

```bash
echo 'DB_PASSWORD = "hunter2-very-secret-123"' >> app/main.py
git commit -am "Add a database password"
git push
```

**You should see:** Red at Secret scan (gitleaks): "leaks found: 1", with the rule, the file and the line. The value itself shows as REDACTED.

#### Step 4. Remove the password

*Where: Workspace terminal*

```bash
sed -i '/DB_PASSWORD/d' app/main.py
git commit -am "Remove the password"
git push
```

**You should see:** Green again.

> **Tip:** The password is still in this branch's history. A real one would now have to be changed, because Git never forgets. That is why the scan runs before anything is merged.

#### Step 5. Run as root

*Where: Workspace terminal*

Change the Dockerfile so the container runs as the administrator.

```bash
sed -i 's/^USER 10001/USER root/' Dockerfile
git commit -am "Run as root"
git push
```

**You should see:** Red at Dockerfile lint (hadolint): "DL3002 warning: Last USER should not be root".

#### Step 6. Put it right, add a test, and merge

*Where: Workspace terminal, then Gitea*

Put USER 10001 back and add one new test, for the health check. Run the tests yourself, push, get an approval and merge.

```bash
sed -i 's/^USER root/USER 10001/' Dockerfile
cat >> tests/test_main.py <<'EOF'

def test_health_check_says_ok():
    status, _, body = main.route("/healthz")
    assert status == 200
    assert body == "ok\n"
EOF
python3 -m pytest -q
git commit -am "Run as an ordinary user again, and test the health check"
git push
```

**You should see:** 6 passed, a green pipeline, and after the merge the pipeline on main pushes a new image to Harbor.

**Done when:** You saw three red runs with clear messages, fixed each one, and merged a green change with one more test.

**If you are stuck**

- Green again after removing the password, but it is still in the branch's history in Gitea: a real password would have to be changed. Delete the branch after the lab.
- Your test change did not break anything: check you changed an expected value (for example 200 to 201), not the code under test.

### Testing basics, for people who are not developers

A unit test is a small automatic check with a known answer: call /healthz, expect 200 and "ok". pytest runs every test and reports green or red.

Tests are the safety net that lets anyone change code: if the change breaks something, a test says so in seconds, before a reviewer spends time.

One test per behaviour, named for what it checks. The template ships with five; every new behaviour deserves one more.

> **In one sentence:** A test is a check with a known answer that runs itself; green means the behaviour still holds.

**In the lab**

```
def test_healthz_is_ok(client):
    code, body = client.get("/healthz")
    assert code == 200
    assert body == "ok"
```

- Run them locally: python3 -m pytest -q
- The pipeline runs the same command on every change.

## Policy-as-code

*The rules a bank would put in a policy document, written as files, kept in Git, tested, and enforced by the platform.*

### Policy-as-code in plain words

A policy document says "only approved images may run in production". A policy as code says the same thing in a file the cluster reads, and refuses anything that breaks it, every time, with a message that says how to fix it.

Because the rule is a file in Git, it is reviewed like any change, tested like code (a good example must pass, a bad one must fail), and versioned. The decision is explainable: the message names the rule.

The rule says no, not a person. That removes arguments, late-night exceptions and inconsistency.

> **In one sentence:** Policy-as-code turns a rule in a document into a file the platform enforces, explains and keeps in Git.

**In the lab**

- Kyverno checks every deployment before the cluster accepts it.
- Three rules guard the team environments: images must come from Harbor; tags must be fixed (never "latest"); every service must carry its name and owner labels.
- Each refusal message says which rule and how to fix it.
- A rule change is a pull request to the platform team.

### What a policy looks like: the trusted-registry rule

```
# platform/policies: policies/pelab-trusted-registry.yaml
# In plain words: for every Pod in a team environment, every
# image must come from harbor.<lab domain>. If not, refuse it.

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
        message: Images must come from harbor.<lab domain>.
          Build and push them with the golden-path pipeline.
        pattern:
          spec:
            containers:
              - image: "harbor.<lab domain>/*"
```

- match: where the rule applies: Pods in namespaces labelled as team environments.
- validate: what must be true: every container image starts with the Harbor address.
- failureAction Enforce: refuse, not just warn.
- message: what the person sees. Usable remediation guidance, as the brief puts it.
- The other two policies have the same shape: a tag that is not "latest"; labels for name and owner.
- Kyverno also checks Deployments with an automatic copy of each Pod rule, named autogen-harbor-only.

## Lab 3: the guardrails

### Lab 3: watch the guardrails refuse a bad deployment

*35 min*

**What you do:** Try to put a careless deployment straight into your dev environment, read the three refusals, and fix them one by one.

**Before you start:** A terminal in your workspace. kubectl already points at your team's dev namespace.

#### Step 1. Get the guardrails repository and a copy of the bad example

*Where: Workspace terminal*

platform/policies holds the guardrails and their examples. Work on a copy of the bad example with your team in it, so the repository stays as it is.

```bash
cd ~
git clone https://gitea.$DOMAIN/platform/policies
cd policies
sed "s/team01/$TEAM/g" examples/bad.yaml > ~/shortcut.yaml
cat ~/shortcut.yaml
```

**You should see:** A Deployment called shortcut in your dev namespace: image nginx:latest, and no name or owner labels.

#### Step 2. Try to deploy it

*Where: Workspace terminal*

```bash
kubectl apply -f ~/shortcut.yaml
```

**You should see:** Refused by three rules, each saying how to fix it:

```
Error from server: ... denied the request:

resource Deployment/teamNN-dev/shortcut was blocked due to the following policies

pelab-immutable-tags:
  autogen-no-latest: 'validation error: The "latest" tag is not allowed; use the commit SHA the pipeline tagged the image with. ...'
pelab-ownership-labels:
  required-labels: 'validation error: Add the labels app.kubernetes.io/name and app.kubernetes.io/part-of (your team). ...'
pelab-trusted-registry:
  autogen-harbor-only: 'validation error: Images must come from harbor.<lab domain>. Build and push them with the golden-path pipeline. ...'
```

#### Step 3. Fix the image

*Where: Workspace terminal*

Use an image from the lab registry, with a fixed tag. That answers two of the three rules.

```bash
sed -i "s#image: nginx:latest#image: harbor.$DOMAIN/dockerhub/library/python:3.12-slim#" ~/shortcut.yaml
kubectl apply -f ~/shortcut.yaml
```

**You should see:** One refusal left: pelab-ownership-labels, the labels.

#### Step 4. Add the labels

*Where: Workspace editor*

Open ~/shortcut.yaml in the editor (menu → File → Open File, then type the path /home/studentNN/shortcut.yaml).

In the first metadata block, under namespace, add the two labels below. Use your team, and the same two-space indents. Save, then apply again:

`~/shortcut.yaml (the top of the file)`:

```yaml
metadata:
  name: shortcut
  namespace: teamNN-dev
  labels:
    app.kubernetes.io/name: shortcut
    app.kubernetes.io/part-of: teamNN
```

```bash
kubectl apply -f ~/shortcut.yaml
```

**You should see:** Accepted: deployment.apps/shortcut created.

#### Step 5. Clean up, and keep the evidence

*Where: Workspace terminal*

```bash
kubectl -n $TEAM-dev delete deployment shortcut
rm ~/shortcut.yaml
```

**You should see:** deployment.apps "shortcut" deleted. Copy the three refusal messages into your team notes for the evidence pack.

**Done when:** You saw three refusals, fixed them, and removed the test deployment.

**If you are stuck**

- Error from server (Forbidden) without a policy name: check the namespace is your team's dev namespace (teamNN-dev).
- Accepted too early? Check you changed team01 to your team: the rules only apply in team namespaces.

### Lab 4: test a policy like code, with the Kyverno CLI

*25 min*

**What you do:** Check the guardrails without a cluster, the way the policies repository's pipeline does, and see that the tests catch a policy that stops working.

**Before you start:** Your copy of platform/policies (~/policies) from Lab 3, unchanged (git status shows nothing to commit).

#### Step 1. Check a good deployment

*Where: Workspace terminal*

kyverno apply runs the policies against a file, on your machine. The values file tells it that team01-dev is a team namespace, as on the cluster.

```bash
cd ~/policies
kyverno apply policies/ --resource examples/good.yaml --values-file tests/values.yaml
```

**You should see:** pass: 4, fail: 0.

#### Step 2. Check the bad one

*Where: Workspace terminal*

```bash
kyverno apply policies/ --resource examples/bad.yaml --values-file tests/values.yaml
```

**You should see:** pass: 1, fail: 3, with the same messages as on the cluster in Lab 3.

#### Step 3. Run the policy tests

*Where: Workspace terminal*

tests/kyverno-test.yaml lists what each example must get: pass, fail or skip. This is exactly what the pipeline runs on every change to the guardrails.

```bash
kyverno test tests/
```

**You should see:** Test Summary: 11 tests passed and 0 tests failed.

#### Step 4. Break a test on purpose

*Where: Workspace terminal*

Pretend the labels rule stopped refusing the shortcut: change its expected result from fail to pass, run the tests, then undo it.

```bash
sed -i '/required-labels.*shortcut/s/result: fail/result: pass/' tests/kyverno-test.yaml
kyverno test tests/
git checkout tests/kyverno-test.yaml
```

**You should see:** 1 test failed: the tests notice when a guardrail does not do what it promises.

#### Step 5. Think of one more rule

*Where: Your team*

What else would you turn into a policy in FMD? Cost (every workload has a budget), naming, data (no production data in dev), resilience (prod has at least two copies)...

**You should see:** One rule per team on the board.

**Done when:** You ran the policies and their tests on your machine and saw a broken test caught.

**If you are stuck**

- Everything shows as skipped: you left out --values-file tests/values.yaml, so the command line does not know team01-dev is a team namespace.

## Scenarios

### Scenarios: everyday mistakes the pipeline catches

| Scenario | What happens | What the platform does | The rule |
| --- | --- | --- | --- |
| The password in the code | A developer pastes a database password into main.py to get something working, and opens a pull request. | The secret scan fails the pipeline and names the file and line. The reviewer sees a red pull request and does not approve it, so the password never reaches main. | No secrets in source code. |
| What is inside the image | A reviewer asks whether the service is affected by a newly announced vulnerability in a common library. | Harbor's SBOM lists every package and version in the image; the scan shows whether the vulnerability applies and how severe it is. Answer in a minute, not a week. | Know what is inside every image. |
| Running as root | A Dockerfile is changed to run as root because "permissions were annoying". | The Dockerfile check warns in the pipeline. If it were deployed anyway, the environment refuses to start a container as root. | Least privilege for containers. |

### Scenarios: what the guardrails do

| Scenario | What happens | What the platform does | The rule |
| --- | --- | --- | --- |
| The unknown image | Someone deploys nginx:latest from the internet into dev, "just to test something". | The guardrail refuses it three times: not from Harbor, tag "latest", no owner label. Each message says how to fix it. Nothing ran. | Only trusted, versioned, owned images run. |
| Asking for an exception | A team needs an image that is not in Harbor, for a good reason and for two weeks. | They open a pull request to the platform team with the reason and an end date. Once approved, the exception applies to that image only, and expires on its own. | Exceptions are written down, approved and temporary. |
| The unsigned image (optional) | Someone pushes an image to Harbor by hand, skipping the pipeline. | With signing switched on, the pipeline signs every image it builds. The signed-images policy reports an image nobody signed. | Only the pipeline produces production images. |

### Saying yes safely: exceptions

A guardrail that can never be lifted gets worked around. A guardrail that can be lifted by anyone is not a guardrail. The answer is an exception that is written down, approved by the right person, limited in scope, and temporary.

As code, an exception is one more file in Git: which rule, for which workload, why, who approved, and when it expires. The platform applies it and removes it on the date.

The brief asks for exactly this: every exception must record scope, rationale, affected assets, residual risk, compensating controls, owner, approver, expiry and remediation plan.

> **In one sentence:** An exception is a recorded, approved, temporary yes; without an end date it is a policy change.

**In the lab**

- Request: a pull request adding exceptions/&lt;team>-&lt;what>.yaml to platform/policies.
- Contents: who, why, which rule, which workload, until when (at most 30 days).
- Checks: the pipeline refuses a request without those, or for a platform namespace.
- Approval: only the platform team; the platform applies it within two minutes.
- Expiry: after the date it is removed. Running pods keep running; new ones are refused.

## Lab 5: ask for an exception

### Lab 5: ask for an exception, and watch it expire

*25 min · per team*

**What you do:** Ask, the proper way, to break one rule for a short time: a written, reviewed, time-limited exception. Then see what happens when it expires.

**Before you start:** Your copy of platform/policies (~/policies), on main and up to date. One member of each team drives.

#### Step 1. Try the status page

*Where: Workspace terminal*

examples/status-page.yaml is a ready-made web page from Docker Hub. Make a copy with your team in it and try it.

```bash
cd ~/policies
git switch main && git pull
sed "s/team01/$TEAM/g" examples/status-page.yaml > ~/status-page.yaml
kubectl apply -f ~/status-page.yaml
```

**You should see:** Refused by pelab-trusted-registry only: the image comes from Docker Hub. Its tag and labels are fine.

#### Step 2. Write the exception request

*Where: Workspace terminal, then the editor*

Make a branch and copy the template into exceptions/, with your team and user name filled in.

Then open the new file in the editor and change the two remaining CHANGE values: the reason, in your own words, and pelab.io/expires. Use the date the last command prints: a week from today, at most 30 days.

```bash
git switch -c $TEAM-status-page
cp examples/exception-template.yaml exceptions/$TEAM-status-page.yaml
sed -i "s/team01/$TEAM/g; s/student01/$ME/" exceptions/$TEAM-status-page.yaml
date -d "+7 days" +%F
```

**You should see:** A file exceptions/teamNN-status-page.yaml with your team in its name and namespace, your user, your reason and the end date.

#### Step 3. Check it the way the pipeline will

*Where: Workspace terminal*

```bash
python3 tests/check-exceptions.py
```

**You should see:** "ok exceptions/teamNN-status-page.yaml ..., until &lt;your date>". Try a date 60 days ahead and run it again: the check refuses it. Put your date back.

#### Step 4. Propose it; the platform team approves

*Where: Workspace terminal, then Gitea*

Commit only your exception file, push, and open a pull request. The instructor reads the reason with you and approves; merge.

```bash
git add exceptions/$TEAM-status-page.yaml
git commit -m "Exception: status page for $TEAM"
git push -u origin $TEAM-status-page
```

**You should see:** The test pipeline is green. Within two minutes of the merge, the merge commit shows platform/apply "3 policies, 1 exceptions in force" (more if other teams were faster).

#### Step 5. Try the status page again

*Where: Workspace terminal*

```bash
kubectl apply -f ~/status-page.yaml
kubectl -n $TEAM-dev get pods
```

**You should see:** deployment.apps/status-page created, and its pod running. Allowed by an exception that anyone can read in Git, with a reason and an end date.

#### Step 6. End the exception, and watch what happens

*Where: Workspace terminal, Gitea, then the terminal again*

End it early, the proper way: change its end date to yesterday in a pull request. The check reports it as ended. The instructor approves; merge.

Two minutes after the merge (the commit shows platform/apply "expired, not applied: teamNN-status-page"), restart your status page and look:

```bash
cd ~/policies
git switch main && git pull
git switch -c $TEAM-status-page-end
sed -i "s/pelab.io\/expires: .*/pelab.io\/expires: \"$(date -d yesterday +%F)\"/" exceptions/$TEAM-status-page.yaml
python3 tests/check-exceptions.py
git commit -am "End the status page exception for $TEAM"
git push -u origin $TEAM-status-page-end
```

After the merge and two minutes:

```bash
kubectl -n $TEAM-dev rollout restart deployment status-page
sleep 20
kubectl -n $TEAM-dev get replicasets,pods
kubectl -n $TEAM-dev describe replicasets | grep "Error creating"
```

**You should see:** The old pod keeps running, but the new ReplicaSet has 0 pods: "Error creating: admission webhook ... denied the request". An expired exception does not switch anything off; it stops anything new starting until the root cause is fixed.

> **Tip:** Clean up: kubectl -n $TEAM-dev delete deployment status-page, then rm ~/status-page.yaml.

**Done when:** You have seen an exception requested, checked, approved, used and expired, all on record in Git.

**If you are stuck**

- check-exceptions.py says the date is too far ahead: at most 30 days from today.
- Still refused after the merge: wait for the platform/apply status (two minutes), and check the namespace and name in your exception match the deployment.

### Check your understanding

1. What is the difference between continuous integration and continuous delivery?
2. Name three checks the pipeline runs and what mistake each one catches.
3. What is an SBOM, and what question does it answer in a hurry?
4. What makes a policy "as code" rather than a rule in a document?
5. What must an exception always have, and why?

### What we built today

You can now:

- Explain CI/CD, DevSecOps and the supply chain in plain words
- Read a pipeline run and find the image tag, the scan and the SBOM
- Make the pipeline fail with a bad test, a secret and a root user, and fix each
- Watch the guardrails refuse a bad deployment, and test a policy with the CLI
- Ask for a time-limited exception, get it approved, and see it expire

**Tomorrow:** Deploy, observe and the capstone. You will promote hello to staging and then prod by pull request, read the dashboard, load-test staging, break and recover a service, and present your team's service with its evidence pack.

---

[Day 4](day4.md) · [Contents](README.md) · [Day 51](day51.md)
