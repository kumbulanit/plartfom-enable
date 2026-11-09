// Day 4: Containers and the packaging template
'use strict';
const DOMAIN = '<lab domain>';

module.exports = [
  {
    type: 'title', section: 'Opening',
    title: 'Containers and the packaging template',
    subtitle: 'Package the app once and run it anywhere. Then create a new service from the template and watch it appear in the catalog and in dev.',
    highlight: ['Workspace', 'Template', 'Portal'],
    notes: 'The morning is Docker by hand, so that the afternoon\'s template is not magic. By the end of the day every delegate has built and run a container image themselves, and has a second service of their own created from the golden path in minutes.',
  },
  {
    type: 'goal', section: 'Opening',
    goal: 'Build and run a container, and create a new service from the packaging template without a ticket.',
    outcomes: [
      'Explain image, container, Dockerfile, registry and tag in plain words',
      'Build the hello image, run it with different settings, and see it report its environment',
      'Create a new service from the golden-path template and find it in the catalog and in dev',
    ],
    highlight: ['Workspace', 'Template', 'Portal'],
    notes: 'The brief\'s Lab 4: "a new service can be created without privileged intervention and meets minimum standards". That is the afternoon.',
  },
  {
    type: 'agenda', section: 'Opening',
    title: "Today's plan",
    bridge: 'Yesterday you got staging and prod from a template. Today you package hello in a container by hand, then let the packaging template create a whole new service.',
    notes: 'Morning by hand, afternoon from the template: the contrast is the lesson. The service created in Lab 3 is the one teams take to prod in the capstone.',
  },
  {
    type: 'concept', section: 'Containers',
    title: 'Containers in plain words',
    icon: 'FiBox',
    idea: [
      'An image is the application plus everything it needs to run (the language, the libraries, the settings files), frozen into one package. A container is a running copy of an image.',
      'A Dockerfile is the recipe that builds the image, step by step, from a base image. A registry is the shelf where images are kept and scanned. A tag is the version label on an image.',
      '"It works on my machine" stops being a problem: the image that passed the checks is the image that runs in dev, staging and prod.',
    ],
    lab: [
      'Docker runs inside your workspace.',
      'Harbor is the lab\'s registry; every team has a project in it.',
      'The pipeline tags each image with the commit it was built from.',
      'The base image comes through Harbor\'s cache, not straight from the internet.',
    ],
    oneLiner: 'An image is the app and everything it needs, packaged once; a container is that image running.',
    notes: 'Analogy for a non-technical audience: a shipping container. The contents are packed once, sealed, labelled, and the same box travels by ship, train and truck without being repacked. Ports, cranes and ships are standard; that is why it is cheap and reliable.',
  },
  {
    type: 'flow', section: 'Containers',
    title: 'From recipe to running container',
    figure: { src: 'container-build.svg', caption: 'Build once, run as many environments as you need: only the settings change.' },
    steps: ['Dockerfile', 'docker build', { text: 'Image', highlight: true }, 'docker run', 'Container', 'docker push', 'Registry (Harbor)', 'Deployed by Argo CD'],
    caption: 'This morning you do steps 1 to 5 by hand. From Day 5 the pipeline does steps 1 to 7 on every change, and Argo CD does step 8.',
    notes: 'Name the commands as you go. The image is the artefact in the brief\'s language: versioned, immutable, scanned, promoted through controlled repositories.',
  },
  {
    type: 'code', section: 'Containers',
    title: 'The hello Dockerfile, line by line',
    code: `ARG BASE_IMAGE=python:3.12-slim
FROM \${BASE_IMAGE}

ARG APP_VERSION=dev
ENV APP_VERSION=\${APP_VERSION} \\
    PYTHONUNBUFFERED=1

WORKDIR /srv
COPY app/ ./app/

USER 10001
EXPOSE 8081
ENTRYPOINT ["python", "-m", "app.main"]`,
    notesRight: [
      'FROM: start from a small official Python image. The pipeline passes the Harbor-cached copy as BASE_IMAGE.',
      'ENV: settings baked into the image. APP_VERSION becomes the commit id in the pipeline.',
      'COPY app/: put the application code into the image. Nothing else: no tests, no secrets.',
      'USER 10001: run as an ordinary user, never as root. A guardrail on Day 5 checks this.',
      'ENTRYPOINT: the command the container runs when it starts.',
    ],
    notes: 'Explain that the Dockerfile is in the template, so every service built from the golden path starts with a good one: small base image, non-root user, nothing extra. Delegates rarely need to write one from scratch; they need to read one.',
  },
  {
    type: 'compare', section: 'Containers',
    title: 'Containers and virtual machines',
    left: {
      head: 'A virtual machine',
      items: [
        'A whole operating system for each application: gigabytes',
        'Its own kernel; starts in minutes',
        'Patched and looked after like a server',
        'Strong isolation, heavy to copy and move',
      ],
    },
    right: {
      head: 'A container',
      items: [
        'Only the application and its libraries: megabytes',
        'Shares the host\'s kernel; starts in a second',
        'Never patched in place: build a new image and replace it',
        'Light to copy: the same image runs everywhere',
      ],
    },
    notes: 'Not either-or: most banks run containers inside virtual machines, and so does this lab (your workspace is itself a container on the lab host, and Docker runs containers inside it). The point for delegates: a container is cheap enough to throw away and recreate, which is what makes "replace, never repair" possible.',
  },
  {
    type: 'concept', section: 'Containers',
    title: 'How a container is kept apart: namespaces, cgroups and layers',
    icon: 'FiLayers',
    idea: [
      'Namespaces give a container its own view of the machine: its own processes, network, files and host name. It cannot see the other containers or the host.',
      'Cgroups limit what it may use: how much CPU and memory. On Kubernetes these are the requests and limits in every deployment, so one service cannot starve the others.',
      'Layers: an image is a stack of read-only layers, one for each Dockerfile step. A running container adds one thin writable layer on top. Many containers share the same layers, which is why they start fast and take little space.',
    ],
    lab: [
      'docker top hello: the processes in the container, only the app.',
      'docker history hello:1: the layers, one per Dockerfile step.',
      'A rebuild reuses unchanged layers (CACHED): put the steps that rarely change first.',
      'The template sets CPU and memory limits for every service.',
    ],
    oneLiner: 'A container is an ordinary process, fenced off by namespaces, limited by cgroups, running on shared read-only layers.',
    notes: 'Keep it conceptual: nobody needs to configure namespaces. Two practical consequences: anything written inside a container is lost when it is replaced (keep data outside it), and the build cache is why a second docker build takes seconds.',
  },
  {
    type: 'rows', section: 'Containers',
    title: 'What you can do with containers',
    rows: [
      { icon: 'FiPackage', head: 'Package once', text: 'Build the application and everything it needs into one image, with a version. The same image goes from your workspace to prod.' },
      { icon: 'FiSliders', head: 'Run it anywhere, with other settings', text: 'Start the same image as dev, staging or prod: only the settings (environment variables) change, never the image.' },
      { icon: 'FiCopy', head: 'Run many side by side', text: 'Several services, or several versions of one, on the same machine without getting in each other\'s way.' },
      { icon: 'FiShield', head: 'Limit and protect', text: 'Cap CPU and memory, run as an ordinary user, scan the image for known weaknesses before it runs.' },
      { icon: 'FiRefreshCw', head: 'Replace instead of repair', text: 'Never fix a running container by hand: start the new image. To roll back, run the old tag again; nothing is rebuilt.' },
    ],
    notes: 'Each row is something delegates do by hand in Labs 1 and 2, and that the platform then does for them: the pipeline packages, Argo CD runs and replaces, Kyverno and Harbor protect.',
  },
  {
    type: 'table', section: 'Containers',
    title: 'How: the Docker commands you need',
    header: ['Command', 'What it does', 'When'],
    colW: [4.3, 5.1, 2.73],
    fontSize: 11.5,
    boldFirst: true,
    rows: [
      ['docker build -t <name>:<tag> .', 'Build an image from the Dockerfile in this folder', 'After a change'],
      ['docker images', 'List the images on this machine', 'After a build'],
      ['docker run -d -p 8081:8081 <image>', 'Start a container in the background, with a port', 'To run the app'],
      ['docker run -e NAME=value ...', 'Give the container a setting (an environment variable)', 'Same image, another environment'],
      ['docker ps (-a)', 'List running containers (-a: stopped ones too)', 'Any time'],
      ['docker logs <name>', 'Show what the application printed', 'When something looks wrong'],
      ['docker exec <name> <command>', 'Run one command inside a running container', 'To look inside'],
      ['docker stop <name>, docker rm <name>', 'Stop a container, then remove it', 'When you are done'],
      ['docker push <registry>/<name>:<tag>', 'Upload the image to a registry such as Harbor', 'The pipeline does it'],
      ['docker pull <registry>/<name>:<tag>', 'Download an image from a registry', 'To run someone else\'s image'],
      ['docker image prune', 'Delete images that no container uses', 'When the disk fills up'],
    ],
    notes: 'Delegates type the first eight this morning. push and pull are what the pipeline and the cluster do with Harbor; prune is the one to know when a workspace runs out of space.',
  },
  {
    type: 'steps', section: 'Lab 1: Docker by hand', time: '40 min',
    title: 'Lab 1: build and run the hello image',
    steps: [
      { do: `cd ~/hello && git switch main && git pull. Then: docker build --build-arg BASE_IMAGE=harbor.${DOMAIN}/dockerhub/library/python:3.12-slim -t hello:1 .`, expect: 'Each Dockerfile line runs as a step; the last line says the image is tagged hello:1.' },
      { do: 'docker images | head', expect: 'hello:1 in the list, with its size: almost all of it is Python itself; your code is a few kilobytes.' },
      { do: 'docker run -d --name hello -p 8081:8081 hello:1', expect: 'A long container id. docker ps shows it running.' },
      { do: 'curl -s localhost:8081/ and curl -i localhost:8081/healthz', expect: 'The JSON with "environment": "local"; HTTP 200 for healthz.' },
      { do: 'docker logs hello, then docker exec hello id', expect: 'JSON log lines; uid=10001, not root.' },
      { do: 'docker stop hello && docker rm hello', expect: 'The container is gone; the image hello:1 remains.' },
    ],
    notes: 'The container runs the exact same code as yesterday, but now it carries its own Python and needs nothing from the workspace. Point at docker exec hello id: the non-root user matters on Day 5. If the build cannot pull the base image, the Harbor cache is not warm; the lab assistant checks.',
  },
  {
    type: 'steps', section: 'Lab 1: Docker by hand', time: '25 min',
    title: 'Lab 2: one image, three environments',
    steps: [
      { do: 'docker run -d --name hello-staging -p 8082:8081 -e APP_ENV=staging -e GREETING="Hello from staging" hello:1', expect: 'curl -s localhost:8082/ says "environment": "staging". Same image, different settings.' },
      { do: 'docker run -d --name hello-prod -p 8083:8081 -e APP_ENV=prod -e GREETING="Hello from prod" hello:1', expect: 'Three containers from one image: local, staging and prod, each reporting its own name.' },
      { do: 'Change the default greeting in app/main.py and rebuild as hello:2 (same build command, -t hello:2).', expect: 'docker images shows hello:1 and hello:2; the old one is untouched.' },
      { do: 'Run hello:2 on port 8084 and compare with 8081.', expect: 'Two versions running side by side.' },
      { do: 'Clean up: docker rm -f hello-staging hello-prod and any others.', expect: 'docker ps is empty.' },
    ],
    notes: 'This is the whole promotion model in miniature: build once, run the same image everywhere, change only the settings. Never reuse a tag: hello:1 must always mean the same image. The pipeline uses the commit id as the tag for exactly this reason, and a guardrail on Day 5 refuses the "latest" tag.',
  },
  {
    type: 'concept', section: 'Containers',
    title: 'Build once, run anywhere: why settings live outside the image',
    icon: 'FiSliders',
    idea: [
      'The image that passed the tests and the scan is the one that runs in production. If you rebuilt it for each environment you would be testing one thing and running another.',
      'So the image holds the code, and the environment holds the settings: the environment name, the greeting, the port, and later secrets. In Kubernetes these arrive as environment variables from a ConfigMap.',
      'Tags are immutable: a tag names one image forever. The pipeline uses the commit id, so every running container can be traced to the exact code it came from.',
    ],
    lab: [
      'deploy/base holds the definition shared by all environments.',
      'deploy/dev, deploy/staging and deploy/prod each add only the settings that differ: namespace, APP_ENV, GREETING, address, image tag, replicas.',
      'Promotion on Day 6 is changing the tag in deploy/staging, nothing else.',
    ],
    oneLiner: 'The image is the code, frozen; the environment supplies the settings; the tag ties a container to a commit.',
    notes: 'This is the brief\'s "artefact integrity" and "traceable to source" in practice. Show the three kustomization files in the repository: the differences are a handful of lines.',
  },
  {
    type: 'rows', section: 'Containers',
    title: 'What makes a good container image',
    rows: [
      { icon: 'FiMinimize2', head: 'Small', text: 'Start from a slim official base image. Less to download, and fewer weaknesses for the scan to find.' },
      { icon: 'FiUser', head: 'Not root', text: 'USER 10001: if someone breaks in, they get as little as possible. On Day 5 the pipeline refuses an image that runs as root.' },
      { icon: 'FiLock', head: 'Nothing secret inside', text: 'No passwords or keys in the image: anyone who can pull it can read them. Settings and secrets come in when it starts.' },
      { icon: 'FiTag', head: 'A fixed tag', text: 'Tag it with the commit id, never "latest": the same tag must always mean exactly the same image.' },
      { icon: 'FiActivity', head: 'One job, easy to watch', text: 'One process, logs to the screen (standard output), and a health check the platform can call, like /healthz.' },
    ],
    notes: 'This is the checklist behind the template\'s Dockerfile and behind the Day 5 checks: hadolint for the Dockerfile, gitleaks for secrets, Trivy for weaknesses, and a guardrail for the tag. A delegate who remembers these five can review any Dockerfile.',
  },
  {
    type: 'section', section: 'The packaging template',
    title: 'The packaging template',
    subtitle: 'What a new service gets for free, and how the platform team built it. Then you create a new service from it (Lab 3), make its first change (Lab 4), and add a pipeline from a template (Lab 5).',
    notes: 'The afternoon moves from doing it by hand to getting it from the golden path.',
  },
  {
    type: 'rows', section: 'The packaging template',
    title: 'What every new service gets from the template',
    rows: [
      { icon: 'FiCode', head: 'A working service and its tests', text: 'The hello app skeleton, six unit tests, and a project file for lint and tests. It runs on the first day.' },
      { icon: 'FiBox', head: 'A Dockerfile that passes the checks', text: 'Small base image, non-root user, only the code inside. The Dockerfile check in the pipeline is already green.' },
      { icon: 'FiPlay', head: 'The pipeline', text: 'Lint, tests, secret scan, Dockerfile check, build, image scan, push. The same for every service, so every service meets the same standard.' },
      { icon: 'FiLayers', head: 'Deployment for dev, staging and prod', text: 'The Kubernetes definition with probes, resource limits and security settings, plus one overlay per environment. Dev goes live on the first merge.' },
      { icon: 'FiBookOpen', head: 'Catalog entry, dashboard, alert, README', text: 'The portal knows the service and its owner; Grafana shows it; an alert fires if it is down; the README explains the path.' },
    ],
    notes: 'Everything on this slide is the "minimum standard" the brief\'s Lab 4 requires, and the team gets it without knowing how any of it works. That is cognitive load removed, which the brief names as a goal.',
  },
  {
    type: 'concept', section: 'The packaging template',
    title: 'Architecting a golden path: how the platform team built it',
    icon: 'FiCompass',
    idea: [
      'Pick a job many teams do the same way. Here: start a new web service and get it to production.',
      'Build it once, properly, with the controls inside: the Dockerfile, the pipeline checks, the deployment settings, the ownership metadata. Have security review it once, not once per team.',
      'Hand it over as a template, measure how many teams use it and how long they take, and improve it from their feedback. Keep it the easiest route, or teams will go around it.',
    ],
    lab: [
      'The template is a Gitea template repository: platform/golden-path.',
      'Creating a service copies it and fills in the names.',
      'The platform team changes it in one place; new services get the improvement.',
      'On Day 6 your capstone says what you would add to it next.',
    ],
    oneLiner: 'A golden path is built once with the controls inside, handed over as a template, and kept the easiest route.',
    notes: 'This is where "architect golden paths" lives in the course. Give the delegates the five verbs: pick, build, embed, hand over, measure. Then ask a few delegates for one more job in FMD that deserves a golden path (a report, a data pipeline, an API). That answer feeds the capstone.',
  },
  {
    type: 'rows', section: 'The packaging template',
    title: 'Your service is also an API, with an owner and a promise',
    intro: 'The brief wants governed APIs: an owner, a contract, versioning, monitoring. The template gives the simplest version of each.',
    rows: [
      { icon: 'FiGlobe', head: 'A contract', text: '/ returns a fixed JSON shape; /healthz tells the platform the service is alive; /metrics gives Prometheus its numbers. Consumers can rely on the shape.' },
      { icon: 'FiUser', head: 'An owner', text: 'catalog-info.yaml names the team that owns it. The portal shows it; CODEOWNERS routes reviews to it.' },
      { icon: 'FiTag', head: 'A version', text: 'Every response carries the version (the commit id). Every image carries the same. Nothing runs that cannot be traced.' },
      { icon: 'FiActivity', head: 'Monitoring', text: 'The template includes a ServiceMonitor and an alert rule. The dashboard on Day 6 shows requests, errors and versions per environment.' },
    ],
    notes: 'Outcome 7 of the brief (API, data and integration platforms) is only introduced in this course. This slide is the hook: a service built on the golden path is already a governed API in miniature. An API gateway (APISIX) is an optional extra in the lab for a follow-on module.',
  },
  {
    type: 'steps', section: 'Lab 3: create a service from the template', time: '40 min · on your own',
    title: 'Lab 3: create a new service from the template',
    figure: { src: 'new-service.svg', caption: 'A new service from the template: its first pipeline, Harbor and Argo CD take it to dev without anyone being asked.' },
    steps: [
      { do: `Gitea: open platform/golden-path (the template). Read .gitea/workflows/ci.yaml (the pipeline) and deploy/dev/kustomization.yaml.`, expect: 'A repository marked Template; the pipeline\'s steps; the blanks ${REPO_NAME} and ${REPO_OWNER}.' },
      { do: `Gitea: + New Repository. Template platform/golden-path, Owner teamNN, Name rates (lowercase). Tick Git Content (Default Branch) and Branch Protection. Create.`, expect: 'A new repository teamNN/rates with the app, tests, Dockerfile, pipeline and deploy folders, names already filled in.' },
      { do: 'Open the Actions tab, choose golden-path and Run workflow on main.', expect: 'The pipeline runs: lint, tests, scans, build, push. All green.' },
      { do: `Open Harbor at https://harbor.${DOMAIN} (sign in as studentNN with your lab password), project teamNN.`, expect: 'A repository teamNN/rates with one image tagged with the commit id, scanned.' },
      { do: 'Open Argo CD and wait for teamNN-rates-dev to appear (up to a minute).', expect: 'Synced and Healthy.' },
      { do: `Open https://rates-teamNN-dev.${DOMAIN}/`, expect: '"app": "rates", "environment": "dev".' },
      { do: `In the portal (https://backstage.${DOMAIN}): Create, then Register existing component. Paste https://gitea.${DOMAIN}/teamNN/rates/src/branch/main/catalog-info.yaml, Analyze, Import.`, expect: 'The service in the catalog, owned by teamNN, with links to dev, staging, prod, the pipeline, Argo CD, Harbor and Grafana.' },
      { do: 'Compare .gitea/workflows/ci.yaml in teamNN/hello and teamNN/rates.', expect: 'The same pipeline: both copied from the template.' },
    ],
    notes: 'Time from clicking Create to a running service in dev: a few minutes, no ticket, no privileged user. That is the brief\'s Lab 4 pass criterion, witnessed. The catalog entry is not decoration: it is where the owner, the links and the support path live. The template wrote catalog-info.yaml for the team; registering it is one more self-service click. (Each team\'s first service, hello, was registered by the platform.)',
  },
  {
    type: 'steps', section: 'Lab 3: create a service from the template', time: '25 min',
    title: 'Lab 4: a first change to the new service',
    steps: [
      { do: `git clone https://gitea.${DOMAIN}/teamNN/rates && cd rates && git switch -c first-change`, expect: 'The repository in your workspace.' },
      { do: 'Change the greeting in app/main.py; run the tests: python3 -m pytest -q', expect: '6 passed.' },
      { do: 'Commit, push, open a pull request; approve as reviewer in a private window; merge.', expect: 'The pipeline runs on the pull request and again on main.' },
      { do: `Watch Argo CD, then open https://rates-teamNN-dev.${DOMAIN}/`, expect: 'The new greeting live in dev.' },
      { do: 'Read the README in the repository: it is the user guide for the golden path.', expect: 'You recognise every step from the last four days.' },
    ],
    notes: 'The new service follows exactly the same loop as hello. Nothing new to learn: that is what a standard path buys.',
  },
  {
    type: 'steps', section: 'Lab 5: a pipeline from a template', time: '25 min',
    title: 'Lab 5: add a pipeline from a template',
    steps: [
      { do: `Gitea: open platform/pipeline-templates and read the README. Write down the time.`, expect: 'Two templates: smoke-test.yaml and nightly-scan.yaml, what each does and when it runs.' },
      { do: 'Open workflows/smoke-test.yaml, read it, and click Copy content.', expect: 'Four checks; the address is worked out from the repository, so nothing to fill in.' },
      { do: 'teamNN/rates: Add File → New File, name .gitea/workflows/smoke-test.yaml, paste. New branch add-smoke-test, Propose file change.', expect: 'Comparing changes: one file added.' },
      { do: 'New Pull Request, Create Pull Request; approve as reviewer in a private window; merge when green.', expect: 'The smoke test on main.' },
      { do: 'Actions → smoke-test → Run Workflow, environment dev.', expect: 'Green in seconds: "It says it is dev." Note the minutes since you started.' },
      { do: 'Run it again for staging.', expect: 'Red: rates has no staging yet. A check that can fail.' },
      { do: 'Open ci.yaml in teamNN/hello → History; then the original in platform/golden-path.', expect: 'One commit: the main pipeline came with the template. Each manual step of the week is one of its steps.' },
    ],
    notes: 'This is the payoff of the day. Ask for the minutes from step 1 to the green run: usually ten to fifteen, most of it review and the main pipeline. Then ask how long it would take a team to write, review and secure a pipeline like ci.yaml from nothing: days, and different in every team. The platform team did it once and handed it over as a template; small pipelines go the same way. Last step: point at the list "by hand → in the pipeline" in the handbook. Every manual step of Day 1 and this morning is now a pipeline step or the deploy folder.',
  },
  {
    type: 'compare', section: 'Close',
    title: 'This morning by hand versus this afternoon from the template',
    left: {
      head: 'By hand (Labs 1 and 2)',
      items: [
        'Write or copy a Dockerfile and hope it is safe',
        'Build and tag the image yourself, and remember the tag',
        'Run containers with the right settings for each environment',
        'No tests, no scans, no dashboard, no owner recorded',
        'Repeat for every service, slightly differently each time',
        'Write every new pipeline yourself, from nothing',
      ],
    },
    right: {
      head: 'From the templates (Labs 3 to 5)',
      items: [
        'A reviewed Dockerfile with a non-root user',
        'The pipeline builds, scans and tags with the commit id',
        'One overlay per environment, already written',
        'Tests, scans, dashboard, alert and owner included',
        'Every service identical in shape; only the code differs',
        'A new pipeline in minutes: copy a pipeline template, review, merge',
      ],
    },
    notes: 'Close the loop between the morning and the afternoon. The by-hand steps were not wasted: they are what the template does, and now the delegates can read it.',
  },
  {
    type: 'quiz', section: 'Close',
    questions: [
      'What is the difference between an image and a container?',
      'Why does the platform build the image once and run it in every environment, instead of building per environment?',
      'Why must a tag never be reused, and what does the pipeline use as the tag?',
      'List four things a new service gets from the packaging template that it would not get by hand.',
      'What are the five steps to architect a golden path?',
      'Where are the pipeline templates kept, and how does a team add one to its service?',
    ],
    notes: 'Answers. 1: An image is the frozen package; a container is a running copy of it. 2: So that the image that was tested and scanned is the one that runs; settings come from the environment. 3: A tag must always mean one image so that a running container can be traced to its code; the commit id. 4: Any four of: tests, a safe Dockerfile, the pipeline, deployment for three environments, a catalog entry with an owner, a dashboard, an alert, a README. 5: Pick a common job, build it once with the controls inside, hand it over as a template, measure its use, improve it.',
  },
  {
    type: 'recap', section: 'Close',
    highlight: ['Workspace', 'Portal', 'Template', 'Repository', 'Pipeline', 'Registry', 'GitOps', 'Environments'],
    built: [
      'Explain image, container, Dockerfile, registry and tag',
      'Build and run the hello image, with different settings per environment',
      'Create a new service from the template and find it in the catalog and in dev',
      'Say how the platform team architects a golden path',
      'Explain why your service is already a governed API in miniature',
    ],
    tomorrow: 'CI/CD, testing and security. You will read the pipeline that has been running all week, break it on purpose, fix it, and see the guardrails refuse a bad deployment.',
    notes: 'Most of the platform has now been used, even if not yet understood in detail. Tomorrow opens up the pipeline and the policies.',
  },
];
