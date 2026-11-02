#!/usr/bin/env python3
"""The handbook's diagrams, as plain SVG files (they render in Gitea, GitHub and Patchbay).

    python3 labs/images/diagrams.py        # writes labs/images/*.svg

Each diagram shows one mechanism a lab depends on. Edit the drawing functions below and run the
script again; the SVGs are generated, not edited by hand.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = 'font-family="-apple-system, Segoe UI, Helvetica, Arial, sans-serif"'
INK, MUTED, LINE, FILL = '#1f2933', '#616e7c', '#7b8794', '#f5f7fa'
ACCENT, ACCENT_FILL = '#2563eb', '#e8efff'   # the path the diagram is about
OK, OK_FILL = '#15803d', '#e7f6ec'
BAD, BAD_FILL = '#b91c1c', '#fdecec'
KINDS = {'': (LINE, FILL), 'accent': (ACCENT, ACCENT_FILL), 'ok': (OK, OK_FILL), 'bad': (BAD, BAD_FILL),
         'ghost': ('#cbd2d9', '#ffffff')}


class Svg:
    def __init__(self, w, h, title):
        self.w, self.h, self.title, self.parts = w, h, title, []

    def box(self, x, y, w, h, label, sub=None, kind=''):
        stroke, fill = KINDS[kind]
        dash = ' stroke-dasharray="5 4"' if kind == 'ghost' else ''
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{fill}" stroke="{stroke}" stroke-width="1.5"{dash}/>')
        cy = y + h / 2 + (-4 if sub else 5)
        self.text(x + w / 2, cy, label, size=13, weight=600, color=INK)
        if sub:
            for i, line in enumerate(sub.split('\n')):
                self.text(x + w / 2, cy + 17 + i * 15, line, size=11, color=MUTED)

    def text(self, x, y, s, size=12, weight=400, color=INK, anchor='middle'):
        s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        self.parts.append(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{s}</text>')

    def arrow(self, pts, label=None, at=None, kind='', dashed=False, below=False):
        """A line through pts, ending in an arrowhead. The label sits by segment `at` (default the middle one)."""
        color = {'': LINE, 'accent': ACCENT, 'ok': OK, 'bad': BAD}[kind]
        d = ' '.join(f'{x},{y}' for x, y in pts)
        dash = ' stroke-dasharray="6 4"' if dashed else ''
        self.parts.append(f'<polyline points="{d}" fill="none" stroke="{color}" stroke-width="{2 if kind else 1.6}"{dash} marker-end="url(#a-{kind or "n"})"/>')
        if label:
            i = at if at is not None else (len(pts) - 2) // 2
            (x1, y1), (x2, y2) = pts[i], pts[i + 1]
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            if y1 == y2:   # horizontal: above (or below) the line
                for j, line in enumerate(label.split('\n')):
                    self.text(mx, my + (16 + j * 13 if below else -7 - (len(label.split('\n')) - 1 - j) * 13), line, size=11, color=color if kind else MUTED)
            else:          # vertical: to the right of the line
                for j, line in enumerate(label.split('\n')):
                    self.text(mx + 8, my + 4 + j * 13, line, size=11, color=color if kind else MUTED, anchor='start')

    def note(self, x, y, s, color=MUTED, anchor='start', size=11):
        for i, line in enumerate(s.split('\n')):
            self.text(x, y + i * 14, line, size=size, color=color, anchor=anchor)

    def save(self, name):
        marks = ''.join(
            f'<marker id="a-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>'
            for k, c in (('n', LINE), ('accent', ACCENT), ('ok', OK), ('bad', BAD)))
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" '
               f'role="img" aria-label="{self.title}" {FONT}><title>{self.title}</title><defs>{marks}</defs>'
               f'<rect width="100%" height="100%" fill="#ffffff"/>' + ''.join(self.parts) + '</svg>\n')
        with open(os.path.join(HERE, name), 'w') as f:
            f.write(svg)


def golden_path():
    s = Svg(1000, 300, 'The golden path: from a commit to prod, and who does each step')
    y = 40
    xs = [20, 185, 350, 515, 680, 845]   # 135 wide, 30 between
    labels = [('Edit', 'your workspace'), ('Pull request', 'Gitea · 1 approval'), ('Pipeline', 'Gitea Actions'),
              ('Image', 'Harbor · scan, SBOM'), ('Argo CD', 'deploys what Git says'), ('dev · staging · prod', 'k3s namespaces')]
    for x, (a, b) in zip(xs, labels):
        s.box(x, y, 135, 64, a, b, kind='accent' if a in ('Pipeline', 'Argo CD') else '')
    for i in range(5):
        s.arrow([(xs[i] + 135, y + 32), (xs[i + 1], y + 32)], None, kind='accent')
        s.text(xs[i] + 150, y + 90, ['push', 'merge', 'push', 'watch', 'sync'][i], size=11, color=ACCENT)
    s.box(680, 160, 135, 56, 'Kyverno', 'checks every Pod', kind='bad')
    s.arrow([(747, 160), (747, 104)], 'refuses bad\nimages', kind='bad', dashed=True)
    s.box(845, 160, 135, 56, 'Grafana', 'versions, traffic, logs')
    s.arrow([(912, 104), (912, 160)], None)
    s.box(185, 160, 135, 56, 'Backstage', 'who owns what', kind='ghost')
    s.note(20, 250, 'Blue: what the platform does by itself once a change is approved. You only edit, open the pull request and approve;\n'
                    'dev follows main automatically, and staging and prod follow a two-line release pull request (Day 6).')
    s.save('golden-path.svg')


def pr_loop():
    s = Svg(1000, 330, 'The pull-request loop: main only takes a reviewed change with a green pipeline')
    s.box(20, 60, 150, 60, 'Your branch', 'greeting-studentNN')
    s.box(230, 60, 150, 60, 'Pull request', 'teamNN/hello')
    s.box(440, 20, 170, 56, 'Pipeline', 'posts status "pipeline"', kind='accent')
    s.box(440, 104, 170, 56, 'Reviewer', 'Review → Approve')
    s.box(680, 60, 130, 60, 'Merge gate', 'protected main', kind='bad')
    s.box(860, 60, 120, 60, 'main', 'squash commit', kind='ok')
    s.arrow([(170, 90), (230, 90)], 'git push')
    s.arrow([(380, 75), (440, 48)], None, kind='accent')
    s.arrow([(380, 105), (440, 132)])
    s.arrow([(610, 48), (680, 78)], None, kind='accent')
    s.arrow([(610, 132), (680, 102)], None)
    s.text(655, 44, 'green', size=11, color=ACCENT)
    s.text(660, 140, '1 approval', size=11, color=MUTED)
    s.arrow([(810, 90), (860, 90)], 'merge', kind='ok')
    s.box(20, 220, 190, 56, 'git push to main', 'refused', kind='bad')
    s.box(250, 220, 190, 56, 'Approve your own PR', 'refused', kind='bad')
    s.box(480, 220, 230, 56, 'New commit after approval', 'approval dismissed', kind='bad')
    s.arrow([(115, 220), (115, 180), (745, 180), (745, 120)], 'what Day 2 Lab 3 tries: each one stops at the gate', at=1, kind='bad', dashed=True)
    s.note(760, 240, 'After the merge, the pipeline on main\npushes the image and Argo CD\nrolls it out to dev.')
    s.save('pr-loop.svg')


def merge_conflict():
    s = Svg(900, 300, 'A merge conflict: two branches changed the same line')
    s.box(20, 120, 120, 50, 'main', 'GREETING = …')
    s.box(220, 40, 170, 56, 'conflict-a', '"Hello from A"', kind='ok')
    s.box(220, 200, 170, 56, 'conflict-b', '"Hello from B"', kind='accent')
    s.arrow([(140, 135), (220, 68)], 'branch')
    s.arrow([(140, 155), (220, 228)], 'branch', below=True)
    s.box(470, 40, 150, 56, 'main', 'has A (merged first)', kind='ok')
    s.arrow([(390, 68), (470, 68)], 'merge', kind='ok')
    s.box(470, 200, 190, 56, 'git merge main', 'CONFLICT in app/main.py', kind='bad')
    s.arrow([(390, 228), (470, 228)], kind='accent')
    s.arrow([(545, 96), (545, 200)], 'bring main in')
    s.box(720, 200, 160, 56, 'You choose', 'one line, no markers', kind='ok')
    s.arrow([(660, 228), (720, 228)], 'edit')
    s.note(720, 120, '<<<<<<< HEAD\n"Hello from B"\n=======\n"Hello from A"\n>>>>>>> main', color=BAD)
    s.save('merge-conflict.svg')


def iac_loop():
    s = Svg(940, 300, 'Infrastructure as Code: plan compares the code with what exists; apply makes them match')
    s.box(20, 110, 150, 64, 'main.tf', 'what should exist')
    s.box(250, 30, 170, 64, 'tofu plan', '+ add  ~ change  - destroy', kind='accent')
    s.box(250, 190, 170, 64, 'state', 'what tofu made')
    s.box(510, 110, 170, 64, 'tofu apply', 'type yes', kind='accent')
    s.box(760, 110, 160, 64, 'Real thing', 'note.txt · a namespace', kind='ok')
    s.arrow([(170, 130), (250, 62)], 'reads', kind='accent')
    s.arrow([(335, 190), (335, 94)], 'compares')
    s.arrow([(420, 62), (510, 130)], 'if you agree', kind='accent')
    s.arrow([(680, 142), (760, 142)], 'makes it so', kind='accent')
    s.arrow([(595, 174), (595, 222), (420, 222)], 'records', at=1, below=True)
    s.arrow([(840, 174), (840, 270), (100, 270), (100, 174)], 'drift: someone changes the real thing by hand; the next plan shows it, apply puts it back', at=1, kind='bad', dashed=True)
    s.save('iac-loop.svg')


def env_request():
    s = Svg(1000, 290, 'Requesting environments: a pull request with a plan, approved by the platform team, applied by the platform')
    s.box(20, 50, 160, 64, 'teamNN.tf', '6 lines: team, envs, size')
    s.box(240, 50, 170, 64, 'Pull request', 'platform/environments')
    s.box(470, 10, 190, 60, 'plan pipeline', 'read-only: shows 16 to add', kind='accent')
    s.box(470, 100, 190, 60, 'platform-approver', 'Review → Approve')
    s.box(720, 50, 120, 64, 'main', 'merged', kind='ok')
    s.box(720, 190, 260, 64, 'Platform applier (every 2 min)', 'tofu apply · posts platform/apply', kind='accent')
    s.box(20, 190, 330, 64, 'teamNN-staging · teamNN-prod', 'namespace, budget (quota), limits, rules', kind='ok')
    s.arrow([(180, 82), (240, 82)], 'git push')
    s.arrow([(410, 72), (470, 42)], kind='accent')
    s.arrow([(410, 92), (470, 128)])
    s.arrow([(660, 42), (720, 72)], None, kind='accent')
    s.arrow([(660, 128), (720, 96)], None)
    s.text(690, 34, 'green', size=11, color=ACCENT)
    s.text(690, 140, 'approved', size=11, color=MUTED)
    s.arrow([(780, 114), (780, 190)], 'fetches main', kind='accent')
    s.arrow([(720, 222), (350, 222)], 'creates', kind='accent')
    s.note(400, 280, 'No pipeline can change the cluster: only the applier does, from what was approved.', anchor='middle')
    s.save('env-request.svg')


def container_build():
    s = Svg(940, 300, 'One image, three environments: build once, change only the settings')
    s.box(20, 110, 140, 64, 'Dockerfile', 'FROM python…\nUSER 10001')
    s.box(220, 110, 150, 64, 'docker build', '-t hello:1', kind='accent')
    s.box(430, 110, 140, 64, 'hello:1', 'image', kind='accent')
    s.arrow([(160, 142), (220, 142)], 'recipe')
    s.arrow([(370, 142), (430, 142)], 'layers', kind='accent')
    rows = [('hello (local)', 'port 8080', 30), ('hello-staging', '-e APP_ENV=staging · 8081', 120), ('hello-prod', '-e APP_ENV=prod · 8082', 210)]
    for name, sub, y in rows:
        s.box(680, y, 240, 56, name, sub, kind='ok')
        s.arrow([(570, 142), (630, 142), (630, y + 28), (680, y + 28)], None, kind='ok')
    s.note(600, 290, 'docker run …', color=OK, anchor='middle')
    s.box(220, 220, 150, 56, 'hello:2', 'a new version', kind='ghost')
    s.arrow([(295, 174), (295, 220)], 'build again\nafter a change', dashed=True)
    s.save('container-build.svg')


def new_service():
    s = Svg(1000, 300, 'A new service from the template: nobody is asked, every step is automatic')
    s.box(20, 40, 170, 64, 'platform/golden-path', 'the template', kind='accent')
    s.box(250, 40, 150, 64, 'teamNN/rates', 'code, tests, pipeline,\ndeploy/, catalog-info')
    s.box(460, 40, 150, 64, 'First pipeline', 'Run Workflow', kind='accent')
    s.box(670, 40, 140, 64, 'Harbor', 'teamNN/rates:<sha>')
    s.box(860, 40, 120, 64, 'rates in dev', 'answers', kind='ok')
    s.arrow([(190, 72), (250, 72)], 'generate', kind='accent')
    s.arrow([(400, 72), (460, 72)])
    s.arrow([(610, 72), (670, 72)], 'push', kind='accent')
    s.arrow([(810, 72), (860, 72)])
    s.box(460, 190, 290, 64, 'Argo CD ApplicationSet', 'finds new team repositories every minute', kind='accent')
    s.arrow([(325, 104), (325, 222), (460, 222)], 'new repo', at=1, below=True)
    s.arrow([(750, 222), (920, 222), (920, 104)], 'deploys deploy/dev', at=0, kind='accent', below=True)
    s.box(20, 190, 170, 64, 'Backstage', 'Register Existing\nComponent', kind='ghost')
    s.arrow([(250, 90), (190, 210)], 'catalog-info.yaml', dashed=True)
    s.save('new-service.svg')


def pipeline():
    s = Svg(1000, 270, 'The pipeline on every change: each step can stop it, and its last step posts the verdict')
    steps = [('ruff', 'lint'), ('pytest', 'unit tests'), ('gitleaks', 'secrets'), ('hadolint', 'Dockerfile'),
             ('kustomize', 'deploy files'), ('docker build', 'image'), ('trivy', 'scan'), ('push', 'main only')]
    x = 15
    for i, (a, b) in enumerate(steps):
        s.box(x, 50, 105, 56, a, b, kind='accent' if a in ('pytest', 'gitleaks', 'hadolint') else '')
        if i:
            s.arrow([(x - 17, 78), (x, 78)])
        x += 122
    s.box(400, 175, 220, 56, 'status "pipeline"', 'success or failure', kind='ok')
    s.parts.append(f'<polyline points="67,106 67,128 920,128 920,106" fill="none" stroke="{OK}" stroke-width="1.5"/>')
    s.arrow([(510, 128), (510, 175)], 'last step: always runs, even after a failure', kind='ok')
    for x, label in ((137, 'wrong test'), (259, 'password'), (381, 'USER root')):
        s.text(x + 52, 30, f'Day 5: {label}', size=11, color=BAD)
    s.note(660, 190, 'The merge gate reads this status:\nred, and main refuses the merge.')
    s.save('pipeline.svg')


def guardrails():
    s = Svg(1000, 300, 'Guardrails: Kyverno checks every Pod at the API server, whoever applies it')
    s.box(20, 110, 150, 64, 'kubectl apply', 'or Argo CD')
    s.box(230, 110, 150, 64, 'API server', 'k3s')
    s.box(440, 50, 260, 184, '', None, kind='bad')
    s.text(570, 76, 'Kyverno: three policies', size=13, weight=600)
    for i, (a, b) in enumerate((('trusted registry', 'image from harbor.<domain>'), ('immutable tags', 'no :latest'),
                                ('ownership labels', 'name, part-of'))):
        s.box(460, 90 + i * 46, 220, 38, a, None)
        s.text(570, 90 + i * 46 + 33, b, size=10, color=MUTED)
    s.box(780, 50, 200, 64, 'Refused', 'each message names the fix', kind='bad')
    s.box(780, 170, 200, 64, 'Running', 'in teamNN-dev', kind='ok')
    s.arrow([(170, 142), (230, 142)], 'create Pod')
    s.arrow([(380, 142), (440, 142)], 'admission')
    s.arrow([(700, 100), (780, 82)], None, kind='bad')
    s.arrow([(700, 190), (780, 202)], None, kind='ok')
    s.text(740, 128, 'any rule fails', size=11, color=BAD)
    s.text(740, 168, 'all pass', size=11, color=OK)
    s.box(230, 230, 190, 56, 'pelab-exceptions', 'approved, until a date')
    s.arrow([(420, 258), (570, 258), (570, 234)], 'lets one workload through', at=0, below=True, dashed=True)
    s.save('guardrails.svg')


def promotion():
    s = Svg(1000, 330, 'Promotion: dev follows main; staging and prod change only through an approved release pull request')
    s.box(20, 40, 170, 64, 'merge to main', 'pipeline pushes <sha>')
    s.box(20, 190, 170, 64, 'Release PR', 'two lines · approved')
    s.box(260, 40, 190, 64, 'deploy/dev', 'newTag: <latest sha>', kind='accent')
    s.box(260, 140, 190, 64, 'deploy/staging', 'newTag: TAG · count: 1')
    s.box(260, 240, 190, 64, 'deploy/prod', 'newTag: TAG · count: 2')
    s.arrow([(190, 72), (260, 72)], 'automatic', kind='accent')
    s.arrow([(190, 212), (260, 172)])
    s.arrow([(190, 232), (260, 272)])
    s.text(225, 235, 'changes', size=11, color=MUTED)
    s.box(540, 120, 150, 104, 'Argo CD', 'makes the cluster\nmatch Git', kind='accent')
    for y, cy in ((40, 140), (140, 172), (240, 204)):
        s.arrow([(450, y + 32), (540, cy)], None, kind='accent')
    s.text(495, 112, 'watches', size=11, color=ACCENT)
    for y, name in ((40, 'teamNN-dev'), (140, 'teamNN-staging'), (240, 'teamNN-prod')):
        s.box(780, y, 190, 64, name, '1 copy' if 'prod' not in name else '2 copies', kind='ok')
    for y, cy in ((40, 140), (140, 172), (240, 204)):
        s.arrow([(690, cy), (780, y + 32)], None, kind='accent')
    s.text(735, 112, 'syncs', size=11, color=ACCENT)
    s.note(20, 290, 'TAG = the commit running in dev,\nalready tested and scanned.')
    s.save('promotion.svg')


def observability():
    s = Svg(940, 300, 'What the dashboard reads: metrics and logs from every copy of the service')
    s.box(20, 110, 170, 70, 'hello pods', '/metrics · JSON logs\ndev, staging, prod')
    s.box(300, 40, 160, 60, 'Prometheus', 'scrapes /metrics', kind='accent')
    s.box(300, 190, 160, 60, 'Alloy → Loki', 'collects the logs', kind='accent')
    s.box(570, 110, 180, 70, 'Grafana', 'Golden path dashboard', kind='ok')
    s.box(570, 10, 180, 56, 'Alert', 'no healthy copy', kind='bad')
    s.box(800, 200, 120, 60, 'k6', 'load test', kind='ghost')
    s.arrow([(190, 130), (300, 70)], 'requests,\nversion, uptime')
    s.arrow([(190, 160), (300, 220)], None)
    s.note(150, 215, 'one line\nper request', anchor='middle')
    s.arrow([(460, 70), (570, 130)], kind='accent')
    s.arrow([(460, 220), (570, 160)], kind='accent')
    s.arrow([(460, 55), (570, 38)], kind='bad', dashed=True)
    s.arrow([(800, 245), (760, 245), (760, 278), (105, 278), (105, 180)], 'traffic to staging', at=2, dashed=True)
    s.save('observability.svg')


def recovery():
    s = Svg(1000, 300, 'Two incidents, two ways back: Argo CD self-heals drift; Git reverts a bad release')
    s.text(20, 30, 'A change by hand', size=13, weight=600, anchor='start')
    s.box(20, 45, 200, 56, 'kubectl scale … --replicas=0', 'dev: 0 copies, 503', kind='bad')
    s.box(300, 45, 180, 56, 'Argo CD', 'OutOfSync: Git says 1')
    s.box(560, 45, 170, 56, 'Self-heal', 'no human', kind='accent')
    s.box(810, 45, 170, 56, 'dev: 1/1', 'about a minute', kind='ok')
    s.arrow([(220, 73), (300, 73)], 'drift')
    s.arrow([(480, 73), (560, 73)], kind='accent')
    s.arrow([(730, 73), (810, 73)], kind='accent')
    s.text(20, 170, 'A bad release', size=13, weight=600, anchor='start')
    s.box(20, 185, 200, 56, 'Release PR', 'newTag: does-not-exist', kind='bad')
    s.box(300, 185, 180, 56, 'staging', 'new pod ImagePullBackOff', kind='bad')
    s.box(560, 185, 170, 56, 'git revert', 'a reviewed PR', kind='accent')
    s.box(810, 185, 170, 56, 'staging healthy', 'old tag again', kind='ok')
    s.arrow([(220, 213), (300, 213)], 'merged')
    s.arrow([(480, 213), (560, 213)], kind='accent')
    s.arrow([(730, 213), (810, 213)], 'syncs', kind='accent')
    s.note(300, 280, 'The old pod keeps serving while the new one fails: users see no outage.')
    s.save('recovery.svg')


# ---------------------------------------------------------------- Day 1 theory diagrams
def bar(s, x, y, w, h, color, fill):
    s.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{fill}" stroke="{color}" stroke-width="1.5"/>')


def before_after():
    s = Svg(1000, 400, 'A change before and after the platform')
    s.text(20, 28, 'Today: a change by tickets', size=14, weight=700, anchor='start')
    xs = [20 + i * 140 for i in range(7)]
    old = [('Ticket', 'request a server', ''), ('Queue', 'wait 2 weeks', 'bad'), ('Install', 'by hand', ''),
           ('Checks', 'by hand, varies', ''), ('Sign-off', 'weekly meeting', 'bad'), ('Deploy', 'ops logs in, Friday', ''),
           ('Live', 'evidence later', '')]
    for x, (a, b, k) in zip(xs, old):
        s.box(x, 45, 120, 60, a, b, kind=k)
    for i in range(6):
        s.arrow([(xs[i] + 120, 75), (xs[i + 1], 75)])
    s.note(20, 135, 'Weeks from idea to live. Many hand-offs. Each check depends on who does it. Evidence is collected afterwards, for the audit.', color=BAD)
    s.text(20, 205, 'On the platform: the paved road', size=14, weight=700, anchor='start')
    xs = [20 + i * 164 for i in range(6)]
    new = [('Edit', 'your branch', ''), ('Pull request', 'one approval', 'accent'), ('Pipeline', 'test, scan, build', 'accent'),
           ('Image', 'scanned, signed', 'accent'), ('Argo CD', 'deploys from Git', 'accent'), ('Live in dev', 'evidence recorded', 'ok')]
    for x, (a, b, k) in zip(xs, new):
        s.box(x, 222, 140, 60, a, b, kind=k)
    for i in range(5):
        s.arrow([(xs[i] + 140, 252), (xs[i + 1], 252)], kind='accent')
    s.note(20, 312, 'Minutes to hours. One review by a person; every other check is automatic and the same every time.\n'
                    'The evidence (who approved, which tests ran, what was deployed) is written as the change moves.', color=OK)
    s.note(20, 365, 'Blue: what the platform does by itself. Red: where the old way waits.')
    s.save('before-after.svg')


def platform_architecture():
    s = Svg(1000, 470, 'Inside the platform: how the pieces talk')
    s.box(20, 200, 140, 64, 'You', 'browser workspace')
    s.box(210, 70, 160, 60, 'Backstage', 'portal, templates')
    s.box(210, 270, 160, 60, 'Gitea', 'code, pull requests')
    s.box(430, 270, 160, 60, 'Gitea Actions', 'pipeline runner', kind='accent')
    s.box(430, 380, 160, 60, 'Harbor', 'images, scans, SBOM', kind='accent')
    s.box(640, 270, 140, 60, 'Argo CD', 'deploys what Git says', kind='accent')
    s.box(640, 60, 140, 64, 'Grafana', 'Prometheus, Loki')
    s.parts.append(f'<rect x="820" y="150" width="160" height="300" rx="10" fill="#ffffff" stroke="{LINE}" stroke-width="1.5"/>')
    s.text(900, 172, 'k3s cluster', size=13, weight=700)
    for i, (n, k) in enumerate((('dev', 'ok'), ('staging', 'ok'), ('prod', 'ok'))):
        s.box(840, 185 + i * 58, 120, 46, f'teamNN-{n}', None, kind=k)
    s.box(840, 375, 120, 58, 'Kyverno', 'checks every pod', kind='bad')
    s.arrow([(160, 220), (210, 110)], 'find, create', at=0)
    s.arrow([(160, 245), (210, 290)], 'git push', at=0)
    s.arrow([(290, 130), (290, 270)], 'template\ncreates repo')
    s.arrow([(370, 300), (430, 300)], 'runs', kind='accent')
    s.arrow([(510, 330), (510, 380)], 'pushes image', kind='accent')
    s.arrow([(330, 270), (330, 240), (710, 240), (710, 270)], 'watches deploy/ in Git', kind='accent')
    s.arrow([(780, 300), (840, 300)], 'syncs', kind='accent')
    s.arrow([(590, 410), (820, 410)], 'images pulled', kind='accent', below=True)
    s.arrow([(900, 150), (900, 92), (780, 92)], 'metrics, logs', at=1)
    s.note(20, 340, 'You touch two things:\nthe workspace and\nthe pull request.\nBlue is automatic.')
    s.save('platform-architecture.svg')


def team_topologies():
    s = Svg(1000, 380, 'How the teams work together')
    for i, (a, b) in enumerate((('Market operations team', 'stream-aligned'), ('Reserves team', 'stream-aligned'),
                                ('Analytics team', 'stream-aligned'))):
        s.box(20 + i * 240, 40, 210, 62, a, b, kind='ok')
    s.box(20, 270, 690, 66, 'Platform team', 'builds and runs the paved road as a product: environments, pipelines, deployment, monitoring', kind='accent')
    for i in range(3):
        x = 125 + i * 240
        s.arrow([(x, 270), (x, 102)], 'self-service\n(as a service)' if i == 0 else None, kind='accent')
    s.box(780, 40, 200, 62, 'Enabling team', 'security, testing coaches')
    s.arrow([(780, 71), (710, 71)], dashed=True)
    s.text(745, 128, 'coaching,', size=11, color=MUTED)
    s.text(745, 142, 'for a while', size=11, color=MUTED)
    s.box(780, 180, 200, 62, 'Complicated subsystem', 'e.g. a pricing engine', kind='ghost')
    s.arrow([(780, 211), (650, 211), (650, 102)], 'used as a service', at=0)
    s.note(780, 290, 'Stream-aligned teams deliver to\nusers. The others exist to make\nthem faster, mostly by\nself-service, not tickets.')
    s.save('team-topologies.svg')


def golden_path_contents():
    s = Svg(1000, 330, 'What one golden-path request gives a team')
    s.box(380, 20, 240, 64, 'Template: "new service"', 'fill in a name, about a minute', kind='accent')
    items = [('Repository', 'code and tests'), ('Pipeline', 'lint, test, scan, build'), ('Deploy config', 'dev, staging, prod'),
             ('Catalogue entry', 'owner, API, docs'), ('Dashboard', 'versions, traffic, logs'), ('Guardrails', 'rules apply at once')]
    xs = [20 + i * 162 for i in range(6)]
    for x, (a, b) in zip(xs, items):
        s.box(x, 170, 150, 60, a, b, kind='ok')
        s.arrow([(500, 84), (500, 125), (x + 75, 125), (x + 75, 170)], kind='accent')
    s.note(20, 275, 'Every new service starts with the controls already in place: nobody has to remember to add tests, scanning,\n'
                    'an owner or a dashboard. That is how a platform makes the safe way the easy way (Day 4 Lab 3 does exactly this).')
    s.save('golden-path-contents.svg')


def value_stream():
    s = Svg(1000, 380, 'A value stream, mapped: where the time goes')
    steps = [('Ticket raised', 0.1), ('Triage', 0.1), ('Write the SQL', 1.0), ('Peer check', 0.3),
             ('Approval', 0.2), ('Ops runs it', 0.3)]
    waits = [5, 3, 2, 4, 3, 1]
    xs = [12 + i * 140 for i in range(7)]
    for i, (x, (a, work)) in enumerate(zip(xs, steps)):
        s.box(x, 50, 112, 64, a, None)
        s.text(x + 56, 138, f'work {work:g} day', size=11, color=OK, weight=600)
    s.box(xs[6], 50, 112, 64, 'Live', None, kind='ok')
    for i in range(6):
        s.arrow([(xs[i] + 112, 82), (xs[i + 1], 82)])
        s.text(xs[i] + 126, 40, f'wait {waits[i]} d', size=11, color=BAD, weight=600)
    s.text(20, 200, 'Lead time: 20 days', size=14, weight=700, anchor='start')
    bar(s, 20, 215, 900 * 18 / 20, 34, BAD, BAD_FILL)
    bar(s, 20 + 900 * 18 / 20, 215, 900 * 2 / 20, 34, OK, OK_FILL)
    s.text(20 + 405, 237, '18 days waiting', size=12, color=BAD, weight=600)
    s.text(20 + 855, 237, '2 days', size=12, color=OK, weight=600)
    s.note(20, 285, 'Flow efficiency = work time / lead time = 2 / 20 = 10%.\n'
                    'Making people work faster saves little; removing the waits between them saves most.\n'
                    'An example, not a measurement: Lab 1 maps one of your own changes the same way.', size=12)
    s.save('value-stream.svg')


def linux_layers():
    s = Svg(900, 400, 'The layers of a Linux computer')
    rows = [('You', 'type a command in the terminal', ''),
            ('Shell (bash)', 'reads your command and starts the program', 'accent'),
            ('Programs', 'git, python3, curl, docker, kubectl', ''),
            ('Linux kernel', 'runs processes, manages memory, files and network, enforces permissions', 'accent'),
            ('Hardware', 'processor, memory, disk, network card (here: the lab server)', 'ghost')]
    for i, (a, b, k) in enumerate(rows):
        s.box(40, 20 + i * 74, 560, 58, a, b, kind=k)
    for i in range(4):
        s.arrow([(320, 78 + i * 74), (320, 94 + i * 74)])
    s.note(640, 60, 'Windows has the same layers:\na different kernel, and\nPowerShell or cmd as the shell.', size=12)
    s.note(640, 200, 'A container (Day 4) shares the\nkernel of the machine it runs on:\nthat is why containers are\nsmall and start in a second.', size=12)
    s.save('linux-layers.svg')


def linux_tree():
    s = Svg(1000, 340, 'The Linux file tree you will use this week')
    s.box(430, 20, 140, 46, '/', 'the root', kind='accent')
    kids = [('/home', 'people'), ('/etc', 'settings'), ('/var', 'changing data'), ('/usr', 'programs'), ('/tmp', 'temporary')]
    xs = [20 + i * 200 for i in range(5)]
    for x, (a, b) in zip(xs, kids):
        s.box(x, 120, 160, 52, a, b)
        s.arrow([(500, 66), (500, 92), (x + 80, 92), (x + 80, 120)])
    s.box(20, 230, 160, 58, 'student07  (~)', 'your home folder', kind='ok')
    s.arrow([(100, 172), (100, 230)])
    s.note(20, 312, 'hello/   day1/   evidence/')
    s.box(420, 230, 160, 52, 'log', 'log files')
    s.arrow([(500, 172), (500, 230)])
    s.box(620, 230, 160, 52, 'bin', 'git, python3, curl')
    s.arrow([(700, 172), (700, 230)])
    s.note(820, 240, '/home/student07/hello\nis the same as\n~/hello', size=12)
    s.save('linux-tree.svg')


def web_request():
    s = Svg(1000, 330, 'One request through hello')
    s.box(20, 60, 170, 70, 'Client', 'curl or a browser')
    s.box(420, 50, 200, 90, 'hello', 'listening on port 8080', kind='accent')
    s.arrow([(190, 80), (420, 80)], 'GET /healthz  (port 8080)', kind='accent')
    s.arrow([(420, 115), (190, 115)], '200 OK  ·  body: ok', kind='ok', below=True)
    s.box(700, 30, 280, 56, 'Log', 'one JSON line per request', kind='ghost')
    s.box(700, 110, 280, 56, '/metrics', 'counts requests, by path and status', kind='ghost')
    s.arrow([(620, 75), (700, 58)])
    s.arrow([(620, 110), (700, 138)])
    s.text(20, 215, 'Status codes you will meet', size=13, weight=700, anchor='start')
    codes = [('200 OK', 'it worked', 'ok'), ('404', 'not found', ''), ('403', 'not allowed', ''), ('500', 'the service failed', 'bad')]
    for i, (a, b, k) in enumerate(codes):
        s.box(20 + i * 170, 230, 150, 56, a, b, kind=k)
    s.note(720, 250, 'The platform asks /healthz all the\ntime, and the dashboard counts\nthe status codes in /metrics.', size=12)
    s.save('web-request.svg')


def config_envs():
    s = Svg(1000, 380, 'One code, three environments: only the settings change')
    s.box(20, 120, 200, 76, 'One build of hello', 'the same code (Day 4:\nthe same image)', kind='accent')
    envs = [('dev', 'APP_ENV=dev\nGREETING="Hello from dev"'), ('staging', 'APP_ENV=staging\nGREETING="Hello from staging"'),
            ('prod', 'APP_ENV=prod\nGREETING="Hello from prod"')]
    for i, (n, v) in enumerate(envs):
        y = 20 + i * 100
        s.box(420, y, 160, 70, n, None, kind='ok')
        s.arrow([(220, 158), (300, 158), (300, y + 35), (420, y + 35)], kind='accent')
        s.note(610, y + 28, v, size=12)
    s.note(20, 318, 'Settings come from outside the code (environment variables). What was tested in staging is exactly what runs in prod:\n'
                    'only the settings differ. Lab 3 does this by hand today.', size=12)
    s.save('config-envs.svg')


if __name__ == '__main__':
    for draw in (golden_path, pr_loop, merge_conflict, iac_loop, env_request, container_build, new_service,
                 pipeline, guardrails, promotion, observability, recovery,
                 before_after, platform_architecture, team_topologies, golden_path_contents, value_stream,
                 linux_layers, linux_tree, web_request, config_envs):
        draw()
    print('wrote', len([f for f in os.listdir(HERE) if f.endswith('.svg')]), 'diagrams to', HERE)
