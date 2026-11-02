# Day 4 instructor guide: Containers and the packaging template

Deck: `Day4-Containers-and-the-packaging-template.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day4/README.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana), on every VM: ansible pelab -m ping first. 30 minutes before the start.
- [ ] The base image is in each VM's Harbor cache: Lab 1 builds pull it through Harbor. On every VM: ansible pelab -b -a "lxc exec student01 -- docker pull harbor.<lab domain>/dockerhub/library/python:3.12-slim"
- [ ] The portal loads and you can sign in as guest (Lab 3, step 7).

## The day, hour by hour

| Time | What | Slides | Notes |
| --- | --- | --- | --- |
| 09:00 | Opening | 1-2 |  |
| 09:15 | Containers: what an image is; the Dockerfile line by line | 3-5 |  |
| 10:00 | Lab 1: build and run the hello image | 6 |  |
| 10:40 | Break |  |  |
| 10:55 | Lab 2: one image, three environments | 7 |  |
| 11:20 | What the cluster adds | 8 |  |
| 11:35 | The packaging template: the golden path | 9-12 | Name the five verbs: pick, build, embed, hand over, measure. |
| 12:30 | Lunch |  |  |
| 13:15 | Lab 3: create a new service from the template | 13-14 | Everyone creates their own rates. Allow for the first pipeline run. |
| 14:10 | Lab 4: a first change to the new service | 15 |  |
| 14:35 | Lab 5: add a pipeline from a template | 16-17 | Ask each delegate for their minutes, from finding the template to the green run. |
| 15:00 | Break |  |  |
| 15:10 | Close: scenarios, quiz and recap | 18-20 |  |
| 15:40 | Check-off and questions |  |  |

## What you do yourself

Each delegate built their own VM, and its passwords are on it. `ansible pelab ...` commands run from your machine, in `prelab-setup/`, after `export ANSIBLE_INVENTORY=inventory/all-vms.yml` (pelab05 instead of pelab reaches one VM). `ansible-playbook ...` commands run on the VM they are for, in `~/sarb/prelab-setup`, with `-K`. Without SSH to the VMs, the delegate runs the command on their VM with `sudo` in front.

**Lab 1, step 1.** If builds cannot pull the base image, that VM's Harbor cache is cold and the VM has no internet. Fix the internet, or pull the image once through that VM's Harbor so the cache keeps it (the check in Before the day).

**Lab 3.** Each delegate creates exactly one service called rates. Argo CD finds new repositories within a minute; the dev address answers after the first pipeline has pushed its image.

**Lab 5.** Each delegate adds smoke-test.yaml to their own rates, through a pull request the reviewer approves. Collect the minutes from step 1 to the green run, and the staging run that goes red: both make the point of the day.

**End of the day.** Each VM backs itself up every night: nothing to copy. Remind everyone to push their work: anything only in a workspace is not backed up. Next morning, check last night's backup is there on every VM. *(Your machine, every VM)*

```bash
ansible pelab -b -m ansible.builtin.shell -a "ls -1t /opt/pelab/backups | head -1"
```

## Watch for

| What you see | What to do |
| --- | --- |
| The template is not offered | The delegate is not signed in to Gitea, or did not choose platform/golden-path in the Template field. |
| A name with capitals or spaces | Delete the repository (Settings → Danger Zone) and create it again as rates. |
| port is already allocated | An old container still uses the port: docker rm -f &lt;name>. |
| Analyze fails in the portal | The address must end in /src/branch/main/catalog-info.yaml. |

## End of the day

- [ ] Every delegate has team01/rates, live in dev, in their portal.
- [ ] Everyone pushed their work.
- [ ] Check-off sheet updated.

## Labs today

| Lab | Time |
| --- | --- |
| Lab 1: build and run the hello image | 40 min |
| Lab 2: one image, three environments | 25 min |
| Lab 3: create a new service from the template | 40 min · per team |
| Lab 4: a first change to the new service | 25 min |
| Lab 5: add a pipeline from a template | 25 min |

## Slide by slide

The same notes are in the deck's speaker notes; quiz answers are under the quiz slide.

### 1. Containers and the packaging template

The morning is Docker by hand, so that the afternoon's template is not magic. By the end of the day every delegate has built and run a container image themselves, and has a second service of their own created from the golden path in minutes.

### 2. Today's goal

The brief's Lab 4: "a new service can be created without privileged intervention and meets minimum standards". That is the afternoon.

### 3. Today's plan

Morning by hand, afternoon from the template: the contrast is the lesson. The service created in Lab 3 is the one teams take to prod in the capstone.

### 4. Containers in plain words

Analogy for a non-technical audience: a shipping container. The contents are packed once, sealed, labelled, and the same box travels by ship, train and truck without being repacked. Ports, cranes and ships are standard; that is why it is cheap and reliable.

### 5. From recipe to running container

Name the commands as you go. The image is the artefact in the brief's language: versioned, immutable, scanned, promoted through controlled repositories.

### 6. The hello Dockerfile, line by line

Explain that the Dockerfile is in the template, so every service built from the golden path starts with a good one: small base image, non-root user, nothing extra. Delegates rarely need to write one from scratch; they need to read one.

### 7. Lab 1: build and run the hello image

The container runs the exact same code as yesterday, but now it carries its own Python and needs nothing from the workspace. Point at docker exec hello id: the non-root user matters on Day 5. If the build cannot pull the base image, the Harbor cache is not warm; the lab assistant checks.

### 8. Lab 2: one image, three environments

This is the whole promotion model in miniature: build once, run the same image everywhere, change only the settings. Never reuse a tag: hello:1 must always mean the same image. The pipeline uses the commit id as the tag for exactly this reason, and a guardrail on Day 5 refuses the "latest" tag.

### 9. Build once, run anywhere: why settings live outside the image

This is the brief's "artefact integrity" and "traceable to source" in practice. Show the three kustomization files in the repository: the differences are a handful of lines.

### 10. The packaging template

The afternoon moves from doing it by hand to getting it from the golden path.

### 11. What every new service gets from the template

Everything on this slide is the "minimum standard" the brief's Lab 4 requires, and the team gets it without knowing how any of it works. That is cognitive load removed, which the brief names as a goal.

### 12. Architecting a golden path: how the platform team built it

This is where "architect golden paths" lives in the course. Give the delegates the five verbs: pick, build, embed, hand over, measure. Then ask a few delegates for one more job in FMD that deserves a golden path (a report, a data pipeline, an API). That answer feeds the capstone.

### 13. Your service is also an API, with an owner and a promise

Outcome 7 of the brief (API, data and integration platforms) is only introduced in this course. This slide is the hook: a service built on the golden path is already a governed API in miniature. An API gateway (APISIX) is an optional extra in the lab for a follow-on module.

### 14. Lab 3: create a new service from the template

Time from clicking Create to a running service in dev: a few minutes, no ticket, no privileged user. That is the brief's Lab 4 pass criterion, witnessed. The catalog entry is not decoration: it is where the owner, the links and the support path live. The template wrote catalog-info.yaml for the team; registering it is one more self-service click. (Each team's first service, hello, was registered by the platform.)

### 15. Lab 4: a first change to the new service

The new service follows exactly the same loop as hello. Nothing new to learn: that is what a standard path buys.

### 16. Lab 5: add a pipeline from a template

This is the payoff of the day. Ask for the minutes from step 1 to the green run: usually ten to fifteen, most of it review and the main pipeline. Then ask how long it would take a team to write, review and secure a pipeline like ci.yaml from nothing: days, and different in every team. The platform team did it once and handed it over as a template; small pipelines go the same way. Last step: point at the list "by hand → in the pipeline" in the handbook. Every manual step of Day 1 and this morning is now a pipeline step or the deploy folder.

### 17. This morning by hand versus this afternoon from the template

Close the loop between the morning and the afternoon. The by-hand steps were not wasted: they are what the template does, and now the delegates can read it.

### 18. Check your understanding

Answers. 1: An image is the frozen package; a container is a running copy of it. 2: So that the image that was tested and scanned is the one that runs; settings come from the environment. 3: A tag must always mean one image so that a running container can be traced to its code; the commit id. 4: Any four of: tests, a safe Dockerfile, the pipeline, deployment for three environments, a catalog entry with an owner, a dashboard, an alert, a README. 5: Pick a common job, build it once with the controls inside, hand it over as a template, measure its use, improve it.

### 19. What we built today

Most of the platform has now been used, even if not yet understood in detail. Tomorrow opens up the pipeline and the policies.
