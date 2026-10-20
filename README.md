# Platform Engineering course: lab and material

Everything for the 6-day Platform Engineering course, in two folders:

| Folder | What it is | Start with |
| --- | --- | --- |
| [`pe-lab-ansible/`](pe-lab-ansible/) | The lab: Ansible that builds the whole platform on one Ubuntu 24.04 server (workspaces, Gitea, Harbor, Argo CD, Kyverno, Grafana, the portal), and resets or tears it down | [`pe-lab-ansible/README.md`](pe-lab-ansible/README.md) |
| [`sarb/`](sarb/) | The course: six slide decks with speaker notes, the delegate handbook's source, the instructor guides and the capstone rubric | [`sarb/instructor/setup-guide.md`](sarb/instructor/setup-guide.md) |

**To build the lab**, clone this repository on the control machine (or on the
server itself) and follow the [setup guide](sarb/instructor/setup-guide.md)
from Part 3. During the course, the [run-book](sarb/instructor/run-book.md) is
the short version.

**Never commit** `pe-lab-ansible/credentials/`, `pe-lab-ansible/backups/` or
`pe-lab-ansible/files/tls/`: the build writes passwords, keys, backups and
certificates there, and they are ignored by git on purpose.
