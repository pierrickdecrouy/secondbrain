import type { Node, Link } from '../types';

export type GraphNode = Node & {
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    index?: number;
    val?: number;
    manualConnections?: string[];
    // ForceGraph2D/3D attaches internal simulation properties at runtime.
    [key: string]: unknown;
};

export type GraphLink = Link & {
    source: string | GraphNode;
    target: string | GraphNode;
    isSemantic?: boolean;
    semanticScore?: number;
    color?: string;
    // ForceGraph2D/3D attaches internal simulation properties at runtime.
    [key: string]: unknown;
};

export const linkEndpointId = (endpoint: GraphLink['source']): string =>
    typeof endpoint === 'string' ? endpoint : (endpoint as GraphNode).id;
