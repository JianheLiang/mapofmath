"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

import { GraphPayload, RelationType } from "@/lib/types";

cytoscape.use(dagre);

type LayoutMode = "force" | "concentric" | "hierarchy";

interface KnowledgeGraphProps {
  graph: GraphPayload | null;
  selectedCenterId: string | null;
  depth: number;
  onDepthChange: (depth: number) => void;
}

const relationLabels: Record<RelationType, string> = {
  defines_with: "defines with",
  used_in_proof: "used in proof",
  related_to: "related",
  worked_on: "worked on",
  belongs_to_area: "belongs to area",
  influenced_by: "influenced by",
};

const relationColors: Record<RelationType, string> = {
  defines_with: "#1f7a63",
  used_in_proof: "#d1495b",
  related_to: "#5f6b7a",
  worked_on: "#2f5d9f",
  belongs_to_area: "#c08a2b",
  influenced_by: "#7c5ea6",
};

function buildLayout(layoutMode: LayoutMode, compactMode: boolean) {
  if (layoutMode === "hierarchy") {
    return {
      name: "dagre",
      rankDir: "LR",
      rankSep: compactMode ? 80 : 120,
      nodeSep: compactMode ? 20 : 40,
      edgeSep: compactMode ? 8 : 18,
      fit: true,
      padding: 24,
      animate: false,
    };
  }

  if (layoutMode === "concentric") {
    return {
      name: "concentric",
      fit: true,
      padding: 28,
      animate: false,
      spacingFactor: compactMode ? 0.75 : 1,
      concentric: (node: cytoscape.NodeSingular) => {
        if (node.data("type") === "area") {
          return 5;
        }
        if (node.data("type") === "theorem") {
          return 4;
        }
        if (node.data("type") === "concept") {
          return 3;
        }
        return 2;
      },
      levelWidth: () => 1,
    };
  }

  return {
    name: "cose",
    fit: true,
    padding: 24,
    animate: false,
    randomize: false,
    idealEdgeLength: compactMode ? 100 : 160,
    nodeRepulsion: compactMode ? 320000 : 480000,
    gravity: compactMode ? 0.4 : 0.25,
    componentSpacing: compactMode ? 40 : 80,
  };
}

