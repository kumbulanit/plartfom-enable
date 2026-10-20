# The GitHub option: hosting the course's Git on github.com

The lab ships with Gitea: a Git service with a web interface much like GitHub's,
running inside the lab on the lab server. This guide is for the case where you
would rather use **github.com** for the Git side of the course, with the rest of
the lab (workspaces, pipelines' runners, the cluster, Harbor, Argo CD, Grafana,
the portal) still on the lab server.

Read the first section before anything else: it says when GitHub is worth it,
and what it costs in work and in money.

## 1. Gitea or GitHub?

| | Gitea (as shipped) | GitHub |
| --- | --- | --- |
| Web interface | Yes: pull requests, reviews, pipeline logs, teams, templates. Deliberately GitHub-like | Yes |
| Blocks a red pull request from merging | Yes (the pipeline posts its verdict; main requires it) | Yes, built in |
| Accounts | Made by the build: one per delegate, no sign-up, no 2FA | Real GitHub accounts, each with 2FA |
| Works without internet | Yes | No: the course stops when github.com is unreachable |
| Data | Stays on the lab server | Repositories live at GitHub (private) |
| Money | None | GitHub Team plan while the course runs: see section 7 |
| Work to switch | None | 2 to 3 days of lab changes, plus a test against a real organisation |
| Reset between cohorts | `reset.yml` | `reset.yml` plus deleting and recreating the repositories at GitHub |
| What delegates learn | The same: the words (pull request, review, Actions, template) are identical | The real product they may use at work |

**Choose Gitea** unless one of these is true:
- SARB already uses GitHub (especially GitHub Enterprise Cloud, where delegates
  already have accounts): then the course on the real tool is worth the switch.
- You want delegates to keep their work and continue after the course.

Everything delegates learn on Gitea carries over to GitHub one to one. If the
bank uses GitHub day to day, one slide on Day 1 saying "Gitea is a stand-in for
GitHub; same words, same buttons" is enough.

## 2. What stays the same

- The lab server, the workspaces in the browser, the runners, the cluster,
  Harbor, Argo CD, Grafana, Kyverno and the portal.
- All six days of material. Delegates branch, push, open pull requests, review,
  merge, read pipeline logs, create a service from a template and watch it
  deploy, exactly as in the handbook.
- The pipeline files: Gitea Actions and GitHub Actions use the same format.
- The delegates' laptops: a browser is all they need (section 6).

## 3. Accounts: the decision that matters most

GitHub accounts belong to people and need **two-factor authentication (2FA)**:
GitHub requires it for everyone who contributes code on github.com.

**Option A: each delegate uses their own GitHub account (preferred by GitHub).**
- Delegates who have one use it; the others create one before the course
  (an e-mail address and ten minutes, including 2FA with an authenticator app
  on their phone).
- You invite all 25 to the organisation and put each in their team.
- Clean audit trail: every commit, review and merge has a real name.
- Cost: 26 seats on the Team plan (section 7).

**Option B: five team accounts, one per team (what you asked about).**
- You create `fmd-pelab-team01` … `team05` with five mailboxes you control
  (one e-mail alias each is enough), strong passwords, and 2FA.
- 2FA on a shared account needs care. The practical way: on Day 1, the team
  chooses one **driver**, who sets up the authenticator app on their own phone
  for the team account (you hand over the QR code from the account's security
  page, then keep the recovery codes yourself). The driver signs in once in
  the browser on their laptop; GitHub keeps that session for the week. Other
  team members work through the shared workspace, where Git already has the
  team's credentials (section 5), so they never need to sign in to GitHub
  themselves except to read.
- Reviews are weaker: a team account cannot approve its own pull request, so
  approvals come from *another team's* account. Teach it as "the reviewer is a
  colleague from the next desk".
- Note GitHub's terms expect one account per person; shared accounts are
  tolerated for things like training when they belong to the organisation, but
  do not make them permanent. Delete them after the course.
- Cost: 6 seats (five teams and you).

