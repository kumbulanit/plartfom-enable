# The lab's passwords

Every machine built from this repository uses these files, so every lab has the
same passwords. Your own login (`student01`) and the others you use in the labs
are printed by `cat /etc/pelab/logins.md` on the machine.

- `delegates/`: the random part of `student01`'s, `reviewer`'s and
  `platform-approver`'s passwords (the build turns each into `Lab-xxxx-xxxx-1234`).
- The other files: the administrator and service passwords, used by the platform.

To change a password, change its file before the build. These are lab-only
passwords: never use them anywhere else.
