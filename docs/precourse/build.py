"""Pre-course questionnaire for the Platform Engineering Capability Development Programme.

One list of questions builds both outputs, so the answer wording in the Google Form and
the scoring key in the workbook can never drift apart:

  precourse-questionnaire.xlsx   for management: the questions, the scoring key, a sheet
                                 to paste the form's responses into, every participant's
                                 score and level, and a one-page summary.
  create-google-form.gs          a Google Apps Script: paste it into script.google.com and
                                 run it once; it creates the form and its response sheet.

Run:  python build.py   (needs openpyxl)
"""
import json
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

HERE = Path(__file__).parent
TITLE = 'Platform Engineering Capability Development Programme: pre-course questionnaire'
INTRO = ('This short questionnaire (about 10 minutes) tells us what you already know, so the six days '
         'start at the right level for everyone. There are no wrong answers and it is not a test of you: '
         'if you do not know something, choose "I don\'t know" - that is exactly what we need to hear. '
         'Your answers are seen only by the course team and your programme sponsor.')

# Each question: section, text, kind ('text', 'choice', 'paragraph'), options, area (scored
# questions only), points per option (0-3), and what the answer tells the course team.
ROLES = [
    'Business or financial markets analyst',
    'Data scientist or data analyst',
    'Software developer',
    'Test analyst',
    'Infrastructure, operations or cloud engineer',
    'Cybersecurity, risk or audit specialist',
    'Other',
]
TRACKS = {  # role -> track: which examples and stretch tasks suit the person
    'Business or financial markets analyst': 'Business',
    'Data scientist or data analyst': 'Developer',
    'Software developer': 'Developer',
    'Test analyst': 'Developer',
    'Infrastructure, operations or cloud engineer': 'Infrastructure',
    'Cybersecurity, risk or audit specialist': 'Infrastructure',
    'Other': 'Business',
}

def scale(never, little, some, lots):
    """A four-step self-rating, from 0 to 3 points."""
    return [(never, 0), (little, 1), (some, 2), (lots, 3)]

def knowledge(right, *wrong):
    """A knowledge check: the right answer 3 points, a wrong one or "I don't know" 0."""
    return [(right, 3)] + [(w, 0) for w in wrong] + [("I don't know", 0)]

