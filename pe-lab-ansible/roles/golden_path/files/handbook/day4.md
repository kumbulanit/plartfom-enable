# Day 4: Containers and the packaging template

**Goal:** Build and run a container, and create a new service from the packaging template without a ticket.

By the end of the day you can:

- Explain image, container, Dockerfile, registry and tag in plain words
- Build the hello image, run it with different settings, and see it report its environment
- Create a new service from the golden-path template and find it in the catalog and in dev

## Containers

### Containers in plain words

An image is the application plus everything it needs to run (the language, the libraries, the settings files), frozen into one package. A container is a running copy of an image.

A Dockerfile is the recipe that builds the image, step by step, from a base image. A registry is the shelf where images are kept and scanned. A tag is the version label on an image.

"It works on my machine" stops being a problem: the image that passed the checks is the image that runs in dev, staging and prod.

> **In one sentence:** An image is the app and everything it needs, packaged once; a container is that image running.

**In the lab**

- Docker runs inside your workspace.
- Harbor is the lab's registry; every team has a project in it.
- The pipeline tags each image with the commit it was built from.
- The base image comes through Harbor's cache, not straight from the internet.

### From recipe to running container

1. Dockerfile
2. docker build
3. Image
4. docker run
5. Container
6. docker push
7. Registry (Harbor)
8. Deployed by Argo CD

This morning you do steps 1 to 5 by hand. From Day 5 the pipeline does steps 1 to 7 on every change, and Argo CD does step 8.

### The hello Dockerfile, line by line

```
ARG BASE_IMAGE=python:3.12-slim
FROM ${BASE_IMAGE}

ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION} \
    PYTHONUNBUFFERED=1

WORKDIR /srv
COPY app/ ./app/

USER 10001
EXPOSE 8080
ENTRYPOINT ["python", "-m", "app.main"]
```

- FROM: start from a small official Python image. The pipeline passes the Harbor-cached copy as BASE_IMAGE.
- ENV: settings baked into the image. APP_VERSION becomes the commit id in the pipeline.
- COPY app/: put the application code into the image. Nothing else: no tests, no secrets.
- USER 10001: run as an ordinary user, never as root. A guardrail on Day 5 checks this.
- ENTRYPOINT: the command the container runs when it starts.

## Lab 1: Docker by hand

### Lab 1: build and run the hello image

*40 min*

**What you do:** Package hello into a container image yourself, run it, look inside it, and remove it.

**Before you start:** Your copy of hello (~/hello). Docker is already installed in your workspace.

#### Step 1. Build the image

*Where: Workspace terminal*

docker build follows the Dockerfile line by line and produces an image called hello:1.

The base image (Python) comes through the lab's registry, Harbor, which keeps a copy of Docker Hub images. The dot at the end means "the Dockerfile is in this folder".

```bash
cd ~/hello
git switch main && git pull
docker build --build-arg BASE_IMAGE=harbor.$DOMAIN/dockerhub/library/python:3.12-slim -t hello:1 .
```

**You should see:** Numbered steps, one per Dockerfile instruction, ending with "naming to docker.io/library/hello:1".

#### Step 2. Find it in the list of images

*Where: Workspace terminal*

```bash
docker images hello
```

**You should see:** hello with the tag 1 and its size. Almost all of it is Python itself; your code is a few kilobytes.

#### Step 3. Run it

*Where: Workspace terminal*

-d runs it in the background, --name gives it a name, and -p 8080:8080 connects port 8080 of your workspace to port 8080 inside the container.

```bash
docker run -d --name hello -p 8080:8080 hello:1
docker ps
```

**You should see:** A long container id, then hello in the list with STATUS "Up".

#### Step 4. Call it

*Where: Workspace terminal*

```bash
curl -s localhost:8080/
curl -i localhost:8080/healthz
```

**You should see:** The same answers as on Day 1, now from inside a container: "environment": "local", then HTTP/1.0 200 OK and ok.

#### Step 5. Read its logs, and check who it runs as

*Where: Workspace terminal*

docker logs shows what the program wrote. docker exec runs a command inside the running container; id shows which user it runs as.

