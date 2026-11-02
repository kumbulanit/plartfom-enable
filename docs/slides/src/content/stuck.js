// "If you are stuck" tips for the handbook, by lab title. Only what the lab
// really does; anything else goes to the lab assistant.
'use strict';

module.exports = {
  'Lab 1: map how a change reaches production today': [
    'No recent change to map? Use how you got access to a new system, or how a report reaches its readers.',
    'Count waits in calendar days, not working hours; the point is how long a user waits.',
  ],
  'Lab 2: Linux warm-up in your workspace': [
    'command not found: check the spelling. Press Tab to complete commands and file names.',
    'top, less and man take over the terminal: press q to leave.',
    'Permission denied: work inside your home folder (cd ~).',
  ],
  'Lab 3: run hello by hand, and count the steps': [
    'git clone asks for a user name and password: studentNN and your password (cat /etc/pelab/logins.md).',
    'Address already in use: a copy is still running. Stop it with pkill -f app.main, or use another PORT.',
    'curl: connection refused: the app is not running, or it runs on another port. Check the first terminal.',
  ],
  'Lab 1: your first change, on a branch': [
    'Author identity unknown: run git config --global user.name "Your Name" and git config --global user.email studentNN@<lab domain>.',
    'rejected (non-fast-forward): someone pushed first. Run git pull --rebase, then push again.',
  ],
  'Lab 2: review, approve, merge, and watch it go live': [
    'Argo CD asks for a user name and password: delegate, with its password from cat /etc/pelab/logins.md. Your studentNN password does not work there.',
    'Merge stays grey: it needs one approval from a second person. Your own approval does not count. Approve as reviewer in a private window, with its password from cat /etc/pelab/logins.md.',
    '"Some checks are pending" or "Some required checks failed" although approved: the required check called pipeline is not green yet. Wait for the run to finish; if it is red, fix it on the branch and push again (Day 5 shows how to read the failure). The "When checks succeed" button only queues the merge: nothing merges while the check is red.',
    'Argo CD still shows the old commit: the pipeline must finish first (Actions tab). Argo CD checks Git every minute, so it notices within a minute or two.',
  ],
  'Lab 3: try to break the rules': [
    'If any of these pushes or approvals succeeds, tell the instructor straight away: a control is missing.',
  ],
  'Lab 4: resolve a merge conflict': [
    'Lost in the conflict? git merge --abort puts everything back; start step 3 again.',
    'Look for the markers <<<<<<<, ======= and >>>>>>>: delete all three lines, not only the text between them.',
  ],
  "Lab 5: write your team's one-page platform charter": [
    'A promise needs a number and a unit: "within 15 minutes", not "fast".',
  ],
  'Lab 1: plan, apply, change, destroy': [
    'tofu init cannot find the provider: check the spelling of hashicorp/local. The workspace has a local copy of it.',
    'tofu apply waits for an answer: type yes and press Enter.',
  ],
  'Lab 2: request staging and prod from the template': [
    'The plan says "Invalid value for variable": the message says what to fix (the team name, the environments or the size).',
    'The plan pipeline fails before the plan with an access error: tell the instructor (the read-only credentials).',
    'Merge stays grey: only the platform team can approve this repository, as pelab-admin (the instructor) or platform-approver (its password is in cat /etc/pelab/logins.md). An approval as studentNN does not count.',
    'No platform/apply status after five minutes: tell the instructor (the platform applier on the lab host).',
  ],
  'Lab 3: drift, and destroy and recreate': [
    'The quota did not come back yet: the platform applies every two minutes. Wait for the next run.',
    'A destroy plan you did not expect: do not merge it. Ask the instructor to look at the plan with you.',
  ],
  'Lab 1: build and run the hello image': [
    'The build cannot pull the base image: the Harbor cache may be cold or offline. Tell the lab assistant.',
    'port is already allocated: an old container still uses the port. docker rm -f hello, then run again.',
  ],
  'Lab 2: one image, three environments': [
    'Your change does not show: rebuild with a new tag, and run that tag. A tag never changes its image.',
  ],
  'Lab 3: create a new service from the template': [
    'The template is not offered: you must be signed in, and pick platform/golden-path in the Template field.',
    'Use a short lowercase name with dashes only: it becomes part of the service address.',
    'Nothing in Argo CD after a few minutes: the pipeline must finish first (Actions tab).',
    'Analyze fails in the portal: check the address ends in /src/branch/main/catalog-info.yaml.',
  ],
  'Lab 4: a first change to the new service': [
    'The same as Day 2: one approval from the reviewer, then merge once the pipeline is green.',
  ],
  'Lab 5: add a pipeline from a template': [
    'Copy the template with its Copy content button, not by selecting the text: the spaces at the start of each line matter.',
    'The file must be at .gitea/workflows/smoke-test.yaml in your rates repository, on main, before smoke-test appears under All Workflows.',
    'Red for staging is expected: rates has no staging yet.',
  ],
  'Lab 1: read the pipeline and its evidence': [
    'Harbor shows a sign-in page: sign in as studentNN with your lab password.',
    'No SBOM yet: Harbor makes it shortly after the image is pushed. Refresh after a minute.',
  ],
  'Lab 2: break the pipeline three ways, and fix it': [
    'Green again after removing the password, but it is still in the branch\'s history in Gitea: a real password would have to be changed. Delete the branch after the lab.',
    'Your test change did not break anything: check you changed an expected value (for example 200 to 201), not the code under test.',
  ],
  'Lab 3: watch the guardrails refuse a bad deployment': [
    'Error from server (Forbidden) without a policy name: check the namespace is your team\'s dev namespace (teamNN-dev).',
    'Accepted too early? Check you changed team01 to your team: the rules only apply in team namespaces.',
  ],
  'Lab 4: test a policy like code, with the Kyverno CLI': [
    'Everything shows as skipped: you left out --values-file tests/values.yaml, so the command line does not know team01-dev is a team namespace.',
  ],
  'Lab 5: ask for an exception, and watch it expire': [
    'check-exceptions.py says the date is too far ahead: at most 30 days from today.',
    'Still refused after the merge: wait for the platform/apply status (two minutes), and check the namespace and name in your exception match the deployment.',
  ],
  'Lab 1: promote hello to staging, then prod': [
    'Copy the whole tag: all 40 characters of the commit id.',
    'Argo CD shows the image cannot be pulled: the tag is wrong. Fix it in a new pull request.',
  ],
  'Lab 2: read the dashboard': [
    'Grafana asks for a login: delegate, with its password from cat /etc/pelab/logins.md (the same as Argo CD). It is read-only: you can look at everything and change nothing.',
    'Empty panels: pick your team and app at the top of the dashboard, and look at the last 15 minutes.',
  ],
  'Lab 3: load-test staging and watch the dashboard': [
    'Use your team\'s staging address, never prod.',
    'Many failed checks: your staging may have 0 replicas. Check Lab 1 was merged and synced.',
  ],
  'Lab 4: break it, and watch the platform recover': [
    'Note the clock time at every step: the times are the evidence.',
  ],
  'Capstone: your service to prod, with evidence': [
    'Collect evidence as you go: a link or a screenshot after every step, not at the end.',
  ],
};
