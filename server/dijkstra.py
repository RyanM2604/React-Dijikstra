import heapq

def find_shortest_path(graph_data, start, end):
    distances = {node: float('inf') for node in graph_data['nodes']}
    distances[str(start)] = 0
    previous = {str(start): None}
    heap = [(0, str(start))]
    visited = set()

    while heap:
        current_distance, current_node = heapq.heappop(heap)
        if current_node in visited:
            continue
        visited.add(current_node)

        if current_node == str(end):
            path = []
            while current_node is not None:
                path.append(int(current_node))
                current_node = previous[current_node]
            return list(reversed(path)), current_distance

        for edge in graph_data['edges']:
            if edge['source'] == current_node:
                neighbor = edge['target']
                distance = current_distance + edge['weight']
                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    previous[neighbor] = current_node
                    heapq.heappush(heap, (distance, neighbor))

    return None, float('inf') 