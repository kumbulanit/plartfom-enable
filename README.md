# Platform Engineering course

Everything for the 6-day Platform Engineering course, in three folders:

| Folder | What it is | Start with |
| --- | --- | --- |
| [`docs/`](docs/) | The course material: the six slide decks (PowerPoint, with speaker notes) and their source, the instructor guides (setup, run-book, a guide per day, safety net, capstone rubric) and the course brief | [`docs/instructor/setup-guide.md`](docs/instructor/setup-guide.md) |
| [`labs/`](labs/) | The labs, one folder per day: `README.md` has every lab of the day step by step, and the folder holds the code the platform puts in Gitea for that day | [`labs/README.md`](labs/README.md) |
| [`prelab-setup/`](prelab-setup/) | What brings the environment up: Ansible that builds the whole platform on one Ubuntu 24.04 server (workspaces, Gitea, Harbor, Argo CD, Kyverno, Grafana, the portal), and resets, backs up or tears it down | [`prelab-setup/README.md`](prelab-setup/README.md) |

**To bring up the lab**, clone this repository on the control machine (or on the
server itself) and follow the [setup guide](docs/instructor/setup-guide.md) from
Part 3. During the course, the [run-book](docs/instructor/run-book.md) is the
short version.

**Where to change things.** The labs' instructions (`labs/dayN/README.md`) and the
instructor's day guides are generated from `docs/slides/src/content/`: edit the
content there, then run `node handbook.js` in `docs/slides/src/` (see
[`docs/slides/README.md`](docs/slides/README.md)). The code in `labs/` is used as it
is: the build seeds it into Gitea, filling in the `.j2` files for the lab.

**Never commit** `prelab-setup/credentials/`, `prelab-setup/backups/` or
`prelab-setup/files/tls/`: the build writes passwords, keys, backups and
certificates there, and they are ignored by git on purpose.
