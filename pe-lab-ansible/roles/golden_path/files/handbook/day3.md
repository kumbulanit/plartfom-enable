# Day 3: Infrastructure as Code from a template

**Goal:** Describe infrastructure in code, read a plan, and request your team's staging and prod environments from the environment template.

By the end of the day you can:

- Explain Infrastructure as Code: plan, apply, destroy, state and drift
- Run OpenTofu yourself on a small example
- Request staging and prod from the template, by pull request, and see them appear

## Infrastructure as Code

### Infrastructure as Code in plain words

Instead of clicking through screens or typing commands, you write down what you want: "a namespace called team01-staging with a budget of 1 CPU". The tool works out the steps.

Plan shows what would change, before anything changes. Apply makes it so. Destroy removes everything the code created. State is the tool's memory of what it built.

Drift is when reality no longer matches the code, because someone changed something by hand. The next plan shows the drift, and apply puts it back.

> **In one sentence:** Infrastructure as Code means you write what you want, the tool makes it so, and the code is the record.

**In the lab**

- The tool is OpenTofu: the open-source version of Terraform, same language, same commands.
- The whole lab was built this way too, with Ansible: one command rebuilds the entire platform.
- Your environments live in the platform/environments repository.
- Every change to them is a pull request with a plan attached, approved by the platform team.

### The Infrastructure as Code loop

1. Write the code
2. tofu init
3. tofu plan
4. Review the plan
5. tofu apply
6. Change the code
7. tofu plan again
8. tofu destroy

The plan is the control point: it is what a reviewer reads in the pull request before approving. Nothing changes until apply.

### Why a bank wants infrastructure as code

Repeatable: the same code gives the same environment every time, in every region, for every team. No more "the test server is slightly different".

Reviewable: an environment change is a pull request with a plan. The reviewer sees exactly what will be created, changed or destroyed.

Auditable and recoverable: the history shows every change and its approval; if an environment is lost, apply rebuilds it.

> **In one sentence:** Code is the only way to make 25 environments identical, reviewed and rebuildable.

**Live demo**

- The instructor shows the playbook that built this lab: ansible-playbook site.yml.
- Roles for the host, the containers, the cluster, each platform service and each team.
- One command, one pinned list of versions, the same result on every run.
- This is the brief's "environment can be safely destroyed and recreated".

## Lab 1: warm-up

### Your first OpenTofu file: five lines that create a file

```
# ~/day3/main.tf
terraform {
  required_providers {
    local = { source = "hashicorp/local" }
  }
}

resource "local_file" "note" {
  filename = "${path.module}/note.txt"
  content  = "Built by code, not by hand."
}
```

- The first block says which plug-in (provider) we need: "local" knows how to manage files on this machine.
- resource "local_file" "note" declares one thing we want to exist: a file, which we will call "note" in the code.
- filename and content are its settings. Change the content and the next plan replaces the file (-/+): a file cannot be edited in place.
- No steps, no commands: only what should exist. OpenTofu works out how.

### Lab 1: plan, apply, change, destroy

*30 min*

**What you do:** Use OpenTofu on something tiny and harmless, a file in your workspace, to learn the four moves of Infrastructure as Code: plan, apply, change and destroy.

**Before you start:** A terminal in your workspace. Nothing here touches anything shared.

#### Step 1. Write the code

*Where: Workspace terminal*

This writes main.tf, the file from the slide: one provider (local, which manages files) and one resource (a file called note.txt). You can also type it in the editor.

```bash
mkdir -p ~/day3 && cd ~/day3
cat > main.tf <<'EOF'
terraform {
  required_providers {
    local = { source = "hashicorp/local" }
  }
}

resource "local_file" "note" {
  filename = "${path.module}/note.txt"
  content  = "Built by code, not by hand."
}
EOF
ls
```

**You should see:** One file: main.tf.

#### Step 2. Prepare the folder: tofu init

*Where: Workspace terminal*

init fetches the provider the code asks for. Your workspace has a local copy, so this needs no internet.

```bash
tofu init
```

**You should see:** "OpenTofu has been successfully initialized!" and a hidden .terraform folder holding the provider.

#### Step 3. See what would happen: tofu plan

*Where: Workspace terminal*

plan compares the code with reality and lists what it would do, without doing anything. + means "will be created".

```bash
tofu plan
```

**You should see:** The file with its settings marked +, and the summary line:

