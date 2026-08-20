# Handoff — Aahil Shaikh's portfolio: React/Motion rework via Subagent-Driven Development — 2026-08-18

## §0 — Orientation (read this first, always)

### Mission
Rebuild Aahil Shaikh's portfolio (`the007programmer.github.io`) off its current zero-build vanilla HTML/CSS/JS stack onto Vite + React + TypeScript + Tailwind CSS v4, so it can use KokonutUI components, Bklit UI charts, and Motion animation instead of hand-rolled everything. The user's own words: **"we're gonna rework my portfolio to make it more appealing"** and, when asked how much motion, **"yea i want crazy transitions and anims."** This reverses a documented decision from an earlier rewrite (zero-build was previously a deliberate, considered choice) — that reversal was asked and answered explicitly, not drifted into: the user was offered "hand-build in vanilla, reference only" vs. "introduce a build step" and chose the build step.

The work is being executed via the **`superpowers:subagent-driven-development`** skill: a controller (you, in the new session) dispatches one fresh implementer subagent per plan task, then a fresh reviewer subagent, iterates a fix loop on findings, and moves to the next task. This is NOT paused because of a technical blocker — it was paused by the user purely to control Claude API cost ("this is using like 77 bucks in usage credits"). The work itself is going well; every task so far has passed review (some after real, substantive fix rounds).

