// Day 4 labs, step by step, for the handbook (see labs/day1.js for the format).
// The docker outputs are from Docker 29; the Gitea screens from Gitea 1.27.0.
'use strict';

const { TERMINAL, OPEN_LINK, PRIVATE_WINDOW } = require('./common');

const BASE = 'harbor.$DOMAIN/dockerhub/library/python:3.12-slim';
// When a workspace's disk cannot take Docker's overlay mounts: the vfs store, as the lab
// setup does (prelab-setup/roles/lxd/tasks/docker-store.yml), then the build again.
// The error it fixes, as a delegate saw it (shortened).
const STORE_ERROR = '[+] Building 6.8s (6/7)                                              docker:default\n => [1/3] FROM harbor.<lab domain>/dockerhub/library/python:3.12-slim@sha256:5e2bdb1b0d54...\n...\n => ERROR [2/3] WORKDIR /srv                                                         0.0s\n------\n > [2/3] WORKDIR /srv:\n------\nDockerfile:12\n  12 | >>> WORKDIR /srv\n--------------------\nERROR: failed to build: failed to solve: failed to compute cache key: failed to mount /var/lib/containerd/tmpmounts/containerd-mount2139173640: mount source: "overlay", target: "/var/lib/containerd/tmpmounts/containerd-mount2139173640", fstype: overlay, flags: 0, data: "workdir=...,userxattr,index=off", err: invalid argument';
const STORE_FIX = 'echo \'{"log-driver": "json-file", "log-opts": {"max-size": "10m", "max-file": "3"}, "features": {"containerd-snapshotter": false}, "storage-driver": "vfs"}\' | sudo tee /etc/docker/daemon.json\nsudo systemctl restart docker\ncd ~/hello\ndocker build --build-arg BASE_IMAGE=' + BASE + ' -t hello:1 .';

