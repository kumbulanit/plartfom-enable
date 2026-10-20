# Course decks

One PowerPoint deck per day of the Platform Engineering Capability Development
Programme. The slides are generated from `src/`, so a change to wording, a lab step
or the colour scheme is made once in the content files and rebuilt.

| File | Slides |
| --- | --- |
| Day1-Platform-engineering-and-Linux-basics.pptx | 19 |
| Day2-Git-and-working-together.pptx | 18 |
| Day3-Infrastructure-as-Code.pptx | 16 |
| Day4-Containers-and-the-packaging-template.pptx | 17 |
| Day5-CICD-testing-and-security.pptx | 20 |
| Day6-Deploy-observe-and-the-capstone.pptx | 21 |

Every slide has speaker notes with the detailed explanation; the slide itself keeps
to the idea, what it looks like in the lab, and the steps. Lab slides show
`<lab domain>` where the real lab domain goes: search and replace it in
`src/content/day*.js` (the `DOMAIN` constant at the top of each file) before the
course.

## Rebuild

Needs Node 20 and the npm packages `pptxgenjs`, `react`, `react-dom`, `react-icons`
and `sharp` on `NODE_PATH`, plus the `apply_theme.js` script from the Claude pptx
skill (set `PPTX_SKILL_DIR` to that skill's folder).

```bash
cd src && node build.js        # all days
cd src && node build.js 3 5    # only some days
cd src && node handbook.js     # the delegate handbook and the instructor notes
```

`handbook.js` writes the delegate handbook into
`pe-lab-ansible/roles/golden_path/files/handbook/` (the lab build seeds it into Gitea
as `platform/handbook`) and the day guides and lab check-off sheet into `../instructor/`.
Each lab's full step-by-step version (where, why, the commands to paste, what to
expect) is in `src/content/labs/dayN.js`; the slides show the short version of the
same steps, and `handbook.js` stops if the two disagree on a lab's steps. How to run
each day (timetable, the instructor's own actions and commands) is in
`src/content/facilitate.js`. "If you are stuck" tips are in `src/content/stuck.js`,
the glossary in `src/content/glossary.js`.

## Layout

- `src/lib.js`: the theme (navy, teal, green), the three slide layouts and the slide
  types (concept, steps, flow, code, table, compare, scenarios, quiz, recap, diagram).
- `src/content/dayN.js`: the slides of each day as data.
- `src/content/labs/dayN.js`: every lab step by step, for the handbook.
- `src/content/facilitate.js`: how to run each day, for the instructor guides.
- `src/build.js`: builds the decks into this folder.
- `src/handbook.js`: builds the handbook and the instructor notes from the same content.