### Project root, stack, how to run
- **Main repo root:** `/home/t007p/Documents/Code/the007programmer.github.io` — branch `agent-field` (the pre-rework state; still has the OLD vanilla site live in it, plus an unrelated in-progress ambient "agent field" flocking-canvas feature that was mid-build on this branch before the rework started).
- **Work happens in an isolated git worktree:** `/home/t007p/Documents/Code/the007programmer.github.io/.worktrees/portfolio-react-rework`, on branch `portfolio-react-rework`, cut from `agent-field` @ `fe2fcd2`. **Always `cd` into the worktree, not the main repo root, to do any of this work.** The worktree directory is gitignored (`.gitignore` line added this session) so it won't accidentally get committed into the main tree.
- **Stack in the worktree:** Vite 5 + React 18 + TypeScript 5 (strict) + Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first `@theme` in `src/index.css`) + shadcn/ui (component base) + KokonutUI (cards/buttons) + Bklit UI (charts) + Motion (`motion/react`) + Vitest + React Testing Library.
- **Run:** `cd .worktrees/portfolio-react-rework && npm install && npm run dev` (Vite dev server). `npm run test` = `vitest run`. `npm run build` = `tsc -b --noEmit && vite build`. Node v26.7.0 / npm 11.19.0 confirmed working in this worktree as of this session.
- **Deploy target (not yet built — Task 17):** GitHub Actions → GitHub Pages, replacing the current "deploy from branch" Pages setting. That settings flip is a live production change and must be flagged to the user before executing, even though the plan resolves that Claude does it (see §1's Task 17 notes).

### Current overall status
- **Tasks 1–13 of a 17-task plan are fully implemented AND reviewed clean.** 39 commits on `portfolio-react-rework` as of this handoff (head: `533981f`). (Task 13's review landed moments after this handoff was first drafted — approved, zero Critical/Important findings, ledger already updated.)
- **Tasks 14–17 have not been started.**
- **The final whole-branch review has not run.**
- One **real design decision surfaced mid-implementation that the user has not yet weighed in on**: Task 12 (Work section) had to change from the planned 3-column grid to a single-column list because Motion's drag-reorder primitive is verified-incompatible with 2D grid reflow. See §2.
- The font-pairing dev switcher (Task 5) substituted real fonts for 3 of 4 named pairings because the plan named non-existent Google Fonts — this substitution needs to be **locked in** (or overridden) by the user at Task 16. See §2.

### Segment map
| Segment | Hand this to a session if you need to… |
|---|---|
| §1 | …continue the SDD implementation run itself: check Task 13's review, then drive Tasks 14→17 and the final review to completion |
| §2 | …get the user's answer on the two open design decisions (Work section layout; font pairing pick) — no coding required, just needs a human answer, can run in parallel with §1 for everything except actually finishing Task 16 |

**All sessions:** run your segment's Bootstrap block first (it joins board `handoff-2026-08-18-portfolio-react-rework` and claims your files); coordinate via `mboard ps|inbox|send`.

**Mboard board:** `MBOARD_BOARD=handoff-2026-08-18-portfolio-react-rework`

> **mboard is on PATH via `~/.claude/mboard/mboard`** (a symlink into a Homebrew-managed `clair` package). Confirmed present. Full path works without any extra setup.

### Global conventions, constraints, and hard-won gotchas

1. **This is a live SDD run — do not restart it from scratch.** Re-invoke the skill (`superpowers:subagent-driven-development`) with the plan file path (`docs/superpowers/plans/2026-08-18-portfolio-visual-rework.md`, readable from either the main repo or the worktree — it's committed). The skill's own setup logic reads the ledger at `.superpowers/sdd/2026-08-18-portfolio-visual-rework/progress.md` **inside the worktree** and resumes at the first task without a `Task N: complete` line. Do not re-run Tasks 1–12. Task 13 needs its review checked/dispatched-if-missing before being marked complete.
2. **Spawned reviewer subagents in this harness do not reliably return their final message to the controller's context.** Across this entire session, "Your final message is the report itself" (the literal instruction in the skill's own `task-reviewer-prompt.md`/`re-review-prompt.md` templates) did NOT work — the controller only ever received `idle_notification` events with no content. The fix that worked every time: **explicitly instruct every reviewer/re-reviewer dispatch to write its complete report to a named file** (e.g. `.superpowers/sdd/.../task-N-review.md`) and reply with just the word "written", then `Read` that file directly. Implementer dispatches did NOT have this problem — their final "Status: DONE, commits: ..., report file: ..." summaries usually came through fine as message content, though occasionally you still needed to check the report file / git log directly when only an empty `idle_notification` arrived. **When resuming: keep using the write-to-file pattern for every reviewer/re-reviewer dispatch. Don't waste turns re-relying on the plain-message template.**
3. **No `TodoWrite` tool exists in this harness.** The ledger (`progress.md`) is the only progress tracker — keep it meticulously updated after every task/fix-round, per the skill's own instructions. This handoff's accuracy depends entirely on that ledger being current, which it is as of `533981f`.
4. **Model selection actually used this session** (per the skill's own guidance, applied): `haiku` for pure-transcription tasks with complete code given and no research needed (Tasks 1, 2, 6). `sonnet` for everything else — anything touching live web research (installing KokonutUI/Bklit UI from their real registries), Motion API judgment calls, or content-accuracy verification. No task needed `opus`-tier. Reviewers were `sonnet` throughout except cheap scoped re-reviews of small, mechanical fix diffs (`haiku`, e.g. Task 1's fix-round re-review, Task 3's fix-round re-review).
5. **The plan itself had several small defects, found and correctly handled during implementation — do not "fix" these again, they're already resolved:**
   - Task 7's ported agent-field text-repulsor selectors expected `.card-title`/`.card-desc`/`.topbar` classNames that Tasks 3 and 9's *planned* code (as originally written in the plan doc) didn't actually emit. **Caught and fixed in the plan text itself during pre-flight review**, before any task was dispatched — see the plan file's own git history (commit `be58afb`, "pre-flight fixes"). Confirmed present in the final Topbar/ProjectCard code.
   - Multiple tasks (6, 7, 10, 11) hit **curly-vs-straight-apostrophe mismatches** between the plan's prose/test blocks and its code blocks (e.g. brief said `&rsquo;` in copy but a test regex expected a straight `'`, or vice versa). Every time, the correct resolution (applied consistently) was: **keep the real rendered copy exact, fix the test to match the copy** — never the reverse. If you see this pattern again in Tasks 14–17, apply the same rule.
   - Task 6's brief-supplied `TIMELINE_NODES` array wasn't internally chronological (the `tamu` node was out of date-order) — implementer caught it and reordered the array without touching any field's actual values. Already fixed in `801a954`.
   - Task 5's brief named 3 fonts (`Switzer`, `Vanguard`, `Athelas`) that are not real Google Fonts families (only `Tempting` had been flagged as uncertain in the plan text; the other two weren't). Verified via live HTTP checks by both the implementer and the reviewer independently. Substituted real fonts — this is an **open decision for the user**, see §2.
6. **Privacy/content rules carry over unchanged and were verified, not just assumed:** no home address, no phone number, "Bay Area" never "Dublin, CA", MAGI (a private multi-agent project) named only by what it does — no hostnames, VPN topology, ports, or filesystem paths — and MAGI's AI-detection-evasion feature stays excluded from the site entirely. Task 6's review cross-checked the ported `MAGI` description in `src/data/work.ts` against these rules explicitly and found no violations. If Tasks 14–17 touch any more content, keep verifying this.
7. **Content is a verbatim port — do not paraphrase anything.** Every data file (`src/data/*.ts`) and every section component's inline copy (Hero, Contact) was cross-checked word-for-word, entity-for-entity against the OLD site's real content, recoverable via `git show agent-field:index.html` (the working tree's own `index.html` was overwritten by Vite's entry point in Task 1 — the *old* content only survives in git history and in `assets/src/script.js`, which is still present in the worktree until Task 16 deletes it).
8. **Every task review independently re-verifies the implementer's claims against actual source** — this was a deliberate, effective practice throughout (e.g. Task 4's review traced Bklit UI's actual vendored source rather than trusting "type-only fix" claims; Task 11's review traced Bklit's `LineChart`/`Grid`/`XAxis` source to confirm a Bklit-integration-was-a-bad-fit claim; Task 12's *three* re-reviews each independently traced Motion's actual installed source for a scheduler-timing claim). **Keep doing this for Tasks 14–17** — it caught real bugs every single time it was applied rigorously, and almost every task had at least one non-trivial finding.
9. **`npm run build` (`tsc -b --noEmit && vite build`) must stay green.** It broke once (Task 4, installing Bklit UI's vendored charts introduced 18 real tsc errors from a Motion `Transition`-type mismatch) and was fixed with a scoped, verified type-only patch (no `motion` version bump) rather than expanding scope. Task 17's GitHub Actions workflow runs exactly this command — a broken build blocks deploy.
10. **Task right-sizing / review discipline that worked well and should continue:** every task got (a) an implementer dispatch with the task-brief file path (never paste the whole plan into a dispatch — `scripts/task-brief` extracts just that task's text), (b) a review dispatch with a generated diff-package file, global constraints copied inline, and explicit "do not trust the report, verify against the diff/source" instructions, (c) a fix loop when Important/Critical findings surfaced, capped at 5 rounds (rounds 1–3 resume the same implementer; rounds 4–5 would escalate to a fresh implementer on a more capable model — never actually needed this escalation, the deepest chain was Task 12's 3 rounds, all resolved by round 3).

---

## §1 — Continue the SDD implementation run (Tasks 13→17 + final review)

Status: **in-progress**
Depends on: none (this is the main thread)

```bash
# Bootstrap (run first) — joins the shared Mboard board and stakes this segment's territory
export MBOARD_BOARD=handoff-2026-08-18-portfolio-react-rework
mboard join --board handoff-2026-08-18-portfolio-react-rework        # idempotent
mboard claim 'docs/superpowers/plans/2026-08-18-portfolio-visual-rework.md' \
             '.worktrees/portfolio-react-rework/**' \
             --note "§1 continuing SDD implementation, Tasks 13-17 + final review"
mboard ps
cd /home/t007p/Documents/Code/the007programmer.github.io/.worktrees/portfolio-react-rework
```

### Goal
Finish executing the 17-task implementation plan for the portfolio rework, using the `superpowers:subagent-driven-development` process exactly as it's been run so far (fresh implementer subagent per task, fresh reviewer subagent, fix loop on findings, ledger updated after every step). End state: all 17 tasks complete and reviewed, final whole-branch review clean, ready to hand to `superpowers:finishing-a-development-branch`.

### Context & decisions
See §0's "Global conventions" — all of it applies here. The single most important operational lesson: **reviewer subagents must be told to write their report to a file**, or their verdict never reaches you. Every dispatch prompt used in this session (visible in this session's own transcript, not reproduced here since the plan/skill templates already capture the shape) followed the pattern:
1. Run `scripts/task-brief PLAN_FILE N` (from `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills/subagent-driven-development/scripts/`) → get brief path.
2. Dispatch implementer (Agent tool, `subagent_type: general-purpose`, explicit `model:`) with: one-line context, brief path ("read this first"), any cross-task interface info the brief can't know (e.g. Task 4's discovered Bklit UI prop shapes, needed verbatim by Task 11's dispatch), report-file path, and the standard "you do not dispatch subagents" / self-review / report-format instructions from `implementer-prompt.md`.
3. On DONE: run `scripts/review-package PLAN_FILE BASE HEAD` (BASE = commit recorded *before* dispatching the implementer, never `HEAD~1`) → get diff-package path.
4. Dispatch reviewer with: brief path, report path, diff-package path, global constraints relevant to *that* task copied inline, and — critically — **explicit instructions to write the full report to a named file** and reply with just "written".
5. Read that file directly (not via SendMessage round-trips — those often only surfaced empty `idle_notification`s).
6. If Critical/Important findings: resume the *same* implementer subagent via `SendMessage` (works reliably in this harness — implementers responded correctly to resumption every time), with the finding(s) verbatim and explicit fix-verification instructions. Re-review via a fresh scoped-re-review dispatch, same write-to-file pattern.
7. Update the ledger (`progress.md`) with a `Task N: complete (commits X..Y, ...)` line (or a fix-round line if not yet closed) in the *same* message as any other bookkeeping.

**Every task from 1–12 is closed exactly this way** — read the ledger (`​.superpowers/sdd/2026-08-18-portfolio-visual-rework/progress.md`) for the full blow-by-blow of every finding and how it was resolved; it's long (320 lines) but it's the authoritative record and is written in enough detail to avoid re-deriving anything.

**Two things worth knowing before you dispatch Task 14+:**
- The plan (`docs/superpowers/plans/2026-08-18-portfolio-visual-rework.md`) is 2945 lines and self-contained — every task has complete, copy-pasteable code in its own section. Don't paste the whole file into a dispatch; always use `task-brief` to extract just the task.
- The design spec it argues from is `docs/superpowers/specs/2026-08-18-portfolio-visual-rework-design.md` (214 lines) — read this once if you want the "why" behind the plan's architecture choices (Approach B: evolve the existing red/paper/slate identity rather than a full instrument-panel pivot; KokonutUI/Bklit UI as re-themed pattern references, not black-box deps; the timeline-chart-replaces-force-graph decision; the agent-field-must-be-ported-not-dropped decision).

### Files & key locations
- **Plan:** `docs/superpowers/plans/2026-08-18-portfolio-visual-rework.md`
- **Spec:** `docs/superpowers/specs/2026-08-18-portfolio-visual-rework-design.md`
- **Ledger (the single most important file to read first):** `.worktrees/portfolio-react-rework/.superpowers/sdd/2026-08-18-portfolio-visual-rework/progress.md` — ends with an explicit "PAUSED HERE" section naming exactly what's done and what's next.
- **SDD skill + scripts:** `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills/subagent-driven-development/` (SKILL.md, implementer-prompt.md, task-reviewer-prompt.md, re-review-prompt.md, scripts/{sdd-workspace,task-brief,review-package}).
- **All application source:** `.worktrees/portfolio-react-rework/src/**` (full listing captured in this handoff's Appendix — 90+ files, don't re-list here, just `find src -type f` if you need a fresh count).

### State: done / in-flight / not-started

**Done (reviewed clean, nothing to redo):**
- Task 1 — Vite/React/TS scaffold, palette tokens, `contrastRatio()` utility. (1 fix round: `index.html` wasn't cleanly replaced on first attempt — fixed.)
- Task 2 — shadcn/ui base, Motion, `useReducedMotionGate()` hook (the single reduced-motion gate every later task uses).
- Task 3 — KokonutUI `mouse-effect-card` + `particle-button` installed under `src/components/kokonutui/`, wrapped as `src/components/kit/ProjectCard.tsx` + `ActionButton.tsx`. (1 fix round: missing contrast tests for 2 new color pairings.)
- Task 4 — Bklit UI `line-chart` (pulls in `Grid`/`XAxis`/`ChartTooltip`/`chart-context`) installed under `src/components/charts/`. (1 controller-directed fix before review: `npm run build` was broken by 18 real tsc errors in vendored files, fixed with a scoped type-only patch, no `motion` version bump.) **Exact exported prop shapes for `LineChart`/`Line`/`Grid`/`XAxis`/`ChartTooltip` are recorded in the ledger's Task 4 section and in `task-4-report.md` — load-bearing, already consumed by Task 11.**
- Task 5 — dev-only `?font=` switcher, all 4 pairings loaded (3 substituted for non-existent Google Fonts — see §2).
- Task 6 — `src/data/{timeline,work,path,toolkit}.ts`, verbatim content port, zero review findings.
- Task 7 — `src/lib/agentField.ts` (physics ported verbatim from `assets/src/field.js`) + `src/components/effects/AgentField.tsx` (new canvas rAF renderer — old vanilla site never actually wired the tested physics to a draw loop).
- Task 8 — `src/components/effects/CursorEffect.tsx`, site-wide cursor glow, `useMotionTemplate` fallback (the plan's literal `--cx`/`--cy` CSS-custom-property approach didn't type-check against installed `@types/react`).
- Task 9 — `src/components/layout/{Topbar,Footer}.tsx`.
- Task 10 — `src/components/sections/Hero.tsx`.
- Task 11 — `src/components/sections/Timeline.tsx` — the new causal-timeline chart replacing the old force-simulated graph. Made a real, source-verified attempt to use Bklit UI's chart primitives (Step 5 of the brief); confirmed via independent source-tracing that `LineChart`/`Grid`/`XAxis` are architecturally incompatible with this task's multi-track-causal-graph shape (hard `useChartStable()` context throw outside a `LineChart` ancestor; `LineChart` itself renders nothing below a 10px jsdom measurement) — kept the brief's hand-rolled SVG as final, correctly.
- Task 12 — `src/components/sections/Work.tsx`. **The most involved task in this run: 3 fix rounds on one interaction bug**, all resolved. See §2 for the resulting layout-change decision that needs the user's sign-off. Final state (drag-to-reorder via Motion's `Reorder.Group`/`Reorder.Item` with a `dragListener={false}` + `useDragControls` drag-handle pattern to avoid conflicting with a separate drag-to-expand gesture; expand-tap uses `onTap` not `onClick`; a `didDragRef` flag cleared via `frame.postRender` — Motion's own scheduler — to avoid a stale-closure/timing-race bug) is independently verified structurally sound by the round-3 re-review, which traced the actual installed Motion source (`node_modules/framer-motion/dist/es/frameloop/{frame,render-step,batcher}.mjs`) rather than trusting the implementer's account.

- Task 13 — `src/components/sections/Tally.tsx` + `src/hooks/useLiveRepoCount.ts`. Implemented as `533981f`, reviewed clean (zero Critical/Important findings — two Minor coverage nits deferred, see `task-13-review.md`). Fully closed.

**Not started (start here):**
- **Task 14** — Path ledger + Toolkit sections (`src/components/sections/{Path,Toolkit}.tsx`), consuming `LEDGER_ROWS`/`TOOLKIT_GROUPS` from Task 6's `src/data/{path,toolkit}.ts`.
- **Task 15** — Contact section (`src/components/sections/Contact.tsx`) + moving static assets (`img/`, `assets/aahil-shaikh-resume.pdf`, `assets/src/page.css`, `thanks.html`, `404.html`) into `public/`.
- **Task 16** — Assemble `src/App.tsx` (compose every section + both ambient layers + Topbar/Footer), **lock in the font pairing** (needs user input — see §2), delete the superseded vanilla files (`assets/src/{main.css,script.js,field.js}`, `tests/{field.html,field-stack.html}`).
- **Task 17** — GitHub Actions deploy workflow (`.github/workflows/deploy.yml`) + flip the GitHub Pages source setting from branch-based to Actions-based. **This settings flip is a live production change — the plan resolves that Claude does it, not the user, but the plan ALSO explicitly says to flag it clearly and pause for confirmation before running the `gh api` call that flips it, even though it's pre-authorized.** Do not skip that confirmation step just because it's "already decided" — it's a real, hard-to-reverse-feeling action on the live site's deploy config.
- **Final whole-branch review** — per the skill, dispatch on the most capable available model once all 17 tasks are done, using `superpowers:requesting-code-review`'s `code-reviewer.md` template, pointed at a `scripts/review-package PLAN_FILE MERGE_BASE HEAD` package where `MERGE_BASE = git merge-base main HEAD` (note: NOT `agent-field` — the plan itself doesn't specify which base branch this ultimately merges to; `main` is the repo's actual default branch per the original `gitStatus` block at session start, but confirm with the user before this final review, since the branch was cut from `agent-field`, not `main`, and `agent-field` itself hasn't merged to `main` yet — this is a genuine open question, not decided anywhere in the plan or spec).
- **After the final review is clean:** delete the plan's SDD workspace (`rm -rf .superpowers/sdd/2026-08-18-portfolio-visual-rework/`), then use `superpowers:finishing-a-development-branch`.

### Next actions
1. `cd /home/t007p/Documents/Code/the007programmer.github.io/.worktrees/portfolio-react-rework`
2. Run `scripts/task-brief docs/superpowers/plans/2026-08-18-portfolio-visual-rework.md 14`, dispatch the Task 14 implementer, and continue the loop through Task 17.
3. Before finalizing Task 16, resolve the two open decisions in §2 (or explicitly proceed with the documented defaults if the user is unreachable — see §2 for what those defaults are).
4. Before executing Task 17's Pages-settings flip, get explicit confirmation from the user, per the plan's own instruction.
5. Run the final whole-branch review, resolve the `main` vs. `agent-field` merge-base question with the user first.
6. Hand off to `superpowers:finishing-a-development-branch`.

### Gotchas & open questions
- All covered in §0's "Global conventions" and this segment's own notes above. The two decisions genuinely blocking full completion are in §2.
- **Merge-base ambiguity for the final review and eventual PR/merge**, noted above — not resolved anywhere in the plan or spec. Ask the user: does `portfolio-react-rework` ultimately merge into `agent-field` (which itself hasn't merged to `main`), or should it target `main` directly? This affects both the final review's diff scope and the eventual PR.

---

## §2 — Decisions needed from the user before Task 16 completes

Status: **blocked on user input**
Depends on: none (can be resolved in parallel with §1's Task 14/15 work; only blocks *finishing* Task 16)

```bash
# Bootstrap (run first) — joins the shared Mboard board; this segment claims nothing (no code work)
export MBOARD_BOARD=handoff-2026-08-18-portfolio-react-rework
mboard join --board handoff-2026-08-18-portfolio-react-rework
mboard ps
mboard send --to '*' --kind note "Picking up §2: relaying the two open Task-16-blocking decisions to the user, not touching any files."
```

### Goal
Get the user's answer on two real product/design decisions that surfaced during implementation and were explicitly deferred rather than silently decided. Neither requires code — just relay the question and the tradeoffs, get an answer, then either implement it yourself (if you also have §1) or hand the answer back via `mboard send` to whichever session is running §1.

### Context & decisions

**Decision 1 — Work section: grid vs. single-column list.**

The original plan (`docs/superpowers/plans/2026-08-18-portfolio-visual-rework.md`, Task 12) specified the project-cards grid as `grid sm:grid-cols-2 lg:grid-cols-3` (a responsive 1/2/3-column grid, matching the OLD vanilla site's actual layout). During Task 12's implementation, the drag-to-reorder feature (Motion's `Reorder.Group`/`Reorder.Item`, `axis="y"`) was found to be **genuinely, architecturally incompatible** with that multi-column grid — reordering an item left a stuck `transform` on it, visually occluding other cards. This was independently verified twice: once by the implementer (confirmed via 8 seconds of polling, ruled out `layout="position"` as a fix) and once by the task reviewer, who traced Motion's actual source (`Reorder/Group.mjs`'s `compareMin` sort and `Reorder/utils/check-reorder.mjs`'s adjacent-neighbor swap logic) and confirmed the reorder algorithm is purely 1-dimensional — it has no concept of a second (column) axis at all. **There is no prop, config, or Motion feature that fixes this**; `Reorder.Group`/`Reorder.Item` is documented and built as a single-column list primitive, full stop.

The implemented fix: `.cards` was changed from the 3-column grid to a single-column `flex flex-col` list (`src/components/sections/Work.tsx`), which is how every one of Motion's own official Reorder examples is structured. This is now live in commit `6564040`/`7ff809f`/`74fb312` (the final Task 12 state).

**What the user needs to decide:** Is a single-column list of all 6 project cards acceptable, or does the 3-column grid need to come back? The tradeoff, as already identified during implementation:
- **Keep the single-column list (current state, zero further work needed):** the Work section becomes noticeably taller (6 stacked cards instead of a 2-row 3-column grid at desktop widths), but drag-to-reorder works correctly and simply.
- **Get the grid back:** would require dropping Motion's `Reorder` primitive entirely and hand-rolling drag-reorder logic (custom pointer tracking + manual row/column-aware index computation) — explicitly identified by both the implementer and reviewer as "a materially larger change than this task's scope," i.e. not a quick follow-up, a genuinely new sub-task.
- **A third option nobody's implemented or evaluated:** keep the grid for pure visual display and only enable the drag-to-reorder interaction below the `sm` breakpoint (where the grid is already single-column anyway) — this wasn't tried and its UX tradeoffs (desktop users lose the reorder interaction entirely) haven't been evaluated.

**If unreachable, the default is: keep the single-column list as-is.** It's the state already shipped, tested, and reviewed clean; reverting would be net-new work, not a rollback.

**Decision 2 — Font pairing lock-in (Task 16).**

The plan asked for a dev-only `?font=` switcher comparing 4 candidate pairings the user originally named: (tempting, switzer) / (athleas, vanguard) / (inter, times new roman mt) / (archivo, abril/stix). During Task 5's implementation, it was discovered — via live HTTP checks against Google Fonts' CSS2 endpoint, independently re-verified by the task reviewer — that **3 of these 4 names are not real Google Fonts families**: `Tempting`, `Switzer`, and `Athelas`/`Vanguard` all return HTTP 400. Only `Inter`, `Archivo`, `Abril Fatface`, and `STIX Two Text` are real.

Substitutions made (visually similar, chosen with reasoning, clearly commented as placeholders in `index.html` and `src/index.css` — not silently passed off as the real thing):
| Named in original request | Substituted with | Reasoning given |
|---|---|---|
| Tempting (display) | Bricolage Grotesque | Already the OLD site's live display font — a safe, known-good distinctive display face |
| Switzer (body) | Manrope | Clean geometric/Swiss-style grotesk, matches "Switzer" 's actual character |
| Athelas (display) | Source Serif 4 | Humanist serif, literary/readable quality matching Athelas's actual character |
| Vanguard (body) | Work Sans | Geometric-leaning humanist sans, matches "Vanguard" 's actual character |

All 4 pairings are live and comparable right now at `npm run dev` → `/?font=tempting`, `/?font=athelas`, `/?font=inter`, `/?font=archivo`.

**What the user needs to decide:** pick a winner from the 4 (with the above substitutions understood as the real content of "tempting" and "athelas"), OR reject the substitutes and provide/license the actual `Tempting`/`Switzer`/`Athelas`/`Vanguard` font files for self-hosting instead.

**If unreachable, there is no safe default** — Task 16 cannot fully complete without this pick (it deletes 3 of the 4 font loads and hardcodes the winner's values into `src/index.css`'s base `@theme` block). If forced to proceed without an answer, the least-bad choice is to leave the dev-only switcher in place (skip Task 16's font-lock-in step only, complete everything else in Task 16) and flag loudly in the final review that this one step is still open — do not guess which pairing the user wants.

### Files & key locations
- `.worktrees/portfolio-react-rework/src/components/sections/Work.tsx` — the grid→list change, if Decision 1 needs to be revisited.
- `.worktrees/portfolio-react-rework/index.html` — font `<link>` tags with the substitution comment, if Decision 2 changes anything.
- `.worktrees/portfolio-react-rework/src/index.css` — `[data-font="..."]` blocks, same.
- `.worktrees/portfolio-react-rework/src/hooks/useFontPairing.ts` — the switcher itself.
- Full reasoning trail for both decisions: `.superpowers/sdd/2026-08-18-portfolio-visual-rework/progress.md`, Task 12 and Task 5 sections; `task-12-review.md`, `task-12-rereview-r1.md`, `task-12-rereview-r2.md`, `task-12-rereview-r3.md` for the exhaustive Motion-source-level proof behind Decision 1; `task-5-review.md` for the font-fact verification behind Decision 2.

### State: done / in-flight / not-started
Both decisions are **surfaced and documented, awaiting the user's answer.** Nothing is broken or blocked in the sense of "can't proceed" — §1 can and should continue through Tasks 14, 15, and most of Task 16 regardless; only Task 16's specific font-lock-in step and (optionally) a Work-section-layout follow-up depend on these answers.

### Next actions
1. Ask the user Decision 1 (grid vs. list) and Decision 2 (font pick) directly, using the tradeoffs above.
2. Relay the answers to whichever session is running §1 via `mboard send --to <label> --kind dep-signal "<answer>"`, or implement them yourself if you're also holding §1's claim.
3. If Decision 1 answer is "get the grid back," treat this as a new, separately-scoped follow-up task (not a quick edit) — it needs its own design pass (custom drag-reorder logic), not a resume of Task 12's existing brief.

### Gotchas & open questions
- Don't re-litigate whether the grid/Reorder incompatibility is real — it's proven three times over (implementer + reviewer + two independent re-reviews, all with actual Motion source citations). The only live question is which UX tradeoff the user prefers.
- Don't silently pick a font pairing on the user's behalf even though a default "recommendation" exists in spirit (Bricolage Grotesque was the OLD site's font, so "tempting" might feel like the safest guess) — the plan's spec explicitly required the user to compare all 4 live before picking, and that comparison hasn't happened yet as far as this session's transcript shows.

---

## Appendix — Verbatim references

### Resuming the SDD skill (exact invocation)
```
Skill: superpowers:subagent-driven-development
Args: docs/superpowers/plans/2026-08-18-portfolio-visual-rework.md
```
The skill's own setup step will find `.worktrees/portfolio-react-rework/.superpowers/sdd/2026-08-18-portfolio-visual-rework/progress.md`, see its first line names this plan file, and resume after the last `Task N: complete` line (Task 12) — i.e. it will look for Task 13's status next, matching this handoff's own instructions in §1.

### Full `src/` file listing as of commit `533981f`
```
src/App.tsx
src/components/charts/**  (62 vendor-installed Bklit UI files, untouched since Task 4)
src/components/effects/{AgentField,CursorEffect}.tsx (+ CursorEffect.test.tsx)
src/components/kit/{ProjectCard,ActionButton}.tsx (+ .test.tsx each), ChartSmoke.test.tsx
src/components/kokonutui/{mouse-effect-card,particle-button}.tsx
src/components/layout/{Topbar,Footer}.tsx (+ Topbar.test.tsx)
src/components/sections/{Hero,Tally,Timeline,Work}.tsx (+ .test.tsx each)
src/components/shimmering-text.tsx
src/components/ui/{button,card}.tsx
src/data/{path,timeline,toolkit,work}.ts (+ timeline.test.ts)
src/hooks/{useFontPairing,useLiveRepoCount,useReducedMotionGate}.ts(x) (+ .test files each)
src/index.css
src/lib/{agentField,contrast,utils}.ts (+ .test.ts for agentField and contrast)
src/main.tsx
src/test/setup.ts
```
(Path/Toolkit/Contact sections and App.tsx's real composition — currently a Task-1 placeholder — are Tasks 14–16's job.)

### Key commit range
`fe2fcd2` (worktree base, = `agent-field` tip at worktree creation) `..` `533981f` (current HEAD, Task 13 implemented) = 39 commits, all on `portfolio-react-rework`.

### GitHub Pages deploy plan (Task 17, not yet built — for reference)
```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: false }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./dist }
  deploy:
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
Pages source flip command (confirm with user first, per §1's Task 17 notes):
```bash
gh api -X PUT repos/The007Programmer/the007programmer.github.io/pages -f build_type=workflow
# or, if Pages was never configured via the API before:
gh api -X POST repos/The007Programmer/the007programmer.github.io/pages -f build_type=workflow
```
