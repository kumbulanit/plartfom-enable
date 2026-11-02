# Start here: your first time at a terminal

This page is for you if you have never typed a command into a computer. Read it once before Day 1: it takes about 15 minutes. You do not have to remember it. Come back to it whenever something feels strange.

Everything this week is done by following the handbook step by step. You will not have to invent a command: you copy it from the handbook, paste it, press Enter, and compare what you get with what the handbook shows. Understanding comes from doing it and reading the short explanations under each step.

## 1. Your workspace: a computer in your browser

For this week you have your own small Linux computer, called your **workspace**. It runs on the lab server, and you use it through your web browser, like a website. Nothing is installed on your laptop.

Open it at `https://studentNN.<lab domain>` (your user name, for example student07, replaces studentNN; the address and your password are in your logins file, /etc/pelab/logins.md on your VM: your instructor shows you how to open it). It looks like this:

```
+----------------------+------------------------------------------+
| EXPLORER (your files)|  EDITOR: the file you clicked on         |
|  > day1              |                                          |
|  > hello             |  1  GREETING = "Hello"                   |
|                      |  2  ...                                  |
+----------------------+------------------------------------------+
| TERMINAL                                              [+]  [bin] |
| student07@student07:~$ _                                         |
+-----------------------------------------------------------------+
```

- **Left, the Explorer:** your folders and files, like the left side of Windows Explorer or the Mac Finder. Click a file to open it.
- **Top right, the Editor:** where an open file is shown and changed, like Notepad or Word. Save with Ctrl+S (on a Mac Cmd+S).
- **Bottom, the Terminal:** where you type commands. If you do not see it: click the menu ☰ at the top left, then Terminal, then New Terminal.

## 2. What a terminal is

A terminal is a conversation in text with the computer. You type an instruction (a **command**), press Enter, and the computer writes its answer underneath. Then it shows the prompt again, which means "I am ready for the next one".

It is the same computer you could click around in, but typing is faster, exact, and easy to repeat: every engineer at the bank uses one, and this week so will you.

## 3. The prompt: who you are and where you are

The line with the blinking cursor is the **prompt**. It tells you three things:

```
student07@student07:~/day1$
```

| Part | Means |
| --- | --- |
| student07 (first) | who you are: your user name |
| @student07 | which computer: your workspace |
| ~/day1 | which folder you are in. ~ is short for your home folder, /home/student07 |
| $ | "ready: type a command" |

Always glance at the folder part before you paste: many steps say "in the hello folder", and the prompt shows whether you are there.

## 4. What a command looks like

A command is a short sentence for the computer. Its parts are separated by spaces:

```
ls  -la  ~/day1
```

| Part | Example | Like in a sentence |
| --- | --- | --- |
| the command | ls ("list") | the verb: what to do |
| options | -la ("long, and all") | how to do it |
| what it acts on | ~/day1 | the object: on what |

Two rules: **spaces matter** (`ls -la` is not `ls-la`), and **capitals matter** (`ls` works, `LS` does not).

## 5. Copy, paste, press Enter

Every command in the handbook is in a grey box. To run it:

1. Move the mouse over the grey box: a copy button appears at its top right. Click it.
2. Click once inside the terminal, so the cursor blinks there.
3. Paste: Ctrl+V (on a Mac Cmd+V), or right-click and choose Paste. If the browser asks whether the page may paste, choose Allow.
4. Press Enter.

You may paste a whole box at once: its lines run one after the other.

## 6. How to tell a command has finished

**The prompt comes back.** That is the signal. Most commands finish in a second.

A few commands keep running on purpose: a service you start, or a screen that keeps updating. The prompt does not come back while they run. That is normal, and the handbook warns you each time. To stop one, click in that terminal and press **Ctrl+C** (on a Mac also Ctrl+C, not Cmd). For a scrolling viewer, press **q**.

## 7. "Nothing happened" usually means "it worked"

Linux is quiet. When a command succeeds, it often prints nothing at all and simply gives you the prompt back. Only problems talk. For example, making a folder prints nothing; to see it, you list the folder with `ls`. The handbook always tells you whether to expect nothing or something.

## 8. How to read the handbook

Every step has the same parts, always in this order:

| You see | What it is | What you do |
| --- | --- | --- |
| **In plain words** | the step in one sentence | read it first |
| **Why** | why the step matters at work | read it |
| **Do this** | numbered actions | do them in order |
| grey box with a copy button | a command | copy, paste, Enter |
| **You should see** and a plain box under it | what appears on your screen | compare, do not paste |
| **What each line does** | each command explained | read it to understand |
| **If you see something else** | the usual problems and their fix | use it when stuck |
| **Check before you go on** | how you know the step worked | check, then go to the next step |

**Your screen will differ a little** from the boxes: your user name, team, dates, numbers and ids (such as 6514a43) are your own. What should match is the shape: the same kind of lines, the same words.

**$ME, $TEAM and $DOMAIN** in a command are filled in by your workspace with your user name, your team and the lab address. Never type over them; paste them as they are.

**studentNN and teamNN** in the text (not in a command) mean your own: for example student07 and team03. Replace them when you type an address into the browser.

## 9. Keys that save you

| Key | What it does |
| --- | --- |
| Ctrl+C (in the terminal) | stop the command that is running |
| q | leave a viewer (top, less, a long status page) |
| Arrow up | bring back the previous command, to run it again |
| Tab | finish a file or folder name for you: type the start, press Tab |
| clear, then Enter | wipe the terminal screen (nothing is lost) |
| Ctrl+S (on a Mac Cmd+S) | save the file open in the editor |

To copy text **out of** the terminal (an error to send the instructor, a message for your notes): select it with the mouse, then right-click and choose Copy.

## 10. When something goes wrong

1. **Read the last lines** the terminal printed: an error usually says what is wrong in plain English ("No such file or directory", "Permission denied").
2. **Look at the step's "If you see something else"**: the common problems are listed there with their fix.
3. **Check the folder in your prompt**: most problems are "right command, wrong folder".
4. **Paste the box again**: almost every step is safe to repeat.
5. **Ask your neighbour, then the instructor.** Nothing you do in your workspace can break anything for anyone else, and your workspace can be reset in a minute.

## 11. Try it: your first three commands (5 minutes)

Open a terminal and paste these one at a time. Each answers a question.

Who am I?

```bash
whoami
```

You should see your own user name:

```
student07
```

Where am I? (pwd means "print working directory": the folder you are in.)

```bash
pwd
```

You should see your home folder:

```
/home/student07
```

What is the date and time on this computer?

```bash
date
```

You should see today's date and time (the lab server uses UTC, two hours behind South Africa):

```
Thu Oct 29 14:32:10 UTC 2026
```

Now press the **arrow up** key: `date` comes back. Press Enter to run it again; the seconds have moved on. You have just used the terminal the way engineers do all day.

## 12. Words

New words are explained at the start of every lab, under "Words you will meet". All of them are also in the [glossary](glossary.md).

---

[Contents](README.md) · [Day 1](day1/README.md)