QUESTIONS = [
    # ---- About you (not scored); the form collects each person's e-mail address itself
    dict(section='About you', text='Which area of FMD do you work in?', kind='choice',
         options=[(o, None) for o in ['Market operations', 'Reserves and liquidity management',
                  'Financial market infrastructure (for example RTGS or FX)', 'Analytics, research or reporting',
                  'Technology supporting FMD', 'Other']],
         tells='Which areas are represented; helps form mixed course teams.'),
    dict(section='About you', text='Which best describes your role?', kind='choice',
         options=[(r, None) for r in ROLES],
         tells='The track (Developer, Infrastructure or Business): which examples and stretch tasks suit the person.'),
    dict(section='About you', text='How many years have you worked in a technical role (IT, data, development, infrastructure, security)?', kind='choice',
         options=[('None: my work is not technical', None), ('Less than 2 years', None), ('2 to 5 years', None), ('More than 5 years', None)],
         tells='Background, shown next to the score.'),
    dict(section='About you', text='Which computer will you use during the course?', kind='choice',
         options=[(o, None) for o in ['A Windows laptop', 'A Mac', 'Either is available to me', 'I am not sure yet']],
         tells='Logistics: browser and access checks before Day 1.'),
    dict(section='About you', text='What do you most want from this course?', kind='choice',
         options=[(o, None) for o in ['To understand platform engineering well enough to take decisions about it',
                  'Hands-on skills I can use in my own work', 'To improve how my team delivers changes',
                  'To prepare to work in, or closely with, a platform team']],
         tells='Expectations: to tune the examples and to compare with the end-of-course evaluation.'),
    # ---- Foundations: Linux and Git (Days 1 and 2)
    dict(section='Foundations', area='Foundations', kind='choice',
         text='How comfortable are you typing commands in a Linux terminal (command line)?',
         options=scale('I have never used one', 'I have typed a few commands, following instructions',
                       'I use it now and then for everyday tasks', 'I use it daily and write small scripts'),
         tells='Day 1: how much Linux help the person needs.'),
    dict(section='Foundations', area='Foundations', kind='choice',
         text='In a Linux terminal, which command lists the files in the current folder?',
         options=knowledge('ls', 'cd', 'mkdir', 'rm'),
         tells='Day 1: basic Linux knowledge, checked rather than self-rated.'),
    dict(section='Foundations', area='Foundations', kind='choice',
         text='How much have you used Git (for example through GitHub, GitLab, Bitbucket or Azure DevOps)?',
         options=scale('Never', 'I have looked at code or files in a Git website',
                       'I clone, commit and push changes now and then', 'I use branches and pull requests every week'),
         tells='Day 2: how much Git help the person needs.'),
    dict(section='Foundations', area='Foundations', kind='choice',
         text='What is a "pull request"?',
         options=knowledge('A request for colleagues to review a change and merge it into the main code',
                           'A way to download the latest code to your computer',
                           'An urgent request to the help desk for access'),
         tells='Day 2: understands the review-and-merge loop.'),
    dict(section='Foundations', area='Foundations', kind='choice',
         text='What does "git commit" do?',
         options=knowledge('Saves a snapshot of your changes, with a message, in your copy of the repository',
                           'Sends your changes to the server for everyone to see',
                           'Deletes your changes and goes back to the last version'),
         tells='Day 2: understands commits (and that commit is not push).'),
    dict(section='Foundations', area='Foundations', kind='choice',
         text='What is an Internal Developer Platform?',
         options=knowledge('A shared, self-service set of tools and templates that lets teams build and run software safely',
                           'A team of developers who build software for other departments',
                           'The laptop and software every developer is given'),
         tells='Day 1: the course\'s central idea.'),
    # ---- Delivery: containers and CI/CD (Days 4 and 5)
    dict(section='Delivery', area='Delivery', kind='choice',
         text='How much have you worked with containers (for example Docker or Podman)?',
         options=scale('Never heard of them', 'I know the idea but have not used them',
                       'I have built or run a container', 'I write Dockerfiles and run containers regularly'),
         tells='Day 4: container experience.'),
    dict(section='Delivery', area='Delivery', kind='choice',
         text='What is the difference between a container image and a container?',
         options=knowledge('The image is the packaged template; a container is a running copy made from it',
                           'They are two names for the same thing',
                           'The image runs on servers; the container runs on laptops'),
         tells='Day 4: understands images and containers.'),
    dict(section='Delivery', area='Delivery', kind='choice',
         text='How much have you worked with CI/CD pipelines (for example Jenkins, GitHub Actions, GitLab CI, Azure Pipelines)?',
         options=scale('Never heard of them', 'I know they exist but have not used one',
                       'I have read pipeline results or changed a pipeline a little', 'I build and maintain pipelines'),
         tells='Day 5: pipeline experience.'),
    dict(section='Delivery', area='Delivery', kind='choice',
         text='A pipeline runs the automated tests on a proposed change, and one test fails. What should happen?',
         options=knowledge('The change is stopped from reaching the main code until it is fixed',
                           'The change goes live and the test is fixed later',
                           'The pipeline deletes the change'),
         tells='Day 5: understands quality gates.'),
    # ---- Infrastructure and operations (Days 3, 5 and 6)
    dict(section='Infrastructure and operations', area='Infrastructure and operations', kind='choice',
         text='How familiar are you with Infrastructure as Code (for example Terraform, OpenTofu, Ansible, CloudFormation)?',
         options=scale('Never heard of it', 'I know the idea but have not used it',
                       'I have changed or run existing code', 'I write and maintain it'),
         tells='Day 3: Infrastructure as Code experience.'),
    dict(section='Infrastructure and operations', area='Infrastructure and operations', kind='choice',
         text='Which statement best describes Infrastructure as Code?',
         options=knowledge('Servers and environments are described in files, kept in Git, and created by a tool',
                           'Writing application code that runs on servers',
                           'A diagram of the servers in the data centre'),
         tells='Day 3: understands the idea of Infrastructure as Code.'),
    dict(section='Infrastructure and operations', area='Infrastructure and operations', kind='choice',
         text='How much have you worked with Kubernetes or OpenShift?',
         options=scale('Never heard of them', 'I know what they are but have not used them',
                       'I have deployed or looked at applications on a cluster', 'I operate or administer clusters'),
         tells='Day 6: Kubernetes experience.'),
    dict(section='Infrastructure and operations', area='Infrastructure and operations', kind='choice',
         text='A developer writes a database password directly into the application code. What is the main risk?',
         options=knowledge('Anyone who can read the code, now or later, can see and use the password',
                           'The application will run more slowly',
                           'There is no risk if the repository is private'),
         tells='Day 5: security awareness (secrets in code).'),
    dict(section='Infrastructure and operations', area='Infrastructure and operations', kind='choice',
         text='What does a service level objective (SLO) describe?',
         options=knowledge('A measurable reliability target, for example "99.9% of requests succeed each month"',
                           'The list of people who own a service',
                           'The date by which a project must be delivered'),
         tells='Day 6: understands reliability targets.'),
]
assert len(QUESTIONS) == 20 and all(q['kind'] == 'choice' for q in QUESTIONS)
for n, q in enumerate(QUESTIONS, 1):
    q['n'] = n
