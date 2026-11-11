---
title: "A knowledge system that survives you"
description: "Notes are easy. Notes you can still use after two years, three tools and one failed migration are hard. What I keep, what I throw away, and why."
date: "2026-07-18"
updated: "2026-07-21"
category: "Thoughts"
tags:
  - Writing
  - Notes
  - Methodology
  - Craft
cover: "/covers/notes.svg"
draft: false
featured: false
---

I have migrated my notes four times: Evernote to plain files, plain files to Notion, Notion back to plain files, and finally to a directory of markdown with a git history. Each migration lost something. The fourth one lost nothing, and the reason is not the tool.

## The failure mode is not the app

Every note system I abandoned died the same death: it accumulated entries faster than it produced understanding. Ten thousand notes, none of which I could find when I needed them, is a very expensive way to store nothing.

The interesting question is not "which app" but "what makes a note worth writing down". My answer, after four attempts:

- **A note must contain something I could not reconstruct.** A quote with a source. A measurement. A decision and the reason behind it.
- **A note must have a date.** Undated notes become folklore; you cannot tell whether the claim was true when you wrote it.
- **A note must be reachable in one search.** If retrieving it requires remembering where it lives, it is already lost.

Anything else — meeting times, links I might read, tasks — belongs in a different system with a different lifecycle. Mixing them is how a knowledge base turns into a junk drawer.

## Directory structure is the schema

```
notes/
  2026/
    07/
      2026-07-18-knowledge-system.md
      2026-07-15-page-table-measurements.md
  topics/
    memory.md        # index: links only, no prose
    raft.md
  reading/
    2026-07-02-designing-data-intensive.md
```

Three rules make this survivable:

1. **Date-prefixed filenames.** Sorting is chronology, for free, forever.
2. **Topic files contain links, not content.** One place to look, no duplication, no merge conflicts.
3. **Markdown only.** Every editor on earth reads it, and so will whatever replaces markdown in ten years, via a converter I can write in an afternoon.

> The system you can rebuild in a day is more valuable than the system with better features.

## Notes that turn into writing

Most of what appears on this site started as a note that got too long. The transition is mechanical:

- A note becomes an article when it has a claim, evidence, and a reason someone else would care.
- If it only has a claim, it stays a note.
- If it only has evidence, it stays a measurement log.
- If it has neither, it gets deleted. Aggressively.

```text
note → (claim + evidence + audience) → draft → (edit × 3) → published
```

The third edit is the one that removes the scaffolding: the "as I mentioned earlier", the throat-clearing introduction, the paragraph that exists because the outline had a gap.

## What I keep outside the system

- **Code experiments** live in repositories, not notes. A note can point at a commit; it should not contain the code.
- **Bookmarks** live in a read-later tool and are deleted after a month. If a link mattered, it becomes a note with my own summary.
- **Decisions** live in the note that made them, with the alternatives I rejected. Future-me needs the rejected options more than the chosen one.

## The test

<details>
<summary>The question I ask before saving anything</summary>

If I read this in two years, with no memory of writing it, would it save me an hour?

If the answer is no, it is not a note. It is a bookmark, a task, or noise.

</details>

That is the entire system. Four migrations taught me that the tool was never the problem — the filter was.
