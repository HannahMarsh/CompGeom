const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
const points = [];
const pointRadius = 5;
let draggingPoint = null;


// Set initial canvas dimensions
function setCanvasDimensions() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

// Scale points when canvas resizes
function scalePoints(oldWidth, oldHeight, newWidth, newHeight) {
    points.forEach(point => {
        point.x = (point.x / oldWidth) * newWidth;
        point.y = (point.y / oldHeight) * newHeight;
    });
}

// Function to handle resizing
function handleResize() {
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;

        setCanvasDimensions();

        const newWidth = canvas.width;
        const newHeight = canvas.height;

        scalePoints(oldWidth, oldHeight, newWidth, newHeight);

        drawVoronoi();
        updateTable();
    }
}

// Call this on load and attach to window resize event
setCanvasDimensions();
window.addEventListener("resize", handleResize);

function addPoint(x, y) {
    const point = getPointAtPosition(x, y);
    if (!point) {
        points.push({ x, y });
        console.log(`Added point at (${x}, ${y}).`);
    }
}

// Function to compute and draw Voronoi diagram
function drawVoronoi() {

    console.log(`Canvas dimensions: ${canvas.width} x ${canvas.height}`)
    //console.log("Drawing Voronoi diagram...");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoints();

    let result;
    if (points.length > 1) {

        const voronoi = new Voronoi();
        result = voronoi.compute(points, {xl: 0, xr: canvas.width, yt: 0, yb: canvas.height});

        // Use the custom Voronoi class
        //const voronoi = new Voronoi(points.map(p => new Point(p.x, p.y)), canvas.width, canvas.height);
        // voronoi.update();

        result.edges.forEach(edge => {
            console.log(`Edge from (${edge.vb.x}, ${edge.vb.y}) to (${edge.va.x}, ${edge.va.y})`);
            ctx.beginPath();
            ctx.moveTo(edge.vb.x, edge.vb.y);
            ctx.lineTo(edge.va.x, edge.va.y);
            ctx.strokeStyle = 'black'; // Edge color
            ctx.stroke();
        });

        drawPoints(); // Redraw points on top

    } else if (points.length === 1) {
        drawPoints();
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
        addPoint(x, y)
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
            addPoint(x, y);
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