SCORED = [q for q in QUESTIONS if q.get('area')]
AREAS = ['Foundations', 'Delivery', 'Infrastructure and operations']
MAX = 3 * len(SCORED)

# ------------------------------------------------------------------ styles
FONT = 'Arial'
NAVY, TEAL, PALE, WHITE = '16233A', '0E5E6F', 'EDF2F6', 'FFFFFF'
INPUT = 'FFF7D6'  # pale yellow: cells to fill in
thin = Side(style='thin', color='C9D3DD')
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)

def f(bold=False, color='000000', size=10, italic=False):
    return Font(name=FONT, bold=bold, color=color, size=size, italic=italic)

def header(ws, row, values, widths=None):
    for c, v in enumerate(values, 1):
        cell = ws.cell(row=row, column=c, value=v)
        cell.font = f(True, WHITE)
        cell.fill = PatternFill('solid', fgColor=TEAL)
        cell.alignment = Alignment(wrap_text=True, vertical='center')
        cell.border = BOX
    if widths:
        for c, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(c)].width = w
    ws.freeze_panes = ws.cell(row=row + 1, column=1)

def title(ws, text, sub=None):
    ws['A1'] = text
    ws['A1'].font = f(True, NAVY, 14)
    if sub:
        ws['A2'] = sub
        ws['A2'].font = f(False, '6B7A8F', 10, italic=True)

def body(cell, wrap=True):
    cell.font = f()
    cell.alignment = Alignment(wrap_text=wrap, vertical='top')
    cell.border = BOX

wb = Workbook()

