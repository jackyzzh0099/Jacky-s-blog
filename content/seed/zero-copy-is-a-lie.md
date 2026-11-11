---
title: "Zero-copy is a lie we tell our benchmarks"
description: "An unfinished investigation into splice, io_uring and the moment a copy stops being free."
date: "2026-11-09"
updated: "2026-11-11"
category: "Software Engineering"
tags:
  - Linux
  - IO
  - Performance
cover: "/covers/zero-copy.svg"
draft: true
featured: false
---

> Draft. Numbers are from a single machine and have not been reproduced. Do not quote yet.

The claim is that `splice(2)` moves data between a socket and a file without copying it through userspace. That is true. It is also true that the kernel copies it between page cache pages, and that the win is smaller than the benchmark suggests once you account for the page faults you no longer take.

## What I measured so far

| Path | Throughput | CPU per GiB |
| --- | --- | --- |
| `read` + `write` (64 KiB buffer) | 1.9 GB/s | 0.42 s |
| `sendfile` | 2.6 GB/s | 0.18 s |
| `splice` to socket | 2.7 GB/s | 0.17 s |
| `io_uring` + `splice` | 2.9 GB/s | 0.15 s |

The gap between `sendfile` and `splice` is inside the noise on this machine. The gap between either of them and a userspace copy loop is real, and it is mostly about page faults and cache pollution, not about the copy instruction.

## To do

- [ ] Repeat with a cold page cache
- [ ] Measure with `perf stat -e cycles,instructions,cache-misses`
- [ ] Test the same workload over loopback vs a real NIC
- [ ] Check whether `MSG_ZEROCOPY` changes the picture for large writes
- [ ] Write the conclusion, or delete this post

```c
// The shape of the experiment
while (remaining > 0) {
    ssize_t n = splice(file_fd, NULL, pipe_fd[1], NULL, 1 << 16, SPLICE_F_MOVE);
    if (n <= 0) break;
    ssize_t sent = 0;
    while (sent < n) {
        ssize_t w = splice(pipe_fd[0], NULL, sock_fd, NULL, n - sent, SPLICE_F_MOVE);
        if (w <= 0) break;
        sent += w;
    }
    remaining -= n;
}
```

The reason this stays a draft: I do not yet have a story for *when* it matters. "Faster in a microbenchmark" is not a reason to add a pipe indirection to a production path.