```
  # local_file.note will be created
  + resource "local_file" "note" {
      + content  = "Built by code, not by hand."
      + filename = "./note.txt"
      ...
Plan: 1 to add, 0 to change, 0 to destroy.
```

#### Step 4. Make it so: tofu apply

*Where: Workspace terminal*

apply shows the same plan and asks for confirmation. Type yes and press Enter. Then look at the result.

```bash
tofu apply
cat note.txt
ls
```

**You should see:** Apply complete! Resources: 1 added. note.txt holds the text, and a terraform.tfstate file appeared: OpenTofu's memory of what it built.

#### Step 5. Change the code, and plan again

*Where: Workspace terminal*

Change the text in main.tf (here with sed; the editor works too), then plan and apply.

A file cannot be edited in place, so OpenTofu replaces it: -/+ and "forces replacement". Other things, like the budgets you request this afternoon, change in place and show ~ instead. Read the symbols, not only the summary.

```bash
sed -i 's/Built by code, not by hand./Changed by code./' main.tf
tofu plan
tofu apply
```

**You should see:** The plan says the file must be replaced:

```
  # local_file.note must be replaced
-/+ resource "local_file" "note" {
      ~ content = "Built by code, not by hand." -> "Changed by code." # forces replacement
      ...
Plan: 1 to add, 0 to change, 1 to destroy.
```

#### Step 6. Break it by hand, let the code repair it, then destroy

*Where: Workspace terminal*

Delete the file by hand, the way someone might "tidy up" a server. The next plan notices that reality no longer matches the code: that is drift. apply puts it back.

Finally destroy removes everything the code created (type yes).

```bash
rm note.txt
tofu plan
tofu apply
cat note.txt
tofu destroy
ls
```

**You should see:** The plan says "will be created" again (1 to add); apply brings the file back; destroy says "Destroy complete! Resources: 1 destroyed." and note.txt is gone.

**Done when:** You have planned, applied, changed, repaired and destroyed a resource using only code.

**If you are stuck**

- tofu init cannot find the provider: check the spelling of hashicorp/local. The workspace has a local copy of it.
- tofu apply waits for an answer: type yes and press Enter.

## Environments

### Environments: dev, staging and prod

An environment is a fenced area where one copy of your application runs: it has its own address, its own settings, a budget of CPU and memory, access rules and network rules.

dev is where every merge lands automatically, for the team to see its work. staging is where a release is checked before production. prod is what users rely on; it changes only through an approved promotion.

The application is identical in all three. Only its settings differ, which is why hello can tell you which environment it is in.

> **In one sentence:** An environment is a fenced area with a budget and rules; the same app runs in all three with different settings.

**In the lab**

- On the cluster, an environment is a namespace: teamNN-dev, teamNN-staging, teamNN-prod.
- Each has a ResourceQuota (the budget), default limits, network policy and access rules.
- dev was created with the lab. Staging and prod you request today.
- The team can change dev and staging; prod is read-only for people. Only the platform deploys there.

### The environment template

The platform team wrote one OpenTofu module, team-environment, that knows how to build a correct environment: namespace, labels, budget, limits, network policy, access rules.

A team never writes those details. It writes six lines naming the module, the team, which environments it wants and a size. The module does the rest.

The pull request shows the plan. Only the platform team can approve it; after the merge the platform applies main itself, within two minutes. That is self-service with guardrails.

> **In one sentence:** The environment template turns a correct, approved environment into six lines any team can write.

**In the lab**

```
module "team01" {
  source = "./modules/team-environment"
  team   = "team01"
  environments = ["staging", "prod"]
  size   = "small"
}
```

- size = small gives 1 CPU and 2 GiB per environment; medium gives double.
- Everything else is decided by the module, the same for every team.

## Lab 2: request staging and prod

### Lab 2: request staging and prod from the template

*45 min · per team*

**What you do:** Get your team's staging and prod environments the platform way: fill in the environment template, open a pull request, read the plan, and let the platform team approve and apply it.

**Before you start:** One member of each team drives; the others watch the plan with them. The platform team (the instructor) approves.

#### Step 1. Copy the environments repository and make a branch

*Where: Workspace terminal*

platform/environments holds every team's environment request. Everyone may propose a change; only the platform team may approve it.

```bash
cd ~
git clone https://gitea.$DOMAIN/platform/environments
cd environments
git switch -c $TEAM-environments
ls
```

**You should see:** main.tf, modules (the template) and team00.tf.example:

```
README.md  main.tf  modules  team00.tf.example
```

#### Step 2. Fill in the template: six lines