# ------------------------------------------------------------------ Read me
ws = wb.active
ws.title = 'Read me'
title(ws, TITLE, 'Prepared for the SARB FMD programme sponsor and course team')
rows = [
    ('What this is', 'A 20-question pre-course questionnaire, all multiple choice: 5 about the person and 15 scored. The form also records each person\'s e-mail address, so nobody types anything. It places every participant at a starting level, Layman, Intermediate or Advanced, and on a track, Developer, Infrastructure or Business, so the course team can form balanced teams and plan support.'),
    ('How the form is made', 'Open script.google.com, create a new project, paste the whole of create-google-form.gs, and click Run (allow it the first time). It creates the Google Form and a Google Sheet that collects the answers, and prints both links. The answer wording in the form is exactly the wording in the "Scoring key" sheet here.'),
    ('How answers get here', 'In the Google Sheet of responses: File > Download > Comma-separated values. Open the CSV, copy every row below the header, and paste it into the "Responses" sheet of this workbook at cell A3 (replacing the example row). Scores, levels and the summary update by themselves.'),
    ('How scoring works', f'Each of the 15 scored questions gives 0 to 3 points: self-ratings from 0 (never) to 3 (daily use); knowledge checks 3 for the right answer and 0 for a wrong one or "I don\'t know". Maximum {MAX} points. The level comes from the share of points, using the thresholds on the "Settings" sheet.'),
    ('Levels', 'Layman: new to most of these ideas; needs the full beginner support (Start-here guide, paired with a stronger colleague, foundations clinic). Intermediate: knows some tools; follows the labs at normal pace. Advanced: uses several of these tools already; gets stretch tasks and can help others.'),
    ('Sheets', 'Questionnaire: the 20 questions and what each tells us. Scoring key: points per answer. Responses: paste the form answers here. Scores: every participant\'s points, area scores, total and level (formulas, do not type here). Summary: the one page for management. Settings: level thresholds and the role-to-track list.'),
    ('Cells you edit', 'Pale-yellow cells only: the Responses sheet (pasted answers) and the Settings sheet (thresholds, tracks). Every other number is a formula.'),
    ('Example row', 'Responses row 3 is an example, named "EXAMPLE - delete when you paste real answers". It is left out of the Summary counts.'),
]
for i, (k, v) in enumerate(rows, 4):
    ws.cell(row=i, column=1, value=k).font = f(True, NAVY)
    ws.cell(row=i, column=1).alignment = Alignment(vertical='top')
    c = ws.cell(row=i, column=2, value=v)
    c.font = f(); c.alignment = Alignment(wrap_text=True, vertical='top')
ws.column_dimensions['A'].width = 22
ws.column_dimensions['B'].width = 110

# ------------------------------------------------------------------ Questionnaire
ws = wb.create_sheet('Questionnaire')
title(ws, 'The 20 questions', 'Exactly as they appear in the Google Form, in the same order')
header(ws, 4, ['#', 'Section', 'Question', 'Type', 'Answer options', 'Scored', 'Area', 'What it tells the course team'],
       [5, 22, 55, 14, 70, 9, 24, 50])
for i, q in enumerate(QUESTIONS, 5):
    opts = '\n'.join(o for o, _ in q.get('options', []))
    kind = {'text': 'Short answer', 'choice': 'Multiple choice', 'paragraph': 'Paragraph'}[q['kind']]
    for c, v in enumerate([q['n'], q['section'], q['text'], kind, opts or '(free text)',
                           'Yes (0-3)' if q.get('area') else 'No', q.get('area', ''), q['tells']], 1):
        body(ws.cell(row=i, column=c, value=v))

# ------------------------------------------------------------------ Scoring key
ws = wb.create_sheet('Scoring key')
title(ws, 'Scoring key', 'Points for every answer of every scored question. Column A is built by a formula; do not edit it.')
header(ws, 4, ['Lookup key', 'Question #', 'Answer (exactly as in the form)', 'Points', 'Area'], [60, 11, 80, 9, 28])
r = 5
for q in SCORED:
    for opt, pts in q['options']:
        ws.cell(row=r, column=1, value=f'="Q"&B{r}&"|"&C{r}')
        ws.cell(row=r, column=2, value=q['n'])
        ws.cell(row=r, column=3, value=opt)
        ws.cell(row=r, column=4, value=pts)
        ws.cell(row=r, column=5, value=q['area'])
        for c in range(1, 6):
            body(ws.cell(row=r, column=c), wrap=False)
        ws.cell(row=r, column=4).font = f(color='0000FF')
        r += 1
KEY_LAST = r - 1

# ------------------------------------------------------------------ Settings
ws = wb.create_sheet('Settings')
title(ws, 'Settings', 'Pale-yellow cells can be changed; everything else follows')
ws['A4'], ws['B4'], ws['C4'] = 'Level', 'From (share of points)', 'Meaning'
for c in 'ABC':
    ws[f'{c}4'].font = f(True, WHITE); ws[f'{c}4'].fill = PatternFill('solid', fgColor=TEAL)
