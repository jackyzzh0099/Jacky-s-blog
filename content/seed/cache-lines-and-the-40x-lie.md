---
title: "Cache lines and the 40× lie"
description: "A benchmark that says one loop is forty times faster than another is usually measuring layout, not algorithms. Three measurements that make the difference visible."
date: "2026-09-09"
updated: "2026-09-11"
category: "Software Engineering"
tags:
  - Performance
  - C
  - CPU
  - Benchmarking
cover: "/covers/cache.svg"
draft: false
featured: false
---

Two functions, identical operation counts, one is 40× slower. The first time this happens you assume a compiler bug. The tenth time you assume the profiler is lying. Eventually you accept the boring answer: one of them touches memory the way the hardware prefers, and the other does not.

## The setup

Sum every field named `value` in an array of one million structs. Two layouts, same semantics:

```c
typedef struct {
    double value;
    char   label[56];   // 64-byte struct total
} Fat;

typedef struct {
    double *values;     // one million doubles, contiguous
    char  **labels;
} Split;
```

The "array of structs" version reads 64 MiB to use 8 MiB of it. The "struct of arrays" version reads 8 MiB and uses all of it. Same number of additions.

```c
// AoS — 8 bytes used per 64-byte cache line
double sum_aos(const Fat *items, size_t n) {
    double s = 0;
    for (size_t i = 0; i < n; i++) s += items[i].value;
    return s;
}

// SoA — every byte of every line is useful
double sum_soa(const double *values, size_t n) {
    double s = 0;
    for (size_t i = 0; i < n; i++) s += values[i];
    return s;
}
```

On a modern desktop, the first runs at roughly 2–3 GB/s and the second at 15–25 GB/s. Not because the CPU is better at `+`, but because DRAM delivers 64-byte lines and only 1/8 of each line is used in the first version.

## The three numbers that explain everything

| Quantity | Typical value | Consequence |
| --- | --- | --- |
| Cache line | 64 bytes | Reading one `double` costs 64 bytes of bandwidth |
| Prefetcher stride | ~2–8 lines ahead | Sequential access is nearly free; random is not |
| DRAM latency | ~90 ns ≈ 300 cycles | A dependent chain of 1M misses is ~0.3 s |

The third row is the one that bites in pointer-chasing code. A linked list of a million nodes, walked once, is dominated by TLB and DRAM latency, not by the work at each node. Sorting an array is often faster than walking the list that replaces it.

## False sharing, the invisible tax

Two threads, two independent counters, no locks — and the program gets slower with more cores.

```c
struct Counters {
    long a;   // same cache line as b
    long b;
};

void *worker_a(void *arg) {
    struct Counters *c = arg;
    for (long i = 0; i < 100000000; i++) c->a++;
    return NULL;
}
// worker_b does the same for c->b
```

Both cores write to the same 64-byte line, so the cache coherence protocol ping-pongs the line between them on every write. The fix is embarrassing:

```c
struct Counters {
    _Alignas(64) long a;
    _Alignas(64) long b;
};
```

Measure it once and you will never forget it: the unaligned version can be 5–10× slower with two threads than with one.

## How to not fool yourself

Benchmarking has its own failure modes, and most "40×" claims are one of these:

- **Dead-code elimination.** If you never use the result, the loop disappears. Print a checksum, or use `volatile`, or `asm volatile("" ::: "memory")`.
- **Measuring the allocator.** `malloc` on first touch, page faults and `madvise` can dominate a benchmark that claims to measure an algorithm.
- **Cold versus warm.** Run three times, report the median of the warm runs *and* the first run separately. They answer different questions.
- **Turbo and thermal drift.** Pin the frequency (`cpupower frequency-set -g performance`) or at least report that you did not.
- **One input size.** The crossover point is the interesting part. Sweep 1e3 → 1e8 and plot.

```bash
perf stat -e cycles,instructions,cache-misses,cache-references,\
page-faults,branch-misses ./bench
```

`cache-misses / cache-references` above ~5% on a tight loop is a layout problem, not an algorithmic one.

## When layout beats asymptotics

Big-O ignores constants, and the constants here are two orders of magnitude. A linear scan over a contiguous array of 1M integers (~4 MB) takes about 200 µs; a binary search over a 1 GB tree with poor locality can take longer per query than the scan it was supposed to replace, because each comparison is a cache miss.

This is why:

- B-trees beat binary trees on disk and in memory.
- Hash maps with open addressing beat chained maps until the load factor gets silly.
- Column stores beat row stores for analytical scans.
- `std::vector` beats `std::list` for almost everything, despite the complexity guarantees.

## What I do now

1. Write the straightforward version, measure it, and only then optimise.
2. Look at the memory access pattern before the instruction count.
3. Prefer contiguous, prefer struct-of-arrays for hot loops, align anything shared between threads.
4. Put the benchmark in the repository with its input generator, so the next person can reproduce the number instead of trusting it.

The 40× difference is real. It is just almost never about the algorithm.