**Option C: SARB has GitHub Enterprise Cloud.** Ask the GitHub administrators
for an organisation (or a set of repositories) for the course. Delegates' work
accounts already exist, 2FA is already handled, and Enterprise includes
everything below. This is the best case.

## 4. Setting up GitHub, step by step

Do this one to two weeks before the course. Allow half a day.

1. **Create the organisation** (github.com → + → New organization), for
   example `fmd-platform-course`. Choose the **Team** plan: the course needs
   protected branches and code owners on private repositories, which the Free
   plan only gives to public repositories.
2. **Organisation settings → Member privileges:**
   - Base permissions: **No permission** (teams get access to their own
     repositories only).
   - Repository creation: allow members to create **private** repositories
     (teams create `rates` from the template on Day 4).
   - Repository forking: off. Pages: off.
3. **Organisation settings → Actions → General:**
   - Allow all actions and reusable workflows (the pipelines use
     `actions/checkout`).
   - Workflow permissions: **Read and write**; allow GitHub Actions to create
     and approve pull requests: off.
   - Fork pull request workflows: not applicable (forking is off).
4. **Organisation settings → Actions → Runners:** this is where the lab's
   runners register (section 5 does it from the server). Nothing to do yet.
5. **Teams:** create `platform` (you and any co-instructor) and `team01` …
   `team05`, and add the accounts (section 3).
6. **Repositories.** Create these private repositories; the lab's Ansible fills
   them (section 5):
   - `golden-path`: tick **Template repository** in its settings once filled;
   - `environments` and `policies`: the request repositories;
   - `team01-hello` … `team05-hello`: the starter services. Give each team
     **Write** on its own `hello`, and `platform` **Admin** on everything.
7. **Rulesets** (Organisation settings → Rules → Rulesets → New branch ruleset).
   One ruleset does for every repository, now and in future:
   - Name `main`, enforcement **Active**, target repositories **All**, target
     branches **Default branch**.
   - Rules: Restrict deletions; Require a pull request before merging, with
     **1 required approval**, **Dismiss stale approvals**; Require status
     checks to pass, adding the check named **`pipeline`** (the name of the
     last job in every pipeline, section 5); Block force pushes.
   - Bypass list: the `platform` team (for emergencies only).

   Add a second ruleset for the request repositories, targeting `environments`
   and `policies` by name, with **Require review from Code Owners** ticked. The
   lab puts a `CODEOWNERS` file naming `@<org>/platform` in both, so only the
   platform team's approval counts there, as in the labs.
8. **Organisation secrets and variables** (Settings → Secrets and variables →
   Actions): the variable `REGISTRY` and the secrets `HARBOR_USERNAME` and
   `HARBOR_PASSWORD`, visible to all repositories. The lab's build prints the
   values (`credentials/platform.md`). The `environments` repository gets its
   own secret `ENVIRONMENTS_READER_KUBECONFIG` from the same file.
9. **Tokens** (fine-grained personal access tokens, Settings → Developer
   settings, made by *you* as organisation owner):
   - **`platform`**: resource owner the organisation, all repositories;
     permissions Contents read, Commit statuses read and write, Metadata read,
     Administration read and write (to register runners and reset
     repositories). Used by the platform applier, Argo CD, the portal and
     `reset.yml`. Expiry: the course week plus a month.
   - **One per team account** (made while signed in as that account): resource
     owner the organisation, its repositories; permissions Contents read and
     write, Pull requests read and write, Workflows read and write, Metadata
     read. The build puts each one in the team's workspaces so `git push`
     works without any sign-in there.
   Put all tokens in `credentials/github/` on the control machine; never in a
   repository.

## 5. What changes in the lab

These are the lab changes behind a `pelab_git_host: github` setting. They are
not written yet: this is the list to build from, with the effort.

