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
    [key: string]: any;
};

export type GraphLink = Link & {
    source: string | GraphNode;
    target: string | GraphNode;
    isSemantic?: boolean;
    semanticScore?: number;
    color?: string;
    [key: string]: any;
};

export const linkEndpointId = (endpoint: GraphLink['source']): string =>
    typeof endpoint === 'string' ? endpoint : (endpoint as GraphNode).id;
