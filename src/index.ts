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
  parent: string;
}

interface IPlanetEdge {
  source: number;
  target: number;
  cost: number;
}

const getNeighbors = (startingNode: number, edges: IPlanetEdge[]): Array<{ neighborNumber: number, distance: number }> => {
  return edges
    .filter((e) => e.source === startingNode || e.target === startingNode)
    .map((n) => {
      return ({
        distance: n.cost,
        neighborNumber: (n.source === startingNode) ? n.target : n.source,
      });
    });
};

const markNodeVisited = (label: string, mapping: Map<string, INodeDistance>) => {
  let node = mapping.get(label);
  node = {
    ...node,
    visited: true,
  };
  mapping.set(label, node);
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

    const nodeInfoMap = new Map<string, INodeDistance>();
    const neighborMap = new Map<string, Array<{ neighborNumber: number, distance: number }>>();
    parsedData.nodes
      .forEach((node) => nodeInfoMap
        .set(node.label, { node, distance: (node.label === 'Erde') ? 0 : Number.POSITIVE_INFINITY, visited: (node.label === 'Erde') ? true : false, parent: undefined }));
    parsedData.nodes.forEach((node) => {
      // The node labels are strings, but we need the numbers, so let's fix that
      const numLabel = labelToNumber(node.label);
      neighborMap.set(node.label, getNeighbors(numLabel, parsedData.edges));
    });

    // Start: 18 (Erde), Ziel: 246 (b3-r7-r4nd7)
    let currentNode = nodeInfoMap.get('Erde');
    const visited = new Map<number, boolean>();
    let nextNodes: Array<{ neighborNumber: number, distance: number }> = [];
    while (currentNode !== undefined) {
      const neighbors = neighborMap.get(currentNode.node.label);
      neighbors.forEach((n) => {
        const neighbor = {...nodeInfoMap.get(numberToLabel(n.neighborNumber))};
        const distance = currentNode.distance + n.distance;
        const isShorter = neighbor.distance > distance;
        if (isShorter) {
          console.log(`Shorter, setting parent to ${currentNode.node.label}`);
          neighbor.distance = distance;
          neighbor.parent = currentNode.node.label;
        }
        nodeInfoMap.set(neighbor.node.label, neighbor);
        if (numberToLabel(n.neighborNumber) === 'b3-r7-r4nd7') {
          console.log('got to target');
        }
      });
      currentNode.visited = true;
      visited.set(labelToNumber(currentNode.node.label), true);
      nodeInfoMap.set(currentNode.node.label, currentNode);
      nextNodes.push(...neighbors);
      nextNodes = nextNodes.filter((n) => !visited.has(n.neighborNumber));
      const nextNode = nextNodes.shift();
      if (nextNode) {
        currentNode = nodeInfoMap.get(numberToLabel(nextNode.neighborNumber));
      } else {
        currentNode = undefined;
      }
    }
    console.log('finished');
    let currentLabel = nodeInfoMap.get('b3-r7-r4nd7').node.label;

    while (currentLabel !== undefined) {
      console.log(currentLabel);
      currentLabel = nodeInfoMap.get(currentLabel).parent;
    }
  });
})();
