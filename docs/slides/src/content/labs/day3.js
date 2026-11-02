// Day 3 labs, step by step, for the handbook (see labs/day1.js for the format).
// Written for someone who has never used a terminal: every command is given,
// every line is explained, and every step says what to expect and what to do
// if it looks different. The outputs are copied from real runs.
'use strict';

const { TERMINAL } = require('./common');

module.exports = {
  'Lab 1: plan, apply, change, destroy': {
    goal: 'Use OpenTofu on something tiny and harmless, a file in your workspace, to learn the four moves of Infrastructure as Code: plan, apply, change and destroy.',
    learn: [
      'What Infrastructure as Code means: a file describes what should exist, and a tool makes it so.',
      'The four moves: plan (look before you change), apply (make it so), change (edit the code, never the thing) and destroy (remove what the code made).',
      'What state is (the tool\'s memory) and what drift is (someone changed it by hand).',
    ],
    words: [
      ['OpenTofu', 'The tool that reads the code and makes it real. It is the open-source twin of Terraform: same language, same commands, but you type tofu instead of terraform.'],
      ['Provider', 'A plug-in that knows how to manage one kind of thing. Here it is local, which manages files in your workspace. This afternoon it is kubernetes.'],
      ['Resource', 'One thing the code describes. Here: one file, note.txt.'],
      ['Plan', 'OpenTofu compares the code with what exists and lists what it would do. It changes nothing.'],
      ['Apply', 'Do what the plan says. OpenTofu asks you to type yes first.'],
      ['State', 'The file terraform.tfstate: OpenTofu\'s memory of what it built, so next time it knows what already exists.'],
      ['Drift', 'Reality no longer matches the code, because someone changed it by hand.'],
    ],
    start: [
      ...TERMINAL,
      'Nothing in this lab touches anything shared. You can make mistakes safely: the worst case is that you start the lab again.',
    ],
    steps: [
      {
        title: 'Write the code',
        where: 'Workspace terminal',
        why: 'Infrastructure as Code starts with a file that describes what you want. Here the "infrastructure" is one small file, note.txt, so you can watch every move without any risk.',
        do: [
          'Copy the whole grey box below, including the line that says EOF.',
          'Paste it into the terminal and press Enter.',
        ],
        run: 'mkdir -p ~/day3 && cd ~/day3\ncat > main.tf <<\'EOF\'\nterraform {\n  required_providers {\n    local = { source = "hashicorp/local" }\n  }\n}\n\nresource "local_file" "note" {\n  filename = "${path.module}/note.txt"\n  content  = "Built by code, not by hand."\n}\nEOF\nls',
        explain: [
          ['mkdir -p ~/day3 && cd ~/day3', 'make a folder called day3 in your home folder (~ means your home folder), then go into it. -p means "no error if it is already there"; && means "and then, if that worked".'],
          ['cat > main.tf <<\'EOF\'', 'write everything that follows, up to the line EOF, into a new file called main.tf. It is the same as typing the file in an editor and saving it.'],
          ['terraform { required_providers { local = ... } }', 'this code needs the provider called local, which manages files. The word is terraform here because OpenTofu and Terraform share the same language.'],
          ['resource "local_file" "note" {', 'one resource: a file. local_file is the kind of thing; note is the name we give it inside the code.'],
          ['filename = "${path.module}/note.txt"', 'where the file goes: note.txt, in this folder. ${path.module} means "the folder this code is in".'],
          ['content  = "Built by code, not by hand."', 'what goes inside the file.'],
          ['ls', 'list the files in the folder, to check.'],
        ],
        see: 'One file in the folder:',
        out: 'main.tf',
        ifnot: [
          ['The prompt changes to > and waits', 'the paste stopped before the last EOF line. Press Ctrl+C, then copy and paste the whole box again.'],
          ['ls shows nothing', 'the file was not written. Check that you pasted the whole box, then try again.'],
        ],
        tip: 'To read the file you just made, type cat main.tf and press Enter.',
      },
      {
        title: 'Prepare the folder: tofu init',
        where: 'Workspace terminal',
        why: 'Before OpenTofu can use the code, it must fetch the provider the code asks for (local). init does this once in every new folder.',
        run: 'tofu init',
        explain: [
          ['tofu init', 'prepare this folder: find and install the providers named in main.tf. Your workspace keeps a copy of them, so this needs no internet.'],
        ],
        see: 'A few lines about the provider, then, near the end:',
        out: 'Initializing provider plugins...\n- Finding latest version of hashicorp/local...\n- Installing hashicorp/local v2.9.1...\n- Installed hashicorp/local v2.9.1 (unauthenticated)\n...\nOpenTofu has been successfully initialized!',
        read: [
          'You also see "Warning: Incomplete lock file information for providers" and the word unauthenticated. Both are expected here: the lab gives OpenTofu its providers from a local copy instead of the internet. You can ignore them.',
          'Type ls -a and press Enter: two new entries appeared, .terraform (the installed provider) and .terraform.lock.hcl (which version was chosen). Leave them alone.',
        ],
        ifnot: [
          ['Error: Failed to query available provider packages', 'check that main.tf says hashicorp/local (cat main.tf). Fix it by repeating step 1, then run tofu init again. If it still fails, ask the instructor.'],
          ['tofu: command not found', 'you are not in your workspace terminal. Open one in the workspace: ☰ → Terminal → New Terminal.'],
        ],
      },
      {
        title: 'See what would happen: tofu plan',
        where: 'Workspace terminal',
        why: 'plan shows what OpenTofu would do, and does nothing. In a bank, the plan is what a reviewer reads before anything is allowed to change.',
        run: 'tofu plan',
        explain: [
          ['tofu plan', 'compare the code (main.tf) with what exists (nothing yet), and list the actions that would make them match.'],
        ],
        see: 'The file with its settings marked +, and a summary line:',
        out: '  # local_file.note will be created\n  + resource "local_file" "note" {\n      + content              = "Built by code, not by hand."\n      + content_md5          = (known after apply)\n      ...\n      + filename             = "./note.txt"\n      + id                   = (known after apply)\n    }\n\nPlan: 1 to add, 0 to change, 0 to destroy.',
        read: [
          'Read the last line first, always. "1 to add, 0 to change, 0 to destroy": one thing will be created, nothing else is touched.',
          '+ in front of a line means "will be created".',
          '(known after apply) means the value exists only once the file exists, like its checksum.',
          'The "Note: You didn\'t use the -out option" at the bottom is advice for automated scripts. Ignore it.',
          'Type ls: there is still no note.txt. A plan never changes anything.',
        ],
      },
      {
        title: 'Make it so: tofu apply',
        where: 'Workspace terminal',
        why: 'apply does what the plan says. It shows the plan again and waits until you type yes, so nothing ever happens by accident.',
        do: [
          'Run the command below.',
          'It prints the same plan as in step 3, then stops at "Enter a value:".',
          'Type yes (the whole word, in small letters) and press Enter. Anything else cancels, and nothing happens.',
          'Then run the two commands in the second box to look at the result.',
        ],
        run: 'tofu apply',
        then: {
          say: 'When you see "Apply complete!", look at what was made:',
          run: 'cat note.txt; echo\nls',
          explain: [
            ['cat note.txt; echo', 'show what is inside the file OpenTofu made. The file does not end with a line break, so echo adds one: your next prompt then starts on its own line.'],
            ['ls', 'list the folder again.'],
          ],
        },
        see: 'Apply completes, the file holds the text from the code, and a new file terraform.tfstate appeared:',
        out: 'Do you want to perform these actions?\n  OpenTofu will perform the actions described above.\n  Only \'yes\' will be accepted to approve.\n\n  Enter a value: yes\n\nlocal_file.note: Creating...\nlocal_file.note: Creation complete after 0s [id=dc2d5adde1d6...]\n\nApply complete! Resources: 1 added, 0 changed, 0 destroyed.\n\nBuilt by code, not by hand.\nmain.tf  note.txt  terraform.tfstate',
        read: [
          'note.txt was made by the code, not by you.',
          'terraform.tfstate is OpenTofu\'s memory, the state: it records that it made note.txt, so next time it knows the file already exists. Never edit it by hand. In a team it is kept in a safe, shared place: this afternoon, your environments keep theirs inside the cluster.',
        ],
        ifnot: [
          ['Apply cancelled.', 'you typed something other than yes. Run tofu apply again and type yes.'],
        ],
      },
      {
        title: 'Change the code, and plan again',
        where: 'Workspace terminal',
        why: 'Real infrastructure changes all the time. The rule is: change the code, never the thing itself. The plan then tells you exactly how OpenTofu will make reality match the new code.',
        do: [
          'Change the text in main.tf. The first command in the box does it for you (you could also edit the file by hand).',
          'The second command shows the changed line, so you can check it.',
          'The third runs a plan: read it before you go on.',
          'Then run the second box: apply makes the change (type yes, as in step 4), then shows the file.',
        ],
        change: {
          file: 'main.tf',
          how: 'only the text in content changes.',
          before: 'content  = "Built by code, not by hand."',
          after: 'content  = "Changed by code."',
        },
        run: 'sed -i \'s/Built by code, not by hand./Changed by code./\' main.tf\ngrep content main.tf\ntofu plan',
        explain: [
          ['sed -i \'s/old text/new text/\' main.tf', 'replace the old text with the new text inside main.tf. -i means "change the file itself". It is the same as editing the line by hand and saving.'],
          ['grep content main.tf', 'show only the line of main.tf that contains the word content, to check the change.'],
          ['tofu plan', 'compare the new code with what exists.'],
        ],
        then: {
          say: 'Now make it so. Type yes when asked, then look at the file:',
          run: 'tofu apply\ncat note.txt; echo',
        },
        see: 'The plan says the file must be replaced, and after the apply the file holds the new text:',
        out: '  # local_file.note must be replaced\n-/+ resource "local_file" "note" {\n      ~ content              = "Built by code, not by hand." -> "Changed by code." # forces replacement\n      ...\n    }\n\nPlan: 1 to add, 0 to change, 1 to destroy.\n...\nApply complete! Resources: 1 added, 0 changed, 1 destroyed.\nChanged by code.',
        read: [
          '-/+ means "destroy, then create a replacement". This provider cannot edit a file\'s text in place, so OpenTofu deletes the old file and makes a new one.',
          '~ marks a value that changes, written old -> new. "# forces replacement" says which change causes the replacement.',
          'Many things can change in place instead: they show only ~ and "1 to change". The budgets you request this afternoon are like that.',
          'The lesson: read the symbols, not only the summary line. Replacing a file is harmless; replacing a database would lose its data.',
        ],
      },
      {
        title: 'Break it by hand, let the code repair it, then destroy',
        where: 'Workspace terminal',
        why: 'Someone "tidies up" by hand and deletes the file: that is drift. The next plan notices that reality no longer matches the code, and apply repairs it. Finally, destroy removes everything the code created, and nothing more.',
        do: [
          'Run the first box: it deletes the file by hand, then runs a plan.',
          'Run the second box: apply puts the file back (type yes).',
          'Run the third box: destroy removes what the code made (type yes), then ls shows what is left.',
        ],
        run: 'rm note.txt\ntofu plan',
        explain: [
          ['rm note.txt', 'delete the file by hand, the way someone might "tidy up" a server.'],
          ['tofu plan', 'compare the code with reality again. The code says note.txt should exist; reality says it does not.'],
        ],
        then: [
          {
            say: 'The plan says the file "will be created" again: drift, found. Repair it (type yes):',
            run: 'tofu apply\ncat note.txt; echo',
          },
          {
            say: 'Now remove everything the code made. destroy shows what it will remove and asks; type yes:',
            run: 'tofu destroy\nls',
            explain: [
              ['tofu destroy', 'remove every resource this code created. It asks first, and there is no undo.'],
              ['ls', 'see what is left in the folder.'],
            ],
          },
        ],
        see: 'The plan finds the missing file (1 to add), apply brings it back, and destroy removes it again:',
        out: 'Plan: 1 to add, 0 to change, 0 to destroy.\n...\nApply complete! Resources: 1 added, 0 changed, 0 destroyed.\nChanged by code.\n...\nDo you really want to destroy all resources?\n  OpenTofu will destroy all your managed infrastructure, as shown above.\n  There is no undo. Only \'yes\' will be accepted to confirm.\n\n  Enter a value: yes\n\nlocal_file.note: Destroying... [id=53aedffc580c...]\nlocal_file.note: Destruction complete after 0s\n\nDestroy complete! Resources: 1 destroyed.\nmain.tf  terraform.tfstate  terraform.tfstate.backup',
        read: [
          'The plan noticed the missing file without anyone looking for it: drift is found by comparing code with reality.',
          'destroy listed exactly what it would remove before it asked. It removed only note.txt: your code (main.tf) and the state stay.',
          'This afternoon the same four moves create, change and remove whole environments.',
        ],
      },
    ],
    done: 'You have planned, applied, changed, repaired and destroyed a resource using only code.',
  },

  'Lab 2: request staging and prod from the template': {
    goal: 'Get your team\'s staging and prod environments the platform way: fill in the environment template, open a pull request, read the plan, and let the platform team approve and apply it.',
    learn: [
      'How a team asks for infrastructure on a platform: a small file in a pull request, not a ticket.',
      'How to read a plan in a pull request, the way a reviewer does.',
      'Why only the platform team may approve, and how the platform then applies the change by itself.',
    ],
    words: [
      ['Environment', 'A fenced area of the cluster for one stage of your service: dev, staging or prod. In Kubernetes it is a namespace, for example team03-staging.'],
      ['Template (module)', 'Infrastructure code written once by the platform team. You fill in a few values; it builds the same, safe environment for every team.'],
      ['Budget (quota)', 'How much CPU and memory an environment may use in total.'],
      ['platform/environments', 'The repository in Gitea where every team\'s environment request lives, one file per team.'],
      ['platform/apply', 'The status the platform writes on a commit after it has applied it: what it added, changed or destroyed.'],
    ],
    start: [
      ...TERMINAL,
      'Have your logins at hand (cat /etc/pelab/logins.md): you need your password, and for step 4 the platform-approver login.',
    ],
    steps: [
      {
        title: 'Copy the environments repository and make a branch',
        where: 'Workspace terminal',
        why: 'Every team asks for environments in the same place: the shared repository platform/environments. You work on a copy, on a branch of your own, exactly as on Day 2.',
        do: [
          'Paste the box into the terminal and press Enter.',
          'If Git asks for a Username and Password, type them as in "Before you start".',
        ],
        run: 'cd ~\ngit clone https://gitea.$DOMAIN/platform/environments\ncd environments\ngit switch -c $TEAM-environments\nls',
        explain: [
          ['cd ~', 'go to your home folder.'],
          ['git clone https://gitea.$DOMAIN/platform/environments', 'copy the repository from Gitea into a new folder called environments. $DOMAIN is filled in for you with the lab\'s address.'],
          ['cd environments', 'go into that folder.'],
          ['git switch -c $TEAM-environments', 'make a new branch and switch to it. $TEAM is filled in with your team, so the branch is called, for example, team03-environments.'],
          ['ls', 'list what the repository contains.'],
        ],
        see: 'Git says it switched to your new branch, then four entries:',
        out: 'Switched to a new branch \'team03-environments\'\nREADME.md  main.tf  modules  team00.tf.example',
        read: [
          'main.tf: settings shared by every request, for example that OpenTofu keeps its state inside the cluster.',
          'modules: the environment template, written and owned by the platform team. You use it; you never change it.',
          'team00.tf.example: an example request, ready to copy.',
          'Each team\'s request will be one more file here, teamNN.tf.',
        ],
        ifnot: [
          ['fatal: destination path \'environments\' already exists', 'you cloned it before. Run cd ~/environments && git switch main && git pull, then git switch -c $TEAM-environments.'],
          ['Authentication failed', 'the user name or password was wrong. Run the git clone line again and type them carefully.'],
        ],
      },
      {
        title: 'Fill in the template: six lines',
        where: 'Workspace terminal',
        why: 'You do not write infrastructure code from scratch. You copy the example under your team\'s name and put your team in it; the template does the rest, the same way for every team.',
        do: [
          'Paste the box and press Enter. The first two lines make your file; the last two show it.',
          'Read your file with the team: check that your team name appears twice.',
        ],
        run: 'cp team00.tf.example $TEAM.tf\nsed -i "s/team00/$TEAM/g" $TEAM.tf\ncat $TEAM.tf\ngit status',
        explain: [
          ['cp team00.tf.example $TEAM.tf', 'copy the example to a new file named after your team, for example team03.tf.'],
          ['sed -i "s/team00/$TEAM/g" $TEAM.tf', 'in your new file, replace every team00 with your team. g means "every time on the line", not just the first.'],
          ['cat $TEAM.tf', 'show the file.'],
          ['git status', 'show what is new or changed in your copy of the repository.'],
        ],
        change: {
          file: 'teamNN.tf',
          how: 'the copy of the example, with your team in both places.',
          before: 'module "team00" {\n  source       = "./modules/team-environment"\n  team         = "team00"\n  environments = ["staging", "prod"]\n  size         = "small"\n}',
          after: 'module "team03" {\n  source       = "./modules/team-environment"\n  team         = "team03"\n  environments = ["staging", "prod"]\n  size         = "small"\n}',
        },
        see: 'Your request, and one new file in git status:',
        out: '# Your team\'s request: a copy of this file named after your team (team01.tf for\n# example), with your team\'s name in both places below. The plan in the pull\n# request shows what will be created before anything changes.\n\nmodule "team03" {\n  source       = "./modules/team-environment"\n  team         = "team03"\n  environments = ["staging", "prod"]\n  size         = "small"\n}\nOn branch team03-environments\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\tteam03.tf',
        read: [
          'module "team03": one request, named after your team.',
          'source: which template to use, the environment template in modules.',
          'team: whose environments these are. It must be your team: the template checks it.',
          'environments = ["staging", "prod"]: which environments you want. dev already exists.',
          'size = "small": the budget of each environment, 1 CPU and 2 GB of memory to reserve (medium is double). Choosing the size is where cost control (FinOps) starts, and it is on record.',
          'git status lists your file under "Untracked files": it is new, and not yet saved in Git.',
        ],
        ifnot: [
          ['cat still shows team00', 'the sed line did not run. Paste it again.'],
          ['No such file or directory', 'you are not in the environments folder. Run cd ~/environments, then paste the box again.'],
        ],
      },
      {
        title: 'Propose it, and read the plan',
        where: 'Workspace terminal, then Gitea in the browser',
        why: 'A pull request proposes the change. Its pipeline runs a plan that shows exactly what would be created, before anything exists. The reviewer decides on that plan.',
        do: [
          'Paste the box and press Enter: it saves your file in a commit and sends your branch to Gitea.',
          'In what git push prints, find the line remote:   https://gitea.<lab domain>/platform/environments/pulls/new/teamNN-environments. Hold Ctrl (on a Mac Cmd) and click it: Gitea opens in a new browser tab, signed in as you. (Or in Gitea: platform/environments → Pull Requests → New Pull Request, and choose your branch on the right.)',
          'The page shows your change and a form under it. The title is already filled in with your commit message; in the box below it, write one line on why your team needs the environments. Click Create Pull Request.',
          'Wait about a minute. Near the bottom of the pull request, a check called plan / plan (pull_request) appears: first a yellow dot (running), then a green tick.',
          'Click Details next to it. The run opens. On the left, click the job plan; on the right, click the step called Plan to unfold its output.',
          'Scroll to the end of the Plan step and read the summary line. Then scroll up and read the list with your team.',
        ],
        run: 'git add $TEAM.tf\ngit commit -m "Request staging and prod for $TEAM"\ngit push -u origin $TEAM-environments',
        explain: [
          ['git add $TEAM.tf', 'put your new file into the next commit.'],
          ['git commit -m "..."', 'save a commit, with a message that says what it does.'],
          ['git push -u origin $TEAM-environments', 'send your branch to Gitea (origin). -u links your branch to Gitea\'s, so later you can just type git push.'],
        ],
        see: 'In the Plan step, a list of creations and this summary line:',
        out: 'Plan: 16 to add, 0 to change, 0 to destroy.',
        read: [
          '16 things, 8 for each environment: the namespace (the fenced area), its budget (team-quota), its container defaults (team-defaults), four network rules (who may talk to it) and your team\'s access.',
          'Every line starts with +: only creations. Nothing of anyone else is changed or destroyed. That is the first thing a reviewer checks.',
          'The pipeline only reads: its credentials can look at the cluster but change nothing. Nothing exists yet.',
          'A second check, pipeline, also turns green: it is the check that main requires before anyone may merge.',
        ],
        ifnot: [
          ['The Plan step is red with "Invalid value for variable"', 'the message says what is wrong: the team name, the environments or the size. Fix teamNN.tf (repeat step 2), then run git commit -am "Fix the request" and git push. The plan runs again by itself.'],
          ['No check appears after three minutes', 'reload the page. If still nothing, tell the instructor (the runners).'],
        ],
      },
      {
        title: 'The platform team approves, and you merge',
        where: 'Gitea in the browser',
        why: 'Only the platform team may approve environment changes. That is segregation of duties: the people who ask are not the people who allow. Your own approval, or the reviewer\'s, does not count here.',
        do: [
          'Now you play the platform team: open a private window (Ctrl+Shift+N; on a Mac Cmd+Shift+N; in Firefox Ctrl+Shift+P), go to https://gitea.<lab domain>, click Sign In and sign in as platform-approver with its password from cat /etc/pelab/logins.md.',
          'In that window, open the pull request (platform/environments → Pull Requests → yours). Click Files Changed: there must be exactly one new file, teamNN.tf, with your team in both places.',
          'Check the plan (as in step 3): 16 to add, 0 to change, 0 to destroy.',
          'Click Review (top right of Files Changed), then Approve. Close the private window.',
          'Back in your own window, signed in as yourself, reload the pull request. When it shows one approval and "All checks were successful", click the merge button (Create merge commit) and confirm.',
          'Wait two minutes. Open platform/environments → Commits and click the small tick next to the newest commit, your merge.',
        ],
        see: 'Among the checks of your merge commit: platform/apply "Applied: 16 added, 0 changed, 0 destroyed". The platform applied main itself; nobody ran a command on the cluster.',
        read: [
          'The approval came from the platform team\'s account; a studentNN approval would leave the merge refused.',
          'The merge was the instruction, and Git keeps the record: who asked, who approved, what the plan said, what was applied.',
        ],
        ifnot: [
          ['Merge stays grey after the approval', 'look at the box above the merge button. "Does not have enough approvals": the approval came from studentNN or reviewer, not platform-approver. "Some checks are pending": wait for the plan to finish.'],
          ['No platform/apply after five minutes', 'tell the instructor (the platform applier on the lab server).'],
        ],
      },
      {
        title: 'Look at your new environment',
        where: 'Workspace terminal',
        why: 'Check with your own eyes that the code made what the plan promised.',
        run: 'kubectl get namespaces | grep $TEAM\nkubectl -n $TEAM-staging get resourcequota,limitrange\nkubectl -n $TEAM-staging describe resourcequota team-quota',
        explain: [
          ['kubectl get namespaces | grep $TEAM', 'list every namespace in the cluster, and keep (grep) only the lines with your team.'],
          ['kubectl -n $TEAM-staging get resourcequota,limitrange', 'in your staging namespace (-n), show the budget (resourcequota) and the container defaults (limitrange).'],
          ['kubectl -n $TEAM-staging describe resourcequota team-quota', 'show the budget in detail: what is used and what is allowed, line by line.'],
        ],
        see: 'Three namespaces for your team, then the budget with nothing used yet:',
        out: 'team03-dev       Active   2d\nteam03-prod      Active   2m\nteam03-staging   Active   2m\n...\nName:                   team-quota\nNamespace:              team03-staging\nResource                Used  Hard\n--------                ----  ----\nlimits.cpu              0     2\nlimits.memory           0     4Gi\npersistentvolumeclaims  0     5\npods                    0     20\nrequests.cpu            0     1\nrequests.memory         0     2Gi\n...',
        read: [
          'Hard is the budget, Used is what runs now: nothing yet.',
          'requests.cpu 1 means one CPU core to reserve for the whole environment; pods 20 means at most twenty running copies.',
          'The limit range team-defaults gives every container sensible defaults, so nobody has to remember to set them.',
        ],
        ifnot: [
          ['Only team03-dev is listed', 'the apply has not happened yet. Check platform/apply on your merge commit (step 4) and wait a minute.'],
        ],
      },
      {
        title: 'See your service find its new homes',
        where: 'Browser: Argo CD',
        why: 'Argo CD has been trying to put hello into staging and prod since Day 1, and kept retrying because they did not exist. Now that they do, it succeeds by itself. Nobody deploys anything.',
        do: [
          'Open https://argocd.<lab domain> in a new browser tab.',
          'Sign in as delegate, with its password from cat /etc/pelab/logins.md (not your studentNN password).',
          'In the search box at the top of the application list, type your team, for example team03.',
          { text: 'Click teamNN-hello-staging, then go back and click teamNN-hello-prod.', shot: { src: 'argocd-staging.png', caption: 'An application\'s page in Argo CD: its health (Healthy), its sync state (Synced to the newest commit on main, with its author and message), and the tree of what it runs. This one is already released (Day 6); today yours runs with 0 copies. In your lab the repository is https://gitea.<lab domain>/teamNN/hello.git, and the names, ids and times are your own.' } },
        ],
        see: 'Both are Synced, and no longer Retrying. hello runs with 0 copies (pods): nothing is released to staging or prod until Day 6.',
        tip: 'If the safety net is on: kubectl -n $TEAM-staging get deployments shows hello with 0/0, and the latest hello commit in Gitea shows safety-net/staging "Deployed to teamNN-staging: not-released-yet, 0 replicas".',
      },
    ],
    done: 'Your team has teamNN-staging and teamNN-prod, created by an approved pull request, and the plan is your design record.',
  },

  'Lab 3: drift, and destroy and recreate': {
    goal: 'See the platform notice and repair a change made by hand, and see that a whole environment can be removed and rebuilt identically, from code only.',
    learn: [
      'How drift is found: a plan compares the code with reality.',
      'How a platform repairs drift by itself, and keeps a record of the repair.',
      'That an environment built from code can be destroyed and rebuilt identically, with a plan and an approval each time.',
    ],
    words: [
      ['Drift', 'Reality no longer matches the code, because someone changed it by hand.'],
      ['Re-apply', 'The platform applies main again every two minutes, which puts back whatever was changed by hand.'],
      ['Update in place', 'A change that edits something without replacing it, shown with ~ in a plan.'],
    ],
    start: [
      'Lab 2 is done: your team has staging (kubectl get namespaces | grep $TEAM shows it).',
      'Keep your copy of platform/environments: cd ~/environments.',
      'The instructor will tell you when to start steps 1 and 3: they pause and restart the platform\'s automatic repairs on every VM at once.',
    ],
    steps: [
      {
        title: 'The instructor changes your quota by hand',
        where: 'Instructor, then your workspace terminal',
        why: 'This is drift on purpose: a well-meaning administrator raises your staging CPU budget directly on the cluster, without changing the code. The instructor has paused the platform\'s repairs for a few minutes, so you have time to look.',
        do: [
          'Wait until the instructor says the budgets have been changed.',
          'Then paste the box and press Enter.',
        ],
        run: 'kubectl -n $TEAM-staging get resourcequota team-quota -o jsonpath=\'{.spec.hard.requests\\.cpu}{"\\n"}\'',
        explain: [
          ['kubectl -n $TEAM-staging get resourcequota team-quota', 'read your staging budget.'],
          ['-o jsonpath=\'{.spec.hard.requests\\.cpu}{"\\n"}\'', 'print only one value from it: the CPU you may reserve (requests.cpu). The backslash before the dot is needed because the name itself contains a dot; {"\\n"} ends the line.'],
        ],
        see: 'A single number:',
        out: '5',
        read: [
          'The code (your teamNN.tf with size "small") says 1. Reality says 5. That gap is drift.',
        ],
        ifnot: [
          ['It still says 1', 'the instructor has not changed it yet, or did it before your staging existed. Wait a moment and run it again.'],
        ],
      },
      {
        title: 'Detect the drift with a plan',
        where: 'Gitea in the browser',
        why: 'A plan compares the code with reality. If reality was changed by hand, the plan shows what it would do to put it back.',
        do: [
          'In Gitea, open platform/environments and click the Actions tab at the top.',
          'On the left, under All Workflows, click plan.',
          'A blue bar appears above the list of runs: "This workflow has a workflow_dispatch event trigger." Click Run Workflow on its right. In the small box that opens, leave the branch as main and click Run Workflow.',
          'After a few seconds a new run appears at the top of the list (reload the page if not). Click it, then click the job plan on the left, then the step Plan on the right to unfold it.',
          'Scroll to the end and read the summary line. Then scroll up and find your budget.',
        ],
        see: 'One change: your staging budget going back to the code\'s value:',
        out: '  # module.team03.kubernetes_resource_quota_v1.budget["staging"] will be updated in-place\n  ~ resource "kubernetes_resource_quota_v1" "budget" {\n      ~ spec {\n          ~ hard = {\n              ~ "requests.cpu"    = "5" -> "1"\n              ...\n\nPlan: 0 to add, 1 to change, 0 to destroy.',
        read: [
          '~ means "update in place": the budget is not replaced, only set back.',
          '"5" -> "1": from what someone did by hand, back to what the code says.',
          'The plan covers the whole repository, and only your budget had drifted. A plan only reads.',
          'Nobody had to look for the drift: running the same plan as always found it.',
        ],
        ifnot: [
          ['There is no Run Workflow button', 'you are on All Workflows, or inside a run. Go back to the Actions tab and click plan on the left.'],
          ['Plan: 0 to add, 0 to change, 0 to destroy', 'the repairs were switched back on before your plan ran, and the platform has already fixed it. Check with the command from step 1: it says 1 again.'],
        ],
      },
      {
        title: 'Let the platform repair it',
        why: 'The platform applies main every two minutes. Whatever was changed by hand goes back to what the code says, and the repair is written on the commit.',
        browser: {
          where: 'Gitea in the browser',
          do: [
            'Wait until the instructor says the repairs are switched back on, then two more minutes.',
            'In Gitea, open platform/environments → Commits and click the small tick next to the newest commit.',
          ],
          see: 'platform/apply says what it repaired: "Applied: 0 added, 1 changed, 0 destroyed". The one change is your budget, put back to what the code says.',
          ifnot: [['No platform/apply line yet', 'wait one more minute and reload: the repairs run every two minutes.']],
        },
        where: 'Workspace terminal',
        do: [
          'Wait until the instructor says the repairs are switched back on.',
          'Paste the box and press Enter. It waits two minutes (the prompt comes back by itself), then reads your budget again.',
          'Then in Gitea, open platform/environments → Commits and click the tick next to the newest commit.',
        ],
        run: 'sleep 120\nkubectl -n $TEAM-staging get resourcequota team-quota -o jsonpath=\'{.spec.hard.requests\\.cpu}{"\\n"}\'',
        explain: [
          ['sleep 120', 'wait 120 seconds, so the platform has time to re-apply main.'],
          ['kubectl ... jsonpath=...', 'read your staging CPU budget again, as in step 1.'],
        ],
        see: '1 again. On the newest commit, platform/apply says what it repaired:',
        out: '1\n\nplatform/apply   Applied: 0 added, 1 changed, 0 destroyed',
        read: [
          'The repair needed no ticket and no person: the platform made reality match the code again.',
          'It is on record: the commit status says when and what was changed back.',
        ],
        ifnot: [
          ['It still says 5', 'wait one more minute and run the kubectl line again. The repairs run every two minutes.'],
        ],
      },
      {
        title: 'Propose removing staging, and read the plan',
        where: 'Workspace terminal, then Gitea',
        why: 'Removing an environment is a change like any other: in code, by pull request, with a plan. The plan shows exactly what would disappear before it does.',
        do: [
          'Paste the box and press Enter. It brings your copy up to date, makes a new branch, removes "staging" from your file, shows the difference, commits and pushes.',
          'Read what git diff prints: the old line in red with -, the new line in green with +.',
          'Open the pull request as in Lab 2, step 3: Ctrl+click (Mac Cmd+click) the pulls/new link that git push prints, check the title (Remove staging for teamNN) and click Create Pull Request.',
          'When the plan check finishes, open it (Details → plan → Plan) and read the summary line.',
        ],
        change: {
          file: 'teamNN.tf',
          how: 'staging is taken out of the list.',
          before: '  environments = ["staging", "prod"]',
          after: '  environments = ["prod"]',
        },
        run: 'cd ~/environments\ngit switch main && git pull\ngit switch -c $TEAM-remove-staging\nsed -i \'s/\\["staging", "prod"\\]/["prod"]/\' $TEAM.tf\ngit diff\ngit commit -am "Remove staging for $TEAM"\ngit push -u origin $TEAM-remove-staging',
        explain: [
          ['git switch main && git pull', 'go back to main and fetch everything merged since, including your Lab 2 change.'],
          ['git switch -c $TEAM-remove-staging', 'make a new branch for this change.'],
          ['sed -i \'s/\\["staging", "prod"\\]/["prod"]/\' $TEAM.tf', 'replace ["staging", "prod"] with ["prod"] in your file. The backslashes tell sed that [ and ] are ordinary characters here.'],
          ['git diff', 'show what you changed, before you commit it.'],
          ['git commit -am "..."', 'add every changed file and commit, in one go (-a: all changed files, -m: the message).'],
          ['git push -u origin $TEAM-remove-staging', 'send the branch to Gitea.'],
        ],
        see: 'git diff shows the one changed line, and the plan in the pull request:',
        out: '-  environments = ["staging", "prod"]\n+  environments = ["prod"]\n...\nPlan: 0 to add, 0 to change, 8 to destroy.',
        read: [
          '- in a plan means "will be destroyed": the eight things of your staging. Nothing of prod.',
          'A reviewer sees exactly what would disappear before it does. At work, a plan that destroys anything is read twice.',
        ],
        ifnot: [
          ['nothing to commit', 'the sed line found nothing to change: check cat $TEAM.tf. If it already says ["prod"], you made this change already: go on to the next step.'],
        ],
      },
      {
        title: 'Remove it, then bring it back',
        where: 'Gitea, then the workspace terminal',
        why: 'An environment built from code can be destroyed and rebuilt identically, from the same code, with a plan and an approval each time. That is what makes environments cheap to throw away and safe to rebuild.',
        do: [
          'Approve it as the platform team (platform-approver, in a private window, as in Lab 2, step 4); then merge it as yourself.',
          'Wait two minutes, then paste the first box: staging is gone.',
          'Paste the second box: it makes a branch that puts staging back. Open its pull request (title: Add staging back for teamNN), read the plan (8 to add), approve it as platform-approver and merge.',
          'Wait two minutes, then paste the third box: staging is back with the same budget.',
        ],
        run: 'kubectl get namespace $TEAM-staging',
        explain: [
          ['kubectl get namespace $TEAM-staging', 'ask the cluster for your staging namespace.'],
        ],
        then: [
          {
            say: 'Staging is gone. Now put it back, the same way:',
            run: 'git switch main && git pull\ngit switch -c $TEAM-add-staging\nsed -i \'s/\\["prod"\\]/["staging", "prod"]/\' $TEAM.tf\ngit diff\ngit commit -am "Add staging back for $TEAM"\ngit push -u origin $TEAM-add-staging',
          },
          {
            say: 'After the second merge and two minutes, check:',
            run: 'kubectl get namespaces | grep $TEAM\nkubectl -n $TEAM-staging get resourcequota team-quota -o jsonpath=\'{.spec.hard.requests\\.cpu}{"\\n"}\'',
          },
        ],
        see: 'First NotFound (staging is gone). After the second pull request: staging is back, with the same budget as before.',
        out: 'Error from server (NotFound): namespaces "team03-staging" not found\n...\nteam03-dev       Active   2d\nteam03-prod      Active   1h\nteam03-staging   Active   1m\n1',
        read: [
          'Nothing was done by hand: two pull requests, two plans, two approvals.',
          'Staging came back identical: same budget, same rules, same access, because it was built from the same code.',
          'Argo CD shows teamNN-hello-staging Retrying while staging is gone, and Synced again once it is back.',
        ],
        look: {
          do: [
            'After the first merge and two minutes: open https://argocd.<lab domain> (sign in as delegate) and click teamNN-hello-staging.',
            'After the second merge and two minutes: reload it.',
          ],
          see: 'While staging is gone, teamNN-hello-staging keeps retrying: it has nowhere to go. Once staging is back, it turns Synced again by itself.',
        },
        ifnot: [
          ['The first box shows staging as Terminating', 'the namespace is still being removed. Wait a minute and run it again.'],
          ['The last box says NotFound', 'the second merge has not been applied yet. Check platform/apply on its merge commit and wait a minute.'],
        ],
      },
    ],
    done: 'You have seen drift detected and repaired, and staging destroyed and recreated, each with a plan and an approval on record.',
  },
};
