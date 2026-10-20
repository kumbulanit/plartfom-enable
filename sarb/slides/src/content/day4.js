// Day 4: Containers and the packaging template
'use strict';
const DOMAIN = '<lab domain>';

module.exports = [
  {
    type: 'title', section: 'Opening',
    title: 'Containers and the packaging template',
    subtitle: 'Package the app once and run it anywhere. Then create a new service from the template and watch it appear in the catalog and in dev.',
    highlight: ['Workspace', 'Template', 'Portal'],
    notes: 'The morning is Docker by hand, so that the afternoon\'s template is not magic. By the end of the day every delegate has built and run a container image themselves, and every team has a second service created from the golden path in minutes.',
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
EXPOSE 8080
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
    type: 'steps', section: 'Lab 1: Docker by hand', time: '40 min',
    title: 'Lab 1: build and run the hello image',
    steps: [
      { do: `cd ~/hello && git switch main && git pull. Then: docker build --build-arg BASE_IMAGE=harbor.${DOMAIN}/dockerhub/library/python:3.12-slim -t hello:1 .`, expect: 'Each Dockerfile line runs as a step; the last line says the image is tagged hello:1.' },
      { do: 'docker images | head', expect: 'hello:1 in the list, with its size: almost all of it is Python itself; your code is a few kilobytes.' },
      { do: 'docker run -d --name hello -p 8080:8080 hello:1', expect: 'A long container id. docker ps shows it running.' },
      { do: 'curl -s localhost:8080/ and curl -i localhost:8080/healthz', expect: 'The JSON with "environment": "local"; HTTP 200 for healthz.' },
      { do: 'docker logs hello, then docker exec hello id', expect: 'JSON log lines; uid=10001, not root.' },
      { do: 'docker stop hello && docker rm hello', expect: 'The container is gone; the image hello:1 remains.' },
    ],
    notes: 'The container runs the exact same code as yesterday, but now it carries its own Python and needs nothing from the workspace. Point at docker exec hello id: the non-root user matters on Day 5. If the build cannot pull the base image, the Harbor cache is not warm; the lab assistant checks.',
  },
  {
    type: 'steps', section: 'Lab 1: Docker by hand', time: '25 min',
    title: 'Lab 2: one image, three environments',
    steps: [
      { do: 'docker run -d --name hello-staging -p 8081:8080 -e APP_ENV=staging -e GREETING="Hello from staging" hello:1', expect: 'curl -s localhost:8081/ says "environment": "staging". Same image, different settings.' },
      { do: 'docker run -d --name hello-prod -p 8082:8080 -e APP_ENV=prod -e GREETING="Hello from prod" hello:1', expect: 'Three containers from one image: local, staging and prod, each reporting its own name.' },
      { do: 'Change the default greeting in app/main.py and rebuild as hello:2 (same build command, -t hello:2).', expect: 'docker images shows hello:1 and hello:2; the old one is untouched.' },
      { do: 'Run hello:2 on port 8083 and compare with 8080.', expect: 'Two versions running side by side.' },
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
    type: 'section', section: 'The packaging template',
    title: 'The packaging template',
    subtitle: 'What a new service gets for free, and how the platform team built it.',
    notes: 'The afternoon moves from doing it by hand to getting it from the golden path.',
  },
  {
    type: 'rows', section: 'The packaging template',
    title: 'What every new service gets from the template',
    rows: [
      { icon: 'FiCode', head: 'A working service and its tests', text: 'The hello app skeleton, five unit tests, and a project file for lint and tests. It runs on the first day.' },
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
    notes: 'This is where "architect golden paths" lives in the course. Give the delegates the five verbs: pick, build, embed, hand over, measure. Then ask each team for one more job in FMD that deserves a golden path (a report, a data pipeline, an API). That answer feeds the capstone.',
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
    type: 'steps', section: 'Lab 3: create a service from the template', time: '40 min · per team',
    title: 'Lab 3: create a new service from the template',
    steps: [
      { do: `Gitea: + New Repository. Template platform/golden-path, Owner teamNN, Name rates (lowercase). Tick Git content and Protected branches. Create.`, expect: 'A new repository teamNN/rates with the app, tests, Dockerfile, pipeline and deploy folders, names already filled in.' },
      { do: 'Open the Actions tab, choose ci.yaml and Run workflow on main.', expect: 'The pipeline runs: lint, tests, scans, build, push. All green.' },
      { do: `Open Harbor at https://harbor.${DOMAIN} (sign in as studentNN with your lab password), project teamNN.`, expect: 'A repository teamNN/rates with one image tagged with the commit id, scanned.' },
      { do: 'Open Argo CD and wait for teamNN-rates-dev to appear (up to a minute).', expect: 'Synced and Healthy.' },
      { do: `Open https://rates-teamNN-dev.${DOMAIN}/`, expect: '"app": "rates", "environment": "dev".' },
      { do: `In the portal (https://backstage.${DOMAIN}): Create, then Register existing component. Paste https://gitea.${DOMAIN}/teamNN/rates/src/branch/main/catalog-info.yaml, Analyze, Import.`, expect: 'The service in the catalog, owned by teamNN, with links to dev, staging, prod, the pipeline, Argo CD, Harbor and Grafana.' },
    ],
    notes: 'Time from clicking Create to a running service in dev: a few minutes, no ticket, no privileged user. That is the brief\'s Lab 4 pass criterion, witnessed. The catalog entry is not decoration: it is where the owner, the links and the support path live. The template wrote catalog-info.yaml for the team; registering it is one more self-service click. (Each team\'s first service, hello, was registered by the platform.)',
  },
  {
    type: 'steps', section: 'Lab 3: create a service from the template', time: '25 min',
    title: 'Lab 4: a first change to the new service',
    steps: [
      { do: `git clone https://gitea.${DOMAIN}/teamNN/rates && cd rates && git switch -c first-change`, expect: 'The repository in your workspace.' },
      { do: 'Change the greeting in app/main.py; run the tests: python3 -m pytest -q', expect: '5 passed.' },
      { do: 'Commit, push, open a pull request; a teammate approves; merge.', expect: 'The pipeline runs on the pull request and again on main.' },
      { do: `Watch Argo CD, then open https://rates-teamNN-dev.${DOMAIN}/`, expect: 'The new greeting live in dev.' },
      { do: 'Read the README in the repository: it is the user guide for the golden path.', expect: 'You recognise every step from the last four days.' },
    ],
    notes: 'The new service follows exactly the same loop as hello. Nothing new to learn: that is what a standard path buys.',
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
      ],
    },
    right: {
      head: 'From the template (Labs 3 and 4)',
      items: [
        'A reviewed Dockerfile with a non-root user',
        'The pipeline builds, scans and tags with the commit id',
        'One overlay per environment, already written',
        'Tests, scans, dashboard, alert and owner included',
        'Every service identical in shape; only the code differs',
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