*Where: Workspace terminal*

Copy the example under your team's name and put your team in it. The file asks the template for two environments, staging and prod, in the small size.

```bash
cp team00.tf.example $TEAM.tf
sed -i "s/team00/$TEAM/g" $TEAM.tf
cat $TEAM.tf
git status
```

**You should see:** Your team's module, and one new file in git status:

```
module "team03" {
  source       = "./modules/team-environment"
  team         = "team03"
  environments = ["staging", "prod"]
  size         = "small"
}
```

#### Step 3. Propose it, and read the plan

*Where: Workspace terminal, then Gitea*

Commit, push and open a pull request in Gitea (use the link git push prints). The plan pipeline starts by itself.

In the pull request, click the pipeline's details (or Actions → plan), then the Plan step. Read the summary line first, then the list.

```bash
git add $TEAM.tf
git commit -m "Request staging and prod for $TEAM"
git push -u origin $TEAM-environments
```

**You should see:** "Plan: 16 to add, 0 to change, 0 to destroy." That is two namespaces, each with a budget (quota), defaults, four network rules and your team's access. Nothing exists yet: the plan only reads.

#### Step 4. The platform team approves, and you merge

*Where: Gitea*

Ask the instructor to review. A teammate's approval does not count here: only the platform team may approve environment changes. Once approved, merge.

**You should see:** Within two minutes the merge commit gets a green tick: platform/apply "Applied: 16 added, 0 changed, 0 destroyed". The platform applied main itself; nobody ran a command on the cluster.

#### Step 5. Look at your new environment

*Where: Workspace terminal*

The quota is the environment's budget; the limit range gives every container sensible defaults.

```bash
kubectl -n $TEAM-staging get resourcequota,limitrange
kubectl get namespaces | grep $TEAM
```

**You should see:** team-quota with requests.cpu 0/1 and requests.memory 0/2Gi, the limit range team-defaults, and three namespaces: dev, staging and prod.

#### Step 6. See your service find its new homes

*Where: Browser: Argo CD*

Argo CD had been trying to deploy hello to staging and prod since Day 1, and kept retrying because they did not exist. Open teamNN-hello-staging and teamNN-hello-prod.

**You should see:** They stop retrying and show Synced, with 0 replicas: nothing is released there until Day 6.

> **Tip:** If the safety net is on: kubectl -n $TEAM-staging get deployments shows hello with 0/0, and the latest hello commit in Gitea shows safety-net/staging "Deployed to teamNN-staging: not-released-yet, 0 replicas".

**Done when:** Your team has teamNN-staging and teamNN-prod, created by an approved pull request, and the plan is your design record.

**If you are stuck**

- The plan says "Invalid value for variable": the message says what to fix (the team name, the environments or the size).
- The plan pipeline fails before the plan with an access error: tell the instructor (the read-only credentials).
- Merge stays grey: only the platform team (the instructor) can approve this repository.
- No platform/apply status after five minutes: tell the instructor (the platform applier on the lab host).

### Who may change the cluster

Plan in the pipeline, apply by the platform. The pipeline in your pull request can only read; the credentials that change the cluster never leave the platform.

- **The plan pipeline reads:** Its credentials can see namespaces, budgets and the OpenTofu state, and change nothing. Anyone can open a pull request; nothing happens until it is approved and merged.
- **The platform team approves:** Only the platform team may approve changes to environments. A teammate's approval does not count: segregation of duties for infrastructure.
- **The platform applies main:** Every two minutes the platform applies the approved state of main with its own credentials, and reports the result on the commit as platform/apply.
- **Drift is put back:** Because it applies every two minutes, a change made by hand is reverted to what the code says. The code is the only way in.

## Lab 3: drift and rebuild

### Lab 3: drift, and destroy and recreate

*30 min*

**What you do:** See the platform notice and repair a change made by hand, and see that a whole environment can be removed and rebuilt identically, from code only.

**Before you start:** Lab 2 done: your staging exists. Keep your copy of platform/environments.

#### Step 1. The instructor changes your quota by hand

*Where: Instructor, then your workspace terminal*

The instructor pauses the platform's automatic repairs for a few minutes, then raises your staging CPU budget directly on the cluster, the way a well-meaning administrator might. Look at it:

```bash
kubectl -n $TEAM-staging get resourcequota team-quota -o jsonpath='{.spec.hard.requests\.cpu}{"\n"}'
```

**You should see:** 5 instead of 1. Reality no longer matches the code.

