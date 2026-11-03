// How to run each day, for the instructor guide (docs/instructor/dayN-notes.md):
// what to prepare, the timetable with slide numbers, every action only the
// instructor takes (with the exact commands), what to watch for, and the end
// of the day. Every delegate has a VM of their own with the whole platform on it.
// Each delegate builds their own VM (Ansible on localhost). Playbooks run on the VM
// they are for; "every VM" commands run from the instructor's machine with
// ANSIBLE_INVENTORY=inventory/all-vms.yml (pelab05 instead of pelab reaches one).
'use strict';

const BACKUP = { when: 'End of the day', what: 'Each VM backs itself up every night: nothing to copy. Remind everyone to push their work: anything only in a workspace is not backed up. Next morning, check last night\'s backup is there on every VM.', where: 'Your machine, every VM', run: 'ansible pelab -b -m ansible.builtin.shell -a "ls -1t /opt/pelab/backups | head -1"' };
const CHECKS = 'The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana), on every VM: ansible pelab -m ping first. 30 minutes before the start.';

module.exports = {
  1: {
    before: [
      CHECKS,
      'Every delegate has built their own VM (prelab-setup/BUILD-YOUR-VM.md): PLAY RECAP said failed=0. Know which VM is whose: one line per delegate in inventory/all-vms.yml on your machine (pelab01, pelab02...), and export ANSIBLE_INVENTORY=inventory/all-vms.yml in your terminal. On every VM the delegate is student01 in team01, and their logins are in /etc/pelab/logins.md on the VM. Keep one VM aside as a spare, and one as your demo VM.',
      'For Lab 1, per team: an A3 sheet, yellow and pink sticky notes, markers. For the room: a long empty wall (or a row of flipcharts) for step 4, and the platform cards from the slide "Your shared steps, done once by the platform", printed one row per card.',
      'Seat the room at tables of four or five for the two Day 1 games (the icebreaker and Lab 1). These table groups are only for the games: every lab on a computer is done alone, on the delegate\'s own VM.',
      'Open your demo VM\'s portal, Gitea and Argo CD on the presenter screen: Gitea as student01 (you show the delegate\'s view), Argo CD as delegate. The passwords are in /etc/pelab/logins.md on the demo VM.',
    ],
    timetable: [
      ['09:00', 'Welcome; everyone opens their VM and their logins file', '1-3', 'Show how to open /etc/pelab/logins.md on the VM. Everyone opens the portal and their workspace before you go on. Count the workspaces that loaded.'],
      ['09:30', 'Platform engineering and the IDP', '4-9', 'The mini platform (slide 6) comes back every day: trace one change through it slowly.'],
      ['10:30', 'Break', '', ''],
      ['10:45', 'Lab 1: map how a change reaches production', '10', 'The four-step game, one slide per step: list your road (12), walk and tick (10), same or different (10), one road on the wall (13). Keep the wall for Day 6.'],
      ['11:45', 'Linux basics', '11-13', ''],
      ['12:15', 'Lunch', '', ''],
      ['13:00', 'Lab 2: Linux warm-up', '14', 'Seat confident delegates next to less confident ones: they may help each other, each on their own VM.'],
      ['13:30', 'Run the app by hand', '15', ''],
      ['13:45', 'Lab 3: run hello by hand, and count the steps', '16-17', 'Collect the step counts: they are the case for the rest of the week.'],
      ['14:45', 'Break', '', ''],
      ['15:00', 'Close: quiz and recap', '18-19', ''],
      ['15:30', 'Check-off and questions', '', 'Tick Labs 1 to 3 per delegate on the check-off sheet.'],
    ],
    actions: [
      { when: '09:00, while everyone signs in', what: 'If a workspace does not load, restart it on that delegate\'s VM (here pelab05). If a password is refused, check it is typed exactly as in the logins file (it is case-sensitive: Lab-xxxx-xxxx-1234).', where: 'Your machine, one VM', run: 'ansible pelab05 -b -a "lxc restart student01"' },
      { when: 'Lab 1', what: 'Photograph the board of bottlenecks. On Day 6 the room checks which of them the platform removed.' },
      { when: 'Lab 3, step 1', what: 'The first git clone of the week asks for the user name and password: the same ones as the workspace.' },
      BACKUP,
    ],
    watch: [
      ['The browser warns about the certificate', 'The thin clients do not trust the lab CA. Desktop support must install it (setup guide, Part 1). Until then delegates can continue past the warning, but code-server misbehaves.'],
      ['A workspace page stays blank', 'ansible pelab05 -b -a "lxc restart student01" (that delegate\'s VM). Still broken: give the delegate the spare VM (run-book).'],
      ['Address already in use (Lab 3)', 'A copy of hello is still running: pkill -f app.main, or use another PORT.'],
    ],
    after: ['Everyone pushed their work.', 'Check-off sheet updated.', 'Bottleneck photo kept for Day 6.'],
  },

  2: {
    before: [
      CHECKS,
      'Check every VM\'s dev address answers: ansible pelab -a "curl -sk https://hello-team01-dev.<lab domain>/" shows hello\'s answer for each VM.',
      'Check every VM\'s runner is up: ansible pelab -b -a "lxc exec runner01 -- systemctl is-active pelab-gitea-runner" says active for each.',
      'Before Lab 2, show the logins file: every delegate has a reviewer login, to approve their own change as a second person in a private window, and platform-approver for Days 3 and 5. Say plainly that at work accounts are personal, and the second person is a real colleague.',
    ],
    timetable: [
      ['09:00', 'Opening: yesterday in one minute, today\'s goal', '1-2', ''],
      ['09:15', 'Version control, the pull-request loop, protected main', '3-6', ''],
      ['10:00', 'Lab 1: your first change, on a branch', '7', 'Everyone makes their own branch and change, on their own VM.'],
      ['10:30', 'Break', '', ''],
      ['10:45', 'Pull requests and reviews', '8', ''],
      ['11:00', 'Lab 2: review, approve, merge, and watch it go live', '9', 'Each delegate approves as reviewer in a private window. Explain GitOps (slide 10) while the pipelines run.'],
      ['11:40', 'GitOps: Git says what should run', '10', ''],
      ['12:00', 'Lab 3: try to break the rules', '11', ''],
      ['12:20', 'Lunch', '', ''],
      ['13:05', 'Lab 4: resolve a merge conflict', '12', 'On your own: two branches, A and B.'],
      ['13:30', 'Platform as a product', '13-14', ''],
      ['14:00', 'Lab 5: your platform charter', '15', '30 minutes on your own, then two minutes with a neighbour. Ask two or three to read theirs to the room.'],
      ['14:45', 'Break', '', ''],
      ['15:00', 'Close: scenarios, quiz and recap', '16-18', ''],
      ['15:40', 'Check-off and questions', '', ''],
    ],
    actions: [
      { when: 'Lab 2', what: 'Each merge runs the pipeline twice (pull request, then main), on the VM\'s one runner: a few minutes of waiting is normal. Use the wait for slide 10. If one pipeline waits more than 10 minutes, check that VM\'s runner (here pelab05).', where: 'Your machine, one VM', run: 'ansible pelab05 -b -a "lxc exec runner01 -- systemctl status pelab-gitea-runner --no-pager"' },
      { when: 'Lab 3', what: 'Every delegate must see the three refusals. If a push straight to main succeeds, stop: the protection is missing on that VM. Put it back: on that VM, in ~/plartfom-enable/prelab-setup (the delegate types it, or you over SSH).', where: 'On that VM', run: 'ansible-playbook site.yml --tags golden_path -K' },
      { when: 'Lab 5', what: 'Make sure every delegate saved their charter (~/charter/charter.md): they use it in the Day 6 capstone.' },
      BACKUP,
    ],
    watch: [
      ['Merge stays grey', 'No approval as reviewer yet, the approval went stale after a new commit (approve again), or the pipeline check is not green yet. Your own approval never counts.'],
      ['A pull request is red and someone wants to merge', 'Gitea will not let them: "Some required checks failed", and the button only offers to merge when checks succeed. Read the failing step together; Day 5 is about exactly this.'],
      ['Argo CD asks for a login', 'The read-only account: delegate, with its password in the logins file (cat /etc/pelab/logins.md). studentNN does not work there. The same login opens Grafana on Day 6.'],
      ['Argo CD shows the old commit for a long time', 'The pipeline on main must finish first (Actions tab). Argo CD checks Git every minute, so it notices within a minute or two. If merges stop reaching dev on a VM, see the safety net (safety-net.md).'],
    ],
    after: ['Everyone pushed their work.', 'Check-off sheet updated.', 'Charters kept.'],
  },

  3: {
    before: [
      CHECKS,
      'Today each delegate approves their own environment request as the platform team, signed in as platform-approver in a private window. Before Lab 2, show on your demo VM what the platform team checks in a request (Lab 2, step 4).',
      'On every VM, the applier says "Up to date": ansible pelab -b -a "journalctl -u pelab-platform-apply.service -n 5 --no-pager"',
      'Nobody has staging or prod yet: Argo CD shows team01-hello-staging and -prod retrying. That is expected.',
    ],
    timetable: [
      ['09:00', 'Opening', '1-2', ''],
      ['09:15', 'Infrastructure as Code; how this lab was built', '3-5', 'Show the lab\'s own Ansible project (site.yml, roles/, versions.yml). Do not run it.'],
      ['10:00', 'Lab 1: plan, apply, change, destroy', '6-7', 'Type the file live on slide 6 first.'],
      ['10:40', 'Break', '', ''],
      ['10:55', 'Environments from a template; how a request becomes an environment', '8-9', ''],
      ['11:30', 'Lab 2: request staging and prod from the template', '10', 'Each delegate approves their own request as platform-approver. Walk round and read a few plans with them.'],
      ['12:30', 'Lunch', '', ''],
      ['13:15', 'What happened when you merged', '11', ''],
      ['13:30', 'Lab 3: drift, and destroy and recreate', '12', 'You pause the repairs and change the quotas on every VM (actions below). Each delegate approves their two pull requests as platform-approver.'],
      ['14:15', 'Break', '', ''],
      ['14:30', 'Budgets: FinOps starts in the template', '13-14', ''],
      ['15:00', 'Close: quiz and recap', '15-16', ''],
      ['15:30', 'Check-off and questions', '', ''],
    ],
    actions: [
      { when: 'Lab 2, step 4: before the delegates approve', what: 'On your demo VM, show what the platform team checks before approving: Files Changed shows one new file, team01.tf, with the team\'s name in both places, environments ["staging", "prod"] and size "small"; the plan run says "Plan: 16 to add, 0 to change, 0 to destroy". If anything else changes, or the plan destroys something, the platform team chooses Request Changes and says why.', where: 'Gitea on your demo VM, as platform-approver' },
      { when: 'Lab 2, after the merges', what: 'Each merge commit gets a green platform/apply within two minutes. If one does not after five minutes, read that VM\'s applier log (here pelab05), fix the cause, and run it again.', where: 'Your machine, one VM', run: 'ansible pelab05 -b -a "journalctl -u pelab-platform-apply.service -n 50 --no-pager"\nansible pelab05 -b -a "systemctl start pelab-platform-apply.service"' },
      { when: 'Lab 3, step 1: cause the drift', what: 'Pause the platform\'s repairs on every VM first, or they may put the quota back before the delegates run their plan. Then raise every VM\'s staging CPU budget by hand.', where: 'Your machine, every VM', run: 'ansible pelab -b -a "systemctl stop pelab-platform-apply.timer"\nansible pelab -b -m ansible.builtin.shell -a "k3s kubectl -n team01-staging patch resourcequota team-quota --type merge -p \'{\\"spec\\":{\\"hard\\":{\\"requests.cpu\\":\\"5\\"}}}\'"' },
      { when: 'Lab 3, after step 2 (every delegate has seen their quota in the plan: 1 to change)', what: 'Switch the repairs back on, on every VM. The quotas return to the code\'s value within two minutes.', where: 'Your machine, every VM', run: 'ansible pelab -b -a "systemctl start pelab-platform-apply.timer pelab-platform-apply.service"' },
      { when: 'Lab 3, steps 4 and 5', what: 'Each delegate approves their own "remove staging" pull request (its plan says 8 to destroy: expected in this lab, and only for staging), then their "add staging back" pull request (8 to add), as platform-approver. Remind them to read the plan before approving.' },
      BACKUP,
    ],
    watch: [
      ['The plan pipeline fails with an access error', 'Its read-only credentials are stale (for example after a cluster rebuild): ansible-playbook site.yml --tags golden_path -K, on that VM'],
      ['"Invalid value for variable" in the plan', 'The team name, environment list or size is wrong. The message says which.'],
      ['A delegate approved their request as studentNN or reviewer', 'It does not count: only pelab-admin or platform-approver may approve here. They sign in as platform-approver in a private window and approve again.'],
    ],
    after: ['Every VM has team01-staging and team01-prod (Argo CD: staging and prod Synced, 0 replicas).', 'The applier timer is running again on every VM: ansible pelab -b -a "systemctl is-active pelab-platform-apply.timer"', 'Everyone pushed their work.', 'Check-off sheet updated.'],
  },

  4: {
    before: [
      CHECKS,
      'The base image is in each VM\'s Harbor cache: Lab 1 builds pull it through Harbor. On every VM: ansible pelab -b -a "lxc exec student01 -- docker pull harbor.<lab domain>/dockerhub/library/python:3.12-slim"',
      'The portal loads and you can sign in as guest (Lab 3, step 7).',
    ],
    timetable: [
      ['09:00', 'Opening', '1-2', ''],
      ['09:15', 'Containers: what an image is; the Dockerfile line by line', '3-5', ''],
      ['10:00', 'Lab 1: build and run the hello image', '6', ''],
      ['10:40', 'Break', '', ''],
      ['10:55', 'Lab 2: one image, three environments', '7', ''],
      ['11:20', 'What the cluster adds', '8', ''],
      ['11:35', 'The packaging template: the golden path', '9-12', 'Name the five verbs: pick, build, embed, hand over, measure.'],
      ['12:30', 'Lunch', '', ''],
      ['13:15', 'Lab 3: create a new service from the template', '13-14', 'Everyone creates their own rates. Allow for the first pipeline run.'],
      ['14:10', 'Lab 4: a first change to the new service', '15', ''],
      ['14:35', 'Lab 5: add a pipeline from a template', '16-17', 'Ask each delegate for their minutes, from finding the template to the green run.'],
      ['15:00', 'Break', '', ''],
      ['15:10', 'Close: scenarios, quiz and recap', '18-20', ''],
      ['15:40', 'Check-off and questions', '', ''],
    ],
    actions: [
      { when: 'Lab 1, step 1', what: 'If builds cannot pull the base image, that VM\'s Harbor cache is cold and the VM has no internet. Fix the internet, or pull the image once through that VM\'s Harbor so the cache keeps it (the check in Before the day).' },
      { when: 'Lab 3', what: 'Each delegate creates exactly one service called rates. Argo CD finds new repositories within a minute; the dev address answers after the first pipeline has pushed its image.' },
      { when: 'Lab 5', what: 'Each delegate adds smoke-test.yaml to their own rates, through a pull request the reviewer approves. Collect the minutes from step 1 to the green run, and the staging run that goes red: both make the point of the day.' },
      BACKUP,
    ],
    watch: [
      ['The template is not offered', 'The delegate is not signed in to Gitea, or did not choose platform/golden-path in the Template field.'],
      ['A name with capitals or spaces', 'Delete the repository (Settings → Danger Zone) and create it again as rates.'],
      ['port is already allocated', 'An old container still uses the port: docker rm -f <name>.'],
      ['Analyze fails in the portal', 'The address must end in /src/branch/main/catalog-info.yaml.'],
    ],
    after: ['Every delegate has team01/rates, live in dev, in their portal.', 'Everyone pushed their work.', 'Check-off sheet updated.'],
  },

  5: {
    before: [
      CHECKS,
      'Kyverno is running on every VM: ansible pelab -b -a "k3s kubectl -n kyverno get pods"',
      'Today each delegate approves their own exception requests as platform-approver, as on Day 3. Before Lab 5, show on your demo VM what the platform team checks in an exception (Lab 5, step 4).',
      'The latest commit of platform/policies shows a green platform/apply "3 policies, 0 exceptions in force".',
    ],
    timetable: [
      ['09:00', 'Opening', '1-2', ''],
      ['09:15', 'CI/CD and DevSecOps; the pipeline file', '3-6', 'Open the real ci.yaml beside slide 6.'],
      ['10:00', 'Lab 1: read the pipeline and its evidence', '7', ''],
      ['10:30', 'Break', '', ''],
      ['10:45', 'Lab 2: break the pipeline three ways, and fix it', '8-9', 'Red runs are the point. Read one failing log together.'],
      ['11:40', 'Policy-as-code: what a guardrail looks like', '10-12', ''],
      ['12:20', 'Lunch', '', ''],
      ['13:05', 'Lab 3: watch the guardrails refuse a bad deployment', '13', ''],
      ['13:40', 'Lab 4: test a policy like code', '14', ''],
      ['14:05', 'Scenarios; exceptions as code', '15-17', ''],
      ['14:30', 'Break', '', ''],
      ['14:45', 'Lab 5: ask for an exception, and watch it expire', '18', 'Two approvals per delegate, as platform-approver.'],
      ['15:25', 'Close: quiz and recap', '19-20', ''],
      ['15:45', 'Check-off and questions', '', ''],
    ],
    actions: [
      { when: 'Lab 2', what: 'Expect red runs: they are the point. Each delegate must see all three failures: the wrong test, the password, and USER root.' },
      { when: 'Lab 5, step 4: before the delegates approve', what: 'On your demo VM, show what the platform team checks in an exception: the file is exceptions/team01-status-page.yaml only; the name and namespace are the team\'s own; requested-by is the delegate; the reason makes sense; the end date is at most 30 days ahead; and the test pipeline is green. Two minutes after the merge, the commit shows "3 policies, 1 exceptions in force".', where: 'Gitea on your demo VM, as platform-approver' },
      { when: 'Lab 5, step 6', what: 'Each delegate sets their end date to yesterday and approves it as platform-approver; the check reports it as ended and stays green. The next platform/apply says "expired, not applied: team01-status-page".' },
      BACKUP,
    ],
    watch: [
      ['Everything shows as skipped in kyverno apply', 'The --values-file tests/values.yaml part is missing.'],
      ['The status page is still refused after the merge', 'Wait for platform/apply (two minutes). Then check the namespace and the names in the exception match the deployment.'],
      ['A delegate committed a changed examples/ file', 'The policy tests then fail. Undo it: git checkout examples/ and push again. The labs work on copies in the home folder.'],
    ],
    after: ['Every delegate\'s exception is ended, and its status-page deployment deleted.', 'Everyone pushed their work.', 'Check-off sheet updated.'],
  },

  6: {
    before: [
      CHECKS,
      'Brief the capstone panels with capstone-rubric.md. Presentations start at 14:45: five minutes and two minutes of questions per delegate. With 25 delegates, run three panels side by side (about eight delegates each, under an hour).',
      'Every delegate has staging and prod (Day 3), and rates (Day 4).',
      'the Golden path services dashboard in Grafana on each VM shows team01.',
    ],
    timetable: [
      ['09:00', 'Opening: today ends in production', '1-2', ''],
      ['09:10', 'Kubernetes in five words; GitOps promotion', '3-5', ''],
      ['09:40', 'Lab 1: promote hello to staging, then prod', '6', ''],
      ['10:20', 'Observability; Lab 2: read the dashboard', '7-9', ''],
      ['11:05', 'Break', '', ''],
      ['11:15', 'Performance engineering; Lab 3: load-test staging', '10-12', 'Staging only, never prod.'],
      ['12:00', 'Lab 4: break it, and watch the platform recover', '13-14', 'Delegates note clock times: they are evidence.'],
      ['12:45', 'Lunch', '', ''],
      ['13:15', 'Capstone: brief, then build', '15-19', '90 minutes. Warn everyone at 14:30.'],
      ['14:45', 'Presentations to the panels', '', 'Seven minutes per delegate, three panels side by side. Each panel scores with the rubric.'],
      ['15:50', 'Close: what next for the platform', '20-21', ''],
    ],
    actions: [
      { when: 'Lab 1', what: 'Each delegate promotes hello twice: staging (one copy), then prod (two copies). The tag must be an image that exists in Harbor; a wrong tag shows as an image pull error.' },
      { when: 'Lab 4, step 2', what: 'Argo CD puts the copy back within a few minutes. Ask the delegates to write down the time from scale-down to "answers again".' },
      { when: 'Capstone', what: 'Circulate. Ask each delegate for their evidence as they go, not at the end. At 14:30 tell them to stop building and finish the evidence pack.' },
      { when: 'After the presentations', what: 'Collect the evidence packs and the panel scores. Compare the bottlenecks photographed on Day 1 with what the delegates did this week.' },
      BACKUP,
    ],
    watch: [
      ['Empty dashboard panels', 'Pick the team (team01) and the app at the top of the dashboard, and look at the last 15 minutes.'],
      ['A load test aimed at prod', 'Stop it. Load tests run against staging only.'],
      ['Merges stop reaching the environments on a VM', 'Restart Argo CD on that VM once; if that does not help within 15 minutes, switch on the safety net there (safety-net.md). The capstone can finish with it on.'],
    ],
    after: ['Everyone pushed their work.', 'Panel scores and evidence packs collected.', 'Next: a new cohort on the same VMs (on each VM: ansible-playbook reset.yml -e reset_rotate_credentials=true -K) or teardown (setup guide, Part 11).'],
  },
};
