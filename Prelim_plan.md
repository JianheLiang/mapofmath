I want to built an interactive integrated math knowledge platform. 
Generally, it integrates 
1. math concepts(theorems and definitions), 
2. math history(trend of math in different branches and period; motivation for introducing math concepts) 
3. biography of mathematicians.

It consist of 2 main parts: backend (database) and frontend

**The database**
It consists of numerous wikis about concepts, theorems, and mathematician biographies, with each wiki possessing the following label:
1. types(concept, theorem, mathematician biographies)
2. links(its connections to other wikis)
	1. e.g. for a theorem, the connection would be concepts the theorem statement connect together, or other theorem/knowledge used in the proof
	2. e.g for a concept, the connection would include other concepts used in its definitions, and related theorems of this concept
	3. e.g. for a mathematician, the connection would including his/her works.
3. area/subarea(e.g. algebraic geometry, category theory (these are also categorized as concepts))
For the wiki, it should consist main content, references (authentic internet source), and all labels above.

**The frontend**
Sequentially (top to bottom), there should be 3 main blocks
1. Search tab (search wiki directly)
2. Exploring connections
	1. A graphic view (nodes and edges. e.g. obsidian style) of math knowledges and its connection. Each types of wiki has an represented color, and edges are drawn precisely according to the link in each wiki
	2. Click each nodes to view the wiki articles it corresponded to.
	3. Nodes belong to the same area should form a loose cluster for visually understanding of their relatedness.

3.  Historical trend:
		A timeline showing chronologically of the order of emergence of concepts in a given historical period.



(when designing the architecutre, if needed, referencing this wiki: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f. But make sure to prioritize my prompt and instructions above)