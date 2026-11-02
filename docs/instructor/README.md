# Instructor guide

| File | What it is |
| --- | --- |
| [setup-guide.md](setup-guide.md) | **Start here.** From an empty server to a checked lab, step by step: what to ask for, installing Ubuntu, Ansible on each VM, the settings, the build, the checks, the rehearsal |
| [BUILD-YOUR-VM.md](../../prelab-setup/BUILD-YOUR-VM.md) | **For the delegates.** Each one builds the lab on their own VM, step by step (Ansible runs on the VM itself), and checks that it runs |
| [run-book.md](run-book.md) | The course week: morning checks, common fixes during the labs, reset, backup and restore, teardown, rehearsal checklist |
| [safety-net.md](safety-net.md) | If Argo CD gives trouble: one command to let the platform deploy instead, what to tell delegates, how to switch back |
| [github-option.md](github-option.md) | Hosting the course's Git on github.com instead of Gitea: when it is worth it, accounts and 2FA, what to set up, what changes in the lab, costs |
| day1-notes.md to day6-notes.md | One guide per day: what to prepare, the day hour by hour with slide numbers, every action only you take (with the commands), what to watch for, the end of the day, then the slide-by-slide notes and quiz answers |
| [lab-check-off.md](lab-check-off.md) | Every lab of the week, with a box per team |
| [capstone-rubric.md](capstone-rubric.md) | The panel's rubric, the evidence-pack checklist and the presentation outline |

The decks are in `../slides/`. The delegates' handbook is the Gitea repository
`platform/handbook`; its source is the course repository's `labs/` folder
(`labs/README.md` and each day's `labs/dayN/README.md`).
The delegates' handbook has every lab written out step by step: where to work,
what to do and why, the commands to paste, and what they should see.

The day guides, the check-off sheet and the handbook are generated from the
decks' content, so they always agree. To change them, edit
`../slides/src/content/`: `dayN.js` (the slides), `labs/dayN.js` (the lab steps)
or `facilitate.js` (the run of each day). Then run `node handbook.js` and
`node build.js` in `../slides/src/`.