| Area | Today (Gitea) | With GitHub | Effort |
| --- | --- | --- | --- |
| Repositories and teams | Ansible creates organisations, teams, users and repositories in Gitea | Ansible fills the repositories you created in section 4 (push content, `CODEOWNERS`, template) with the `platform` token | ½ day |
| Pipelines | `.gitea/workflows/*.yaml`; the last step posts the `pipeline` status | `.github/workflows/*.yaml`; `gitea.` becomes `github.`; `actions/checkout@v4`; the last **job** is called `pipeline` and fails when the build failed (GitHub's own required check) | ½ day |
| Runners | `gitea-runner` in the LXD runner containers | GitHub's `actions-runner` in the same containers, registered to the organisation with the label `pelab-host` through the API (`POST /orgs/{org}/actions/runners/registration-token`) | ½ day |
| Workspaces | Delegates sign in to Gitea with their lab password | Git credential helper with the team's token (`https://x-access-token:<token>@github.com`), written by the build; delegates never type a token | ¼ day |
| Platform applier and safety net | Gitea's API for clones and commit statuses | `api.github.com`: same endpoints (`/repos/{o}/{r}/statuses/{sha}`, `/commits/{ref}/status`), the field is `state` instead of `status` | ¼ day |
| Argo CD | Gitea repository credentials and the SCM generator for Gitea | A repository credential template for `https://github.com/<org>` with the `platform` token; the GitHub SCM generator | ¼ day |
| Portal (Backstage) | Gitea integration | GitHub integration with the token; catalog locations under github.com | ¼ day |
| Reset | `reset.yml` recreates Gitea content | Also deletes and recreates the repositories through the API | ¼ day |
| Handbook and slides | Gitea addresses and screens | `github.com/<org>/…`; "Use this template" instead of Gitea's New Repository; sign in with 2FA on Day 1 | ½ day |
| Test | Done on a local Gitea | Needs a real organisation and a token: one day with the real runners | 1 day |

Total: about three days, with the test. The parts in the last three rows are
the ones most easily got wrong, so test the full Day 1 and Day 4 labs end to
end before the course.

**Outbound access the server then needs:** `github.com`, `api.github.com`,
`*.actions.githubusercontent.com`, `objects.githubusercontent.com`,
`codeload.github.com` (for `actions/checkout` and the runner's downloads). A
cloud server has this already.

## 6. Delegates' laptops (Windows or Mac)

Nothing to install, and **no SSH keys for GitHub**: Git runs inside the
workspace on the lab server, where the build has already placed the team's
credentials. The laptop needs:
- a current browser, signed in to github.com (with 2FA) as the delegate's own
  account or the team account, and
- the browser workspace at `https://studentNN.<lab domain>`, as today.

If a delegate wants Git on their own laptop as well, that is their own GitHub
set-up (Git for Windows or Xcode command-line tools, plus `gh auth login`), and
not part of the course. Keep the course inside the workspace: every laptop then
behaves the same.

## 7. Money

| Item | Cost |
| --- | --- |
| GitHub Team plan | US$4 per seat per month, billed monthly; cancel after the course. Option A: 26 seats ≈ $104 a month. Option B: 6 seats ≈ $24 a month |
| Actions minutes | None: the lab's own runners do the work (self-hosted runners are free) |
| Storage | None of note: no artifacts or packages are kept at GitHub |

## 8. Risks to know

- **Internet.** If github.com is unreachable from the venue or the server, the
  course stops. Gitea has no such dependency.
- **Accounts on the day.** 2FA problems eat the first hour of Day 1. With option
  B, have the five drivers sign in on their laptops before the first lab;
  with option A, send the "create your account and turn on 2FA" mail two weeks
  ahead and check it on the rehearsal day.
- **API limits.** A token may make 5,000 requests an hour. The platform applier
  makes a handful every two minutes, Argo CD polls every three minutes: well
  inside the limit.
- **Self-approval.** GitHub, like Gitea, does not let an account approve its own
  pull request. With team accounts (option B), reviews come from another team.
- **Shared accounts** (option B) weaken the Day 2 message that every change
  has a named author and reviewer. Say so, and point at what the bank's own
  GitHub would do differently.

## 9. If you decide on GitHub

1. Settle the account option (section 3) and create the organisation (section 4).
2. Ask for the lab changes in section 5 to be built and tested: allow a week of
   calendar time for it.
3. Run the rehearsal (setup guide, Part 9) against the real organisation, with
   one delegate's laptop and the 2FA flow included.
