const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
const points = [];
const pointRadius = 5;
let draggingPoint = null;

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Function to compute and draw Voronoi diagram
function drawVoronoi() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoints();

    if (points.length > 1) {
        const voronoi = generateVoronoi(points.map(p => [p.x, p.y]), canvas.width, canvas.height);

        // Check if voronoi is an array of cells or a single line segment
        if (Array.isArray(voronoi)) {
            // Handle general case for multiple cells
            voronoi.forEach((cell) => {
                if (cell && cell.length > 0) {
                    ctx.beginPath();
                    if (cell.length === 2) {
                        // Special case for a single line segment
                        ctx.moveTo(cell[0].x, cell[0].y);
                        ctx.lineTo(cell[1].x, cell[1].y);
                    } else {
                        // General case for polygonal cells
                        ctx.moveTo(cell[0][0], cell[0][1]);
                        cell.forEach(([x, y]) => ctx.lineTo(x, y));
                        ctx.closePath();
                    }
                    ctx.strokeStyle = 'gray';
                    ctx.stroke();
                }
            });
        } else if (voronoi && voronoi.start && voronoi.end) {
            // Handle the special case for two points resulting in a single dividing line
            ctx.beginPath();
            ctx.moveTo(voronoi.start.x, voronoi.start.y);
            ctx.lineTo(voronoi.end.x, voronoi.end.y);
            ctx.strokeStyle = 'gray';
            ctx.stroke();
        }
    }
}



// Function to draw all points
function drawPoints() {
   // console.log("Drawing points on canvas...");
    points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "blue";
        ctx.fill();
        ctx.stroke();
        //console.log(`Point ${index + 1} drawn at (${point.x}, ${point.y}).`);
    });
}