levels = [('Layman', 0, 'New to most ideas: full beginner support'),
          ('Intermediate', 0.40, 'Knows some tools: normal pace'),
          ('Advanced', 0.75, 'Uses several tools: stretch tasks, helps others')]
for i, (lvl, frm, mean) in enumerate(levels, 5):
    ws.cell(row=i, column=1, value=lvl).font = f(True)
    c = ws.cell(row=i, column=2, value=frm)
    c.number_format = '0%'; c.font = f(color='0000FF'); c.fill = PatternFill('solid', fgColor=INPUT)
    ws.cell(row=i, column=3, value=mean).font = f()
ws['A9'] = 'Assumption: thresholds of 40% and 75% are the course team\'s starting point; adjust after the first cohort.'
ws['A9'].font = f(italic=True, color='6B7A8F')
ws['A11'], ws['B11'] = 'Role (as in the form)', 'Track'
for c in 'AB':
    ws[f'{c}11'].font = f(True, WHITE); ws[f'{c}11'].fill = PatternFill('solid', fgColor=TEAL)
for i, role in enumerate(ROLES, 12):
    ws.cell(row=i, column=1, value=role).font = f()
    c = ws.cell(row=i, column=2, value=TRACKS[role])
    c.font = f(color='0000FF'); c.fill = PatternFill('solid', fgColor=INPUT)
ROLE_LAST = 11 + len(ROLES)
ws.column_dimensions['A'].width = 44; ws.column_dimensions['B'].width = 24; ws.column_dimensions['C'].width = 50
dv = DataValidation(type='list', formula1='"Developer,Infrastructure,Business"', allow_blank=False)
ws.add_data_validation(dv); dv.add(f'B12:B{ROLE_LAST}')
INTER, ADV = "Settings!$B$6", "Settings!$B$7"

# ------------------------------------------------------------------ Responses
ROWS = 80  # room for a large cohort
ws = wb.create_sheet('Responses')
title(ws, 'Responses: paste the Google Form answers here, from cell A3',
      'Same columns as the form\'s response sheet: Timestamp, Email Address, then the 20 questions in order')
cols = ['Timestamp', 'Email Address'] + [f'Q{q["n"]}. {q["text"]}' for q in QUESTIONS]
for c, v in enumerate(cols, 1):
    cell = ws.cell(row=2, column=c, value=v)
    cell.font = f(True, WHITE); cell.fill = PatternFill('solid', fgColor=TEAL)
    cell.alignment = Alignment(wrap_text=True, vertical='top'); cell.border = BOX
    ws.column_dimensions[get_column_letter(c)].width = 18 if c == 1 else 30
ws.row_dimensions[2].height = 90
ws.freeze_panes = 'C3'
# One example row of realistic answers, kept out of the summary by its name.
example = ['2026-11-02 08:15:00', 'EXAMPLE - delete when you paste real answers',
           'Market operations', 'Business or financial markets analyst', 'Less than 2 years', 'A Windows laptop',
           'Hands-on skills I can use in my own work']
for q in SCORED:
    example.append(q['options'][1][0])  # the second option: a little experience, or a wrong answer
example[7] = SCORED[0]['options'][1][0]
example[8] = SCORED[1]['options'][0][0]  # knows ls
for c, v in enumerate(example, 1):
    cell = ws.cell(row=3, column=c, value=v)
    cell.font = f(italic=True, color='6B7A8F')
for r in range(3, 3 + ROWS):
    for c in range(1, len(cols) + 1):
        ws.cell(row=r, column=c).fill = PatternFill('solid', fgColor=INPUT)
        ws.cell(row=r, column=c).border = BOX

def resp_col(n):
    """The Responses column of question n (A: timestamp, B: e-mail address)."""
    return get_column_letter(n + 2)

