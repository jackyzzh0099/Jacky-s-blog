---
title: "atlas"
summary: "An embedded key-value store built around an LSM tree, written to understand compaction rather than to replace RocksDB."
date: "2026-08-06"
status: "beta"
stack:
  - Rust
  - LSM Tree
  - WAL
  - Crash Recovery
cover: "/covers/atlas.svg"
repo: "https://github.com/jacky/atlas"
demo: ""
featured: true
order: 2
---

`atlas` is a single-file, single-writer key-value store: put, get, delete, range scan, and a memtable that flushes to immutable sorted runs. It exists because I wanted to know exactly why write amplification is the price of fast writes, instead of taking it on faith.

## Design

```text
  write ──► WAL (append, fsync) ──► memtable (skiplist)
                                       │ full
                                       ▼
                              immutable SST (sorted, blocked)
                                       │
                              level 0 ─┴─► compaction ─► level 1..n
```

- **WAL first, always.** A write is durable when the WAL record is fsynced; the memtable is a cache over it.
- **SSTables are blocked and indexed.** 4 KiB blocks, a sparse index in memory, bloom filters per table.
- **Compaction is size-tiered for L0, levelled after.** The simplest thing that keeps read amplification bounded.
- **Snapshots are sequence numbers**, not copies.

## What is measured

| Metric | Value (1M keys, 100 B values) |
| --- | --- |
| Sequential write | 180k ops/s |
| Random read (bloom hit) | 95k ops/s |
| Random read (miss) | 210k ops/s |
| Write amplification (steady state) | 8.4× |
| Recovery from 64 MB WAL | 340 ms |

The 8.4× write amplification is the honest number, and it is the reason LSM stores are not free. Making it smaller means fewer compactions, which means more files, which means slower reads.

## Status

Correct under crash tests with `kill -9` at random points, verified by a workload that replays and compares. No multi-process access, no transactions across keys, and no plans to add either.

- [x] Crash-consistent WAL replay
- [x] Bloom filters and block index
- [x] Manual compaction trigger
- [ ] Background compaction scheduler
- [ ] Block compression (LZ4)
