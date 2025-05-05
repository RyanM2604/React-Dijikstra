import csv
import json

def convert_to_json():
    # Read nodes
    nodes = {}
    with open('nodes.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            nodes[row['id']] = {
                'lat': float(row['lat']),
                'lon': float(row['lon'])
            }

    # Read edges
    edges = []
    with open('edges.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            edges.append({
                'source': row['source'],
                'target': row['target'],
                'weight': float(row['length'])
            })

    # Create graph data structure
    graph_data = {
        'nodes': nodes,
        'edges': edges
    }

    # Write to JSON file
    with open('graph_data.json', 'w') as f:
        json.dump(graph_data, f)

if __name__ == '__main__':
    convert_to_json() 