module.exports = {
  'Lab 1: build and run the hello image': {
    goal: 'Package hello into a container image yourself, run it, look inside it, and remove it.',
    learn: [
      'What a container image is, and how a Dockerfile describes one.',
      'How to build an image, run it as a container, read its logs and look inside.',
      'Why the image runs as an ordinary user, not as the administrator.',
    ],
    words: [
      ['Image', 'A package with everything a program needs to run: the program, Python, the libraries. Built once, it never changes.'],
      ['Container', 'A running copy of an image, kept apart from everything else on the machine.'],
      ['Dockerfile', 'The recipe for an image: one instruction per line.'],
      ['Tag', 'The label after the colon in hello:1: which version of the image.'],
      ['Registry', 'Where images are kept and shared. The lab\'s registry is Harbor; it also keeps copies of public images from Docker Hub.'],
      ['Port mapping', '-p 8081:8081 connects a port of your workspace to a port inside the container.'],
    ],
    start: [
      ...TERMINAL,
      'Your copy of hello, in ~/hello. Docker is already installed in your workspace; nothing else is needed.',
    ],
    steps: [
      {
        title: 'Build the image',
        simple: {
          do: [
            'Paste the box. It builds an image called hello:1 from your code (the Dockerfile says how). The first time takes about a minute.',
            {
              text: 'Only if the build stops at WORKDIR /srv with "failed to mount ... overlay ... invalid argument", like the picture: paste the box once. It switches Docker in your workspace to a simpler way of storing images (a little slower, works everywhere), then builds again.',
              seen: { cmd: 'docker build --build-arg BASE_IMAGE=' + BASE + ' -t hello:1 .', out: STORE_ERROR },
              cmd: STORE_FIX,
            },
          ],
        },
        where: 'Workspace terminal',
        why: 'Packaging the service once, as an image, means it runs exactly the same everywhere: in your workspace, in dev, staging and prod.',
        do: [
          'Paste the box and press Enter. The first build takes a minute: it fetches Python through Harbor.',
          'Read the numbered steps as they appear: one for each instruction in the Dockerfile.',
        ],
        run: 'cd ~/hello\ngit switch main && git pull\ndocker build --build-arg BASE_IMAGE=' + BASE + ' -t hello:1 .',
        explain: [
          ['git switch main && git pull', 'build from the latest main, with your merged changes.'],
          ['docker build', 'build an image by following the Dockerfile in this folder.'],
          ['--build-arg BASE_IMAGE=harbor.$DOMAIN/dockerhub/library/python:3.12-slim', 'which image to start from: a small Python 3.12, fetched through the lab\'s Harbor (dockerhub is Harbor\'s copy of Docker Hub). The Dockerfile\'s first line uses this setting.'],
          ['-t hello:1', 'name (tag) the result hello, version 1.'],
          ['.', 'the folder to build from: this one (the dot). The Dockerfile is here.'],
        ],
        see: 'Something like this: a list of steps that fills in as it goes, [1/3] to [3/3] for the three instructions of the Dockerfile, ending with the image being named:',
        out: '[+] Building 12.4s (8/8) FINISHED                                     docker:default\n => [internal] load build definition from Dockerfile                             0.0s\n => [internal] load metadata for harbor.<lab domain>/dockerhub/library/python:3.12-slim   1.2s\n...\n => [1/3] FROM harbor.<lab domain>/dockerhub/library/python:3.12-slim@sha256:...   9.6s\n...\n => [2/3] WORKDIR /srv                                                           0.3s\n => [3/3] COPY app/ app/                                                         0.1s\n => exporting to image                                                           0.2s\n => => exporting layers                                                          0.1s\n => => writing image sha256:51ec07f75cbf...                                      0.0s\n => => naming to docker.io/library/hello:1                                       0.0s',
        read: [
          'Each [n/3] is one instruction of the Dockerfile: start from Python, make a working folder /srv, copy your app folder into it. Open Dockerfile in the editor to see the lines.',
          'A second build is much faster: Docker reuses the steps that did not change (CACHED).',
        ],
        ifnot: [
          ['failed to resolve source metadata ... harbor', 'the workspace cannot reach Harbor. Check that you pasted the whole line; if it still fails, tell the instructor.'],
          ['Cannot connect to the Docker daemon', 'Docker is not running in your workspace: sudo systemctl start docker, then build again.'],
          ['failed to mount ... overlay ... invalid argument (at WORKDIR /srv)', 'your workspace\'s disk cannot stack image layers. Switch Docker to the vfs store, then build again: ' + STORE_FIX.split('\n').slice(0, 2).join(' && ') + '. New labs are set up this way already when they need it.'],
        ],
      },
      {
        title: 'Find it in the list of images',
        simple: { do: ['Paste the box. It lists your hello images: hello:1 is there.'] },
        where: 'Workspace terminal',
        why: 'An image is now stored in your workspace, ready to run as many times as you like.',
        run: 'docker images hello',
        explain: [
          ['docker images hello', 'list the images called hello in your workspace.'],
        ],
        see: 'hello:1 with its id and its size:',
        out: 'IMAGE     ID             DISK USAGE   CONTENT SIZE   EXTRA\nhello:1   51ec07f75cbf        145MB             0B',
        read: [
          'Almost all of the 145 MB is Python itself; your code is a few kilobytes.',
          'The id is the image\'s fingerprint: the same id is always exactly the same image.',
        ],
      },
      {
        title: 'Run it',
        simple: { do: ['Paste the box. It starts a container from hello:1 in the background, on port 8081, then lists the running containers.'] },
        where: 'Workspace terminal',
        why: 'An image is only a package; a container is the running copy. One image can run as many containers as you like.',
        run: 'docker run -d --name hello -p 8081:8081 hello:1\ndocker ps',
        explain: [
          ['docker run', 'start a container from an image.'],
          ['-d', 'in the background (detached), so your terminal stays free.'],
          ['--name hello', 'call the container hello, so later commands can find it by name.'],
          ['-p 8081:8081', 'connect port 8081 of your workspace to port 8081 inside the container, where the service listens.'],
          ['hello:1', 'the image to run.'],
          ['docker ps', 'list the running containers.'],
        ],
        see: 'A long container id, then hello in the list with STATUS "Up":',
        out: '945cd5ec3bf7cdc2172d...\nCONTAINER ID   IMAGE     COMMAND                CREATED         STATUS        PORTS                                         NAMES\n945cd5ec3bf7   hello:1   "python -m app.main"   2 seconds ago   Up 1 second   0.0.0.0:8081->8081/tcp, [::]:8081->8081/tcp   hello',
        ifnot: [
          ['port is already allocated', 'something already uses port 8081, perhaps hello from Day 1 still running: stop it (Ctrl+C in its terminal, or pkill -f "python3 -m app.main"), then docker rm hello and run again.'],
          ['The container name "/hello" is already in use', 'a container called hello exists from an earlier try: docker rm -f hello, then run again.'],
        ],
      },
      {
        title: 'Call it',
        simple: { do: ['Paste the box. It asks the container for its answer, then for its health check (ok).'] },
        where: 'Workspace terminal',
        why: 'Check that the service in the container answers exactly like the one you ran by hand on Day 1.',
        run: 'curl -s localhost:8081/\ncurl -i localhost:8081/healthz',
        explain: [
          ['curl -s localhost:8081/', 'call the service; port 8081 of your workspace leads into the container.'],
          ['curl -i localhost:8081/healthz', 'the health check, with the status line.'],
        ],
        ifnot: [
          ['curl: (52) Empty reply from server, or nothing at all', 'the container is still starting. Wait two seconds and run the box again.'],
        ],
        see: 'The same answers as on Day 1, now from inside a container:',
        out: '{"app": "hello", "version": "dev", "environment": "local", "message": "Hello from the PE Lab golden path"}\nHTTP/1.0 200 OK\nServer: hello Python/3.12.15\n...\nok',
        read: [
          'The Server line shows the Python inside the image (yours may be a slightly different 3.12), not your workspace\'s: the container brings its own.',
          'To see it in your browser, as on Day 1: echo "https://$ME.$DOMAIN/proxy/8081/", then Ctrl+click the address (Cmd+click on a Mac).',
        ],
      },
      {
        title: 'Read its logs, and check who it runs as',
        simple: { do: ['Paste the box. It shows what the container printed (its log), then which user it runs as: 10001, an ordinary user, not root.'] },
        where: 'Workspace terminal',
        why: 'Logs are how you find out what a container did. And a container should never run as the administrator: if someone breaks into it, they must get as little as possible.',
        run: 'docker logs hello\ndocker exec hello id',
        explain: [
          ['docker logs hello', 'show what the program in the container wrote: its log.'],
          ['docker exec hello id', 'run one command, id, inside the running container; id shows which user it runs as.'],
        ],
        see: 'The JSON log lines, then the user:',
        out: '{"event": "started", "app": "hello", "env": "local", "version": "dev", "port": 8081}\n{"event": "request", "app": "hello", "env": "local", "method": "GET", "path": "/", "status": 200, "duration_ms": 0.24}\nuid=10001 gid=0(root) groups=0(root)',
        read: [
          'One log line for the start, then one per request: the same log as on Day 1.',
          'uid=10001 is an ordinary user, not root (root would be uid=0). The Dockerfile\'s USER 10001 line did that. On Day 5 you see the pipeline refuse a Dockerfile without it.',
        ],
      },
      {
        title: 'Stop and remove it',
        simple: { do: ['Paste the box. It stops and removes the container. The image hello:1 stays.'] },
        where: 'Workspace terminal',
        why: 'Containers are thrown away and recreated, never repaired by hand. The image stays, ready to run again.',
        run: 'docker stop hello\ndocker rm hello\ndocker ps -a\ndocker images hello',
        explain: [
          ['docker stop hello', 'stop the container (it is asked to finish, then stopped).'],
          ['docker rm hello', 'remove the stopped container.'],
          ['docker ps -a', 'list all containers, stopped ones too (-a): none left.'],
          ['docker images hello', 'the image is still there.'],
        ],
        see: 'No container left, but the image hello:1 is still there:',
        out: 'hello\nhello\nCONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES\nIMAGE     ID             DISK USAGE   CONTENT SIZE   EXTRA\nhello:1   51ec07f75cbf        145MB             0B',
        read: [
          'docker stop and docker rm each repeat the container\'s name when they succeed.',
        ],
      },
    ],
    done: 'You built hello:1, ran it, read its logs, saw it runs as an ordinary user, and removed the container.',
  },

  'Lab 2: one image, three environments': {
    goal: 'Run the same image as staging and prod with only its settings changed, and see that a new version is a new image beside the old one.',
    learn: [
      'Build once, run anywhere: the same image runs in every environment; only the settings differ.',
      'A new version is a new image, beside the old one; rolling back is running the old one again.',
    ],
    words: [
      ['Environment variable', 'A setting given to the container when it starts, with -e NAME=value.'],
      ['Version', 'Here a new tag, hello:2, built from changed code. hello:1 is not touched.'],
    ],
    start: [
      'Lab 1 done: the image hello:1 exists (docker images hello).',
      'No container called hello is running (docker ps shows none).',
    ],
    steps: [
      {
        title: 'Run it as staging',
        simple: { do: ['Paste the box. It starts the same image again, as staging, on port 8082. Only its settings (each -e) are different.'] },
        where: 'Workspace terminal',
        why: 'The same image becomes "staging" just by being given other settings when it starts.',
        run: 'cd ~/hello\ndocker run -d --name hello-staging -p 8082:8081 -e APP_ENV=staging -e GREETING="Hello from staging" hello:1\nsleep 2\ncurl -s localhost:8082/',
        explain: [
          ['cd ~/hello', 'go into your copy of hello: this lab builds and edits it (a new terminal starts in your home folder, where docker build would not find the Dockerfile).'],
          ['--name hello-staging -p 8082:8081', 'a second name and another port of your workspace (8082), leading to the same port 8081 inside.'],
          ['-e APP_ENV=staging -e GREETING="Hello from staging"', 'two settings (environment variables) given to the container.'],
          ['sleep 2', 'wait two seconds: the service needs a moment to start before it can answer.'],
          ['curl -s localhost:8082/', 'call this copy.'],
        ],
        see: 'The same image, now reporting staging:',
        out: '{"app": "hello", "version": "dev", "environment": "staging", "message": "Hello from staging"}',
      },
      {
        title: 'Run it as prod too',
        simple: { do: ['Paste the box. It starts a third copy, as prod, on port 8083, then lists the running containers.'] },
        where: 'Workspace terminal',
        why: 'Two environments side by side, from one image: what dev, staging and prod are on the platform.',
        run: 'docker run -d --name hello-prod -p 8083:8081 -e APP_ENV=prod -e GREETING="Hello from prod" hello:1\nsleep 2\ncurl -s localhost:8083/\ndocker ps',
        explain: [
          ['docker run ... -e APP_ENV=prod ... hello:1', 'a third copy, as prod, on port 8083.'],
          ['docker ps', 'both are running, from the same image.'],
        ],
        read: [
          'Side by side in your browser: echo "https://$ME.$DOMAIN/proxy/8082/" for staging and echo "https://$ME.$DOMAIN/proxy/8083/" for prod, then Ctrl+click each (Cmd+click on a Mac). Same image, two colours, two names.',
        ],
        see: 'prod answers, and docker ps lists two containers, both from hello:1:',
        out: '{"app": "hello", "version": "dev", "environment": "prod", "message": "Hello from prod"}\nCONTAINER ID   IMAGE     ...   PORTS                    NAMES\n...            hello:1   ...   0.0.0.0:8083->8081/tcp   hello-prod\n...            hello:1   ...   0.0.0.0:8082->8081/tcp   hello-staging',
      },
      {
        title: 'Make version 2',
        simple: {
          // No editor: sed makes the same change, so the whole step is one box.
          where: 'Workspace terminal',
          do: ['Paste the box. It changes the greeting in app/main.py, then builds a new image, hello:2, beside hello:1.'],
          change: null,
          run: 'sed -i "s/^GREETING = .*/GREETING = os.environ.get(\\"GREETING\\", \\"Hello from version 2\\")/" app/main.py\ndocker build --build-arg BASE_IMAGE=' + BASE + ' --build-arg APP_VERSION=2 -t hello:2 .\ndocker images hello',
          out: '...\nIMAGE     ID             DISK USAGE   CONTENT SIZE   EXTRA\nhello:1   51ec07f75cbf        145MB             0B   U\nhello:2   88e52ddf8ecf        145MB             0B',
        },
        where: 'Workspace editor and terminal',
        why: 'A change to the code means a new image. The old one stays exactly as it was: that is what makes rolling back safe.',
        do: [
          'In the editor, open hello → app → main.py and change the text of the GREETING line (line 22), for example to Hello from version 2. Save with Ctrl+S (Mac Cmd+S).',
          'Paste the box: it builds a new image, tagged 2, and gives it the version number 2.',
        ],
        change: {
          file: 'app/main.py',
          how: 'line 22, only the text in the second pair of quotes.',
          before: 'GREETING = os.environ.get("GREETING", "Hello from the PE Lab golden path")',
          after: 'GREETING = os.environ.get("GREETING", "Hello from version 2")',
        },
        run: 'docker build --build-arg BASE_IMAGE=' + BASE + ' --build-arg APP_VERSION=2 -t hello:2 .\ndocker images hello',
        explain: [
          ['--build-arg APP_VERSION=2', 'a setting baked into the image when it is built: the version it reports.'],
          ['-t hello:2', 'tag the new image hello, version 2.'],
        ],
        see: 'Two images: hello:1 (in use, U) and the new hello:2:',
        out: 'IMAGE     ID             DISK USAGE   CONTENT SIZE   EXTRA\nhello:1   51ec07f75cbf        145MB             0B   U\nhello:2   88e52ddf8ecf        145MB             0B',
        read: [
          'Different ids: two different images. Building version 2 did not change version 1.',
          'U under EXTRA means "in use": your staging and prod containers run hello:1.',
        ],
        tip: 'No editor at hand? sed -i "s/^GREETING = .*/GREETING = os.environ.get(\\"GREETING\\", \\"Hello from version 2\\")/" app/main.py makes the same change.',
      },
      {
        title: 'Run the two versions side by side',
        simple: { do: ['Paste the box. It runs version 1 (port 8081) and version 2 (port 8084) side by side, and asks both.'] },
        where: 'Workspace terminal',
        why: 'Old and new can run at the same time. Rolling back is just running the old image again: nothing has to be rebuilt.',
        run: 'docker run -d --name hello-v1 -p 8081:8081 hello:1\ndocker run -d --name hello-v2 -p 8084:8081 hello:2\nsleep 2\ncurl -s localhost:8081/\ncurl -s localhost:8084/',
        explain: [
          ['docker run ... hello:1 / hello:2', 'one container from each version, on ports 8081 and 8084.'],
          ['curl -s localhost:8081/, curl -s localhost:8084/', 'ask both.'],
        ],
        see: 'Two answers: version dev with the old greeting, version 2 with yours:',
        out: '{"app": "hello", "version": "dev", "environment": "local", "message": "Hello from the PE Lab golden path"}\n{"app": "hello", "version": "2", "environment": "local", "message": "Hello from version 2"}',
      },
      {
        title: 'Clean up',
        simple: { do: ['Paste the box. It removes the four containers and puts app/main.py back as it was.'] },
        where: 'Workspace terminal',
        why: 'Leave the workspace tidy, and undo your greeting change: real changes go through a pull request, not from here.',
        run: 'docker rm -f hello-staging hello-prod hello-v1 hello-v2\ngit checkout app/main.py\ndocker ps',
        explain: [
          ['docker rm -f ...', 'stop and remove the four containers in one go (-f: force, even while running).'],
          ['git checkout app/main.py', 'undo your change to app/main.py: put back what Git has.'],
          ['docker ps', 'check that nothing is running.'],
        ],
        see: 'The four names, Git confirming the undo, and an empty list:',
        out: 'hello-staging\nhello-prod\nhello-v1\nhello-v2\nUpdated 1 path from the index\nCONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES',
      },
    ],
    done: 'You ran one image as three environments and two versions side by side.',
  },

  'Lab 3: create a new service from the template': {
    goal: 'Use the golden path: create a brand-new service called rates from the template, and watch it build, deploy and appear in the portal without asking anyone.',
    learn: [
      'What a golden path gives a team: a new service with code, tests, pipeline, deployment, dashboard and catalog entry, in minutes.',
      'How the pieces of the platform connect: Gitea, the pipeline, Harbor, Argo CD and the portal.',
      'Where the template lives (platform/golden-path in Gitea), where its pipeline is (.gitea/workflows/ci.yaml), and how a new service gets both.',
    ],
    words: [
      ['Golden path (template)', 'The platform team\'s ready-made way to build a service. You fill in a name; everything else is already done the safe way.'],
      ['Harbor', 'The lab\'s registry: it stores your images, scans them for known weaknesses and lists their ingredients (SBOM).'],
      ['Portal (Backstage)', 'The catalog of every service: who owns it and where it runs.'],
    ],
    start: [
      'Gitea is open and you are signed in as yourself (https://gitea.<lab domain>).',
      'Keep your logins at hand (cat /etc/pelab/logins.md): Harbor uses your studentNN login; Argo CD the delegate login.',
    ],
    steps: [
      {
        title: 'Look inside the template first',
        where: 'Browser: Gitea',
        why: 'The template is an ordinary repository that the platform team owns: platform/golden-path. Everything a new service gets, its pipeline included, is in there. You read it; you never copy it by hand.',
        do: [
          { text: 'Open https://gitea.<lab domain>/platform/golden-path. Next to the name platform / golden-path, a grey label says Template, and a blue button Use this template sits above the files: Gitea offers this repository as a starting point for new ones. Do not click it yet.', shot: { src: 'gitea-12-template-repo.png', caption: 'The template repository platform/golden-path in Gitea: the Template label next to its name, and the folders and files every new service gets. In your lab the address starts with https://gitea.<lab domain>.' } },
          'Read the list of files: .gitea (the pipeline and the review rule), app (the code), deploy (how it runs in dev, staging and prod), tests, Dockerfile (how the image is built), README.md (the user guide) and catalog-info.yaml (its portal entry).',
          { text: 'Click .gitea, then workflows, then ci.yaml. This is the pipeline: the one file that says what runs on every change.', shot: { src: 'gitea-13-template-pipeline.png', caption: 'The pipeline in the template, .gitea/workflows/ci.yaml. The comment at the top says what the platform provides (the registry and the push login); the on: block says when it runs; each "- name:" under steps is one check.' } },
          'Read the steps from top to bottom: each line "- name: ..." is one step. Check out, Lint (ruff), Unit tests (pytest), Secret scan (gitleaks), Dockerfile lint (hadolint), Validate the manifests, Build the image, Vulnerability scan (trivy), Push to Harbor, Sign the image, Clean up, Post the verdict.',
          'Read the block on: near the top: the pipeline runs on every push to main, on every pull request, and when someone clicks Run Workflow (workflow_dispatch).',
          'Go back to platform/golden-path (click golden-path in the path at the top). Click deploy, then dev, then kustomization.yaml.',
          { text: 'Find ${REPO_NAME} and ${REPO_OWNER} in it. They are blanks: when a repository is created from the template, Gitea writes the new name and team in their place.', shot: { src: 'gitea-14-template-placeholders.png', caption: 'deploy/dev/kustomization.yaml in the template: ${REPO_NAME} and ${REPO_OWNER} are the blanks Gitea fills in with the new repository\'s name and team.' } },
          'Go back, click .gitea, then the file template. It lists the files in which Gitea fills in the blanks: README.md, catalog-info.yaml, .gitea/CODEOWNERS and everything under deploy.',
        ],
        see: 'The template: one repository with the code, the pipeline (.gitea/workflows/ci.yaml), the deployment for three environments and the catalog entry, with blanks where the service\'s name and team go.',
        read: [
          'This is how a platform team shares its knowledge: not as a wiki page or a ticket, but as a working starting point. Every team that uses it gets the same checks in the same order.',
          'You can read the template but not change it: it belongs to the platform team. To ask for a change, open an issue in platform/golden-path (the Issues tab).',
        ],
        ifnot: [
          ['Gitea shows "404 Not Found"', 'check the address: platform, then golden-path, with a dash. Make sure you are signed in (your picture at the top right).'],
        ],
      },
      {
        title: 'Create the repository from the template',
        where: 'Browser: Gitea',
        why: 'One form creates a complete service. Nobody raises a ticket or copies files by hand.',
        do: [
          'In Gitea, click + (top right, next to your picture) → New Repository.',
          'Owner: open the list and choose your team name, teamNN (not your user name).',
          'Repository Name: rates (in small letters).',
          'Template: click "Select a template.", type golden and choose platform/golden-path. (Clicking Use this template on platform/golden-path opens the same form with this already chosen.)',
          'Template Items appears: tick Git Content (Default Branch) and Branch Protection. Leave the others.',
          'Click Create Repository at the bottom.',
        ],
        see: 'teamNN/rates with the folders app, deploy and tests and the files Dockerfile, README.md and catalog-info.yaml.',
        read: [
          'Open deploy → dev → kustomization.yaml: where the template had ${REPO_NAME} and ${REPO_OWNER}, it now says rates and teamNN. The template filled them in.',
          'Open .gitea → workflows → ci.yaml: the same pipeline you read in the template, word for word. You wrote none of it, and it already runs every check.',
          'Branch Protection copied the template\'s rule: main takes pull requests only, with an approval and a green pipeline, from the first minute.',
        ],
        ifnot: [
          ['teamNN is not in the Owner list', 'you are not signed in as yourself. Check the picture at the top right; if it is right, tell the instructor.'],
          ['The repository has only a README', 'Git Content was not ticked. Ask the instructor to delete it, and create it again.'],
        ],
      },
      {
        title: 'Run its pipeline for the first time',
        where: 'Browser: Gitea',
        why: 'The first pipeline builds the first image. From then on it runs by itself on every change.',
        do: [
          'In teamNN/rates, click the Actions tab.',
          'On the left, under All Workflows, click golden-path.',
          'A blue bar says "This workflow has a workflow_dispatch event trigger.": click Run Workflow on its right, leave the branch as main, and click Run Workflow in the box that opens.',
          'Reload the page after a few seconds: a new run appears at the top. Click it to watch.',
        ],
        see: 'The job build with its steps (lint, tests, secret scan, Dockerfile lint, build, scan, push), each turning green, in a few minutes.',
        read: [
          'Each step is a check of the golden path. You meet every one of them again on Day 5.',
        ],
        ifnot: [
          ['The run waits for a long time ("Waiting to run")', 'the runner is busy with another run (yours, for example on another branch). Wait; if it has not started after five minutes, tell the instructor.'],
        ],
      },
      {
        title: 'Find its image in Harbor',
        where: 'Browser: Harbor',
        why: 'The pipeline\'s result is an image in Harbor, scanned, with its list of ingredients. That is the evidence of what will run.',
        do: [
          'Open https://harbor.<lab domain> in a new tab. On the sign-in page, type your studentNN in Username and your own password in Password (the same as Gitea), and click LOG IN.',
          'You land on Projects: a table with one line per project. In the Project Name column, click your team name, teamNN.',
          'The project opens on its Repositories tab: one line per image name. Click teamNN/rates.',
          'You now see the artifacts list: one line per image built. Read the line from left to right: Artifacts (the image\'s fingerprint, sha256:...), Tags (the commit id), Size, Vulnerabilities (a coloured bar; move the mouse over it to see how many weaknesses of each severity) and Push Time.',
        ],
        see: 'One artifact, tagged with the commit id (40 letters and digits), with its scan result under Vulnerabilities and its SBOM.',
        read: [
          'The tag is the commit the image was built from: anyone can trace a running image back to its exact code and review.',
          'Click the artifact to see the vulnerability report and the SBOM (the ingredients list). Day 5 reads them in detail.',
        ],
      },
      {
        title: 'Watch it deploy',
        where: 'Browser: Argo CD',
        why: 'Argo CD finds new services by itself and deploys them to dev. Nobody configures anything.',
        do: [
          'Open https://argocd.<lab domain> and sign in as delegate, with its password from cat /etc/pelab/logins.md.',
          'Type your team name in the search box at the top.',
          'Wait up to a minute: Argo CD looks for new repositories every minute.',
        ],
        see: 'teamNN-rates-dev appears, then shows Synced and Healthy.',
        tip: 'If the safety net is on: the latest commit of teamNN/rates in Gitea shows safety-net/dev "Deployed to teamNN-dev" once the first pipeline has passed.',
      },
      {
        title: 'Open it',
        why: 'The new service answers on its own dev address, made for it by the template.',
        browser: {
          where: 'Browser',
          do: ['Open https://rates-teamNN-dev.<lab domain>/ in a new tab (your team name instead of teamNN).'],
          see: 'The same kind of page as hello: DEV in big red letters, the greeting "Hello from the PE Lab golden path", and under it "rates · version" with the commit id. Same template, so the same page, with the new service\'s name.',
          ifnot: [['A 404 page, or the browser cannot find the address', 'Argo CD has not deployed it yet (step 5). Wait a minute and reload.']],
        },
        where: 'Workspace terminal',
        run: 'curl -s https://rates-$TEAM-dev.$DOMAIN/',
        explain: [
          ['curl -s https://rates-$TEAM-dev.$DOMAIN/', 'call the new service in dev, as a program would: the answer is data (JSON).'],
        ],
        see: 'It answers as rates, in dev:',
        out: '{"app": "rates", "version": "4f2c1e9...", "environment": "dev", "message": "Hello from the PE Lab golden path"}',
        ifnot: [
          ['curl: (6) Could not resolve host, or a 404 page', 'Argo CD has not deployed it yet (step 5). Wait a minute and try again.'],
        ],
      },
      {
        title: 'Add it to the portal',
        where: 'Browser: the portal (Backstage)',
        why: 'The catalog is where everyone finds every service, its owner and its links. Registering takes one address.',
        do: [
          'Open https://backstage.<lab domain> in a new tab. A page asks how to sign in: on the Guest card, click Enter. No password is needed.',
          'In the menu on the left (Home, Catalog, APIs, Docs, Create...), click Create.... The page lists templates.',
          'At the top right of that page, click Register Existing Component.',
          'A form with one box, Select URL (the repository URL), opens. Paste this address in it, with your team name: https://gitea.<lab domain>/teamNN/rates/src/branch/main/catalog-info.yaml',
          'Click Analyze. Backstage reads the file and shows what it will add: one component, rates.',
          'Click Import, wait a few seconds, then click View Component.',
          'Read the component\'s page: the About card (owner teamNN, the description) and the links to its environments, pipeline, Argo CD, Harbor and Grafana. Click Catalog on the left: rates is now listed next to hello.',
        ],
        see: 'rates in the catalog, owned by teamNN, with links to its environments, pipeline, Argo CD, Harbor and Grafana.',
        read: [
          'catalog-info.yaml in the repository is where the portal reads all this from: the template wrote it for you.',
        ],
        ifnot: [
          ['Analyze reports an error', 'check the address: your team name, rates, and catalog-info.yaml at the end. Open it in a new tab first: it should show the file.'],
        ],
      },
      {
        title: 'Two services, one pipeline',
        where: 'Browser: Gitea',
        why: 'hello was made from the same template before the course began. Two services, the same checks: that is what a template buys a platform team.',
        do: [
          'In Gitea, open teamNN/hello, then .gitea → workflows → ci.yaml.',
          'In a second tab, open teamNN/rates, then .gitea → workflows → ci.yaml.',
          'Compare the two: the same steps, in the same order, with the same comments.',
          'Now open platform/golden-path and click Issues: this is where teams ask the platform team for changes to the template.',
        ],
        see: 'The same pipeline in hello and rates, copied from platform/golden-path.',
        read: [
          'A new repository gets a copy of the template as it is that day. When the platform team improves the pipeline (a new scan, say), every service created afterwards gets it at once.',
          'Services that already exist keep their copy. The platform team brings them up to date with a pull request to each team, which the team reviews and merges like any other change. That is why the whole pipeline is one file: one file is easy to compare and to update.',
        ],
      },
    ],
    done: 'teamNN/rates exists, its pipeline is green, it answers in dev, and it is in the portal. Count how many people you had to ask: none.',
  },

  'Lab 4: a first change to the new service': {
    goal: 'Make your first change to rates through the same loop as on Day 2, and read the README the golden path gave it.',
    learn: [
      'That a service made from the template works with the same loop as every other: branch, change, test, pull request, review, merge.',
      'How to run the service\'s tests yourself before you push.',
    ],
    words: [
      ['Test', 'A small program that checks the service does what it should. pytest runs them all.'],
    ],
    start: [
      ...TERMINAL,
      'Lab 3 done: teamNN/rates exists and answers in dev.',
    ],
    steps: [
      {
        title: 'Copy the new repository and make a branch',
        where: 'Workspace terminal',
        why: 'Same loop as on Day 2: your own copy, your own branch.',
        run: 'cd ~\ngit clone https://gitea.$DOMAIN/$TEAM/rates\ncd rates\ngit switch -c first-change-$ME',
        explain: [
          ['git clone https://gitea.$DOMAIN/$TEAM/rates', 'copy the new repository into ~/rates.'],
          ['git switch -c first-change-$ME', 'a new branch with your name.'],
        ],
        see: 'Git copies it (the numbers may differ a little) and switches to your branch:',
        out: 'Cloning into \'rates\'...\nremote: Enumerating objects: 31, done.\nremote: Counting objects: 100% (31/31), done.\nremote: Compressing objects: 100% (24/24), done.\nremote: Total 31 (delta 1), reused 0 (delta 0), pack-reused 0 (from 0)\nReceiving objects: 100% (31/31), 11.00 KiB | 11.00 MiB/s, done.\nResolving deltas: 100% (1/1), done.\nSwitched to a new branch \'first-change-student07\'',
      },
      {
        title: 'Change the greeting and run the tests',
        where: 'Workspace editor and terminal',
        why: 'Run the same tests the pipeline will run, before you push: you find a mistake in seconds instead of minutes.',
        do: [
          'In the editor, open rates → app → main.py and change the text of the GREETING line (line 22). Save with Ctrl+S (Mac Cmd+S).',
          'Paste the box to run the tests.',
        ],
        change: {
          file: 'app/main.py',
          how: 'line 22, only the text in the second pair of quotes.',
          before: 'GREETING = os.environ.get("GREETING", "Hello from the PE Lab golden path")',
          after: 'GREETING = os.environ.get("GREETING", "Rates service of team 3")',
        },
        run: 'pytest -q',
        explain: [
          ['pytest -q', 'run every test in the tests folder, quietly (-q): one dot per passing test.'],
        ],
        see: 'Six dots and "6 passed":',
        out: '......                                                                   [100%]\n6 passed in 0.57s',
        read: [
          'Each dot is one test that passed; a failing test would show F and a red explanation (Day 5).',
        ],
        ifnot: [
          ['pytest: command not found', 'you are not in your workspace terminal. Open one in the workspace (☰ → Terminal → New Terminal).'],
          ['SyntaxError or a failed test', 'a quote went missing in your GREETING line. Compare it with the After box, fix and save, then run pytest -q again.'],
        ],
      },
      {
        title: 'Commit, push, review, merge',
        where: 'Workspace terminal, then Gitea',
        why: 'The new service follows exactly the Day 2 rules: a second person (the reviewer) approves, the pipeline must be green, then you merge.',
        do: [
          'Paste the box to commit and push.',
          'Open the pulls/new link it prints (' + OPEN_LINK.replace(/:.*$/, '') + ') and click Create Pull Request.',
          'Approve as reviewer: ' + PRIVATE_WINDOW + ' Then Files Changed → Review → Approve, and close the private window.',
          'When "All checks were successful", merge (Create squash commit, as on Day 2).',
        ],
        run: 'git commit -am "First change to rates"\ngit push -u origin first-change-$ME',
        explain: [
          ['git commit -am "First change to rates"', 'commit every changed file, with a message.'],
          ['git push -u origin first-change-$ME', 'send the branch to Gitea.'],
        ],
        see: 'The pipeline runs on the pull request, and again on main after the merge.',
      },
      {
        title: 'See it live in dev',
        why: 'The proof that the new service ships exactly like hello: merge, and it is live in dev.',
        browser: {
          where: 'Browser',
          do: [
            'Wait a few minutes after the merge: the pipeline builds the image first (Actions tab, green tick), then Argo CD deploys it within a minute.',
            'Reload your rates dev tab (https://rates-teamNN-dev.<lab domain>/).',
          ],
          see: 'DEV in red, and your new greeting under it. The version is now the commit id of your merge.',
          ifnot: [['The old greeting', 'the pipeline or Argo CD has not finished. Check the Actions run of your merge (green?) and teamNN-rates-dev in Argo CD, wait a minute, and reload.']],
        },
        where: 'Workspace terminal',
        run: 'curl -s https://rates-$TEAM-dev.$DOMAIN/',
        explain: [
          ['curl -s https://rates-$TEAM-dev.$DOMAIN/', 'call rates in dev.'],
        ],
        see: 'Your new greeting, a few minutes after the merge (the pipeline builds the image first, then Argo CD deploys it within a minute):',
        out: '{"app": "rates", "version": "a81d3c0...", "environment": "dev", "message": "Rates service of team 3"}',
        tip: 'If the safety net is on, check the merge commit\'s safety-net/dev status instead of Argo CD.',
      },
      {
        title: 'Read the README',
        where: 'Browser: Gitea',
        why: 'The README is the golden path\'s user guide: everything a new team member needs to change, release and watch the service.',
        do: [
          'Open teamNN/rates in Gitea: the README is shown under the file list.',
          'Read the sections on changing, releasing and watching the service.',
        ],
        see: 'You recognise every step from the last four days: branch and pull request (Day 2), environments (Day 3), the image (Day 4), and the release to staging and prod still to come (Day 6).',
      },
    ],
    done: 'Your change to rates is live in dev, through a reviewed pull request.',
  },

  'Lab 5: add a pipeline from a template': {
    goal: 'Give rates a second pipeline, a smoke test, by copying a template the platform team wrote. Time it: from finding the template to a green run.',
    learn: [
      'Where the platform team keeps its pipeline templates (platform/pipeline-templates in Gitea) and how a team uses one.',
      'Where the main pipeline you have used all week came from, and why the platform team wrote it once instead of each team writing its own.',
    ],
    words: [
      ['Pipeline template', 'A pipeline the platform team wrote once, as one file, for every team to copy. It works without changes.'],
      ['Smoke test', 'A quick check that a running service answers at all: its page, its health check, the right environment. Not a full test, just "is there smoke?".'],
      ['workflow_dispatch', 'The line in a pipeline that adds the Run Workflow button: the pipeline runs when someone clicks it.'],
    ],
    start: [
      'Lab 3 done: teamNN/rates exists and answers in dev.',
      'Gitea is open and you are signed in as yourself.',
      'Look at the clock and write down the time: you stop the clock at the end of step 5.',
    ],
    steps: [
      {
        title: 'Find the pipeline templates',
        where: 'Browser: Gitea',
        why: 'Templates are only useful if teams can find them. The platform team keeps them next to the golden path, with a README that says what each one does.',
        do: [
          'Look at the clock and write down the time: you stop the clock at the end of step 5.',
          'Open https://gitea.<lab domain>/platform/pipeline-templates.',
          { text: 'Read the README under the file list: a table with one line per template (what it does, when it runs), then "Use one" in four steps.', shot: { src: 'gitea-15-pipeline-templates.png', caption: 'platform/pipeline-templates: the folder workflows holds the templates, and the README lists them: smoke-test.yaml and nightly-scan.yaml, what each does and when it runs. In your lab the address starts with https://gitea.<lab domain>.' } },
          'You can also find it in the portal: open https://backstage.<lab domain>, click Catalog, and look for Pipeline templates. Its links lead back here.',
        ],
        see: 'One line per template, among them smoke-test.yaml (is the service answering?), the one you use in this lab, and nightly-scan.yaml (scan the image again every night).',
        ifnot: [['Gitea shows "404 Not Found"', 'check the address: platform, then pipeline-templates. Make sure you are signed in (your picture at the top right).']],
      },
      {
        title: 'Read the smoke test, and copy it',
        where: 'Browser: Gitea',
        why: 'Read before you use: a template is code that will run in your repository. This one is about thirty lines and needs no changes.',
        do: [
          'Click workflows, then smoke-test.yaml.',
          'Read the comment at the top: copy it unchanged, as .gitea/workflows/smoke-test.yaml.',
          'Read the block on: workflow_dispatch adds a Run Workflow button, and inputs adds a list in it: which environment to check (dev, staging or prod).',
          'Read the four steps (each "- name:"): Work out the address, The service answers, Its health check says ok, It runs as the right environment.',
          'Above the file, on the right, click the Copy content button (two small squares, next to the download arrow). The whole file is now copied.',
        ],
        see: 'The template, and the four checks it makes.',
        read: [
          'Work out the address builds your service\'s address from the repository\'s name and team, for example https://rates-teamNN-dev.<lab domain>. That is why nobody has to fill anything in: the same file works for hello, rates and any service made from the golden path.',
        ],
      },
      {
        title: 'Add it to rates, on a new branch',
        where: 'Browser: Gitea',
        why: 'A new pipeline is a change like any other: it goes through a pull request, a review and the main pipeline before it can run.',
        do: [
          'Open your rates repository: https://gitea.<lab domain>/teamNN/rates.',
          'Above the file list, click Add File, then New File.',
          'In the box "Name your file…" at the top, type .gitea/workflows/smoke-test.yaml (each / makes a folder as you type).',
          'Click in the big empty editor below and paste with Ctrl+V (Mac Cmd+V). The template appears, about 45 lines.',
          'Scroll down to Commit Changes. In the first box, type the message Add the smoke test from the pipeline templates.',
          { text: 'Choose "Create a new branch for this commit and start a pull request." and type the branch name add-smoke-test in the box that appears. Click Propose file change.', shot: { src: 'gitea-16-new-file-propose.png', caption: 'The bottom of the New File page: the end of the pasted template, the commit message, "Create a new branch for this commit and start a pull request." chosen with the branch add-smoke-test, and the Propose file change button.' } },
        ],
        see: 'The page "Comparing changes": one commit, one file added, .gitea/workflows/smoke-test.yaml with the template\'s lines in green.',
        ifnot: [
          ['The pasted text is empty, or its lines are shifted to the right', 'click in the editor, press Ctrl+A (Mac Cmd+A) and Delete, go back to the template, click Copy content again, and paste once more.'],
          ['"Commit directly to the main branch" is the only choice', 'you are in platform/pipeline-templates, not in teamNN/rates. Go back to your rates repository and start again from Add File.'],
        ],
      },
      {
        title: 'Open the pull request, review, merge',
        where: 'Browser: Gitea',
        why: 'Same rules as every change on Day 2: a reviewer approves and the main pipeline must be green. The platform\'s template does not skip the team\'s own rules.',
        do: [
          'On "Comparing changes", click New Pull Request, then Create Pull Request at the bottom of the form.',
          'Wait for the main pipeline (golden-path) to run on the pull request: a few minutes, until "All checks were successful".',
          'Approve as reviewer: ' + PRIVATE_WINDOW + ' Then Files Changed → Review → Approve, and close the private window.',
          'Back in your own window, reload the pull request and merge it (Create squash commit, as on Day 2).',
        ],
        see: 'The pull request merged. main of teamNN/rates now has .gitea/workflows/smoke-test.yaml.',
      },
      {
        title: 'Run the smoke test',
        where: 'Browser: Gitea',
        why: 'The new pipeline is live the moment it is on main. Nobody installed anything or asked for access.',
        do: [
          'In teamNN/rates, click the Actions tab. On the left, under All Workflows, there are now two: golden-path (the main pipeline) and smoke-test (yours). Click smoke-test.',
          { text: 'In the blue bar "This workflow has a workflow_dispatch event trigger.", click Run Workflow on the right. A box opens: leave main, leave "Which environment to check" on dev, and click Run Workflow.', shot: { src: 'gitea-17-run-smoke-test.png', caption: 'The Run Workflow box of smoke-test: "Use workflow from: main", and the list "Which environment to check" (dev, staging, prod) that the template\'s inputs block made.' } },
          'Reload the page after a few seconds: the run appears at the top. Click it, then click smoke-test on the left to see its steps.',
          { text: 'Click each step to open it. Look at the clock: how many minutes since you wrote down the time at the start?', shot: { src: 'gitea-18-smoke-test-green.png', caption: 'A green smoke test: Work out the address prints "Checking https://rates-team01-dev..." and The service answers shows the service\'s JSON. The two last steps are green too. In your lab the address ends in your lab domain.' } },
        ],
        see: 'Every step green, in seconds. Work out the address prints "Checking https://rates-teamNN-dev.<lab domain>", The service answers shows rates\' JSON, the health check prints ok, and the last step says "It says it is dev."',
        read: [
          'Write down the minutes it took. Most of it was the review and the main pipeline, not the smoke test.',
        ],
        ifnot: [
          ['There is no smoke-test under All Workflows', 'the file is not on main yet, or not in .gitea/workflows. Check that the pull request is merged and that the file is at .gitea/workflows/smoke-test.yaml (Code tab).'],
          ['The run waits for a long time ("Waiting to run")', 'the runner is busy, for example with the main pipeline of your merge. Wait a minute or two.'],
        ],
      },
      {
        title: 'Make it go red',
        where: 'Browser: Gitea',
        why: 'A check is only worth having if it can fail. rates has no staging yet, so the smoke test for staging must say so.',
        do: [
          'Click Run Workflow again. This time, in "Which environment to check", choose staging. Click Run Workflow.',
          'Reload, open the new run and click smoke-test on the left.',
        ],
        see: 'A red cross. The service answers failed: curl reports an error (for example "The requested URL returned error: 404"), because nothing runs at https://rates-teamNN-staging.<lab domain> yet. The later steps did not run.',
        read: [
          'Red is the smoke test doing its job: it tells you, in seconds, that an environment does not answer. On Day 6, run it against hello in staging and prod after each release.',
        ],
      },
      {
        title: 'Where the main pipeline came from',
        where: 'Browser: Gitea',
        why: 'The main pipeline you have used all week was built the same way, by the platform team, from the steps you did by hand.',
        do: [
          'Open teamNN/hello, then .gitea → workflows → ci.yaml.',
          'Above the file, click History. One commit: the platform created hello from the golden-path template before the course, and the pipeline came with it.',
          'Open https://gitea.<lab domain>/platform/golden-path/src/branch/main/.gitea/workflows/ci.yaml: the original, in the template. Every service made from the template has a copy.',
          'Read the list below: each line is something you did by hand this week, then (→) the step of the pipeline that now does it.',
          'By hand, Day 4 Lab 4: you ran pytest -q yourself → Lint (ruff) and Unit tests (pytest), on every change.',
          'By hand, Day 4 Lab 1: docker build, with a tag you chose → Build the image, tagged with the commit id: no tag to remember.',
          'By hand, Day 4 Lab 1: the image stayed in your workspace → Push to Harbor, where Argo CD fetches it.',
          'By hand: nobody checked for secrets, Dockerfile mistakes or known weaknesses → Secret scan (gitleaks), Dockerfile lint (hadolint), Vulnerability scan (trivy), and Harbor scans again.',
          'By hand, Day 1 Lab 3 and Day 4 Lab 2: settings typed into the run command → no pipeline step: the template\'s deploy folder holds the settings, and Argo CD runs them.',
        ],
        see: 'Every manual step from Day 1 and this morning, done by the pipeline on every change, the same way for every team.',
        read: [
          'This is the platform engineering bargain. The platform team did the work once: they wrote the steps down as a pipeline, had security check it once, and put it in a template. Every team gets it in seconds, and nobody has to remember it.',
          'The second template took you minutes, not days, for the same reason. Teams that need a new kind of pipeline ask in platform/pipeline-templates (Issues). When one team\'s idea is good, it becomes a template for everyone.',
        ],
        tip: 'Want another? Add nightly-scan.yaml the same way (steps 2 to 4). It scans rates\' image again every night at 02:00, because new weaknesses are found in images that have not changed. Its Run Workflow button scans it now.',
      },
    ],
    done: 'rates has a second pipeline, copied from a template in minutes, reviewed and green. You know where the templates are, and where the main pipeline came from.',
  },
};
