from __future__ import annotations

from typing import Dict, List, Sequence


def period_for_year(year: int) -> str:
    if year < 500:
        return "Ancient Mathematics"
    if year < 1500:
        return "Medieval Mathematics"
    if year < 1700:
        return "Early Modern Mathematics"
    if year < 1800:
        return "Enlightenment Mathematics"
    if year < 1900:
        return "19th Century Mathematics"
    if year < 1946:
        return "Early 20th Century Mathematics"
    return "Contemporary Mathematics"


def make_seed(
    title: str,
    slug: str,
    entry_type: str,
    area: str,
    subarea: str,
    year: int,
    mathematicians: Sequence[str] = (),
) -> Dict:
    return {
        "title": title,
        "slug": slug,
        "type": entry_type,
        "area": area,
        "subarea": subarea,
        "historical_start_year": year,
        "period_label": period_for_year(year),
        "mathematicians": list(mathematicians),
    }


CONCEPTS: List[Dict] = [
    make_seed("Set (mathematics)", "set", "concept", "foundations", "set theory", 1874, ["georg-cantor"]),
    make_seed("Function (mathematics)", "function", "concept", "foundations", "mathematical language", 1694, ["gottfried-wilhelm-leibniz", "leonhard-euler"]),
    make_seed("Group (mathematics)", "group", "concept", "abstract algebra", "group theory", 1830, ["evariste-galois", "joseph-louis-lagrange"]),
    make_seed("Ring (mathematics)", "ring", "concept", "abstract algebra", "ring theory", 1914, ["david-hilbert", "emmy-noether"]),
    make_seed("Field (mathematics)", "field", "concept", "abstract algebra", "field theory", 1830, ["evariste-galois"]),
    make_seed("Vector space", "vector-space", "concept", "linear algebra", "linear spaces", 1843, ["david-hilbert"]),
    make_seed("Matrix (mathematics)", "matrix", "concept", "linear algebra", "matrix theory", 1850, ["john-von-neumann"]),
    make_seed("Determinant", "determinant", "concept", "linear algebra", "matrix theory", 1693, ["leonhard-euler", "carl-friedrich-gauss"]),
    make_seed("Linear map", "linear-map", "concept", "linear algebra", "transformations", 1888, ["david-hilbert"]),
    make_seed("Eigenvalues and eigenvectors", "eigenvalues-and-eigenvectors", "concept", "linear algebra", "spectral theory", 1900, ["david-hilbert", "john-von-neumann"]),
    make_seed("Metric space", "metric-space", "concept", "analysis", "metric geometry", 1906, ["stefan-banach"]),
    make_seed("Topological space", "topological-space", "concept", "topology", "general topology", 1914, ["henri-poincare"]),
    make_seed("Manifold", "manifold", "concept", "geometry", "differential topology", 1854, ["bernhard-riemann", "henri-poincare"]),
    make_seed("Compact space", "compact-space", "concept", "topology", "general topology", 1906, ["henri-poincare"]),
    make_seed("Banach space", "banach-space", "concept", "analysis", "functional analysis", 1922, ["stefan-banach"]),
    make_seed("Hilbert space", "hilbert-space", "concept", "analysis", "functional analysis", 1907, ["david-hilbert", "john-von-neumann"]),
    make_seed("Sigma-algebra", "sigma-algebra", "concept", "analysis", "measure theory", 1901, ["henri-lebesgue", "andrey-kolmogorov"]),
    make_seed("Measure (mathematics)", "measure", "concept", "analysis", "measure theory", 1897, ["henri-lebesgue"]),
    make_seed("Probability theory", "probability-theory", "concept", "probability", "foundations", 1654, ["blaise-pascal", "andrey-kolmogorov"]),
    make_seed("Random variable", "random-variable", "concept", "probability", "stochastic processes", 1900, ["andrey-kolmogorov"]),
    make_seed("Expected value", "expected-value", "concept", "probability", "stochastic processes", 1814, ["andrey-kolmogorov"]),
    make_seed("Limit (mathematics)", "limit", "concept", "analysis", "calculus foundations", 1817, ["augustin-louis-cauchy"]),
    make_seed("Derivative", "derivative", "concept", "analysis", "differential calculus", 1675, ["isaac-newton", "gottfried-wilhelm-leibniz"]),
    make_seed("Integral", "integral", "concept", "analysis", "integral calculus", 1675, ["isaac-newton", "gottfried-wilhelm-leibniz"]),
    make_seed("Differential equation", "differential-equation", "concept", "analysis", "differential equations", 1676, ["isaac-newton", "joseph-louis-lagrange"]),
    make_seed("Partial differential equation", "partial-differential-equation", "concept", "analysis", "differential equations", 1740, ["leonhard-euler", "joseph-louis-lagrange"]),
    make_seed("Fourier series", "fourier-series", "concept", "analysis", "harmonic analysis", 1807, ["bernhard-riemann"]),
    make_seed("Complex number", "complex-number", "concept", "analysis", "complex analysis", 1545, ["rene-descartes", "leonhard-euler"]),
    make_seed("Complex analysis", "complex-analysis", "concept", "analysis", "complex analysis", 1825, ["augustin-louis-cauchy", "bernhard-riemann"]),
    make_seed("Real number", "real-number", "concept", "foundations", "number systems", 1872, ["georg-cantor"]),
    make_seed("Prime number", "prime-number", "concept", "number theory", "arithmetic", -300, ["euclid"]),
    make_seed("Modular arithmetic", "modular-arithmetic", "concept", "number theory", "arithmetic", 1801, ["carl-friedrich-gauss"]),
    make_seed("Number theory", "number-theory", "concept", "number theory", "general number theory", 1650, ["pierre-de-fermat", "carl-friedrich-gauss"]),
    make_seed("Graph theory", "graph-theory", "concept", "discrete mathematics", "graph theory", 1736, ["leonhard-euler"]),
    make_seed("Tree (graph theory)", "tree-graph-theory", "concept", "discrete mathematics", "graph theory", 1857, []),
    make_seed("Category theory", "category-theory", "concept", "foundations", "category theory", 1945, ["alexander-grothendieck"]),
    make_seed("Functor", "functor", "concept", "foundations", "category theory", 1945, ["alexander-grothendieck"]),
    make_seed("Natural transformation", "natural-transformation", "concept", "foundations", "category theory", 1945, ["alexander-grothendieck"]),
    make_seed("Topology", "topology", "concept", "topology", "general topology", 1895, ["henri-poincare"]),
    make_seed("Homology (mathematics)", "homology", "concept", "topology", "algebraic topology", 1890, ["henri-poincare"]),
    make_seed("Cohomology", "cohomology", "concept", "topology", "algebraic topology", 1935, ["alexander-grothendieck", "michael-atiyah"]),
    make_seed("Differential geometry", "differential-geometry", "concept", "geometry", "differential geometry", 1854, ["bernhard-riemann", "carl-friedrich-gauss"]),
    make_seed("Algebraic geometry", "algebraic-geometry", "concept", "geometry", "algebraic geometry", 1850, ["alexander-grothendieck", "andrew-wiles"]),
    make_seed("Elliptic curve", "elliptic-curve", "concept", "geometry", "algebraic geometry", 1800, ["andrew-wiles"]),
    make_seed("Lie group", "lie-group", "concept", "geometry", "differential geometry", 1888, ["henri-poincare"]),
    make_seed("Tensor", "tensor", "concept", "geometry", "multilinear algebra", 1898, ["bernhard-riemann", "john-von-neumann"]),
    make_seed("Boolean algebra", "boolean-algebra", "concept", "logic", "algebraic logic", 1847, ["alonzo-church"]),
    make_seed("Mathematical logic", "mathematical-logic", "concept", "logic", "foundations of logic", 1879, ["kurt-godel", "alan-turing", "alonzo-church"]),
    make_seed("Turing machine", "turing-machine", "concept", "logic", "computability theory", 1936, ["alan-turing", "alonzo-church"]),
    make_seed("Information theory", "information-theory", "concept", "applied mathematics", "information theory", 1948, ["john-von-neumann", "alan-turing"]),
]