#### Step 2. Detect the drift with a plan

*Where: Browser: Gitea*

Open platform/environments → Actions → plan → Run workflow, keep the branch main, and run it. Open the new run and its Plan step.

**You should see:** "Plan: 0 to add, 1 to change, 0 to destroy." The ~ line shows the quota going back from 5 to 1. This is drift, detected.

#### Step 3. Let the platform repair it

*Where: Workspace terminal*

When every team has seen its plan, the instructor switches the repairs back on. The platform re-applies main every two minutes. Wait, then look again.

```bash
sleep 120
kubectl -n $TEAM-staging get resourcequota team-quota -o jsonpath='{.spec.hard.requests\.cpu}{"\n"}'
```

**You should see:** 1 again. The latest commit on main shows platform/apply "Applied: 0 added, 1 changed, 0 destroyed": the repair is on record.

#### Step 4. Propose removing staging, and read the plan

*Where: Workspace terminal, then Gitea*

Take the latest main, make a branch, and remove "staging" from your list. Push and open a pull request.

```bash
cd ~/environments
git switch main && git pull
git switch -c $TEAM-remove-staging
sed -i 's/\["staging", "prod"\]/["prod"]/' $TEAM.tf
git diff
git commit -am "Remove staging for $TEAM"
git push -u origin $TEAM-remove-staging
```

**You should see:** The plan in the pull request: "Plan: 0 to add, 0 to change, 8 to destroy." A reviewer sees exactly what would disappear before it does.

#### Step 5. Remove it, then bring it back

*Where: Gitea, then the workspace terminal*

The instructor approves; merge it. Check staging is gone. Then put it back the same way, with a second pull request.

```bash
kubectl get namespace $TEAM-staging
git switch main && git pull
git switch -c $TEAM-add-staging
sed -i 's/\["prod"\]/["staging", "prod"]/' $TEAM.tf
git commit -am "Add staging back for $TEAM"
git push -u origin $TEAM-add-staging
```

**You should see:** First "NotFound" (staging is gone). After the second pull request is approved and merged, staging is back within two minutes, identical to before: same budget, same rules, same access. Nothing was done by hand.

**Done when:** You have seen drift detected and repaired, and staging destroyed and recreated, each with a plan and an approval on record.

**If you are stuck**

- The quota did not come back yet: the platform applies every two minutes. Wait for the next run.
- A destroy plan you did not expect: do not merge it. Ask the instructor to look at the plan with you.

## Budgets

### Budgets: FinOps starts in the template

Every environment has a budget: how much CPU and memory it may request in total, and what a container gets if it does not say. On the cluster these are the ResourceQuota and the LimitRange.

Budgets make sharing fair, stop one team from starving the others, and make cost visible per team and per environment.

The size setting in the template is the simplest FinOps control: a team picks small or medium, and the cost of that choice is known before anything runs.

> **In one sentence:** A budget in the template means cost and fairness are decided before the first container runs.

**In the lab**

- small: 1 CPU and 2 GiB requested per environment; medium: double.
- A deployment that asks for more than the budget is refused. You will see this on Day 6.
- Containers without limits get the defaults from the LimitRange.
- The dashboard on Day 6 shows how much of the budget each environment uses.

### What the plan tells a reviewer, and an auditor

- **+ to add:** New things that will exist after apply. For an environment request: namespaces, quotas, policies, role bindings, each with its settings.
- **~ to change:** Existing things whose settings will change, shown old to new. This is how drift and size changes appear.
- **- to destroy:** Things that will be removed. The blast radius of the change, visible before approval.
- **The record:** The plan in the pull request, the approval, the apply log and the Git history together answer: what changed, who asked, who approved, when it happened.

### Check your understanding

1. What is the difference between plan and apply, and which one would you show an auditor?
2. What is drift, and how did you detect and fix it today?
3. Why does the team write six lines instead of the whole environment definition?
4. Why is prod read-only for people, and how does a change still reach it?
5. What does size = "small" decide, and why is that a cost control?

### What we built today

You can now:

- Explain plan, apply, destroy, state and drift
- Run OpenTofu on your own small example
- Request staging and prod from the environment template by pull request
- Read a plan the way a reviewer and an auditor would
- Say what a budget is and why it lives in the template

**Tomorrow:** Containers. You will build the hello image with Docker, run it with different settings, and then create a brand-new service from the packaging template and see it appear in the catalog and in dev.

---

[Day 2](day2.md) · [Contents](README.md) · [Day 31](day31.md)
