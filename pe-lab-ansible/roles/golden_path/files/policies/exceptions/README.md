# Exceptions

Sometimes a team has a good reason to break a guardrail for a short time. This
folder is how it asks.

1. Copy `examples/exception-template.yaml` to `exceptions/<team>-<what>.yaml`.
2. Fill in every value marked `CHANGE`:
   - **who** asked (`pelab.io/requested-by`),
   - **why** the golden path cannot be used (`pelab.io/reason`),
   - **until when** (`pelab.io/expires`, at most 30 days ahead; to end one early, set it to yesterday in a pull request),
   - **which rule** (`spec.exceptions`) and **which workload** in **which team
     namespace** (`spec.match`).
3. Open a pull request. The pipeline checks the request (`tests/check-exceptions.py`)
   and runs the policy tests.
4. The platform team reviews and approves it. Once it is merged, the platform
   applies it within two minutes: the commit shows a green `platform/apply` status.
5. After the expiry date the platform removes it on its own, and the guardrail
   applies again. Delete the file when you no longer need it.

An exception without an end date would be a change to the rule. That needs its
own pull request to the policy, not an exception.

Exceptions only count in the `pelab-exceptions` namespace, which only the
platform can write to. An exception created anywhere else is ignored.
