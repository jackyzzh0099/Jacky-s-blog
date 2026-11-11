---
title: "Attention is a database lookup"
description: "Strip away the architecture diagrams and a transformer block is a soft associative memory. The maths is less mysterious when you read it as retrieval."
date: "2026-09-27"
updated: "2026-10-02"
category: "AI & Machine Learning"
tags:
  - Transformers
  - Deep Learning
  - Mathematics
  - PyTorch
cover: "/covers/attention.svg"
draft: false
featured: true
---

Every explanation of attention starts with a diagram of three boxes labelled Q, K and V and then quietly hopes you will not ask what they are. But there is a much older way to read the same operation: attention is a soft dictionary lookup, written with matrix multiplications because GPUs are good at those.

Once I saw it that way, the rest of the transformer stopped looking like architecture and started looking like plumbing.

## A hard lookup, then a soft one

A Python dict does exact retrieval:

```python
memory = {"apple": [1.0, 0.0], "orange": [0.9, 0.1]}
memory["apple"]        # exact key → one value
```

A neural network cannot index by string, and exact match is the wrong operation anyway. What it can do is measure similarity between vectors and blend every value by how similar it is to the query. That blend is attention.

Formally, for a single query vector $q \in \mathbb{R}^{d_k}$ and $n$ key–value pairs stored in matrices $K \in \mathbb{R}^{n \times d_k}$ and $V \in \mathbb{R}^{n \times d_v}$:

$$
\mathrm{Attention}(q, K, V) = \sum_{i=1}^{n} \alpha_i\, v_i,
\qquad
\alpha_i = \frac{\exp\!\left(q \cdot k_i / \sqrt{d_k}\right)}{\sum_{j=1}^{n}\exp\!\left(q \cdot k_j / \sqrt{d_k}\right)}
$$

That is it. The softmax over dot products is the "which keys are similar" step, and the weighted sum is the "return a blend of their values" step. Everything else in the transformer is stacked around this one idea.

## Why divide by $\sqrt{d_k}$

Dot products of independent random vectors have variance growing linearly with dimension: if $q_i, k_i \sim \mathcal{N}(0,1)$ then

$$
\mathrm{Var}\!\left(\sum_{i=1}^{d_k} q_i k_i\right) = d_k
$$

Without scaling, logits spread out as $d_k$ grows, softmax saturates, and gradients through it collapse toward zero. Dividing by $\sqrt{d_k}$ normalises the variance back to 1, keeping the distribution in the region where softmax has usable slope.

> A saturated softmax is a lookup table with one entry set to 1 and everything else to 0 — precise, and impossible to learn from. The temperature is the difference between a database and a differentiable database.

## Batched, masked, and causal

Real implementations do this for every query at once:

$$
\mathrm{Attention}(Q,K,V) = \mathrm{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}} + M\right)V,
\qquad M_{ij} = \begin{cases} 0 & j \le i \\ -\infty & j > i \end{cases}
$$

The mask $M$ is what makes a language model causal: position $i$ may only attend to positions $\le i$. Adding $-\infty$ before the softmax gives those entries weight exactly zero.

```python
import math
import torch
import torch.nn.functional as F

def attention(q, k, v, causal: bool = True):
    """q,k,v: (batch, heads, seq, dim)"""
    d_k = q.size(-1)
    scores = q @ k.transpose(-2, -1) / math.sqrt(d_k)   # (B, H, T, T)

    if causal:
        T = scores.size(-1)
        mask = torch.ones(T, T, dtype=torch.bool, device=q.device).triu(1)
        scores = scores.masked_fill(mask, float("-inf"))

    weights = F.softmax(scores, dim=-1)
    return weights @ v, weights
```

Two details that matter more than they look:

- `float("-inf")` rather than a large negative number. With fp16, `-1e4` after the softmax is not zero, and the model slowly attends to the future.
- The transpose is on the last two dims, not a full transpose. A full `.T` on a 4-D tensor is a bug that only shows up when `batch == heads`.

## Reading a real head

If attention is retrieval, then inspecting the weight matrix should tell you what a head is looking for. In practice, in a small trained model you will find:

| Head pattern | What it retrieves |
| --- | --- |
| Diagonal | The token itself (identity, useful as a residual) |
| Previous token | Local bigram statistics |
| First token | A global "sink" for information not needed locally |
| Syntactic | Matching brackets, matching verbs |
| Induction | "After A comes B" — the previous occurrence of the same prefix |

The induction head is the interesting one: it is the mechanism behind in-context learning, and it is implemented by composing two attentions — one that looks back for a matching token, one that copies what followed it. A retrieval circuit, built out of retrieval.

## Complexity, honestly

Self-attention is $O(n^2 d)$ in sequence length, which is why the entire inference-stack industry exists around the KV cache:

$$
\text{KV bytes} = 2 \times L \times H \times d_{\text{head}} \times n \times \text{bytes per element}
$$

For a 32-layer, 32-head model with $d_{\text{head}} = 128$ in fp16 at 32k context, that is roughly 16 GiB of cache for a single sequence — before weights. Every technique you have heard of (GQA, sliding windows, paging, quantised caches) is an attack on that number, not on the maths.

## The mental model that stuck

- **Q** is the question you are asking.
- **K** is the index of what is stored.
- **V** is what gets returned.
- **Softmax** is "how many results should I blend".
- **Masking** is "which rows am I allowed to read".
- **Multi-head** is "run several independent lookups and concatenate the answers".

Nothing here needs the word "attention". It is a differentiable hash map with a temperature, and the transformer is a stack of them plus a feed-forward network that does the actual per-token computation.
