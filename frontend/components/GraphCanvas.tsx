"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

import { GraphNode, GraphPayload, RelationType } from "@/lib/types";

cytoscape.use(dagre);

type LayoutMode = "force" | "concentric" | "hierarchy";

interface GraphCanvasProps {
  graph: GraphPayload | null;
  selectedCenterId: string | null;
  depth?: number;
  onDepthChange?: (depth: number) => void;
  showControls?: boolean;
  showRelationFilters?: boolean;
  previewHref?: string;
  onNodeSelect?: (node: GraphNode) => void;
  className?: string;
  emptyMessage?: string;
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
  defines_with: "#35a889",
  used_in_proof: "#c55b6f",
  related_to: "#7b8daf",
  worked_on: "#4a76c7",
  belongs_to_area: "#9ab2d6",
  influenced_by: "#8166d6",
};

function hashArea(area: string) {
  let hash = 0;
  for (let index = 0; index < area.length; index += 1) {
    hash = (hash * 31 + area.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function areaTheme(area: string) {
  const hue = hashArea(area || "general") % 360;
  return {
    fill: `hsla(${hue}, 78%, 83%, 0.34)`,
    border: `hsla(${hue}, 56%, 58%, 0.62)`,
    label: `hsla(${hue}, 52%, 36%, 1)`,
    nodeFill: `hsla(${hue}, 74%, 97%, 0.98)`,
    nodeBorder: `hsla(${hue}, 58%, 56%, 0.86)`,
    nodeHighlight: `hsla(${hue}, 84%, 90%, 0.98)`,
  };
}

function buildLayout(
  layoutMode: LayoutMode,
  compactMode: boolean,
  selectedCenterId: string | null,
) {
  if (layoutMode === "hierarchy") {
    return {
      name: "dagre",
      rankDir: "LR",
      rankSep: compactMode ? 64 : 112,
      nodeSep: compactMode ? 20 : 42,
      edgeSep: compactMode ? 8 : 16,
      fit: true,
      padding: compactMode ? 24 : 40,
      animate: false,
    };
  }

  if (layoutMode === "concentric") {
    return {
      name: "concentric",
      fit: true,
      padding: compactMode ? 24 : 40,
      animate: false,
      avoidOverlap: true,
      minNodeSpacing: compactMode ? 22 : 34,
      spacingFactor: compactMode ? 0.92 : 1.24,
      startAngle: -Math.PI / 2,
      concentric: (node: cytoscape.NodeSingular) => {
        if (node.id() === selectedCenterId) {
          return 100;
        }
        if (node.data("type") === "area-cluster") {
          return 0;
        }
        if (node.data("type") === "theorem") {
          return 44;
        }
        if (node.data("type") === "concept") {
          return 36;
        }
        if (node.data("type") === "mathematician") {
          return 28;
        }
        return 18;
      },
      levelWidth: () => 18,
    };
  }

  return {
    name: "cose",
    fit: true,
    padding: compactMode ? 28 : 48,
    animate: false,
    randomize: false,
    idealEdgeLength: compactMode ? 92 : 156,
    nodeRepulsion: compactMode ? 180000 : 420000,
    gravity: compactMode ? 0.32 : 0.22,
    componentSpacing: compactMode ? 30 : 64,
    nestingFactor: 0.8,
  };
}

function typeShape(type: string) {
  if (type === "theorem") {
    return "round-rectangle";
  }
  if (type === "mathematician") {
    return "diamond";
  }
  return "ellipse";
}

export function GraphCanvas({
  graph,
  selectedCenterId,
  depth = 1,
  onDepthChange,
  showControls = true,
  showRelationFilters = true,
  previewHref,
  onNodeSelect,
  className,
  emptyMessage = "No graph data matches the current selection.",
}: GraphCanvasProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("concentric");
  const [compactMode, setCompactMode] = useState(showControls ? false : true);
  const [activeRelations, setActiveRelations] = useState<Record<RelationType, boolean>>({
    defines_with: true,
    used_in_proof: true,
    related_to: true,
    worked_on: true,
    belongs_to_area: false,
    influenced_by: true,
  });

  const relationTypes = useMemo(
    () =>
      Array.from(
        new Set(
          (graph?.edges ?? [])
            .filter((edge) => edge.relation_type !== "belongs_to_area")
            .map((edge) => edge.relation_type),
        ),
      ).filter((relation): relation is RelationType => Boolean(relation)),
    [graph],
  );

  const filteredGraph = useMemo(() => {
    if (!graph) {
      return null;
    }

    const rawNodes = graph.nodes.filter((node) => node.type !== "area");
    const rawNodeIds = new Set(rawNodes.map((node) => node.id));
    const visibleEdges = graph.edges.filter(
      (edge) =>
        edge.relation_type !== "belongs_to_area" &&
        activeRelations[edge.relation_type] &&
        rawNodeIds.has(edge.source) &&
        rawNodeIds.has(edge.target),
    );
    const visibleIds = new Set<string>();
    visibleEdges.forEach((edge) => {
      visibleIds.add(edge.source);
      visibleIds.add(edge.target);
    });
    if (selectedCenterId) {
      visibleIds.add(selectedCenterId);
    }

    const nodes = rawNodes
      .filter((node) => visibleIds.has(node.id))
      .map((node) => {
        const theme = areaTheme(node.area);
        return {
          ...node,
          parent: `cluster:${node.area}`,
          nodeFill: theme.nodeFill,
          nodeBorder: theme.nodeBorder,
          nodeHighlight: theme.nodeHighlight,
        };
      });

    const areaClusters = Array.from(new Set(nodes.map((node) => node.parent)))
      .map((clusterId) => {
        const clusterNodes = nodes.filter((node) => node.parent === clusterId);
        const area = clusterNodes[0]?.area ?? "general";
        const theme = areaTheme(area);
        return {
          id: clusterId,
          title: area,
          type: "area-cluster",
          area,
          clusterFill: theme.fill,
          clusterBorder: theme.border,
          clusterLabel: theme.label,
        };
      });

    return {
      nodes: [...areaClusters, ...nodes],
      edges: visibleEdges,
    };
  }, [activeRelations, graph, selectedCenterId]);

  useEffect(() => {
    if (!containerRef.current || !filteredGraph) {
      return;
    }

    const elements: cytoscape.ElementDefinition[] = filteredGraph.nodes.map((node) => ({
      data: {
        id: node.id,
        slug: "slug" in node ? node.slug : undefined,
        label: node.title,
        type: node.type,
        area: node.area,
        parent: "parent" in node ? node.parent : undefined,
        clusterFill: "clusterFill" in node ? node.clusterFill : undefined,
        clusterBorder: "clusterBorder" in node ? node.clusterBorder : undefined,
        clusterLabel: "clusterLabel" in node ? node.clusterLabel : undefined,
        nodeFill: "nodeFill" in node ? node.nodeFill : undefined,
        nodeBorder: "nodeBorder" in node ? node.nodeBorder : undefined,
        nodeHighlight: "nodeHighlight" in node ? node.nodeHighlight : undefined,
      },
    }));

    filteredGraph.edges.forEach((edge) => {
      elements.push({
        data: {
          id: `${edge.source}:${edge.target}:${edge.relation_type}`,
          source: edge.source,
          target: edge.target,
          relationType: edge.relation_type,
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
            "font-size": compactMode ? 10 : 12,
            color: "#214f9c",
            "text-wrap": "wrap",
            "text-max-width": compactMode ? 100 : 136,
            "text-valign": "bottom",
            "text-margin-y": compactMode ? 6 : 10,
            "overlay-opacity": 0,
          },
        },
        {
          selector: 'node[type = "area-cluster"]',
          style: {
            shape: "ellipse",
            "background-color": "data(clusterFill)",
            "border-width": 1.5,
            "border-color": "data(clusterBorder)",
            color: "data(clusterLabel)",
            "font-size": compactMode ? 11 : 13,
            "font-weight": 700,
            "text-valign": "top",
            "text-halign": "center",
            "text-margin-y": compactMode ? 12 : 16,
            "padding-top": compactMode ? 26 : 34,
            "padding-bottom": compactMode ? 24 : 32,
            "padding-left": compactMode ? 28 : 38,
            "padding-right": compactMode ? 28 : 38,
            "z-compound-depth": "bottom",
          },
        },
        {
          selector: 'node[type != "area-cluster"]',
          style: {
            width: compactMode ? 18 : 24,
            height: compactMode ? 18 : 24,
            shape: (element: cytoscape.NodeSingular) => typeShape(element.data("type")),
            "background-color": "data(nodeFill)",
            "border-width": 2,
            "border-color": "data(nodeBorder)",
            "text-outline-width": 3,
            "text-outline-color": "rgba(255, 255, 255, 0.92)",
          },
        },
        {
          selector: "edge",
          style: {
            width: compactMode ? 1.2 : 1.6,
            "curve-style": "bezier",
            "line-color": "#7b8daf",
            "target-arrow-color": "#7b8daf",
            "target-arrow-shape": "triangle",
            opacity: 0.8,
            "arrow-scale": 0.7,
          },
        },
        ...Object.entries(relationColors).map(([relationType, color]) => ({
          selector: `edge[relationType = "${relationType}"]`,
          style: {
            "line-color": color,
            "target-arrow-color": color,
          },
        })),
        {
          selector: ".faded",
          style: {
            opacity: 0.16,
          },
        },
        {
          selector: ".selected-node",
          style: {
            "border-width": 4,
            "border-color": "#244da2",
            "background-color": "data(nodeHighlight)",
            width: compactMode ? 28 : 36,
            height: compactMode ? 28 : 36,
            "font-size": compactMode ? 11 : 13,
            "text-margin-y": compactMode ? 8 : 12,
            "z-index": 999,
          },
        },
      ] as any,
      wheelSensitivity: 0.15,
      minZoom: 0.35,
      maxZoom: 2.5,
    });

    cyRef.current = cy;

    cy.on("tap", (event) => {
      if (previewHref && event.target === cy) {
        router.push(previewHref as Route);
      }
    });

    cy.on("tap", "node", (event) => {
      const node = event.target;
      const data = node.data();
      if (previewHref) {
        router.push(previewHref as Route);
        return;
      }
      if (data.type === "area" || data.type === "area-cluster") {
        return;
      }

      const graphNode = filteredGraph.nodes.find(
        (item) => item.id === data.id && "slug" in item,
      ) as GraphNode | undefined;
      if (graphNode && onNodeSelect) {
        onNodeSelect(graphNode);
        return;
      }

      if (data.slug) {
        router.push(`/wiki/${data.slug}` as Route);
      }
    });

    cy.on("mouseover", "node", (event) => {
      const node = event.target;
      const neighborhood = node.closedNeighborhood();
      cy.elements().addClass("faded");
      neighborhood.removeClass("faded");
    });

    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("faded");
      if (selectedCenterId) {
        cy.getElementById(selectedCenterId).closedNeighborhood().removeClass("faded");
      }
    });

    cy.layout(buildLayout(layoutMode, compactMode, selectedCenterId) as never).run();

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [
    compactMode,
    filteredGraph,
    layoutMode,
    onNodeSelect,
    previewHref,
    router,
    selectedCenterId,
  ]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !selectedCenterId) {
      return;
    }

    cy.nodes().removeClass("selected-node");
    const selected = cy.getElementById(selectedCenterId);
    if (selected.nonempty()) {
      selected.addClass("selected-node");
      cy.animate({
        fit: {
          eles: selected.closedNeighborhood(),
          padding: 48,
        },
        duration: 260,
      });
    }
  }, [selectedCenterId]);

  const visibleNodeCount =
    filteredGraph?.nodes.filter((node) => node.type !== "area").length ?? 0;
  const visibleEdgeCount = filteredGraph?.edges.length ?? 0;

  return (
    <div className={`graph-canvas-panel ${className ?? ""}`.trim()}>
      {showControls ? (
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

            {onDepthChange ? (
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
            ) : null}
          </div>

          <div className="graph-control-group">
            <button
              type="button"
              className={`secondary-button ${compactMode ? "is-active" : ""}`}
              onClick={() => setCompactMode((current) => !current)}
            >
              {compactMode ? "Compact" : "Spacious"}
            </button>
            <div className="graph-stats">
              <span>{visibleNodeCount} nodes</span>
              <span>{visibleEdgeCount} links</span>
            </div>
          </div>
        </div>
      ) : null}

      {showRelationFilters && relationTypes.length > 0 ? (
        <div className="relation-chip-row">
          {relationTypes.map((relationType) => (
            <button
              key={relationType}
              type="button"
              className={`relation-chip ${activeRelations[relationType] ? "is-active" : ""}`}
              onClick={() =>
                setActiveRelations((current) => ({
                  ...current,
                  [relationType]: !current[relationType],
                }))
              }
            >
              <i style={{ backgroundColor: relationColors[relationType] }} />
              {relationLabels[relationType]}
            </button>
          ))}
        </div>
      ) : null}

      {!filteredGraph || filteredGraph.nodes.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
      <div className="wireframe-canvas">
          <div ref={containerRef} className="cytoscape-canvas" />
        </div>
      )}
    </div>
  );
}
