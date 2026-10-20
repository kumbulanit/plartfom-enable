# Day 4 instructor guide: Containers and the packaging template

Deck: `Day4-Containers-and-the-packaging-template.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day4.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana, and the lab server lines). 30 minutes before the start.
- [ ] The base image is in Harbor's cache: Lab 1 builds pull it through Harbor. From any workspace: docker pull harbor.<lab domain>/dockerhub/library/python:3.12-slim
- [ ] The portal loads and you can sign in as guest (Lab 3, step 6).

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
| 13:15 | Lab 3: create a new service from the template | 13 | One driver per team. Allow for the first pipeline run. |
| 14:10 | Lab 4: a first change to the new service | 14 |  |
| 14:35 | Break |  |  |
| 14:50 | Close: scenarios, quiz and recap | 15-17 |  |
| 15:30 | Check-off and questions |  |  |

## What you do yourself

Commands for the lab server run there over SSH (`ssh labadmin@<server>`); the others on the control machine, in `pe-lab-ansible/`.

**Lab 1, step 1.** If builds cannot pull the base image, the Harbor cache is cold and the server has no internet. Fix the internet, or pull the image once on the lab server so the cache keeps it.

**Lab 3.** Each team creates exactly one service called rates. Argo CD finds new repositories within a minute; the dev address answers after the first pipeline has pushed its image.

**End of the day.** Copy tonight's backup to the control machine (it takes a fresh one first). *(Control machine)*

```bash
ansible-playbook backup.yml
```

## Watch for

| What you see | What to do |
| --- | --- |
| The template is not offered | The delegate is not signed in to Gitea, or did not choose platform/golden-path in the Template field. |
| A name with capitals or spaces | Delete the repository (Settings → Danger Zone) and create it again as rates. |
| port is already allocated | An old container still uses the port: docker rm -f &lt;name>. |
| Analyze fails in the portal | The address must end in /src/branch/main/catalog-info.yaml. |

## End of the day

- [ ] Every team has teamNN/rates, live in dev, in the portal.
- [ ] Backup copied.
- [ ] Check-off sheet updated.

## Labs today

| Lab | Time |
| --- | --- |
| Lab 1: build and run the hello image | 40 min |
| Lab 2: one image, three environments | 25 min |
| Lab 3: create a new service from the template | 40 min · per team |
| Lab 4: a first change to the new service | 25 min |

## Slide by slide

The same notes are in the deck's speaker notes; quiz answers are under the quiz slide.

### 1. Containers and the packaging template

The morning is Docker by hand, so that the afternoon's template is not magic. By the end of the day every delegate has built and run a container image themselves, and every team has a second service created from the golden path in minutes.

### 2. Today's goal

The brief's Lab 4: "a new service can be created without privileged intervention and meets minimum standards". That is the afternoon.

### 3. Containers in plain words

Analogy for a non-technical audience: a shipping container. The contents are packed once, sealed, labelled, and the same box travels by ship, train and truck without being repacked. Ports, cranes and ships are standard; that is why it is cheap and reliable.

### 4. From recipe to running container

Name the commands as you go. The image is the artefact in the brief's language: versioned, immutable, scanned, promoted through controlled repositories.

### 5. The hello Dockerfile, line by line

Explain that the Dockerfile is in the template, so every service built from the golden path starts with a good one: small base image, non-root user, nothing extra. Delegates rarely need to write one from scratch; they need to read one.

### 6. Lab 1: build and run the hello image

The container runs the exact same code as yesterday, but now it carries its own Python and needs nothing from the workspace. Point at docker exec hello id: the non-root user matters on Day 5. If the build cannot pull the base image, the Harbor cache is not warm; the lab assistant checks.

### 7. Lab 2: one image, three environments

This is the whole promotion model in miniature: build once, run the same image everywhere, change only the settings. Never reuse a tag: hello:1 must always mean the same image. The pipeline uses the commit id as the tag for exactly this reason, and a guardrail on Day 5 refuses the "latest" tag.

### 8. Build once, run anywhere: why settings live outside the image

This is the brief's "artefact integrity" and "traceable to source" in practice. Show the three kustomization files in the repository: the differences are a handful of lines.

### 9. The packaging template

The afternoon moves from doing it by hand to getting it from the golden path.

### 10. What every new service gets from the template

Everything on this slide is the "minimum standard" the brief's Lab 4 requires, and the team gets it without knowing how any of it works. That is cognitive load removed, which the brief names as a goal.

### 11. Architecting a golden path: how the platform team built it

This is where "architect golden paths" lives in the course. Give the delegates the five verbs: pick, build, embed, hand over, measure. Then ask each team for one more job in FMD that deserves a golden path (a report, a data pipeline, an API). That answer feeds the capstone.

### 12. Your service is also an API, with an owner and a promise

Outcome 7 of the brief (API, data and integration platforms) is only introduced in this course. This slide is the hook: a service built on the golden path is already a governed API in miniature. An API gateway (APISIX) is an optional extra in the lab for a follow-on module.

### 13. Lab 3: create a new service from the template

Time from clicking Create to a running service in dev: a few minutes, no ticket, no privileged user. That is the brief's Lab 4 pass criterion, witnessed. The catalog entry is not decoration: it is where the owner, the links and the support path live. The template wrote catalog-info.yaml for the team; registering it is one more self-service click. (Each team's first service, hello, was registered by the platform.)

### 14. Lab 4: a first change to the new service

The new service follows exactly the same loop as hello. Nothing new to learn: that is what a standard path buys.

### 15. This morning by hand versus this afternoon from the template

Close the loop between the morning and the afternoon. The by-hand steps were not wasted: they are what the template does, and now the delegates can read it.

### 16. Check your understanding

Answers. 1: An image is the frozen package; a container is a running copy of it. 2: So that the image that was tested and scanned is the one that runs; settings come from the environment. 3: A tag must always mean one image so that a running container can be traced to its code; the commit id. 4: Any four of: tests, a safe Dockerfile, the pipeline, deployment for three environments, a catalog entry with an owner, a dashboard, an alert, a README. 5: Pick a common job, build it once with the controls inside, hand it over as a template, measure its use, improve it.

### 17. What we built today

Most of the platform has now been used, even if not yet understood in detail. Tomorrow opens up the pipeline and the policies.
