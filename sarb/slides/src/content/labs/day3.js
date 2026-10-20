// Day 3 labs, step by step, for the handbook (see labs/day1.js for the format).
'use strict';

module.exports = {
  'Lab 1: plan, apply, change, destroy': {
    goal: 'Use OpenTofu on something tiny and harmless, a file in your workspace, to learn the four moves of Infrastructure as Code: plan, apply, change and destroy.',
    start: 'A terminal in your workspace. Nothing here touches anything shared.',
    steps: [
      {
        title: 'Write the code',
        where: 'Workspace terminal',
        say: 'This writes main.tf, the file from the slide: one provider (local, which manages files) and one resource (a file called note.txt). You can also type it in the editor.',
        run: 'mkdir -p ~/day3 && cd ~/day3\ncat > main.tf <<\'EOF\'\nterraform {\n  required_providers {\n    local = { source = "hashicorp/local" }\n  }\n}\n\nresource "local_file" "note" {\n  filename = "${path.module}/note.txt"\n  content  = "Built by code, not by hand."\n}\nEOF\nls',
        see: 'One file: main.tf.',
      },
      {
        title: 'Prepare the folder: tofu init',
        where: 'Workspace terminal',
        say: 'init fetches the provider the code asks for. Your workspace has a local copy, so this needs no internet.',
        run: 'tofu init',
        see: '"OpenTofu has been successfully initialized!" and a hidden .terraform folder holding the provider.',
      },
      {
        title: 'See what would happen: tofu plan',
        where: 'Workspace terminal',
        say: 'plan compares the code with reality and lists what it would do, without doing anything. + means "will be created".',
        run: 'tofu plan',
        see: 'The file with its settings marked +, and the summary line:',
        out: '  # local_file.note will be created\n  + resource "local_file" "note" {\n      + content  = "Built by code, not by hand."\n      + filename = "./note.txt"\n      ...\nPlan: 1 to add, 0 to change, 0 to destroy.',
      },
      {
        title: 'Make it so: tofu apply',
        where: 'Workspace terminal',
        say: 'apply shows the same plan and asks for confirmation. Type yes and press Enter. Then look at the result.',
        run: 'tofu apply\ncat note.txt\nls',
        see: 'Apply complete! Resources: 1 added. note.txt holds the text, and a terraform.tfstate file appeared: OpenTofu\'s memory of what it built.',
      },
      {
        title: 'Change the code, and plan again',
        where: 'Workspace terminal',
        say: [
          'Change the text in main.tf (here with sed; the editor works too), then plan and apply.',
          'A file cannot be edited in place, so OpenTofu replaces it: -/+ and "forces replacement". Other things, like the budgets you request this afternoon, change in place and show ~ instead. Read the symbols, not only the summary.',
        ],
        run: 'sed -i \'s/Built by code, not by hand./Changed by code./\' main.tf\ntofu plan\ntofu apply',
        see: 'The plan says the file must be replaced:',
        out: '  # local_file.note must be replaced\n-/+ resource "local_file" "note" {\n      ~ content = "Built by code, not by hand." -> "Changed by code." # forces replacement\n      ...\nPlan: 1 to add, 0 to change, 1 to destroy.',
      },
      {
        title: 'Break it by hand, let the code repair it, then destroy',
        where: 'Workspace terminal',
        say: [
          'Delete the file by hand, the way someone might "tidy up" a server. The next plan notices that reality no longer matches the code: that is drift. apply puts it back.',
          'Finally destroy removes everything the code created (type yes).',
        ],
        run: 'rm note.txt\ntofu plan\ntofu apply\ncat note.txt\ntofu destroy\nls',
        see: 'The plan says "will be created" again (1 to add); apply brings the file back; destroy says "Destroy complete! Resources: 1 destroyed." and note.txt is gone.',
      },
    ],
    done: 'You have planned, applied, changed, repaired and destroyed a resource using only code.',
  },

  'Lab 2: request staging and prod from the template': {
    goal: 'Get your team\'s staging and prod environments the platform way: fill in the environment template, open a pull request, read the plan, and let the platform team approve and apply it.',
    start: 'One member of each team drives; the others watch the plan with them. The platform team approves: the instructor, or one of you playing the platform team as platform-approver.',
    steps: [
      {
        title: 'Copy the environments repository and make a branch',
        where: 'Workspace terminal',
        say: 'platform/environments holds every team\'s environment request. Everyone may propose a change; only the platform team may approve it.',
        run: 'cd ~\ngit clone https://gitea.$DOMAIN/platform/environments\ncd environments\ngit switch -c $TEAM-environments\nls',
        see: 'main.tf, modules (the template) and team00.tf.example:',
        out: 'README.md  main.tf  modules  team00.tf.example',
      },
      {
        title: 'Fill in the template: six lines',
        where: 'Workspace terminal',
        say: 'Copy the example under your team\'s name and put your team in it. The file asks the template for two environments, staging and prod, in the small size.',
        run: 'cp team00.tf.example $TEAM.tf\nsed -i "s/team00/$TEAM/g" $TEAM.tf\ncat $TEAM.tf\ngit status',
        see: 'Your team\'s module, and one new file in git status:',
        out: 'module "team03" {\n  source       = "./modules/team-environment"\n  team         = "team03"\n  environments = ["staging", "prod"]\n  size         = "small"\n}',
      },
      {
        title: 'Propose it, and read the plan',
        where: 'Workspace terminal, then Gitea',
        say: [
          'Commit, push and open a pull request in Gitea (use the link git push prints). The plan pipeline starts by itself.',
          'In the pull request, click the pipeline\'s details (or Actions → plan), then the Plan step. Read the summary line first, then the list.',
        ],
        run: 'git add $TEAM.tf\ngit commit -m "Request staging and prod for $TEAM"\ngit push -u origin $TEAM-environments',
        see: '"Plan: 16 to add, 0 to change, 0 to destroy." That is two namespaces, each with a budget (quota), defaults, four network rules and your team\'s access. Nothing exists yet: the plan only reads.',
      },
      {
        title: 'The platform team approves, and you merge',
        where: 'Gitea',
        say: [
          'Ask the platform team to review. A teammate\'s approval as studentNN does not count here: only the platform team may approve environment changes.',
          'The platform team is the instructor, or one of you playing it: open a private window (Ctrl+Shift+N; on a Mac Cmd+Shift+N), sign in to Gitea as platform-approver (its login is on your access sheet), open the pull request, read Files Changed and the plan, then Review → Approve. Close the window and merge as yourself.',
        ],
        see: 'Within two minutes the merge commit gets a green tick: platform/apply "Applied: 16 added, 0 changed, 0 destroyed". The platform applied main itself; nobody ran a command on the cluster.',
      },
      {
        title: 'Look at your new environment',
        where: 'Workspace terminal',
        say: 'The quota is the environment\'s budget; the limit range gives every container sensible defaults.',
        run: 'kubectl -n $TEAM-staging get resourcequota,limitrange\nkubectl get namespaces | grep $TEAM',
        see: 'team-quota with requests.cpu 0/1 and requests.memory 0/2Gi, the limit range team-defaults, and three namespaces: dev, staging and prod.',
      },
      {
        title: 'See your service find its new homes',
        where: 'Browser: Argo CD',
        say: 'Argo CD had been trying to deploy hello to staging and prod since Day 1, and kept retrying because they did not exist. Open teamNN-hello-staging and teamNN-hello-prod (sign in as delegate again if Argo CD asks).',
        see: 'They stop retrying and show Synced, with 0 replicas: nothing is released there until Day 6.',
        tip: 'If the safety net is on: kubectl -n $TEAM-staging get deployments shows hello with 0/0, and the latest hello commit in Gitea shows safety-net/staging "Deployed to teamNN-staging: not-released-yet, 0 replicas".',
      },
    ],
    done: 'Your team has teamNN-staging and teamNN-prod, created by an approved pull request, and the plan is your design record.',
  },

  'Lab 3: drift, and destroy and recreate': {
    goal: 'See the platform notice and repair a change made by hand, and see that a whole environment can be removed and rebuilt identically, from code only.',
    start: 'Lab 2 done: your staging exists. Keep your copy of platform/environments.',
    steps: [
      {
        title: 'The instructor changes your quota by hand',
        where: 'Instructor, then your workspace terminal',
        say: 'The instructor pauses the platform\'s automatic repairs for a few minutes, then raises your staging CPU budget directly on the cluster, the way a well-meaning administrator might. Look at it:',
        run: 'kubectl -n $TEAM-staging get resourcequota team-quota -o jsonpath=\'{.spec.hard.requests\\.cpu}{"\\n"}\'',
        see: '5 instead of 1. Reality no longer matches the code.',
      },
      {
        title: 'Detect the drift with a plan',
        where: 'Browser: Gitea',
        say: 'Open platform/environments → Actions → plan → Run workflow, keep the branch main, and run it. Open the new run and its Plan step.',
        see: '"Plan: 0 to add, 1 to change, 0 to destroy." The ~ line shows the quota going back from 5 to 1. This is drift, detected.',
      },
      {
        title: 'Let the platform repair it',
        where: 'Workspace terminal',
        say: 'When every team has seen its plan, the instructor switches the repairs back on. The platform re-applies main every two minutes. Wait, then look again.',
        run: 'sleep 120\nkubectl -n $TEAM-staging get resourcequota team-quota -o jsonpath=\'{.spec.hard.requests\\.cpu}{"\\n"}\'',
        see: '1 again. The latest commit on main shows platform/apply "Applied: 0 added, 1 changed, 0 destroyed": the repair is on record.',
      },
      {
        title: 'Propose removing staging, and read the plan',
        where: 'Workspace terminal, then Gitea',
        say: 'Take the latest main, make a branch, and remove "staging" from your list. Push and open a pull request.',
        run: 'cd ~/environments\ngit switch main && git pull\ngit switch -c $TEAM-remove-staging\nsed -i \'s/\\["staging", "prod"\\]/["prod"]/\' $TEAM.tf\ngit diff\ngit commit -am "Remove staging for $TEAM"\ngit push -u origin $TEAM-remove-staging',
        see: 'The plan in the pull request: "Plan: 0 to add, 0 to change, 8 to destroy." A reviewer sees exactly what would disappear before it does.',
      },
      {
        title: 'Remove it, then bring it back',
        where: 'Gitea, then the workspace terminal',
        say: 'The platform team approves (the instructor, or platform-approver in a private window); merge it. Check staging is gone. Then put it back the same way, with a second pull request.',
        run: 'kubectl get namespace $TEAM-staging\ngit switch main && git pull\ngit switch -c $TEAM-add-staging\nsed -i \'s/\\["prod"\\]/["staging", "prod"]/\' $TEAM.tf\ngit commit -am "Add staging back for $TEAM"\ngit push -u origin $TEAM-add-staging',
        see: 'First "NotFound" (staging is gone). After the second pull request is approved and merged, staging is back within two minutes, identical to before: same budget, same rules, same access. Nothing was done by hand.',
      },
    ],
    done: 'You have seen drift detected and repaired, and staging destroyed and recreated, each with a plan and an approval on record.',
  },
};