# ------------------------------------------------------------------ Scores
ws = wb.create_sheet('Scores')
title(ws, 'Scores: worked out from the Responses sheet (formulas: do not type here)')
heads = ['E-mail address', 'FMD area', 'Role', 'Track', 'Years in a technical role'] + [f'Q{q["n"]}' for q in SCORED] \
        + [f'{a} (of {3 * sum(1 for q in SCORED if q["area"] == a)})' for a in AREAS] + [f'Total (of {MAX})', 'Share', 'Level']
header(ws, 3, heads, [34, 24, 34, 15, 22] + [6] * len(SCORED) + [16, 16, 18, 12, 9, 14])
first_q = 6
area_col = {a: first_q + len(SCORED) + i for i, a in enumerate(AREAS)}
tot_col = first_q + len(SCORED) + len(AREAS)
share_col, level_col = tot_col + 1, tot_col + 2
for r in range(4, 4 + ROWS):
    src = r - 1  # Responses row
    L = lambda c: get_column_letter(c)
    ws.cell(row=r, column=1, value=f'=IF(Responses!B{src}="","",Responses!B{src})')
    ws.cell(row=r, column=2, value=f'=IF($A{r}="","",Responses!{resp_col(1)}{src})')
    ws.cell(row=r, column=3, value=f'=IF($A{r}="","",Responses!{resp_col(2)}{src})')
    ws.cell(row=r, column=4, value=f'=IF($A{r}="","",IFERROR(INDEX(Settings!$B$12:$B${ROLE_LAST},MATCH($C{r},Settings!$A$12:$A${ROLE_LAST},0)),"Business"))')
    ws.cell(row=r, column=5, value=f'=IF($A{r}="","",Responses!{resp_col(3)}{src})')
    for i, q in enumerate(SCORED):
        c = first_q + i
        ws.cell(row=r, column=c, value=(
            f'=IF($A{r}="","",IFERROR(INDEX(\'Scoring key\'!$D$5:$D${KEY_LAST},'
            f'MATCH("Q{q["n"]}|"&Responses!{resp_col(q["n"])}{src},\'Scoring key\'!$A$5:$A${KEY_LAST},0)),0))'))
    for a in AREAS:
        cs = [first_q + i for i, q in enumerate(SCORED) if q['area'] == a]
        ws.cell(row=r, column=area_col[a], value=f'=IF($A{r}="","",SUM({L(cs[0])}{r}:{L(cs[-1])}{r}))')
    ws.cell(row=r, column=tot_col, value=f'=IF($A{r}="","",SUM({L(first_q)}{r}:{L(first_q + len(SCORED) - 1)}{r}))')
    c = ws.cell(row=r, column=share_col, value=f'=IF($A{r}="","",{L(tot_col)}{r}/{MAX})')
    c.number_format = '0%'
    ws.cell(row=r, column=level_col, value=f'=IF($A{r}="","",IF({L(share_col)}{r}>={ADV},"Advanced",IF({L(share_col)}{r}>={INTER},"Intermediate","Layman")))')
    for cc in range(1, level_col + 1):
        ws.cell(row=r, column=cc).font = f()
        ws.cell(row=r, column=cc).border = BOX
LEVEL = f'Scores!${get_column_letter(level_col)}$4:${get_column_letter(level_col)}${3 + ROWS}'
TRACK = f'Scores!$D$4:$D${3 + ROWS}'
NAME = f'Scores!$A$4:$A${3 + ROWS}'
SHARE = f'Scores!${get_column_letter(share_col)}$4:${get_column_letter(share_col)}${3 + ROWS}'
lvl_range = f'{get_column_letter(level_col)}4:{get_column_letter(level_col)}{3 + ROWS}'
for text, color in [('Layman', 'FCE4D6'), ('Intermediate', 'FFF2CC'), ('Advanced', 'E2EFDA')]:
    ws.conditional_formatting.add(lvl_range, CellIsRule(operator='equal', formula=[f'"{text}"'], fill=PatternFill('solid', fgColor=color)))

