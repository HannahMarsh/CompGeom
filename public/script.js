const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
const points = [];
const pointRadius = 5;
let draggingPoint = null;

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Function to compute and draw Voronoi diagram
function drawVoronoi() {
    //console.log("Drawing Voronoi diagram...");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoints();

    if (points.length > 1) {
        const voronoi = d3.voronoi()
            .extent([[0, 0], [canvas.width, canvas.height]])
            .polygons(points.map(p => [p.x, p.y]));

        voronoi.forEach((cell, index) => {
            ctx.beginPath();
            if (cell) {
                ctx.moveTo(cell[0][0], cell[0][1]);
                cell.forEach(([x, y]) => ctx.lineTo(x, y));
                ctx.closePath();
                ctx.strokeStyle = 'gray';
                ctx.stroke();
            }
           // console.log(`Voronoi cell for point ${index + 1} drawn.`);
        });
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
        points.push({ x, y });
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
