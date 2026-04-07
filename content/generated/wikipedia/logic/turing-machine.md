---
slug: turing-machine
title: Turing machine
type: concept
summary: A Turing machine is a mathematical model of computation describing an abstract
  machine that manipulates symbols on a strip of tape according to a table of rules.
area: logic
subarea: computability theory
historical_start_year: 1936
historical_end_year: null
period_label: Early 20th Century Mathematics
mathematicians:
- alan-turing
- alonzo-church
references:
- title: Wikipedia - Turing machine
  url: https://en.wikipedia.org/wiki/Turing_machine
relations:
- target_slug: alan-turing
  relation_type: worked_on
  evidence: Curated mathematician association from the import manifest.
  weight: null
- target_slug: alonzo-church
  relation_type: worked_on
  evidence: Curated mathematician association from the import manifest.
  weight: null
- target_slug: boolean-algebra
  relation_type: related_to
  evidence: Derived from a direct Wikipedia article link between imported pages.
  weight: null
- target_slug: category-theory
  relation_type: related_to
  evidence: Derived from a direct Wikipedia article link between imported pages.
  weight: null
- target_slug: david-hilbert
  relation_type: related_to
  evidence: Derived from a direct Wikipedia article link between imported pages.
  weight: null
- target_slug: function
  relation_type: related_to
  evidence: Derived from a direct Wikipedia article link between imported pages.
  weight: null
- target_slug: godels-incompleteness-theorems
  relation_type: related_to
  evidence: Derived from a direct Wikipedia article link between imported pages.
  weight: null
- target_slug: information-theory
  relation_type: related_to
  evidence: Derived from a direct Wikipedia article link between imported pages.
  weight: null
- target_slug: kurt-godel
  relation_type: related_to
  evidence: Derived from a direct Wikipedia article link between imported pages.
  weight: null
- target_slug: mathematical-logic
  relation_type: related_to
  evidence: Derived from a direct Wikipedia article link between imported pages.
  weight: null
- target_slug: set
  relation_type: related_to
  evidence: Derived from a direct Wikipedia article link between imported pages.
  weight: null
source:
  name: Wikipedia
  url: https://en.wikipedia.org/wiki/Turing_machine
  license: CC BY-SA 4.0
  retrieved_at: '2026-04-07T02:27:19+00:00'
  external_id: '30403'
  external_title: Turing machine
---

A Turing machine is a mathematical model of computation describing an abstract machine that manipulates symbols on a strip of tape according to a table of rules. Despite the model's simplicity, it is capable of implementing any computer algorithm.
The machine operates on an infinite memory tape divided into discrete cells, each of which can hold a single symbol drawn from a finite set of symbols called the alphabet of the machine. It has a "head" that, at any point in the machine's operation, is positioned over one of these cells, and a "state" selected from a finite set of states. At each step of its operation, the head reads the symbol in its cell. Then, based on the symbol and the machine's own present state, the machine writes a symbol into the same cell, and moves the head one step to the left or the right, or halts the computation. The choice of which replacement symbol to write, which direction to move the head, and whether to halt is based on a finite table that specifies what to do for each combination of the current state and the symbol that is read. 
As with a real computer program, it is possible for a Turing machine to go into an infinite loop which will never halt.
The...

Source: Wikipedia article at https://en.wikipedia.org/wiki/Turing_machine
