'use strict';
import fs from 'fs';

const file = `${__dirname}/../assets/generatedGraph.json`;

interface IPlanetNode {
  label: string;
}

interface INodeDistance {
  node: IPlanetNode;
  distance: number;
  visited: boolean;
}

interface IPlanetEdge {
  source: number;
  target: number;
  cost: number;
}

const getNeighbors = (startingNode: number, edges: IPlanetEdge[]): Array<{neighborNumber: number, distance: number}> => {
  return edges
    .filter((e) => e.source === startingNode || e.target === startingNode)
    .map((n) => {
      return ({
        distance: n.cost,
        neighborNumber: (n.source === startingNode) ? n.target : n.source,
      });
    });
};

const numberToLabel = (nodeNumber: number): string => {
  switch (nodeNumber) {
    case 18:
      return 'Erde';
    case 246:
      return 'b3-r7-r4nd7';
    default:
      return `node_${nodeNumber}`;
  }
};

const labelToNumber = (label: string): number => {
  switch (label) {
    case 'Erde':
      return 18;
    case 'b3-r7-r4nd7':
      return 246;
    default:
      return Number(label.replace(/\D/g, ''));
  }
};

(async () => {
  fs.readFile(file, { encoding: 'utf-8' }, (err, data) => {
    if (err) {
      console.error('Could not open graph file for reading');
      return;
    }
    const parsedData: { nodes: IPlanetNode[], edges: IPlanetEdge[] } = JSON.parse(data);

    const distanceMap = new Map<string, INodeDistance>();
    const neighborMap = new Map<string, Array<{ neighborNumber: number, distance: number}>>();
    parsedData.nodes
      .forEach((node) => distanceMap
      .set(node.label, { node, distance: (node.label === 'Erde') ? 0 : Number.POSITIVE_INFINITY, visited: (node.label === 'Erde') ? true : false }));
    parsedData.nodes.forEach((node) => {
      // The node labels are strings, but we need the numbers, so let's fix that
      const numLabel = labelToNumber(node.label);
      neighborMap.set(node.label, getNeighbors(numLabel, parsedData.edges));
    });

    // Start: 18 (Erde), Ziel: 246 (b3-r7-r4nd7)
    const currentNode = distanceMap.get('Erde');
    const nextNodes = neighborMap.get('Erde');
    while (nextNodes.length !== 0) {
      const neighbor = nextNodes.shift();
      const neighborLabel = numberToLabel(neighbor.neighborNumber);
      const neighborNode = distanceMap.get(neighborLabel);
      distanceMap.set(neighborLabel, {
        ...neighborNode,
        distance: (neighborNode.distance <= neighbor.distance) ? neighborNode.distance : neighbor.distance,
        visited: true,
      });
      const unvisitedNeighbors = neighborMap.get(neighborLabel).map((n) => {
        return distanceMap.get(numberToLabel(n.neighborNumber));
      }).filter((d) => !d.visited).map((d) => labelToNumber(d.node.label));
      console.log(unvisitedNeighbors);
    }
  });
})();
