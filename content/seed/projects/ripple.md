---
title: "ripple"
summary: "A preemptive RTOS kernel for Cortex-M4 in about 2,500 lines, with a priority-inheritance mutex and a scheduler you can read in one sitting."
date: "2026-05-11"
status: "archived"
stack:
  - C
  - ARM Cortex-M
  - Assembly
  - RTOS
cover: "/covers/ripple.svg"
repo: "https://github.com/jacky/ripple"
demo: ""
featured: false
order: 4
---

`ripple` was built to answer a question I could not answer from a datasheet: what exactly happens on a context switch when a higher-priority thread becomes ready?

The answer is about forty instructions of assembly, and a great deal of care around the FPU.

## Scheduler

- Fixed-priority preemptive scheduling, 32 levels, O(1) selection via a bitmap.
- Round-robin within a priority, configurable quantum.
- `PendSV` for the actual switch, `SysTick` for the tick — the standard split, because it makes the switch tail-chained and keeps interrupt latency predictable.
- Priority inheritance on mutexes, so a low-priority thread holding a lock cannot be starved by a medium-priority one.

```c
__attribute__((naked)) void PendSV_Handler(void) {
    __asm volatile(
        "mrs    r0, psp            \n"
        "stmdb  r0!, {r4-r11}      \n"  // callee-saved core regs
        "vstmdbeq r0!, {s16-s31}   \n"  // FPU context, if used
        "bl     scheduler_switch  \n"   // returns next TCB in r0
        "ldmia  r0!, {r4-r11}      \n"
        "vldmiaeq r0!, {s16-s31}   \n"
        "msr    psp, r0            \n"
        "bx     lr                 \n"
    );
}
```

## What I learned

1. **The FPU lazy-stacking rules are the whole difficulty.** Get `CONTROL.FPCA` and `FPCCR.ASPEN` wrong and the bug appears only when two threads both use floats, in the form of corrupted registers that look like a compiler bug.
2. **A tick is not a schedule.** The tick is a trigger; decisions belong in the scheduler, and those decisions must be O(1) or your jitter is unbounded.
3. **Priority inheritance is not optional.** Without it, my motor-control demo missed deadlines whenever logging was enabled.

## Why archived

The project did what I wanted: I can explain, line by line, what my microcontroller does. It is not maintained, it has no MPU support, and if you need a production RTOS use Zephyr or FreeRTOS. The repository stays up as a reference.

- [x] Context switch with FPU support
- [x] Priority inheritance mutex
- [x] Static allocation only, no heap
- [ ] MPU-based stack guard (never finished)
- [ ] Tickless idle