# ------------------------------------------------------------------ Summary
ws = wb.create_sheet('Summary', 1)
title(ws, 'Pre-course readiness: summary for management', 'Counts leave out the example row. Everything here is a formula.')
NOT_EX = f'{NAME},"<>EXAMPLE*"'
ws['A4'] = 'Participants who answered'
ws['B4'] = f'=COUNTIFS({NAME},"?*",{NAME},"<>EXAMPLE*")'
ws['A5'] = 'Average share of points'
ws['B5'] = f'=IFERROR(AVERAGEIFS({SHARE},{NAME},"?*",{NAME},"<>EXAMPLE*"),0)'
ws['B5'].number_format = '0%'
for a in ('A4', 'A5'):
    ws[a].font = f(True, NAVY, 11)
for b in ('B4', 'B5'):
    ws[b].font = f(True, NAVY, 14)

# Level by track
ws['A7'] = 'Participants by starting level and track'
ws['A7'].font = f(True, NAVY, 12)
tracks = ['Developer', 'Infrastructure', 'Business']
levels_n = ['Layman', 'Intermediate', 'Advanced']
for c, v in enumerate(['Level'] + tracks + ['Total', 'Share'], 1):
    cell = ws.cell(row=8, column=c, value=v)
    cell.font = f(True, WHITE); cell.fill = PatternFill('solid', fgColor=TEAL); cell.border = BOX
for i, lvl in enumerate(levels_n, 9):
    ws.cell(row=i, column=1, value=lvl).font = f(True)
    for j, t in enumerate(tracks, 2):
        ws.cell(row=i, column=j, value=f'=COUNTIFS({LEVEL},$A{i},{TRACK},{get_column_letter(j)}$8,{NOT_EX})')
    ws.cell(row=i, column=5, value=f'=SUM(B{i}:D{i})')
    c = ws.cell(row=i, column=6, value=f'=IF($B$4=0,0,E{i}/$B$4)'); c.number_format = '0%'
    for j in range(1, 7):
        ws.cell(row=i, column=j).border = BOX
        if j > 1: ws.cell(row=i, column=j).font = f()
ws.cell(row=12, column=1, value='Total').font = f(True)
for j in range(2, 6):
    ws.cell(row=12, column=j, value=f'=SUM({get_column_letter(j)}9:{get_column_letter(j)}11)').font = f(True)
    ws.cell(row=12, column=j).border = BOX
ws.cell(row=12, column=1).border = BOX

# Average share per area, per track
ws['A15'] = 'Where the group starts: average share of points per area'
ws['A15'].font = f(True, NAVY, 12)
for c, v in enumerate(['Area'] + tracks + ['Everyone'], 1):
    cell = ws.cell(row=16, column=c, value=v)
    cell.font = f(True, WHITE); cell.fill = PatternFill('solid', fgColor=TEAL); cell.border = BOX
for i, a in enumerate(AREAS, 17):
    col = get_column_letter(area_col[a])
    rng = f'Scores!${col}$4:${col}${3 + ROWS}'
    amax = 3 * sum(1 for q in SCORED if q['area'] == a)
    ws.cell(row=i, column=1, value=a).font = f(True)
    for j, t in enumerate(tracks, 2):
        c = ws.cell(row=i, column=j, value=f'=IFERROR(AVERAGEIFS({rng},{TRACK},"{t}",{NOT_EX})/{amax},"-")')
        c.number_format = '0%'; c.font = f()
    c = ws.cell(row=i, column=5, value=f'=IFERROR(AVERAGEIFS({rng},{NAME},"?*",{NOT_EX})/{amax},"-")')
    c.number_format = '0%'; c.font = f()
    for j in range(1, 6):
        ws.cell(row=i, column=j).border = BOX

