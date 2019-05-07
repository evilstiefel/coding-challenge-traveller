'use strict';
import fs from 'fs';

const file = `${__dirname}/../assets/generatedGraph.json`;

interface IPlanetNode {
  label: string;
}

interface IPlanetEdge {
  source: number;
  target: number;
  cost: number;
}

fs.readFile(file, { encoding: 'utf-8' }, (err, data) => {
  if (err) {
    console.error('Could not open graph file for reading');
    return;
  }
  const { nodes, edges }: { nodes: IPlanetNode[], edges: IPlanetEdge[] } = JSON.parse(data);
});
