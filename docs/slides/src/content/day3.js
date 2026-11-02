// Day 3: Infrastructure as Code from a template
'use strict';
const DOMAIN = '<lab domain>';

module.exports = [
  {
    type: 'title', section: 'Opening',
    title: 'Infrastructure as Code from a template',
    subtitle: 'Get an environment by writing a few lines of code and opening a pull request, not by raising a ticket.',
    highlight: ['Environments', 'Template'],
    notes: 'Today the delegates get their staging and prod environments. Not from the instructor, and not from a ticket: from a template, by pull request, with an approval. The morning teaches the idea with a tiny OpenTofu exercise; the afternoon uses the real environment template.',
  },
  {
    type: 'goal', section: 'Opening',
    goal: 'Describe infrastructure in code, read a plan, and request your team\'s staging and prod environments from the environment template.',
    outcomes: [
      'Explain Infrastructure as Code: plan, apply, destroy, state and drift',
      'Run OpenTofu yourself on a small example',
      'Request staging and prod from the template, by pull request, and see them appear',
    ],
    highlight: ['Environments', 'Template'],
    notes: 'The outcome that matters for the brief is the third: a "secure landing zone" provisioned from reusable modules, repeatably, with evidence (the plan) and a teardown (destroy).',
  },
  {
    type: 'agenda', section: 'Opening',
    title: "Today's plan",
    bridge: 'Yesterday your change reached dev through a pull request. Today the infrastructure gets the same treatment: your team\'s staging and prod, requested as code.',
    notes: 'Same loop as yesterday (branch, pull request, review, merge), now for infrastructure. Lab 1 is a harmless warm-up; Lab 2 is the real request.',
  },
  {
    type: 'concept', section: 'Infrastructure as Code',
    title: 'Infrastructure as Code in plain words',
    icon: 'FiFileText',
    idea: [
      'Instead of clicking through screens or typing commands, you write down what you want: "a namespace called team01-staging with a budget of 1 CPU". The tool works out the steps.',
      'Plan shows what would change, before anything changes. Apply makes it so. Destroy removes everything the code created. State is the tool\'s memory of what it built.',
      'Drift is when reality no longer matches the code, because someone changed something by hand. The next plan shows the drift, and apply puts it back.',
    ],
    lab: [
      'The tool is OpenTofu: the open-source version of Terraform, same language, same commands.',
      'The whole lab was built this way too, with Ansible: one command rebuilds the entire platform.',
      'Your environments live in the platform/environments repository.',
      'Every change to them is a pull request with a plan attached, approved by the platform team.',
    ],
    oneLiner: 'Infrastructure as Code means you write what you want, the tool makes it so, and the code is the record.',
    notes: 'The four words to land: plan, apply, destroy, drift. Use a bank analogy: a standing instruction versus phoning the branch each month. The brief asks for "repeatable deployment", "no critical control failure" and "environment can be safely destroyed and recreated"; all three come directly from this way of working.',
  },
  {
    type: 'flow', section: 'Infrastructure as Code',
    title: 'The Infrastructure as Code loop',
    figure: { src: 'iac-loop.svg', caption: 'plan compares the code with what exists; apply makes them match; a change by hand (drift) shows up in the next plan.' },
    steps: ['Write the code', 'tofu init', { text: 'tofu plan', highlight: true }, 'Review the plan', 'tofu apply', 'Change the code', 'tofu plan again', 'tofu destroy'],
    caption: 'The plan is the control point: it is what a reviewer reads in the pull request before approving. Nothing changes until apply.',
    notes: 'init downloads the providers (the plug-ins that know how to talk to Kubernetes, a cloud, or a file system). plan is read-only. apply changes things. destroy is the undo. Say clearly that destroy is a feature, not a danger: environments that can be destroyed and recreated are environments nobody is afraid to change.',
  },
  {
    type: 'concept', section: 'Infrastructure as Code',
    title: 'Why a bank wants infrastructure as code',
    icon: 'FiShield',
    idea: [
      'Repeatable: the same code gives the same environment every time, in every region, for every team. No more "the test server is slightly different".',
      'Reviewable: an environment change is a pull request with a plan. The reviewer sees exactly what will be created, changed or destroyed.',
      'Auditable and recoverable: the history shows every change and its approval; if an environment is lost, apply rebuilds it.',
    ],
    labTitle: 'Live demo',
    lab: [
      'The instructor shows the playbook that built this lab: ansible-playbook site.yml.',
      'Roles for the host, the containers, the cluster, each platform service and each team.',
      'One command, one pinned list of versions, the same result on every run.',
      'This is the brief\'s "environment can be safely destroyed and recreated".',
    ],
    oneLiner: 'Code is the only way to make 25 environments identical, reviewed and rebuildable.',
    notes: 'Keep the demo to the structure: show site.yml, the roles folder and versions.yml. Do not run it (it takes a long time and disrupts the lab). The lesson: everything they use this week was created from code, which is why it can be reset between cohorts.',
  },
  {
    type: 'code', section: 'Lab 1: warm-up',
    title: 'Your first OpenTofu file: five lines that create a file',
    code: `# ~/day3/main.tf
terraform {
  required_providers {
    local = { source = "hashicorp/local" }
  }
}

resource "local_file" "note" {
  filename = "\${path.module}/note.txt"
  content  = "Built by code, not by hand."
}`,
    notesRight: [
      'The first block says which plug-in (provider) we need: "local" knows how to manage files on this machine.',
      'resource "local_file" "note" declares one thing we want to exist: a file, which we will call "note" in the code.',
      'filename and content are its settings. Change the content and the next plan replaces the file (-/+): a file cannot be edited in place.',
      'No steps, no commands: only what should exist. OpenTofu works out how.',
    ],
    notes: 'Type it live, slowly. The point is the shape of every IaC file: providers, then resources with settings. The environment template this afternoon has the same shape, with Kubernetes resources instead of a file.',
  },
  {
    type: 'steps', section: 'Lab 1: warm-up', time: '30 min',
    title: 'Lab 1: plan, apply, change, destroy',
    steps: [
      { do: 'mkdir -p ~/day3 && cd ~/day3, then create main.tf with the code from the previous slide.', expect: 'One file, main.tf.' },
      { do: 'tofu init', expect: '"OpenTofu has been successfully initialized" and a .terraform folder with the provider.' },
      { do: 'tofu plan', expect: 'Plan: 1 to add, 0 to change, 0 to destroy, and the file\'s settings listed with + signs.' },
      { do: 'tofu apply (type yes), then cat note.txt', expect: 'The file exists with your text. A terraform.tfstate file appeared: the memory.' },
      { do: 'Change the content in main.tf. tofu plan, then tofu apply.', expect: 'Plan: 1 to add, 0 to change, 1 to destroy. -/+ and "forces replacement": the file is deleted and created again with the new text.' },
      { do: 'Delete note.txt by hand (rm note.txt), then tofu plan, and tofu apply to put it back. Finally tofu destroy.', expect: 'The plan sees the file is missing (drift) and creates it again. destroy removes the file and empties the state.' },
    ],
    notes: 'Step 5: a file cannot be edited in place, so the plan shows -/+ (replace). This afternoon\'s quota changes in place (~): read the symbol, not only the summary. Step 6 is the drift demonstration in miniature. If tofu init cannot download the provider, the lab\'s provider mirror is not reachable; the lab assistant checks the dry-run notes. Everything here runs inside the workspace and touches nothing shared.',
  },
  {
    type: 'section', section: 'Environments',
    title: 'Environments',
    subtitle: 'You have used OpenTofu on a file. Now the same four moves on real infrastructure: request your team\'s staging and prod from the environment template (Lab 2), then see drift found and an environment rebuilt from code (Lab 3).',
    notes: 'Bridge from the warm-up: the file was harmless practice; the next plan creates real namespaces, quotas and access for the team.',
  },
  {
    type: 'concept', section: 'Environments',
    title: 'Environments: dev, staging and prod',
    icon: 'FiLayers',
    idea: [
      'An environment is a fenced area where one copy of your application runs: it has its own address, its own settings, a budget of CPU and memory, access rules and network rules.',
      'dev is where every merge lands automatically, for the team to see its work. staging is where a release is checked before production. prod is what users rely on; it changes only through an approved promotion.',
      'The application is identical in all three. Only its settings differ, which is why hello can tell you which environment it is in.',
    ],
    lab: [
      'On the cluster, an environment is a namespace: teamNN-dev, teamNN-staging, teamNN-prod.',
      'Each has a ResourceQuota (the budget), default limits, network policy and access rules.',
      'dev was created with the lab. Staging and prod you request today.',
      'The team can change dev and staging; prod is read-only for people. Only the platform deploys there.',
    ],
    oneLiner: 'An environment is a fenced area with a budget and rules; the same app runs in all three with different settings.',
    notes: 'Make the governance point: prod being read-only for people is not distrust, it is the brief\'s "least privilege" and "controlled promotion". Deployments to prod happen through Git and Argo CD, which keeps the evidence.',
  },
  {
    type: 'concept', section: 'Environments',
    title: 'The environment template',
    figure: { src: 'env-request.svg', caption: 'A request is a pull request with a plan; the platform team approves; only the platform applier changes the cluster.' },
    icon: 'FiCopy',
    idea: [
      'The platform team wrote one OpenTofu module, team-environment, that knows how to build a correct environment: namespace, labels, budget, limits, network policy, access rules.',
      'A team never writes those details. It writes six lines naming the module, the team, which environments it wants and a size. The module does the rest.',
      'The pull request shows the plan. Only the platform team can approve it; after the merge the platform applies main itself, within two minutes. That is self-service with guardrails.',
    ],
    labCode: `module "team01" {
  source = "./modules/team-environment"
  team   = "team01"
  environments = ["staging", "prod"]
  size   = "small"
}`,
    lab: [
      'size = small gives 1 CPU and 2 GiB per environment; medium gives double.',
      'Everything else is decided by the module, the same for every team.',
    ],
    oneLiner: 'The environment template turns a correct, approved environment into six lines any team can write.',
    notes: 'This is "architecting a golden path" for infrastructure: the hard, risky part (what a safe environment looks like) is done once by the platform team and reviewed by security; the easy part (asking for one) is left to the teams. Compare with the ticket: a form that goes to a person who does it by hand, differently each time.',
  },
  {
    type: 'steps', section: 'Lab 2: request staging and prod', time: '45 min · per team',
    title: 'Lab 2: request staging and prod from the template',
    steps: [
      { do: `git clone https://gitea.${DOMAIN}/platform/environments && cd environments && git switch -c teamNN-environments`, expect: 'main.tf, a modules/team-environment folder and team00.tf.example.' },
      { do: 'cp team00.tf.example teamNN.tf, then replace team00 with your team in both places.', expect: 'One new file of six lines (git status shows it).' },
      { do: 'git add teamNN.tf, commit, push, and open a pull request. Open its plan pipeline run.', expect: 'Plan: 16 to add, 0 to change, 0 to destroy: two namespaces, each with a budget, defaults, four network rules and access.' },
      { do: 'Approve as the platform team (platform-approver, in a private window); your own or the reviewer\'s approval does not count here. Merge.', expect: 'Within two minutes the merge commit gets a green platform/apply status: "Applied: 16 added".' },
      { do: 'kubectl -n teamNN-staging get resourcequota,limitrange', expect: 'team-quota with requests.cpu 0/1 and requests.memory 0/2Gi, and team-defaults.' },
      { do: 'Open Argo CD: teamNN-hello-staging and teamNN-hello-prod.', expect: 'They stop retrying and show Synced, with 0 replicas until Day 6\'s promotion.' },
    ],
    notes: 'One pull request per delegate, on their own VM. The plan is the evidence the brief asks for in Lab 3: a design record of exactly what will be created. Neither the delegate nor the reviewer login can approve: only the platform team can (Gitea approval whitelist: pelab-admin and, for role-play, platform-approver, which each delegate signs in as), which is the separation of duties the brief requires for infrastructure. Keep the pull request link and the platform/apply status for the evidence pack. If the plan fails with "Invalid value for variable", the message says exactly what to fix (team name, environments or size).',
  },
  {
    type: 'rows', section: 'Lab 2: request staging and prod',
    title: 'Who may change the cluster',
    intro: 'Plan in the pipeline, apply by the platform. The pipeline in your pull request can only read; the credentials that change the cluster never leave the platform.',
    rows: [
      { icon: 'FiEye', head: 'The plan pipeline reads', text: 'Its credentials can see namespaces, budgets and the OpenTofu state, and change nothing. Anyone can open a pull request; nothing happens until it is approved and merged.' },
      { icon: 'FiUserCheck', head: 'The platform team approves', text: 'Only the platform team may approve changes to environments. The person who asks cannot approve: segregation of duties for infrastructure.' },
      { icon: 'FiRefreshCw', head: 'The platform applies main', text: 'Every two minutes the platform applies the approved state of main with its own credentials, and reports the result on the commit as platform/apply.' },
      { icon: 'FiShield', head: 'Drift is put back', text: 'Because it applies every two minutes, a change made by hand is reverted to what the code says. The code is the only way in.' },
    ],
    notes: 'This is a deliberate design choice worth explaining to a bank audience: if the pipeline that runs on a pull request could change the cluster, anyone who can open a pull request could change the cluster by editing the pipeline. Keeping the write credentials with the platform, and applying only what is approved on main, is the pattern behind tools like Atlantis and Argo CD.',
  },
  {
    type: 'steps', section: 'Lab 3: drift and rebuild', time: '30 min',
    title: 'Lab 3: drift, and destroy and recreate',
    steps: [
      { do: 'The instructor changes your staging quota by hand on the cluster (the way a well-meaning admin might).', expect: 'kubectl -n teamNN-staging get resourcequota shows a different number.' },
      { do: 'In Gitea, open the environments repository, Actions, plan, and Run workflow on main.', expect: 'The plan shows one change per team (5 to change): each quota back to what the code says. This is drift, detected.' },
      { do: 'Wait up to two minutes and look at the quota again.', expect: 'Back to the code\'s value. The commit status says "Applied: 0 added, 5 changed": one repair per team.' },
      { do: 'Open a pull request that removes "staging" from your environments list. Read the plan.', expect: 'Plan: 0 to add, 0 to change, 8 to destroy. The reviewer can see exactly what would disappear.' },
      { do: 'Merge it, confirm staging is gone, then open a pull request that adds it back and merge that.', expect: 'Staging is recreated, identical to before. Nothing was done by hand.' },
    ],
    notes: 'Before step 1, pause the platform\'s repairs on every VM, or they may put the quota back before the delegates run their plan. Change every delegate\'s quota, let them do step 2, then start the repairs again for step 3. The day guide has the commands: one ansible line from your machine reaches every VM (or each delegate runs it with sudo on their own VM). This is the brief\'s pass criterion for Lab 3: "environment can be safely destroyed and recreated". The drift step is the brief\'s "drift detection" from the IaC product standard. Point out that the plan for a destroy is the safest possible review: the reviewer sees the blast radius before approving.',
  },
  {
    type: 'section', section: 'Budgets',
    title: 'Budgets',
    subtitle: 'Your environments exist, built from code. Last topic today: the budget written into the same template, and what a plan tells a reviewer and an auditor.',
    notes: 'Short topic, no lab: use the plans the teams already opened in Lab 2 as the examples.',
  },
  {
    type: 'concept', section: 'Budgets',
    title: 'Budgets: FinOps starts in the template',
    icon: 'FiDollarSign',
    idea: [
      'Every environment has a budget: how much CPU and memory it may request in total, and what a container gets if it does not say. On the cluster these are the ResourceQuota and the LimitRange.',
      'Budgets make sharing fair, stop one team from starving the others, and make cost visible per team and per environment.',
      'The size setting in the template is the simplest FinOps control: a team picks small or medium, and the cost of that choice is known before anything runs.',
    ],
    lab: [
      'small: 1 CPU and 2 GiB requested per environment; medium: double.',
      'A deployment that asks for more than the budget is refused. You will see this on Day 6.',
      'Containers without limits get the defaults from the LimitRange.',
      'The dashboard on Day 6 shows how much of the budget each environment uses.',
    ],
    oneLiner: 'A budget in the template means cost and fairness are decided before the first container runs.',
    notes: 'The brief\'s FinOps outcome is mostly beyond this course, but budgets are where it starts: allocation, unit cost and waste detection all need a budget per team and environment first. OpenCost is an optional extra in the lab for a later module.',
  },
  {
    type: 'rows', section: 'Budgets',
    title: 'What the plan tells a reviewer, and an auditor',
    rows: [
      { icon: 'FiPlus', color: 'accent1', head: '+ to add', text: 'New things that will exist after apply. For an environment request: namespaces, quotas, policies, role bindings, each with its settings.' },
      { icon: 'FiEdit2', color: 'accent2', head: '~ to change', text: 'Existing things whose settings will change, shown old to new. This is how drift and size changes appear.' },
      { icon: 'FiMinus', color: 'accent3', head: '- to destroy', text: 'Things that will be removed. The blast radius of the change, visible before approval.' },
      { icon: 'FiFileText', color: 'accent4', head: 'The record', text: 'The plan in the pull request, the approval, the apply log and the Git history together answer: what changed, who asked, who approved, when it happened.' },
    ],
    notes: 'Teach delegates to read the summary line first (x to add, y to change, z to destroy) and only then the detail. A reviewer who sees "to destroy" on a prod environment asks questions before approving.',
  },
  {
    type: 'quiz', section: 'Close',
    questions: [
      'What is the difference between plan and apply, and which one would you show an auditor?',
      'What is drift, and how did you detect and fix it today?',
      'Why does the team write six lines instead of the whole environment definition?',
      'Why is prod read-only for people, and how does a change still reach it?',
      'What does size = "small" decide, and why is that a cost control?',
    ],
    notes: 'Answers. 1: plan shows what would change without changing it; apply changes it. The plan attached to the approved pull request is the audit evidence. 2: Reality differing from the code; the plan showed the hand-edited quota as a change, apply restored it. 3: The platform team put the correct, security-reviewed definition in the module once; teams only choose what varies. 4: Least privilege; deployments to prod go through Git and Argo CD, which keep the evidence. 5: The CPU and memory budget of each environment; the cost of a choice is known before anything runs and fairness between teams is enforced.',
  },
  {
    type: 'recap', section: 'Close',
    highlight: ['Workspace', 'Portal', 'Repository', 'GitOps', 'Template', 'Environments'],
    built: [
      'Explain plan, apply, destroy, state and drift',
      'Run OpenTofu on your own small example',
      'Request staging and prod from the environment template by pull request',
      'Read a plan the way a reviewer and an auditor would',
      'Say what a budget is and why it lives in the template',
    ],
    tomorrow: 'Containers. You will build the hello image with Docker, run it with different settings, and then create a brand-new service from the packaging template and see it appear in the catalog and in dev.',
    notes: 'Each team now has three environments. Tomorrow the app gets packaged so that the same image can run in all three.',
  },
];
