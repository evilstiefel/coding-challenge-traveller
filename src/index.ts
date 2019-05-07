'use strict';
import fs from 'fs';
import { from } from 'rxjs';
import { pairwise, map, scan, takeLast } from 'rxjs/operators';

/**
 * Lösung (Ausgabe des Programms in der Konsole):
 * The shortest path is 7 steps long (not including earth):
 * Erde -> node_810 -> node_595 -> node_132 -> node_519 -> node_71 -> node_432 -> b3-r7-r4nd7
 * Calculated cost for the path: 2.995687895999458.
 */

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

/**
 * Liefert ein Array aus der Nummer des Nachbarn und den Kosten für den Weg dorthin
 * @param startingNode Node, von der aus wir nach Nachbarn suchen
 * @param edges Alle Kanten des Graphs
 */
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

/**
 * Liefert die Kante, die zwei Knoten miteinander verbindet, sonst undefined
 * @param node1 Knoten 1
 * @param node2 Knoten 2
 * @param edges Alle Kanten des Graphs
 */
const findEdge = (node1: number, node2: number, edges: IPlanetEdge[]): IPlanetEdge | undefined => {
  return edges.find((e) => {
    return (
      (e.source === node1 && e.target === node2) ||
      (e.target === node1 && e.source === node2)
    );
  });
};

/**
 * Gegeben die Aufgabenstellung wandelt diese Funktion eine Knotennummer
 * in das zugehörige Label um
 * @param nodeNumber Nummer des Knotens
 */
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

/**
 * Gegeben die Aufgabenstellung wandelt diese Funktion ein Knotenlabel in
 * die zugehörige Nummer um
 * @param label Bezeichnung des Knotens
 */
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
  /**
   * Wir lesen die Datei asynchron ein und nutzen das Callback dann zur Berechnung
   * des Weges.
   */
  fs.readFile(file, { encoding: 'utf-8' }, (err, data) => {
    if (err) {
      console.error('Konnte die Quelldatei nicht einlesen');
      return;
    }
    const parsedData: { nodes: IPlanetNode[], edges: IPlanetEdge[] } = JSON.parse(data);

    const nodeInfoMap = new Map<string, INodeDistance>();
    const neighborMap = new Map<string, Array<{ neighborNumber: number, distance: number }>>();
    parsedData.nodes
      .forEach((node) => nodeInfoMap
        .set(node.label, { node, distance: (node.label === 'Erde') ? 0 : Number.POSITIVE_INFINITY, visited: (node.label === 'Erde') ? true : false, parent: undefined }));
    parsedData.nodes.forEach((node) => {
      const numLabel = labelToNumber(node.label);
      neighborMap.set(node.label, getNeighbors(numLabel, parsedData.edges));
    });

    // Start: 18 (Erde), Ziel: 246 (b3-r7-r4nd7)
    let currentNode = nodeInfoMap.get('Erde');
    const visited = new Map<number, boolean>();
    let nextNodes: Array<{ neighborNumber: number, distance: number }> = [];
    /**
     * Der Algorithmus ist iterativ implementiert. Solange wir einen aktuellen Knoten
     * ausgewählt haben, besuchen wir alle seine Nachbarn und berechnen die Kosten zu
     * diesen. Falls sie geringer sind, als die im Nachbarn gespeicherten, aktualisieren
     * wir dessen Kosten und setzen einen Zeiger vom Nachbarn auf den aktuellen Knoten.
     * Wenn wir alle Nachbarn durchgelaufen haben, setzen wir den aktuellen Knoten auf
     * "besucht" - besuchte Knoten werden nicht erneut angelaufen.
     * Dann aktualisieren wir ein Array von als nächstes als Ausgangsbasis zu benutzenden
     * Knoten und wiederholen den Algorithmus, bis wir keine Nachbarn mehr haben, zu denen
     * wir weiterlaufen können.
     */
    while (currentNode !== undefined) {
      const neighbors = neighborMap.get(currentNode.node.label);
      neighbors.forEach((n) => {
        const neighbor = { ...nodeInfoMap.get(numberToLabel(n.neighborNumber)) };
        const distance = currentNode.distance + n.distance;
        const isShorter = neighbor.distance > distance;
        if (isShorter) {
          neighbor.distance = distance;
          neighbor.parent = currentNode.node.label;
        }
        nodeInfoMap.set(neighbor.node.label, neighbor);
      });
      currentNode.visited = true;
      /**
       * Falls wir beim Ziel angekommen sind, Abbruch der Schleife
       */
      if (currentNode.node.label === 'b3-r7-r4nd7') {
        break;
      }
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

    // Ermittlung des Pfades durch "Rückwärtslaufen" der Parent-Bezeichner
    let currentLabel = nodeInfoMap.get('b3-r7-r4nd7').node.label;
    let path: string[] = [];
    while (currentLabel !== undefined) {
      path.push(currentLabel);
      currentLabel = nodeInfoMap.get(currentLabel).parent;
    }
    // Natürlich wollen wir nicht rückwärts fliegen, also drehen wir den Weg um
    path = path.reverse();
    /**
     * Jetzt berechnen wir noch einmal aus den paarweisen Elementen der Strecke
     * die Gesamtkosten. Nicht Teil der Aufgabenstellung, aber meines Debuggings
     */
    from(path).pipe(
      pairwise(),
      map((pair) => findEdge(labelToNumber(pair[0]), labelToNumber(pair[1]), parsedData.edges)),
      map((edge) => edge.cost),
      scan((acc, edge) => acc + edge, 0),
      takeLast(1),
    ).subscribe((sum) => {
      /**
       * Die Summe vergleichen wir mit der gespeicherten Distanz im Ziel.
       * Diese müssen identisch sein, wenn der Weg so stimmt. Wird hier
       * nicht benutzt, könnte man aber.
       */
      console.log(`The shortest path is ${path.length - 1} steps long (not including earth): `);
      console.log(path.join(' -> '));
      console.log(`Calculated cost for the path: ${sum}.`);
    });
  });
})();