export function KnowledgeGraph({
  graph,
  selectedCenterId,
  depth,
  onDepthChange,
}: KnowledgeGraphProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("force");
  const [compactMode, setCompactMode] = useState(true);
  const [activeRelations, setActiveRelations] = useState<Record<RelationType, boolean>>({
    defines_with: true,
    used_in_proof: true,
    related_to: true,
    worked_on: true,
    belongs_to_area: false,
    influenced_by: true,
  });

  const relationTypes = Array.from(
    new Set((graph?.edges ?? []).map((edge) => edge.relation_type)),
  );

  const filteredGraph = (() => {
    if (!graph) {
      return null;
    }

    const visibleEdges = graph.edges.filter((edge) => activeRelations[edge.relation_type]);
    const visibleIds = new Set<string>();
    graph.nodes.forEach((node) => {
      if (node.type === "area") {
        visibleIds.add(node.id);
      }
    });
    visibleEdges.forEach((edge) => {
      visibleIds.add(edge.source);
      visibleIds.add(edge.target);
    });
    if (selectedCenterId) {
      visibleIds.add(selectedCenterId);
    }

    return {
      nodes: graph.nodes.filter((node) => visibleIds.has(node.id)),
      edges: visibleEdges,
    };
  })();

  useEffect(() => {
    if (!containerRef.current || !filteredGraph) {
      return;
    }

    const elements: cytoscape.ElementDefinition[] = [];

    filteredGraph.nodes
      .filter((node) => node.type === "area")
      .forEach((node) => {
        elements.push({
          data: {
            id: node.id,
            label: node.title,
            type: node.type,
            area: node.area,
          },
          classes: "area-compound",
        });
      });

    filteredGraph.nodes
      .filter((node) => node.type !== "area")
      .forEach((node) => {
        elements.push({
          data: {
            id: node.id,
            slug: node.slug,
            label: node.title,
            type: node.type,
            area: node.area,
            subarea: node.subarea,
            parent: `area:${node.area}`,
          },
        });
      });

    filteredGraph.edges.forEach((edge) => {
      elements.push({
        data: {
          id: `${edge.source}:${edge.target}:${edge.relation_type}`,
          source: edge.source,
          target: edge.target,
          relationType: edge.relation_type,
          label: relationLabels[edge.relation_type],
          evidence: edge.evidence,
        },
      });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "font-family": "Source Sans 3, Segoe UI, sans-serif",
            "font-size": 11,
            color: "#e8eaed",
            "text-wrap": "wrap",
            "text-max-width": 120,
            "text-valign": "bottom",
            "text-margin-y": 9,
            "overlay-opacity": 0,
          },
        },
        {
          selector: 'node[type = "concept"]',
          style: {
            width: compactMode ? 26 : 34,
            height: compactMode ? 26 : 34,
            "background-color": "#1f7a63",
            "border-width": 2,
            "border-color": "#1a1a1a",
          },
        },
        {
          selector: 'node[type = "theorem"]',
          style: {
            width: compactMode ? 28 : 36,
            height: compactMode ? 28 : 36,
            "background-color": "#d1495b",
            shape: "round-rectangle",
            "border-width": 2,
            "border-color": "#1a1a1a",
          },
        },
        {
          selector: 'node[type = "mathematician"]',
          style: {
            width: compactMode ? 24 : 32,
            height: compactMode ? 24 : 32,
            "background-color": "#2f5d9f",
            shape: "diamond",
            "border-width": 2,
            "border-color": "#1a1a1a",
          },
        },
        {
          selector: 'node[type = "area"]',
          style: {
            "background-color": "rgba(255, 255, 255, 0.04)",
            "border-width": 1.5,
            "border-color": "rgba(255, 255, 255, 0.12)",
            shape: "round-rectangle",
            padding: compactMode ? 14 : 22,
            "text-halign": "center",
            "text-valign": "top",
            "text-margin-y": -8,
            color: "#c9ccd1",
            "font-size": 13,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.6,
            "line-color": "#4a4d55",
            "curve-style": "bezier",
            opacity: 0.65,
            "target-arrow-shape": "triangle",
            "target-arrow-color": "data(color)",
            "arrow-scale": 0.7,
          },
        },
        {
          selector: 'edge[relationType = "defines_with"]',
          style: {
            "line-color": relationColors.defines_with,
            "target-arrow-color": relationColors.defines_with,
          },
        },
        {
          selector: 'edge[relationType = "used_in_proof"]',
          style: {
            "line-color": relationColors.used_in_proof,
            "target-arrow-color": relationColors.used_in_proof,
          },
        },
        {
          selector: 'edge[relationType = "related_to"]',
          style: {
            "line-color": relationColors.related_to,
            "target-arrow-color": relationColors.related_to,
          },
        },
        {
          selector: 'edge[relationType = "worked_on"]',
          style: {
            "line-color": relationColors.worked_on,
            "target-arrow-color": relationColors.worked_on,
          },
        },
        {
          selector: 'edge[relationType = "belongs_to_area"]',
          style: {
            "line-style": "dashed",
            "line-color": relationColors.belongs_to_area,
            "target-arrow-color": relationColors.belongs_to_area,
            opacity: 0.2,
          },
        },
        {
          selector: 'edge[relationType = "influenced_by"]',
          style: {
            "line-color": relationColors.influenced_by,
            "target-arrow-color": relationColors.influenced_by,
          },
        },
        {
          selector: ".faded",
          style: {
            opacity: 0.14,
          },
        },
        {
          selector: ".focused",
          style: {
            opacity: 1,
            "z-index": 999,
          },
        },
        {
          selector: ".selected-node",
          style: {
            "border-width": 4,
            "border-color": "#6b9aff",
            "shadow-blur": 22,
            "shadow-opacity": 0.35,
            "shadow-color": "#3366bb",
          },
        },
      ] as any,
      wheelSensitivity: 0.16,
      minZoom: 0.45,
      maxZoom: 2.4,
    });

    cyRef.current = cy;

    cy.on("tap", "node", (event) => {
      const node = event.target;
      if (node.data("type") === "area") {
        return;
      }
      const slug = node.data("slug") as string;
      if (slug) {
        router.push(`/wiki/${slug}`);
      }
    });

    cy.on("mouseover", "node", (event) => {
      const node = event.target;
      if (node.data("type") === "area") {
        return;
      }
      const neighborhood = node.closedNeighborhood();
      cy.elements().addClass("faded").removeClass("focused");
      neighborhood.removeClass("faded").addClass("focused");
    });

    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("faded focused");
      if (selectedCenterId) {
        const selected = cy.getElementById(selectedCenterId);
        if (selected.nonempty()) {
          const neighborhood = selected.closedNeighborhood();
          cy.elements().addClass("faded").removeClass("focused");
          neighborhood.removeClass("faded").addClass("focused");
        }
      }
    });

    cy.layout(buildLayout(layoutMode, compactMode) as never).run();

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [compactMode, filteredGraph, layoutMode, router, selectedCenterId]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    cy.nodes().removeClass("selected-node");
    cy.elements().removeClass("faded focused");

    if (selectedCenterId) {
      const selected = cy.getElementById(selectedCenterId);
      if (selected.nonempty()) {
        selected.addClass("selected-node focused");
        const neighborhood = selected.closedNeighborhood();
        cy.elements().addClass("faded").removeClass("focused");
        neighborhood.removeClass("faded").addClass("focused");
        cy.animate({
          fit: {
            eles: neighborhood,
            padding: 48,
          },
          duration: 250,
        });
      }
    }
  }, [selectedCenterId]);

  function toggleRelation(relationType: RelationType) {
    setActiveRelations((current) => ({
      ...current,
      [relationType]: !current[relationType],
    }));
  }

  const visibleEdgeCount = filteredGraph?.edges.length ?? 0;
  const visibleNodeCount = filteredGraph?.nodes.filter((node) => node.type !== "area").length ?? 0;

  return (
    <section id="section-graph" className="panel section-panel home-panel">
      <div className="section-heading home-section-heading">
        <p className="eyebrow">02 Connections</p>
        <div>
          <h2>Explore the knowledge graph</h2>
          <p>
            This explorer takes cues from Juggl’s layout-driven graph navigation and
            Extended Graph’s focus/filter workflow, adapted to this site’s compact atlas
            style.
          </p>
        </div>
      </div>

      <div className="graph-toolbar">
        <div className="graph-control-group">
          <label>
            <span>Layout</span>
            <select
              value={layoutMode}
              onChange={(event) => setLayoutMode(event.target.value as LayoutMode)}
            >
              <option value="force">Force</option>
              <option value="concentric">Concentric</option>
              <option value="hierarchy">Hierarchy</option>
            </select>
          </label>

          <label>
            <span>Depth</span>
            <select
              value={depth}
              onChange={(event) => onDepthChange(Number(event.target.value))}
            >
              <option value={1}>1 hop</option>
              <option value={2}>2 hops</option>
              <option value={3}>3 hops</option>
            </select>
          </label>
        </div>

        <div className="graph-control-group graph-toggles">
          <button
            type="button"
            className={`secondary-button ${compactMode ? "is-active" : ""}`}
            onClick={() => setCompactMode((current) => !current)}
          >
            {compactMode ? "Compact on" : "Compact off"}
          </button>
          <div className="graph-stats">
            <span>{visibleNodeCount} nodes</span>
            <span>{visibleEdgeCount} links</span>
          </div>
        </div>
      </div>

      <div className="relation-chip-row">
        {relationTypes
          .filter((relationType): relationType is RelationType => Boolean(relationType))
          .map((relationType) => (
            <button
              key={relationType}
              type="button"
              className={`relation-chip ${activeRelations[relationType] ? "is-active" : ""}`}
              onClick={() => toggleRelation(relationType)}
            >
              <i style={{ backgroundColor: relationColors[relationType] }} />
              {relationLabels[relationType]}
            </button>
          ))}
      </div>

      {!filteredGraph || filteredGraph.nodes.length === 0 ? (
        <div className="empty-state">
          <p>Choose a wiki entry or relax the filters to explore the graph.</p>
        </div>
      ) : (
        <div className="cytoscape-shell home-cytoscape-shell">
          <div ref={containerRef} className="cytoscape-canvas" />
        </div>
      )}
    </section>
  );
}
