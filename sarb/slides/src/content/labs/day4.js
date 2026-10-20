// Day 4 labs, step by step, for the handbook (see labs/day1.js for the format).
'use strict';

module.exports = {
  'Lab 1: build and run the hello image': {
    goal: 'Package hello into a container image yourself, run it, look inside it, and remove it.',
    start: 'Your copy of hello (~/hello). Docker is already installed in your workspace.',
    steps: [
      {
        title: 'Build the image',
        where: 'Workspace terminal',
        say: [
          'docker build follows the Dockerfile line by line and produces an image called hello:1.',
          'The base image (Python) comes through the lab\'s registry, Harbor, which keeps a copy of Docker Hub images. The dot at the end means "the Dockerfile is in this folder".',
        ],
        run: 'cd ~/hello\ngit switch main && git pull\ndocker build --build-arg BASE_IMAGE=harbor.$DOMAIN/dockerhub/library/python:3.12-slim -t hello:1 .',
        see: 'Numbered steps, one per Dockerfile instruction, ending with "naming to docker.io/library/hello:1".',
      },
      {
        title: 'Find it in the list of images',
        where: 'Workspace terminal',
        run: 'docker images hello',
        see: 'hello with the tag 1 and its size. Almost all of it is Python itself; your code is a few kilobytes.',
      },
      {
        title: 'Run it',
        where: 'Workspace terminal',
        say: '-d runs it in the background, --name gives it a name, and -p 8080:8080 connects port 8080 of your workspace to port 8080 inside the container.',
        run: 'docker run -d --name hello -p 8080:8080 hello:1\ndocker ps',
        see: 'A long container id, then hello in the list with STATUS "Up".',
      },
      {
        title: 'Call it',
        where: 'Workspace terminal',
        run: 'curl -s localhost:8080/\ncurl -i localhost:8080/healthz',
        see: 'The same answers as on Day 1, now from inside a container: "environment": "local", then HTTP/1.0 200 OK and ok.',
      },
      {
        title: 'Read its logs, and check who it runs as',
        where: 'Workspace terminal',
        say: 'docker logs shows what the program wrote. docker exec runs a command inside the running container; id shows which user it runs as.',
        run: 'docker logs hello\ndocker exec hello id',
        see: 'The JSON log lines, then:',
        out: 'uid=10001 gid=0(root) groups=0(root)',
        tip: 'uid=10001 is an ordinary user, not root (root would be uid=0). The Dockerfile\'s USER 10001 line did that: a container that is broken into gets no administrator rights.',
      },
      {
        title: 'Stop and remove it',
        where: 'Workspace terminal',
        run: 'docker stop hello\ndocker rm hello\ndocker ps -a\ndocker images hello',
        see: 'No container left, but the image hello:1 is still there, ready to run again.',
      },
    ],
    done: 'You built hello:1, ran it, read its logs, saw it runs as an ordinary user, and removed the container.',
  },

  'Lab 2: one image, three environments': {
    goal: 'Run the same image as staging and prod with only its settings changed, and see that a new version is a new image beside the old one.',
    start: 'Lab 1 done: the image hello:1 exists (docker images hello).',
    steps: [
      {
        title: 'Run it as staging',
        where: 'Workspace terminal',
        say: '-e sets a setting (an environment variable) inside the container. Same image, different settings.',
        run: 'docker run -d --name hello-staging -p 8081:8080 -e APP_ENV=staging -e GREETING="Hello from staging" hello:1\ncurl -s localhost:8081/',
        see: '"environment": "staging" and "Hello from staging".',
      },
      {
        title: 'Run it as prod too',
        where: 'Workspace terminal',
        run: 'docker run -d --name hello-prod -p 8082:8080 -e APP_ENV=prod -e GREETING="Hello from prod" hello:1\ncurl -s localhost:8082/\ndocker ps',
        see: 'Two containers from one image, each reporting its own environment.',
      },
      {
        title: 'Make version 2',
        where: 'Workspace editor and terminal',
        say: 'Change the default greeting in app/main.py (the GREETING line, as on Day 2) and save. Then build again with a new tag, and give it a version number.',
        run: 'docker build --build-arg BASE_IMAGE=harbor.$DOMAIN/dockerhub/library/python:3.12-slim --build-arg APP_VERSION=2 -t hello:2 .\ndocker images hello',
        see: 'Both hello:1 and hello:2. Building version 2 did not change version 1: an image never changes once built.',
      },
      {
        title: 'Run the two versions side by side',
        where: 'Workspace terminal',
        run: 'docker run -d --name hello-v1 -p 8080:8080 hello:1\ndocker run -d --name hello-v2 -p 8083:8080 hello:2\ncurl -s localhost:8080/\ncurl -s localhost:8083/',
        see: 'Two answers: version "dev" with the old greeting, and version "2" with your new one. Rolling back is running the old image again.',
      },
      {
        title: 'Clean up',
        where: 'Workspace terminal',
        say: 'Remove the four containers. Undo your greeting change too: the real change goes through a pull request, not from here.',
        run: 'docker rm -f hello-staging hello-prod hello-v1 hello-v2\ngit checkout app/main.py\ndocker ps',
        see: 'docker ps shows no containers.',
      },
    ],
    done: 'You ran one image as three environments and two versions side by side.',
  },

  'Lab 3: create a new service from the template': {
    goal: 'Use the golden path: create a brand-new service called rates from the template, and watch it build, deploy and appear in the portal without asking anyone.',
    start: 'One member of each team creates the service; the others follow on their screen. Sign in to Gitea first.',
    steps: [
      {
        title: 'Create the repository from the template',
        where: 'Browser: Gitea',
        say: [
          'In Gitea click + (top right) → New Repository.',
          'Template: type golden-path and choose platform/golden-path. Under Template Items tick Git Content and Protected Branch.',
          'Owner: your team (teamNN). Repository Name: rates (lowercase). Click Create Repository.',
        ],
        see: 'teamNN/rates with the app, tests, Dockerfile, pipeline and deploy folders. Open deploy/dev/kustomization.yaml: the names already say rates and your team.',
      },
      {
        title: 'Run its pipeline for the first time',
        where: 'Browser: Gitea',
        say: 'Open the Actions tab of teamNN/rates, choose golden-path (ci.yaml) on the left, then Run workflow, keep main, and Run workflow. Click the run that appears.',
        see: 'Lint, tests, scans, build and push, each turning green, in a few minutes.',
      },
      {
        title: 'Find its image in Harbor',
        where: 'Browser: Harbor',
        say: 'Open https://harbor.<lab domain>, sign in as studentNN with your lab password, open the project teamNN.',
        see: 'A repository teamNN/rates with one image, tagged with the commit id, and its scan result.',
      },
      {
        title: 'Watch it deploy',
        where: 'Browser: Argo CD',
        say: 'Open https://argocd.<lab domain> (sign in as delegate if it asks). Argo CD looks for new repositories every minute.',
        see: 'teamNN-rates-dev appears, then Synced and Healthy.',
        tip: 'If the safety net is on: the latest commit of teamNN/rates in Gitea shows safety-net/dev "Deployed to teamNN-dev" once the first pipeline has passed.',
      },
      {
        title: 'Open it',
        where: 'Browser or terminal',
        run: 'curl -s https://rates-$TEAM-dev.$DOMAIN/',
        see: '"app": "rates", "environment": "dev".',
      },
      {
        title: 'Add it to the portal',
        where: 'Browser: the portal (Backstage)',
        say: [
          'Open https://backstage.<lab domain> and sign in as guest. Click Create, then Register Existing Component.',
          'Paste https://gitea.<lab domain>/teamNN/rates/src/branch/main/catalog-info.yaml (with your team), click Analyze, then Import.',
        ],
        see: 'rates in the catalog, owned by teamNN, with links to its environments, pipeline, Argo CD, Harbor and Grafana.',
      },
    ],
    done: 'teamNN/rates exists, its pipeline is green, it answers in dev, and it is in the portal. Count how many people you had to ask: none.',
  },

  'Lab 4: a first change to the new service': {
    goal: 'Make your first change to rates through the same loop as on Day 2, and read the README the golden path gave it.',
    start: 'Lab 3 done: teamNN/rates exists and runs in dev.',
    steps: [
      {
        title: 'Copy the new repository and make a branch',
        where: 'Workspace terminal',
        run: 'cd ~\ngit clone https://gitea.$DOMAIN/$TEAM/rates\ncd rates\ngit switch -c first-change-$ME',
        see: 'Switched to a new branch \'first-change-studentNN\'.',
      },
      {
        title: 'Change the greeting and run the tests',
        where: 'Workspace editor and terminal',
        say: 'Change the GREETING line in app/main.py and save. Then run the tests the pipeline will run.',
        run: 'python3 -m pytest -q',
        see: '5 passed.',
      },
      {
        title: 'Commit, push, review, merge',
        where: 'Workspace terminal, then Gitea',
        say: 'Push and open a pull request; a teammate approves; merge once the pipeline is green.',
        run: 'git commit -am "First change to rates"\ngit push -u origin first-change-$ME',
        see: 'The pipeline runs on the pull request, and again on main after the merge.',
      },
      {
        title: 'See it live in dev',
        where: 'Browser: Argo CD, then the terminal',
        run: 'curl -s https://rates-$TEAM-dev.$DOMAIN/',
        see: 'Your new greeting, a few minutes after the merge.',
        tip: 'If the safety net is on, check the merge commit\'s safety-net/dev status instead of Argo CD.',
      },
      {
        title: 'Read the README',
        where: 'Browser: Gitea',
        say: 'Open README.md in teamNN/rates. It is the user guide of the golden path: how to change, release and watch the service.',
        see: 'You recognise every step from the last four days.',
      },
    ],
    done: 'Your change to rates is live in dev, through a reviewed pull request.',
  },
};