```bash
docker logs hello
docker exec hello id
```

**You should see:** The JSON log lines, then:

```
uid=10001 gid=0(root) groups=0(root)
```

> **Tip:** uid=10001 is an ordinary user, not root (root would be uid=0). The Dockerfile's USER 10001 line did that: a container that is broken into gets no administrator rights.

#### Step 6. Stop and remove it

*Where: Workspace terminal*

```bash
docker stop hello
docker rm hello
docker ps -a
docker images hello
```

**You should see:** No container left, but the image hello:1 is still there, ready to run again.

**Done when:** You built hello:1, ran it, read its logs, saw it runs as an ordinary user, and removed the container.

**If you are stuck**

- The build cannot pull the base image: the Harbor cache may be cold or offline. Tell the lab assistant.
- port is already allocated: an old container still uses the port. docker rm -f hello, then run again.

### Lab 2: one image, three environments

*25 min*

**What you do:** Run the same image as staging and prod with only its settings changed, and see that a new version is a new image beside the old one.

**Before you start:** Lab 1 done: the image hello:1 exists (docker images hello).

#### Step 1. Run it as staging

*Where: Workspace terminal*

-e sets a setting (an environment variable) inside the container. Same image, different settings.

```bash
docker run -d --name hello-staging -p 8081:8080 -e APP_ENV=staging -e GREETING="Hello from staging" hello:1
curl -s localhost:8081/
```

**You should see:** "environment": "staging" and "Hello from staging".

#### Step 2. Run it as prod too

*Where: Workspace terminal*

```bash
docker run -d --name hello-prod -p 8082:8080 -e APP_ENV=prod -e GREETING="Hello from prod" hello:1
curl -s localhost:8082/
docker ps
```

**You should see:** Two containers from one image, each reporting its own environment.

#### Step 3. Make version 2

*Where: Workspace editor and terminal*

Change the default greeting in app/main.py (the GREETING line, as on Day 2) and save. Then build again with a new tag, and give it a version number.

```bash
docker build --build-arg BASE_IMAGE=harbor.$DOMAIN/dockerhub/library/python:3.12-slim --build-arg APP_VERSION=2 -t hello:2 .
docker images hello
```

**You should see:** Both hello:1 and hello:2. Building version 2 did not change version 1: an image never changes once built.

#### Step 4. Run the two versions side by side

*Where: Workspace terminal*

```bash
docker run -d --name hello-v1 -p 8080:8080 hello:1
docker run -d --name hello-v2 -p 8083:8080 hello:2
curl -s localhost:8080/
curl -s localhost:8083/
```

**You should see:** Two answers: version "dev" with the old greeting, and version "2" with your new one. Rolling back is running the old image again.

#### Step 5. Clean up

*Where: Workspace terminal*

Remove the four containers. Undo your greeting change too: the real change goes through a pull request, not from here.

```bash
docker rm -f hello-staging hello-prod hello-v1 hello-v2
git checkout app/main.py
docker ps
```

**You should see:** docker ps shows no containers.

**Done when:** You ran one image as three environments and two versions side by side.

**If you are stuck**

- Your change does not show: rebuild with a new tag, and run that tag. A tag never changes its image.

## Containers

### Build once, run anywhere: why settings live outside the image

The image that passed the tests and the scan is the one that runs in production. If you rebuilt it for each environment you would be testing one thing and running another.

So the image holds the code, and the environment holds the settings: the environment name, the greeting, the port, and later secrets. In Kubernetes these arrive as environment variables from a ConfigMap.

Tags are immutable: a tag names one image forever. The pipeline uses the commit id, so every running container can be traced to the exact code it came from.

> **In one sentence:** The image is the code, frozen; the environment supplies the settings; the tag ties a container to a commit.

**In the lab**

- deploy/base holds the definition shared by all environments.
- deploy/dev, deploy/staging and deploy/prod each add only the settings that differ: namespace, APP_ENV, GREETING, address, image tag, replicas.
- Promotion on Day 6 is changing the tag in deploy/staging, nothing else.

## The packaging template

*What a new service gets for free, and how the platform team built it.*

### What every new service gets from the template