THEOREMS: List[Dict] = [
    make_seed("Pythagorean theorem", "pythagorean-theorem", "theorem", "geometry", "euclidean geometry", -500, ["euclid"]),
    make_seed("Fundamental theorem of arithmetic", "fundamental-theorem-of-arithmetic", "theorem", "number theory", "arithmetic", 300, ["euclid", "carl-friedrich-gauss"]),
    make_seed("Fundamental theorem of calculus", "fundamental-theorem-of-calculus", "theorem", "analysis", "calculus foundations", 1668, ["isaac-newton", "gottfried-wilhelm-leibniz"]),
    make_seed("Bayes' theorem", "bayes-theorem", "theorem", "probability", "bayesian inference", 1763, ["andrey-kolmogorov"]),
    make_seed("Law of large numbers", "law-of-large-numbers", "theorem", "probability", "limit theorems", 1713, ["andrey-kolmogorov"]),
    make_seed("Central limit theorem", "central-limit-theorem", "theorem", "probability", "limit theorems", 1810, ["andrey-kolmogorov"]),
    make_seed("Godel's incompleteness theorems", "godels-incompleteness-theorems", "theorem", "logic", "mathematical logic", 1931, ["kurt-godel"]),
    make_seed("Cauchy's integral theorem", "cauchys-integral-theorem", "theorem", "analysis", "complex analysis", 1825, ["augustin-louis-cauchy"]),
    make_seed("Euler's formula", "eulers-formula", "theorem", "analysis", "complex analysis", 1748, ["leonhard-euler"]),
    make_seed("Green's theorem", "greens-theorem", "theorem", "analysis", "vector calculus", 1828, ["bernhard-riemann"]),
    make_seed("Stokes' theorem", "stokes-theorem", "theorem", "analysis", "differential geometry", 1850, ["bernhard-riemann"]),
    make_seed("Noether's theorem", "noethers-theorem", "theorem", "applied mathematics", "mathematical physics", 1918, ["emmy-noether"]),
    make_seed("Fermat's little theorem", "fermats-little-theorem", "theorem", "number theory", "arithmetic", 1640, ["pierre-de-fermat"]),
    make_seed("Chinese remainder theorem", "chinese-remainder-theorem", "theorem", "number theory", "arithmetic", 300, ["carl-friedrich-gauss"]),
    make_seed("Lagrange's theorem (group theory)", "lagranges-theorem-group-theory", "theorem", "abstract algebra", "group theory", 1770, ["joseph-louis-lagrange"]),
    make_seed("Hahn-Banach theorem", "hahn-banach-theorem", "theorem", "analysis", "functional analysis", 1927, ["stefan-banach"]),
    make_seed("Spectral theorem", "spectral-theorem", "theorem", "analysis", "functional analysis", 1900, ["david-hilbert", "john-von-neumann"]),
    make_seed("Brouwer fixed-point theorem", "brouwer-fixed-point-theorem", "theorem", "topology", "algebraic topology", 1911, ["henri-poincare", "michael-atiyah"]),
    make_seed("Divergence theorem", "divergence-theorem", "theorem", "analysis", "vector calculus", 1768, ["carl-friedrich-gauss"]),
    make_seed("Fubini's theorem", "fubinis-theorem", "theorem", "analysis", "measure theory", 1907, ["henri-lebesgue"]),
]

