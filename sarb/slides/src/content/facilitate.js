// How to run each day, for the instructor guide (sarb/instructor/dayN-notes.md):
// what to prepare, the timetable with slide numbers, every action only the
// instructor takes (with the exact commands), what to watch for, and the end
// of the day. Commands marked "lab server" run there over SSH; the others on
// the control machine in pe-lab-ansible/.
'use strict';

const BACKUP = { when: 'End of the day', what: 'Copy tonight\'s backup to the control machine (it takes a fresh one first).', where: 'Control machine', run: 'ansible-playbook backup.yml' };
const CHECKS = 'The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana, and the lab server lines). 30 minutes before the start.';

module.exports = {
  1: {
    before: [
      CHECKS,
      'Print the access sheets (credentials/access/student01.md to student25.md), one per delegate, in team order. Keep student26 aside as the spare; student27 is your demo workspace (setup guide, Part 5).',
      'One A3 sheet and markers per team for Lab 1.',
      'Know who sits in which team: student01-05 are team01, student06-10 team02, and so on.',
      'Open the portal, Gitea and Argo CD on the presenter screen, signed in as pelab-admin in a private window (you approve on Days 3 and 5).',
    ],
    timetable: [
      ['09:00', 'Welcome; hand out the access sheets', '1-3', 'Everyone opens the portal and their workspace before you go on. Count the workspaces that loaded.'],
      ['09:30', 'Platform engineering and the IDP', '4-9', 'The mini platform (slide 6) comes back every day: trace one change through it slowly.'],
      ['10:30', 'Break', '', ''],
      ['10:45', 'Lab 1: map how a change reaches production', '10', '45 minutes in teams, then two minutes per team. Write each team\'s bottleneck on the board.'],
      ['11:45', 'Linux basics', '11-13', ''],
      ['12:15', 'Lunch', '', ''],
      ['13:00', 'Lab 2: Linux warm-up', '14', 'Pair confident delegates with less confident ones.'],
      ['13:30', 'Run the app by hand', '15', ''],
      ['13:45', 'Lab 3: run hello by hand, and count the steps', '16-17', 'Collect the step counts: they are the case for the rest of the week.'],
      ['14:45', 'Break', '', ''],
      ['15:00', 'Close: quiz and recap', '18-19', ''],
      ['15:30', 'Check-off and questions', '', 'Tick Labs 1 to 3 per team on the check-off sheet.'],
    ],
    actions: [
      { when: '09:00, while everyone signs in', what: 'If a workspace does not load, restart it. If a password is refused, check it is typed exactly as on the sheet (it is case-sensitive: Lab-xxxx-xxxx-1234).', where: 'Lab server', run: 'sudo lxc restart studentNN' },
      { when: 'Lab 1', what: 'Photograph the board of bottlenecks. On Day 6 the teams check which of them the platform removed.' },
      { when: 'Lab 3, step 1', what: 'The first git clone of the week asks for the user name and password: the same ones as the workspace.' },
      BACKUP,
    ],
    watch: [
      ['The browser warns about the certificate', 'The thin clients do not trust the lab CA. Desktop support must install it (setup guide, Part 1). Until then delegates can continue past the warning, but code-server misbehaves.'],
      ['A workspace page stays blank', 'sudo lxc restart studentNN on the lab server. Still broken: give the delegate a spare (run-book).'],
      ['Address already in use (Lab 3)', 'A copy of hello is still running: pkill -f app.main, or use another PORT.'],
    ],
    after: ['Backup copied (ansible-playbook backup.yml).', 'Check-off sheet updated.', 'Bottleneck photo kept for Day 6.'],
  },

  2: {
    before: [
      CHECKS,
      'Check every team\'s dev address answers: https://hello-team01-dev.<lab domain>/ to team05.',
      'Check the five runners are up: Gitea → Site Administration → Actions → Runners shows five runners, idle.',
    ],
    timetable: [
      ['09:00', 'Opening: yesterday in one minute, today\'s goal', '1-2', ''],
      ['09:15', 'Version control, the pull-request loop, protected main', '3-6', ''],
      ['10:00', 'Lab 1: your first change, on a branch', '7', 'Everyone makes their own branch and change.'],
      ['10:30', 'Break', '', ''],
      ['10:45', 'Pull requests and reviews', '8', ''],
      ['11:00', 'Lab 2: review, approve, merge, and watch it go live', '9', 'In pairs. Explain GitOps (slide 10) while the pipelines run.'],
      ['11:40', 'GitOps: Git says what should run', '10', ''],
      ['12:00', 'Lab 3: try to break the rules', '11', ''],
      ['12:20', 'Lunch', '', ''],
      ['13:05', 'Lab 4: resolve a merge conflict', '12', 'In pairs.'],
      ['13:30', 'Platform as a product', '13-14', ''],
      ['14:00', 'Lab 5: the team\'s platform charter', '15', '30 minutes in teams, then two minutes per team.'],
      ['14:45', 'Break', '', ''],
      ['15:00', 'Close: scenarios, quiz and recap', '16-18', ''],
      ['15:40', 'Check-off and questions', '', ''],
    ],
    actions: [
      { when: 'Lab 2', what: 'Expect a queue: five runners serve 25 people, and each merge runs the pipeline twice (pull request, then main). Use the wait for slide 10. If one pipeline waits more than 10 minutes, check the runners.', where: 'Lab server', run: 'sudo lxc list runner -c ns\nsudo lxc exec runner01 -- systemctl status pelab-gitea-runner --no-pager' },
      { when: 'Lab 3', what: 'Every team must see the three refusals. If a push straight to main succeeds, stop: the protection is missing. Put it back.', where: 'Control machine', run: 'ansible-playbook site.yml --tags golden_path' },
      { when: 'Lab 5', what: 'Photograph or collect the charters: the teams use them in the Day 6 capstone.' },
      BACKUP,
    ],
    watch: [
      ['Merge stays grey', 'No approval yet, the approval went stale after a new commit (approve again), or the pipeline check is not green yet. Your own approval never counts.'],
      ['A pull request is red and someone wants to merge', 'Gitea will not let them: "Some required checks failed", and the button only offers to merge when checks succeed. Read the failing step together; Day 5 is about exactly this.'],
      ['Argo CD shows the old commit for a long time', 'The pipeline on main must finish first (Actions tab). Argo CD notices within about three minutes. If merges stop reaching dev for every team, see the safety net (safety-net.md).'],
    ],
    after: ['Backup copied.', 'Check-off sheet updated.', 'Charters kept.'],
  },

  3: {
    before: [
      CHECKS,
      'Sign in to Gitea as pelab-admin (credentials/gitea-admin.txt) in a private window. Today only you may approve environment requests.',
      'On the lab server, the applier says "Up to date": sudo journalctl -u pelab-platform-apply.service -n 5 --no-pager',
      'No team has staging or prod yet: Argo CD shows teamNN-hello-staging and -prod retrying. That is expected.',
    ],
    timetable: [
      ['09:00', 'Opening', '1-2', ''],
      ['09:15', 'Infrastructure as Code; how this lab was built', '3-5', 'Show the lab\'s own Ansible project (site.yml, roles/, versions.yml). Do not run it.'],
      ['10:00', 'Lab 1: plan, apply, change, destroy', '6-7', 'Type the file live on slide 6 first.'],
      ['10:40', 'Break', '', ''],
      ['10:55', 'Environments from a template; how a request becomes an environment', '8-9', ''],
      ['11:30', 'Lab 2: request staging and prod from the template', '10', 'One driver per team. You approve five pull requests.'],
      ['12:30', 'Lunch', '', ''],
      ['13:15', 'What happened when you merged', '11', ''],
      ['13:30', 'Lab 3: drift, and destroy and recreate', '12', 'You pause the repairs and change the quotas (actions below). You approve ten pull requests.'],
      ['14:15', 'Break', '', ''],
      ['14:30', 'Budgets: FinOps starts in the template', '13-14', ''],
      ['15:00', 'Close: quiz and recap', '15-16', ''],
      ['15:30', 'Check-off and questions', '', ''],
    ],
    actions: [
      { when: 'Lab 2, step 4: approve each team\'s request', what: 'In platform/environments → Pull Requests, open each one. Files Changed must show one new file, teamNN.tf, with the team\'s own name in both places, environments ["staging", "prod"] and size "small". Open its plan run: "Plan: 16 to add, 0 to change, 0 to destroy". Then Review → Approve. If anything else changes, or the plan destroys something, choose Request Changes and say why.', where: 'Gitea, as pelab-admin' },
      { when: 'Lab 2, after the merges', what: 'Each merge commit gets a green platform/apply within two minutes. If one does not after five minutes, read the applier\'s log, fix the cause, and run it again.', where: 'Lab server', run: 'sudo journalctl -u pelab-platform-apply.service -n 50 --no-pager\nsudo systemctl start pelab-platform-apply.service' },
      { when: 'Lab 3, step 1: cause the drift', what: 'Pause the platform\'s repairs first, or it may put the quotas back before the teams run their plan. Then raise every team\'s staging CPU budget by hand.', where: 'Lab server', run: 'sudo systemctl stop pelab-platform-apply.timer\nfor t in team01 team02 team03 team04 team05; do\n  sudo k3s kubectl -n $t-staging patch resourcequota team-quota --type merge -p \'{"spec":{"hard":{"requests.cpu":"5"}}}\'\ndone' },
      { when: 'Lab 3, after step 2 (every team has seen "1 to change")', what: 'Switch the repairs back on. The quotas return to the code\'s value within two minutes.', where: 'Lab server', run: 'sudo systemctl start pelab-platform-apply.timer pelab-platform-apply.service' },
      { when: 'Lab 3, steps 4 and 5', what: 'Approve each team\'s "remove staging" pull request (its plan says 8 to destroy: expected in this lab, and only for staging), then its "add staging back" pull request (8 to add).', where: 'Gitea, as pelab-admin' },
      BACKUP,
    ],
    watch: [
      ['The plan pipeline fails with an access error', 'Its read-only credentials are stale (for example after a cluster rebuild): ansible-playbook site.yml --tags golden_path'],
      ['"Invalid value for variable" in the plan', 'The team name, environment list or size is wrong. The message says which.'],
      ['A team approved its own request', 'It does not count: only pelab-admin may approve here. Merge stays grey until you approve.'],
    ],
    after: ['Every team has teamNN-staging and teamNN-prod (Argo CD: staging and prod Synced, 0 replicas).', 'The applier timer is running again: systemctl list-timers pelab-platform-apply.timer', 'Backup copied.', 'Check-off sheet updated.'],
  },

  4: {
    before: [
      CHECKS,
      'The base image is in Harbor\'s cache: Lab 1 builds pull it through Harbor. From any workspace: docker pull harbor.<lab domain>/dockerhub/library/python:3.12-slim',
      'The portal loads and you can sign in as guest (Lab 3, step 6).',
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
      ['13:15', 'Lab 3: create a new service from the template', '13', 'One driver per team. Allow for the first pipeline run.'],
      ['14:10', 'Lab 4: a first change to the new service', '14', ''],
      ['14:35', 'Break', '', ''],
      ['14:50', 'Close: scenarios, quiz and recap', '15-17', ''],
      ['15:30', 'Check-off and questions', '', ''],
    ],
    actions: [
      { when: 'Lab 1, step 1', what: 'If builds cannot pull the base image, the Harbor cache is cold and the server has no internet. Fix the internet, or pull the image once on the lab server so the cache keeps it.' },
      { when: 'Lab 3', what: 'Each team creates exactly one service called rates. Argo CD finds new repositories within a minute; the dev address answers after the first pipeline has pushed its image.' },
      BACKUP,
    ],
    watch: [
      ['The template is not offered', 'The delegate is not signed in to Gitea, or did not choose platform/golden-path in the Template field.'],
      ['A name with capitals or spaces', 'Delete the repository (Settings → Danger Zone) and create it again as rates.'],
      ['port is already allocated', 'An old container still uses the port: docker rm -f <name>.'],
      ['Analyze fails in the portal', 'The address must end in /src/branch/main/catalog-info.yaml.'],
    ],
    after: ['Every team has teamNN/rates, live in dev, in the portal.', 'Backup copied.', 'Check-off sheet updated.'],
  },

  5: {
    before: [
      CHECKS,
      'Kyverno is running: sudo k3s kubectl -n kyverno get pods (lab server).',
      'Sign in to Gitea as pelab-admin in a private window: today you approve the exception requests.',
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
      ['14:45', 'Lab 5: ask for an exception, and watch it expire', '18', 'You approve two pull requests per team.'],
      ['15:25', 'Close: quiz and recap', '19-20', ''],
      ['15:45', 'Check-off and questions', '', ''],
    ],
    actions: [
      { when: 'Lab 2', what: 'Expect many red runs at once and a queue on the runners. Each team must see all three failures: the wrong test, the password, and USER root.' },
      { when: 'Lab 5, step 4: approve each team\'s exception', what: 'In platform/policies → Pull Requests, open each one. Check that the file is exceptions/teamNN-status-page.yaml only; that the name and namespace are the team\'s own; that requested-by is one of its members; that the reason makes sense; that the end date is at most 30 days ahead; and that the test pipeline is green. Then approve. Two minutes after the merge, the commit shows "3 policies, N exceptions in force".', where: 'Gitea, as pelab-admin' },
      { when: 'Lab 5, step 6: approve each team\'s "end" pull request', what: 'The team sets its end date to yesterday; the check reports it as ended and stays green. Approve it. The next platform/apply says "expired, not applied: teamNN-status-page". Let the team open this pull request: you cannot approve one you opened yourself.', where: 'Gitea, as pelab-admin' },
      BACKUP,
    ],
    watch: [
      ['Everything shows as skipped in kyverno apply', 'The --values-file tests/values.yaml part is missing.'],
      ['The status page is still refused after the merge', 'Wait for platform/apply (two minutes). Then check the namespace and the names in the exception match the deployment.'],
      ['A delegate committed a changed examples/ file', 'The policy tests then fail. Undo it: git checkout examples/ and push again. The labs work on copies in the home folder.'],
    ],
    after: ['Every team\'s exception is ended, and its status-page deployment deleted.', 'Backup copied.', 'Check-off sheet updated.'],
  },

  6: {
    before: [
      CHECKS,
      'Brief the capstone panel with capstone-rubric.md. Presentations start at 14:45: ten minutes and three minutes of questions per team.',
      'Every team has staging and prod (Day 3), and rates (Day 4).',
      'The Golden path dashboard in Grafana shows all five teams.',
    ],
    timetable: [
      ['09:00', 'Opening: today ends in production', '1-2', ''],
      ['09:10', 'Kubernetes in five words; GitOps promotion', '3-5', ''],
      ['09:40', 'Lab 1: promote hello to staging, then prod', '6', ''],
      ['10:20', 'Observability; Lab 2: read the dashboard', '7-9', ''],
      ['11:05', 'Break', '', ''],
      ['11:15', 'Performance engineering; Lab 3: load-test staging', '10-12', 'Staging only, never prod.'],
      ['12:00', 'Lab 4: break it, and watch the platform recover', '13-14', 'Teams note clock times: they are evidence.'],
      ['12:45', 'Lunch', '', ''],
      ['13:15', 'Capstone: brief, then build', '15-19', '90 minutes. Warn the teams at 14:30.'],
      ['14:45', 'Presentations to the panel', '', 'Five teams, 13 minutes each. The panel scores with the rubric.'],
      ['15:50', 'Close: what next for the platform', '20-21', ''],
    ],
    actions: [
      { when: 'Lab 1', what: 'Each team promotes hello twice: staging (one copy), then prod (two copies). The tag must be an image that exists in Harbor; a wrong tag shows as an image pull error.' },
      { when: 'Lab 4, step 2', what: 'Argo CD puts the copy back within a few minutes. Ask the teams to write down the time from scale-down to "answers again".' },
      { when: 'Capstone', what: 'Circulate. Ask each team for its evidence as it goes, not at the end. At 14:30 tell them to stop building and finish the evidence pack.' },
      { when: 'After the presentations', what: 'Collect the evidence packs and the panel scores. Compare the bottlenecks photographed on Day 1 with what the teams did this week.' },
      BACKUP,
    ],
    watch: [
      ['Empty dashboard panels', 'Pick the team and the app at the top of the dashboard, and look at the last 15 minutes.'],
      ['A load test aimed at prod', 'Stop it. Load tests run against staging only.'],
      ['Merges stop reaching the environments for every team', 'Restart Argo CD once; if that does not help within 15 minutes, switch on the safety net (safety-net.md). The capstone can finish with it on.'],
    ],
    after: ['Backup copied.', 'Panel scores and evidence packs collected.', 'Next: a new cohort (ansible-playbook reset.yml -e reset_rotate_credentials=true) or teardown (setup guide, Part 11).'],
  },
};