- **A working service and its tests:** The hello app skeleton, five unit tests, and a project file for lint and tests. It runs on the first day.
- **A Dockerfile that passes the checks:** Small base image, non-root user, only the code inside. The Dockerfile check in the pipeline is already green.
- **The pipeline:** Lint, tests, secret scan, Dockerfile check, build, image scan, push. The same for every service, so every service meets the same standard.
- **Deployment for dev, staging and prod:** The Kubernetes definition with probes, resource limits and security settings, plus one overlay per environment. Dev goes live on the first merge.
- **Catalog entry, dashboard, alert, README:** The portal knows the service and its owner; Grafana shows it; an alert fires if it is down; the README explains the path.

### Architecting a golden path: how the platform team built it

Pick a job many teams do the same way. Here: start a new web service and get it to production.

Build it once, properly, with the controls inside: the Dockerfile, the pipeline checks, the deployment settings, the ownership metadata. Have security review it once, not once per team.

Hand it over as a template, measure how many teams use it and how long they take, and improve it from their feedback. Keep it the easiest route, or teams will go around it.

> **In one sentence:** A golden path is built once with the controls inside, handed over as a template, and kept the easiest route.

**In the lab**

- The template is a Gitea template repository: platform/golden-path.
- Creating a service copies it and fills in the names.
- The platform team changes it in one place; new services get the improvement.
- On Day 6 your capstone says what you would add to it next.

### Your service is also an API, with an owner and a promise

The brief wants governed APIs: an owner, a contract, versioning, monitoring. The template gives the simplest version of each.

- **A contract:** / returns a fixed JSON shape; /healthz tells the platform the service is alive; /metrics gives Prometheus its numbers. Consumers can rely on the shape.
- **An owner:** catalog-info.yaml names the team that owns it. The portal shows it; CODEOWNERS routes reviews to it.
- **A version:** Every response carries the version (the commit id). Every image carries the same. Nothing runs that cannot be traced.
- **Monitoring:** The template includes a ServiceMonitor and an alert rule. The dashboard on Day 6 shows requests, errors and versions per environment.

## Lab 3: create a service from the template

### Lab 3: create a new service from the template

*40 min · per team*

**What you do:** Use the golden path: create a brand-new service called rates from the template, and watch it build, deploy and appear in the portal without asking anyone.

**Before you start:** One member of each team creates the service; the others follow on their screen. Sign in to Gitea first.

#### Step 1. Create the repository from the template

*Where: Browser: Gitea*

In Gitea click + (top right) → New Repository.

Template: type golden-path and choose platform/golden-path. Under Template Items tick Git Content and Protected Branch.

Owner: your team (teamNN). Repository Name: rates (lowercase). Click Create Repository.

**You should see:** teamNN/rates with the app, tests, Dockerfile, pipeline and deploy folders. Open deploy/dev/kustomization.yaml: the names already say rates and your team.

#### Step 2. Run its pipeline for the first time

*Where: Browser: Gitea*

Open the Actions tab of teamNN/rates, choose golden-path (ci.yaml) on the left, then Run workflow, keep main, and Run workflow. Click the run that appears.

**You should see:** Lint, tests, scans, build and push, each turning green, in a few minutes.

#### Step 3. Find its image in Harbor

*Where: Browser: Harbor*

Open https://harbor.<lab domain>, sign in as studentNN with your lab password, open the project teamNN.

**You should see:** A repository teamNN/rates with one image, tagged with the commit id, and its scan result.

#### Step 4. Watch it deploy

*Where: Browser: Argo CD*

Open https://argocd.<lab domain>. Argo CD looks for new repositories every minute.

**You should see:** teamNN-rates-dev appears, then Synced and Healthy.

> **Tip:** If the safety net is on: the latest commit of teamNN/rates in Gitea shows safety-net/dev "Deployed to teamNN-dev" once the first pipeline has passed.

#### Step 5. Open it

*Where: Browser or terminal*

```bash
curl -s https://rates-$TEAM-dev.$DOMAIN/
```

**You should see:** "app": "rates", "environment": "dev".

#### Step 6. Add it to the portal