MATHEMATICIANS: List[Dict] = [
    make_seed("Euclid", "euclid", "mathematician", "geometry", "ancient geometry", -300),
    make_seed("Archimedes", "archimedes", "mathematician", "applied mathematics", "ancient mathematics", -287),
    make_seed("Rene Descartes", "rene-descartes", "mathematician", "geometry", "analytic geometry", 1596),
    make_seed("Pierre de Fermat", "pierre-de-fermat", "mathematician", "number theory", "arithmetic", 1607),
    make_seed("Blaise Pascal", "blaise-pascal", "mathematician", "probability", "early probability", 1623),
    make_seed("Isaac Newton", "isaac-newton", "mathematician", "analysis", "calculus", 1643),
    make_seed("Gottfried Wilhelm Leibniz", "gottfried-wilhelm-leibniz", "mathematician", "analysis", "calculus", 1646),
    make_seed("Leonhard Euler", "leonhard-euler", "mathematician", "analysis", "eighteenth-century mathematics", 1707),
    make_seed("Joseph-Louis Lagrange", "joseph-louis-lagrange", "mathematician", "analysis", "mechanics and algebra", 1736),
    make_seed("Carl Friedrich Gauss", "carl-friedrich-gauss", "mathematician", "number theory", "arithmetic and geometry", 1777),
    make_seed("Augustin-Louis Cauchy", "augustin-louis-cauchy", "mathematician", "analysis", "rigorous analysis", 1789),
    make_seed("Bernhard Riemann", "bernhard-riemann", "mathematician", "geometry", "analysis and geometry", 1826),
    make_seed("Georg Cantor", "georg-cantor", "mathematician", "foundations", "set theory", 1845),
    make_seed("David Hilbert", "david-hilbert", "mathematician", "foundations", "formalism and analysis", 1862),
    make_seed("Emmy Noether", "emmy-noether", "mathematician", "abstract algebra", "algebra and physics", 1882),
    make_seed("Henri Poincare", "henri-poincare", "mathematician", "topology", "topology and dynamical systems", 1854),
    make_seed("Kurt Godel", "kurt-godel", "mathematician", "logic", "mathematical logic", 1906),
    make_seed("Alan Turing", "alan-turing", "mathematician", "logic", "computability", 1912),
    make_seed("John von Neumann", "john-von-neumann", "mathematician", "applied mathematics", "functional analysis and computing", 1903),
    make_seed("Andrey Kolmogorov", "andrey-kolmogorov", "mathematician", "probability", "probability theory", 1903),
    make_seed("Evariste Galois", "evariste-galois", "mathematician", "abstract algebra", "group theory", 1811),
    make_seed("Niels Henrik Abel", "niels-henrik-abel", "mathematician", "abstract algebra", "algebra and analysis", 1802),
    make_seed("Alexander Grothendieck", "alexander-grothendieck", "mathematician", "geometry", "algebraic geometry", 1928),
    make_seed("Srinivasa Ramanujan", "srinivasa-ramanujan", "mathematician", "number theory", "analytic number theory", 1887),
    make_seed("Sophie Germain", "sophie-germain", "mathematician", "number theory", "arithmetic and elasticity", 1776),
    make_seed("Andrew Wiles", "andrew-wiles", "mathematician", "number theory", "modern number theory", 1953),
    make_seed("Henri Lebesgue", "henri-lebesgue", "mathematician", "analysis", "measure theory", 1875),
    make_seed("Stefan Banach", "stefan-banach", "mathematician", "analysis", "functional analysis", 1892),
    make_seed("Michael Atiyah", "michael-atiyah", "mathematician", "geometry", "topology and geometry", 1929),
    make_seed("Alonzo Church", "alonzo-church", "mathematician", "logic", "computability theory", 1903),
]

WIKIPEDIA_SEED_MANIFEST: List[Dict] = CONCEPTS + THEOREMS + MATHEMATICIANS

assert len(WIKIPEDIA_SEED_MANIFEST) == 100