// Function to update the coordinates table
function updateTable() {
    //console.log("Updating points table...");
    const tableBody = document.getElementById("points-table").querySelector("tbody");
    tableBody.innerHTML = "";
    points.forEach((point, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${index + 1}</td><td>${Math.round(point.x)}</td><td>${Math.round(point.y)}</td>`;
        tableBody.appendChild(row);
    });
    drawVoronoi();
}

// Add point on click
canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const point = getPointAtPosition(x, y);
    if (point) {
        draggingPoint = point;
        console.log(`Started dragging point at (${point.x}, ${point.y}).`);
    } else {
        // Store point as an object instead of an array
        points.push({ x: x, y: y });
        console.log(`Added new point at (${x}, ${y}).`);
        drawPoints();
        updateTable();
        draggingPoint = getPointAtPosition(x, y);
    }
});


// Update point position while dragging
canvas.addEventListener("mousemove", (event) => {
    if (draggingPoint) {
        const rect = canvas.getBoundingClientRect();
        draggingPoint.x = event.clientX - rect.left;
        draggingPoint.y = event.clientY - rect.top;
        //console.log(`Dragging point to (${draggingPoint.x}, ${draggingPoint.y}).`);
        drawPoints();
        updateTable();
    }
});

// Stop dragging
canvas.addEventListener("mouseup", () => {
    draggingPoint = null;
});

// Clear all points
function clearAllPoints() {
    points.length = 0;
    console.log("Cleared all points.");
    drawVoronoi();
    updateTable();
}

// Add random point
function addRandomPoint() {
    while (true) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const point = getPointAtPosition(x, y);
        if (!point) {
            points.push({ x, y });
            console.log(`Added random point at (${x}, ${y}).`);
            break;
        }
    }
    drawVoronoi();
    updateTable();
}

// Check if mouse is near a point
function getPointAtPosition(x, y) {
    return points.find(point => {
        const dx = point.x - x;
        const dy = point.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= pointRadius;
    });
}

// Event listeners for buttons
document.getElementById("clear-button").addEventListener("click", () => {
    console.log("Clear button clicked.");
    clearAllPoints();
});

document.getElementById("add-random-button").addEventListener("click", () => {
    console.log("Add random point button clicked.");
    addRandomPoint();
});

function generateVoronoi(points, width, height) {
    // Special case handling for 1 or 2 points
     // Special case handling for 1 or 2 points
     if (points.length === 1) {
        console.log("Single point detected; no Voronoi cells to generate.");
        return [[]]; // Return an array containing an empty array
    } else if (points.length === 2) {
        console.log("Two points detected; generating a single dividing line.");

        // Create a dividing line between the two points
        const [p1, p2] = points;
        const midpoint = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };

        // Determine the perpendicular bisector direction
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const perpendicular = { x: -dy / length, y: dx / length };

        // Extend line to canvas bounds
        const lineStart = {
            x: midpoint.x + perpendicular.x * width,
            y: midpoint.y + perpendicular.y * height
        };
        const lineEnd = {
            x: midpoint.x - perpendicular.x * width,
            y: midpoint.y - perpendicular.y * height
        };

        // Return the line segment as a cell array
        return [[lineStart, lineEnd]]; // Ensure it's an array of arrays for consistency
    }
    let eventQueue = initializeEventQueue(points);
    let beachline = new Beachline();
    let edges = [];

    // Process each event in order
    while (eventQueue.length > 0) {
        const event = eventQueue.pop();
        console.log("Processing event:", event);

        if (event.type === 'site') {
            handleSiteEvent(event, beachline, eventQueue, edges);
        } else if (event.type === 'circle') {
            handleCircleEvent(event, beachline, eventQueue, edges);
        }
    }

    // Extend unfinished edges to the boundaries of the canvas
    completeEdges(edges, width, height);

    // Return Voronoi cells for each point
    const cells = buildVoronoiCells(edges, points, width, height);
    console.log("Generated Voronoi cells:", cells);
    return cells;
}

function initializeEventQueue(points) {
    points.forEach((p, i) => {
        if (typeof p.x === "undefined" || typeof p.y === "undefined") {
            console.error(`Point ${i} has undefined coordinates:`, p);
        }
    });

    const queue = points.map(p => ({ type: 'site', point: p }))
        .sort((a, b) => b.point.y - a.point.y); // Priority by y-coordinate
    
    console.log("Initialized event queue:", queue);
    return queue;
}


function handleSiteEvent(event, beachline, eventQueue, edges) {
    const newPoint = event.point;
    
    // Check if newPoint.x is defined
    if (typeof newPoint.x === "undefined") {
        console.error("newPoint.x is undefined:", newPoint);
        return;
    }
    
    const splitArc = beachline.findArcAbove(newPoint.x);
    if (splitArc) {
        console.log("Splitting arc for new point:", newPoint);
        beachline.splitArc(splitArc, newPoint, edges);
    } else {
        console.log("Adding new arc for new point:", newPoint);
        beachline.addNewArc(newPoint, edges);
    }

    checkForCircleEvents(beachline, newPoint, eventQueue);
    console.log("Edges after site event:", edges);
}


function checkForCircleEvents(beachline, newPoint, eventQueue) {
    const arcTriples = beachline.getTriples();
    
    arcTriples.forEach(triple => {
        const [arcLeft, arcMiddle, arcRight] = triple;
        const circle = calculateCircumcircle(arcLeft.point, arcMiddle.point, arcRight.point);

        if (circle) {
            const circleEvent = {
                type: 'circle',
                y: circle.center.y - circle.radius,
                x: circle.center.x,
                disappearingArc: arcMiddle,
                vertex: circle.center
            };
            eventQueue.push(circleEvent);
            eventQueue.sort((a, b) => b.y - a.y);
            console.log("Added circle event:", circleEvent);
        }
    });
}


// Function to calculate the circumcircle of three points
function calculateCircumcircle(p1, p2, p3) {
    // Check if the points are collinear (no circumcircle possible)
    const d = (p1.x - p2.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p2.y);
    if (Math.abs(d) < 1e-10) return null;

    // Calculate circumcenter (x, y) and radius for the circle
    const A = p1.x * p1.x + p1.y * p1.y;
    const B = p2.x * p2.x + p2.y * p2.y;
    const C = p3.x * p3.x + p3.y * p3.y;
    const centerX = (A * (p2.y - p3.y) + B * (p3.y - p1.y) + C * (p1.y - p2.y)) / (2 * d);
    const centerY = (A * (p3.x - p2.x) + B * (p1.x - p3.x) + C * (p2.x - p1.x)) / (2 * d);
    const radius = Math.sqrt((p1.x - centerX) ** 2 + (p1.y - centerY) ** 2);

    return {
        center: { x: centerX, y: centerY },
        radius
    };
}

function handleCircleEvent(event, beachline, eventQueue, edges) {
    const { disappearingArc, vertex } = event;

    console.log("Handling circle event at vertex:", vertex);
    beachline.removeArc(disappearingArc, vertex, edges);

    checkForCircleEvents(beachline, vertex, eventQueue);
}


function completeEdges(edges, width, height) {
    edges.forEach(edge => {
        if (!edge.complete) {
            edge.extendToBounds(width, height);
        }
    });
}

function buildVoronoiCells(edges, points, width, height) {
    const cells = points.map(point => ({ site: point, edges: [] }));

    edges.forEach(edge => {
        const leftCell = cells.find(cell => cell.site === edge.left);
        const rightCell = cells.find(cell => cell.site === edge.right);

        if (leftCell) {
            leftCell.edges.push(edge);
            console.log("Assigning edge to left cell:", leftCell);
        }
        if (rightCell && rightCell !== leftCell) {
            rightCell.edges.push(edge);
            console.log("Assigning edge to right cell:", rightCell);
        }
    });

    const polygons = cells.map(cell => {
        const polygon = buildPolygonFromEdges(cell.edges, cell.site, width, height);
        console.log("Polygon for site:", cell.site, " -> ", polygon);
        return polygon;
    });

    return polygons;
}


function buildPolygonFromEdges(edges, site, width, height) {
    const vertices = [];
    
    if (edges.length === 0) {
        console.log("No edges found for site:", site);
        return vertices; // No edges, empty cell
    }

    // Start with the first edge
    let currentEdge = edges.find(edge => edge.start);
    if (!currentEdge) {
        console.log("No valid starting edge for site:", site);
        return vertices;
    }

    // Track visited edges to prevent loops
    const visitedEdges = new Set();

    while (currentEdge) {
        vertices.push(currentEdge.start);
        visitedEdges.add(currentEdge);

        // Find the next connected edge
        const nextEdge = edges.find(edge => 
            edge.start && 
            edge.start.x === currentEdge.end?.x && 
            edge.start.y === currentEdge.end?.y && 
            !visitedEdges.has(edge)
        );

        // Update the current edge, or break if no more connections
        currentEdge = nextEdge || null;
    }

    // Ensure the polygon is closed by connecting back to the start if possible
    if (!isPolygonClosed(vertices)) {
        extendPolygonToBounds(vertices, width, height);
    }

    console.log("Generated polygon vertices for site:", site, " -> ", vertices);
    return vertices;
}



// Helper to check if a polygon is closed
function isPolygonClosed(vertices) {
    if (vertices.length < 3) return false;
    const first = vertices[0];
    const last = vertices[vertices.length - 1];
    return first.x === last.x && first.y === last.y;
}

// Helper to extend the polygon to canvas boundaries for open cells
function extendPolygonToBounds(vertices, width, height) {
    vertices.forEach(vertex => {
        vertex.x = Math.min(Math.max(vertex.x, 0), width);
        vertex.y = Math.min(Math.max(vertex.y, 0), height);
    });
    console.log("Extended polygon vertices to bounds:", vertices);
}



class Beachline {
    constructor() {
        this.root = null; // The root of the binary search tree for arcs
        this.firstArc = null; // Keep track of the first arc in a linked list structure
    }

    findArcAbove(x) {
        // Ensure `x` is defined and not `NaN`
        if (typeof x === "undefined" || isNaN(x)) {
            console.error("Invalid x in findArcAbove:", x);
            return null;
        }
        
        // Return the first arc for simplicity
        if (this.firstArc) {
            console.log("Returning first arc for x =", x, ":", this.firstArc);
            return this.firstArc;
        }
        console.log("No arc found above x =", x);
        return null;
    }
    
    
    splitArc(arc, newPoint, edges) {
        const leftArc = { point: arc.point, previous: arc.previous, next: null };
        const middleArc = { point: newPoint, previous: leftArc, next: null };
        const rightArc = { point: arc.point, previous: middleArc, next: arc.next };
    
        leftArc.next = middleArc;
        middleArc.next = rightArc;
    
        if (arc.previous) arc.previous.next = leftArc;
        if (arc.next) arc.next.previous = rightArc;
    
        if (this.firstArc === arc) this.firstArc = leftArc;
    
        // Add edges with directions
        const newEdgeLeft = new Edge(newPoint, arc.point);
        newEdgeLeft.direction = calculateDirection(newPoint, arc.point);
    
        const newEdgeRight = new Edge(arc.point, newPoint);
        newEdgeRight.direction = calculateDirection(arc.point, newPoint);
    
        edges.push(newEdgeLeft, newEdgeRight);
    
        // Assign left and right site points for each edge
        newEdgeLeft.left = newPoint;
        newEdgeLeft.right = arc.point;
        newEdgeRight.left = arc.point;
        newEdgeRight.right = newPoint;
    }


    addNewArc(newPoint, edges) {
        const newArc = { point: newPoint, previous: null, next: null };
        if (isNaN(newPoint.x) || isNaN(newPoint.y)) {
            console.error("Attempted to add arc with invalid point:", newPoint);
            return;
        }

        if (!this.firstArc) {
            this.firstArc = newArc;
            this.root = newArc;  
            console.log("Added first arc:", newArc);
        } else {
            let current = this.firstArc;
            while (current.next) {
                current = current.next;
            }
            current.next = newArc;
            newArc.previous = current;
            console.log("Added new arc:", newArc);
        }
    }
    
    

    removeArc(arc, vertex, edges) {
        if (arc.previous) arc.previous.next = arc.next;
        if (arc.next) arc.next.previous = arc.previous;
    
        if (this.firstArc === arc) this.firstArc = arc.next;
    
        // Add edges connecting the vertex to neighboring arcs
        const leftEdge = new Edge(vertex, arc.previous.point);
        const rightEdge = new Edge(vertex, arc.next.point);
        edges.push(leftEdge, rightEdge);
    }
    

    getTriples() {
        // Get all consecutive triples of arcs
        const triples = [];
        let arc = this.firstArc;
        
        while (arc && arc.next && arc.next.next) {
            triples.push([arc, arc.next, arc.next.next]);
            arc = arc.next;
        }

        return triples;
    }
}

function calculateDirection(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    return { x: -dy / magnitude, y: dx / magnitude }; // Perpendicular direction
}



class Edge {
    constructor(start, end, left = null, right = null) {
        this.start = start;
        this.end = end;
        this.left = left;
        this.right = right;
        this.complete = false;
    }

    extendToBounds(width, height) {
        if (this.complete) return;
    
        if (!this.direction) {
            console.error("Edge direction is undefined for edge:", this);
            return;
        }
    
        const intersections = calculateIntersections(this.start, this.direction, width, height);
        if (intersections.length > 0) {
            this.end = intersections[0]; // Closest intersection
            this.complete = true;
        }
    }
    
}

function calculateIntersections(start, direction, width, height) {
    const intersections = [];
    const { x: x1, y: y1 } = start;
    const { x: dx, y: dy } = direction;

    // Intersect with the left edge (x = 0)
    if (dx !== 0) {
        const t = -x1 / dx;
        const y = y1 + t * dy;
        if (y >= 0 && y <= height) intersections.push({ x: 0, y });
    }

    // Intersect with the right edge (x = width)
    if (dx !== 0) {
        const t = (width - x1) / dx;
        const y = y1 + t * dy;
        if (y >= 0 && y <= height) intersections.push({ x: width, y });
    }

    // Intersect with the top edge (y = 0)
    if (dy !== 0) {
        const t = -y1 / dy;
        const x = x1 + t * dx;
        if (x >= 0 && x <= width) intersections.push({ x, y: 0 });
    }

    // Intersect with the bottom edge (y = height)
    if (dy !== 0) {
        const t = (height - y1) / dy;
        const x = x1 + t * dx;
        if (x >= 0 && x <= width) intersections.push({ x, y: height });
    }

    return intersections;
}

function calculateCircumcircle(p1, p2, p3) {
    // Check if any point has undefined or NaN coordinates
    if (!p1 || !p2 || !p3 || isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y) || isNaN(p3.x) || isNaN(p3.y)) {
        console.error("Invalid points for circumcircle calculation:", p1, p2, p3);
        return null;
    }

    const d = (p1.x - p2.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p2.y);
    if (Math.abs(d) < 1e-10) {
        console.warn("Points are collinear, no valid circumcircle for points:", p1, p2, p3);
        return null;
    }

    // Proceed with circumcircle calculation
    const A = p1.x * p1.x + p1.y * p1.y;
    const B = p2.x * p2.x + p2.y * p2.y;
    const C = p3.x * p3.x + p3.y * p3.y;
    const centerX = (A * (p2.y - p3.y) + B * (p3.y - p1.y) + C * (p1.y - p2.y)) / (2 * d);
    const centerY = (A * (p3.x - p2.x) + B * (p1.x - p3.x) + C * (p2.x - p1.x)) / (2 * d);
    const radius = Math.sqrt((p1.x - centerX) ** 2 + (p1.y - centerY) ** 2);

    if (isNaN(centerX) || isNaN(centerY) || isNaN(radius)) {
        console.error("Invalid circumcircle calculation with points:", p1, p2, p3);
        return null;
    }

    return {
        center: { x: centerX, y: centerY },
        radius
    };
}






