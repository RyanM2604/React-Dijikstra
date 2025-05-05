from flask import Flask, request, jsonify
from flask_cors import CORS
import csv
from heapq import heapify, heappop, heappush
import os
import json
from dijkstra import find_shortest_path

class Node:
    def __init__(self, id, lon, lat):
        self.id = int(id)
        self.lon = float(lon)
        self.lat = float(lat)

class Edge:
    def __init__(self, id, source, target, length):
        self.id = int(id)
        self.source = int(source)
        self.target = int(target)
        self.length = float(length)

class Graph:
    def __init__(self):
        self.graph = {}

    def create_edge(self, source, target, length):
        self.graph.setdefault(source, {})
        self.graph.setdefault(target, {})
        self.graph[source][target] = length

    def dijkstra(self, source):
        distances = {node: float('inf') for node in self.graph}
        distances[source] = 0
        pq = [(0, source)]
        heapify(pq)
        visited = set()
        while pq:
            curr_dist, curr_node = heappop(pq)
            if curr_node in visited:
                continue
            visited.add(curr_node)
            for neighbor, weight in self.graph[curr_node].items():
                new_dist = curr_dist + weight
                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    heappush(pq, (new_dist, neighbor))
        predecessors = {n: None for n in self.graph}
        for u in self.graph:
            for v, w in self.graph[u].items():
                if distances[u] + w == distances[v]:
                    predecessors[v] = u
        return distances, predecessors

    def shortest_path(self, source, target):
        _, pred = self.dijkstra(source)
        path = []
        node = target
        while node is not None:
            path.append(node)
            node = pred[node]
        return list(reversed(path))

node_list = []
with open('nodes.csv', newline='') as f:
    reader = csv.reader(f)
    next(reader)
    for row in reader:
        node_list.append(Node(*row))
node_dict = {n.id: (n.lat, n.lon) for n in node_list}

edge_list = []
with open('edges.csv', newline='') as f:
    reader = csv.reader(f)
    next(reader)
    for row in reader:
        _, eid, src, tgt, length, *rest = row
        edge_list.append(Edge(eid, src, tgt, length))

graph = Graph()
for e in edge_list:
    graph.create_edge(e.source, e.target, e.length)

app = Flask(__name__)
CORS(app)

def load_graph_data():
    try:
        with open('graph_data.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError:
        return None

graph_data = load_graph_data()
if not graph_data:
    exit(1)

@app.route('/api/nodes', methods=['GET'])
def get_all_nodes():
    try:
        nodes = []
        for node_id, node_data in graph_data['nodes'].items():
            nodes.append({
                'id': int(node_id),
                'lat': node_data['lat'],
                'lon': node_data['lon']
            })
        return jsonify(nodes)
    except Exception as e:
        return jsonify({'error': 'Failed to get nodes'}), 500

@app.route('/api/shortest_path', methods=['GET'])
def get_shortest_path():
    try:
        src = request.args.get('source')
        tgt = request.args.get('target')
        
        if not src or not tgt:
            return jsonify({'error': 'Source and target nodes are required'}), 400
            
        try:
            src = int(src)
            tgt = int(tgt)
        except ValueError:
            return jsonify({'error': 'Node IDs must be integers'}), 400
            
        src_str = str(src)
        tgt_str = str(tgt)
            
        if src_str not in graph_data['nodes']:
            return jsonify({'error': f'Source node {src} not found'}), 404
        if tgt_str not in graph_data['nodes']:
            return jsonify({'error': f'Target node {tgt} not found'}), 404
            
        path, distance = find_shortest_path(graph_data, src, tgt)
        
        if not path:
            return jsonify({'error': 'No path found between the nodes'}), 404
            
        coords = []
        for node_id in path:
            node = graph_data['nodes'][str(node_id)]
            coords.append({
                'lat': node['lat'],
                'lon': node['lon']
            })
            
        return jsonify({
            'coords': coords,
            'distance': distance
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    host = os.environ.get('HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=False)