# What it means for the course
ws['A22'] = 'What this means for the course'
ws['A22'].font = f(True, NAVY, 12)
notes = [
    ('Layman participants', '=B9+C9+D9', 'Read the Start-here guide before Day 1; sit with an Intermediate or Advanced colleague; daily 16:30 foundations clinic.'),
    ('Intermediate participants', '=B10+C10+D10', 'Follow the labs at the normal pace.'),
    ('Advanced participants', '=B11+C11+D11', 'Stretch tasks in every lab; act as pair partners for Layman colleagues.'),
    ('Teams of 4 to 5', '=IF(B4=0,0,ROUNDUP(B4/5,0))', 'Mix levels and tracks: at least one Intermediate or Advanced per team.'),
]
for i, (k, frm, note) in enumerate(notes, 23):
    ws.cell(row=i, column=1, value=k).font = f(True)
    ws.cell(row=i, column=2, value=frm).font = f(True, NAVY)
    c = ws.cell(row=i, column=3, value=note); c.font = f(); c.alignment = Alignment(wrap_text=True, vertical='top')
    ws.merge_cells(start_row=i, start_column=3, end_row=i, end_column=6)
    ws.row_dimensions[i].height = 30
ws.column_dimensions['A'].width = 34
for col in 'BCDEF':
    ws.column_dimensions[col].width = 16

chart = BarChart()
chart.type = 'col'; chart.grouping = 'stacked'; chart.overlap = 100
chart.title = 'Starting level by track'
chart.y_axis.title = 'Participants'
data = Reference(ws, min_col=2, max_col=4, min_row=8, max_row=11)
cats = Reference(ws, min_col=1, min_row=9, max_row=11)
chart.add_data(data, titles_from_data=True); chart.set_categories(cats)
chart.height, chart.width = 7.5, 14
ws.add_chart(chart, 'H4')

wb.move_sheet('Read me', -wb.index(wb['Read me']))
out = HERE / 'precourse-questionnaire.xlsx'
wb.save(out)
print('wrote', out.name)

# ------------------------------------------------------------------ Google Apps Script
items = []
for q in QUESTIONS:
    items.append({'section': q['section'], 'text': q['text'], 'kind': q['kind'],
                  'options': [o for o, _ in q.get('options', [])]})
gs = f'''/**
 * Creates the pre-course questionnaire as a Google Form, with a Google Sheet that
 * collects the answers. Generated by build.py: the answer wording matches the
 * scoring key in precourse-questionnaire.xlsx exactly, so do not edit answers here.
 *
 * How to use (5 minutes):
 *   1. Go to https://script.google.com and click New project.
 *   2. Delete the empty function, paste this whole file, and click Save.
 *   3. Choose createQuestionnaire in the list at the top and click Run.
 *      The first time, Google asks for permission to create forms and sheets: allow it.
 *   4. Open View > Logs (or the Execution log): it shows the link to send to
 *      participants, the link to edit the form, and the link to the answers sheet.
 */
const TITLE = {json.dumps(TITLE)};
const INTRO = {json.dumps(INTRO)};
const QUESTIONS = {json.dumps(items, indent=2)};

function createQuestionnaire() {{
  const form = FormApp.create(TITLE)
    .setDescription(INTRO)
    .setCollectEmail(true)
    .setProgressBar(true)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage('Thank you. Your answers help us start the course at the right level for you.');
  let section = null;
  QUESTIONS.forEach(function (q, i) {{
    if (q.section !== section) {{
      if (section !== null) form.addPageBreakItem().setTitle(q.section);
      section = q.section;
    }}
    const label = (i + 1) + '. ' + q.text;
    const item = form.addMultipleChoiceItem().setTitle(label).setRequired(true);
    item.setChoices(q.options.map(function (o) {{ return item.createChoice(o); }}));
  }});
  const sheet = SpreadsheetApp.create(TITLE + ' (responses)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  Logger.log('Send this link to participants: ' + form.getPublishedUrl());
  Logger.log('Edit the form: ' + form.getEditUrl());
  Logger.log('Answers arrive in: ' + sheet.getUrl());
}}
'''
(HERE / 'create-google-form.gs').write_text(gs)
print('wrote create-google-form.gs')