*Where: Browser: the portal (Backstage)*

Open https://backstage.<lab domain> and sign in as guest. Click Create, then Register Existing Component.

Paste https://gitea.<lab domain>/teamNN/rates/src/branch/main/catalog-info.yaml (with your team), click Analyze, then Import.

**You should see:** rates in the catalog, owned by teamNN, with links to its environments, pipeline, Argo CD, Harbor and Grafana.

**Done when:** teamNN/rates exists, its pipeline is green, it answers in dev, and it is in the portal. Count how many people you had to ask: none.

**If you are stuck**

- The template is not offered: you must be signed in, and pick platform/golden-path in the Template field.
- Use a short lowercase name with dashes only: it becomes part of the service address.
- Nothing in Argo CD after a few minutes: the pipeline must finish first (Actions tab).
- Analyze fails in the portal: check the address ends in /src/branch/main/catalog-info.yaml.

### Lab 4: a first change to the new service

*25 min*

**What you do:** Make your first change to rates through the same loop as on Day 2, and read the README the golden path gave it.

**Before you start:** Lab 3 done: teamNN/rates exists and runs in dev.

#### Step 1. Copy the new repository and make a branch

*Where: Workspace terminal*

```bash
cd ~
git clone https://gitea.$DOMAIN/$TEAM/rates
cd rates
git switch -c first-change-$ME
```

**You should see:** Switched to a new branch 'first-change-studentNN'.

#### Step 2. Change the greeting and run the tests

*Where: Workspace editor and terminal*

Change the GREETING line in app/main.py and save. Then run the tests the pipeline will run.

```bash
python3 -m pytest -q
```

**You should see:** 5 passed.

#### Step 3. Commit, push, review, merge

*Where: Workspace terminal, then Gitea*

Push and open a pull request; a teammate approves; merge once the pipeline is green.

```bash
git commit -am "First change to rates"
git push -u origin first-change-$ME
```

**You should see:** The pipeline runs on the pull request, and again on main after the merge.

#### Step 4. See it live in dev

*Where: Browser: Argo CD, then the terminal*

```bash
curl -s https://rates-$TEAM-dev.$DOMAIN/
```

**You should see:** Your new greeting, a few minutes after the merge.

> **Tip:** If the safety net is on, check the merge commit's safety-net/dev status instead of Argo CD.

#### Step 5. Read the README

*Where: Browser: Gitea*

Open README.md in teamNN/rates. It is the user guide of the golden path: how to change, release and watch the service.

**You should see:** You recognise every step from the last four days.

**Done when:** Your change to rates is live in dev, through a reviewed pull request.

**If you are stuck**

- The same as Day 2: one approval from a teammate, then merge once the pipeline is green.

### This morning by hand versus this afternoon from the template

**By hand (Labs 1 and 2)**

- Write or copy a Dockerfile and hope it is safe
- Build and tag the image yourself, and remember the tag
- Run containers with the right settings for each environment
- No tests, no scans, no dashboard, no owner recorded
- Repeat for every service, slightly differently each time

**From the template (Labs 3 and 4)**

- A reviewed Dockerfile with a non-root user
- The pipeline builds, scans and tags with the commit id
- One overlay per environment, already written
- Tests, scans, dashboard, alert and owner included
- Every service identical in shape; only the code differs

### Check your understanding

1. What is the difference between an image and a container?
2. Why does the platform build the image once and run it in every environment, instead of building per environment?
3. Why must a tag never be reused, and what does the pipeline use as the tag?
4. List four things a new service gets from the packaging template that it would not get by hand.
5. What are the five steps to architect a golden path?

### What we built today

You can now:

- Explain image, container, Dockerfile, registry and tag
- Build and run the hello image, with different settings per environment
- Create a new service from the template and find it in the catalog and in dev
- Say how the platform team architects a golden path
- Explain why your service is already a governed API in miniature

**Tomorrow:** CI/CD, testing and security. You will read the pipeline that has been running all week, break it on purpose, fix it, and see the guardrails refuse a bad deployment.

---

[Day 3](day3.md) · [Contents](README.md) · [Day 41](day41.md)
