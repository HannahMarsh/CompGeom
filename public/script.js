const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
const points = [];
const pointRadius = 5;
let draggingPoint = null;

// Set canvas width and height based on its CSS-defined size
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Function to draw all points
function drawPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "blue";
        ctx.fill();
        ctx.stroke();
    });
}

// Function to update the coordinates table
function updateTable() {
    const tableBody = document.getElementById("points-table").querySelector("tbody");
    tableBody.innerHTML = ""; // Clear the table

    points.forEach((point, index) => {
        const row = document.createElement("tr");
        
        const cellIndex = document.createElement("td");
        cellIndex.textContent = index + 1;

        const cellX = document.createElement("td");
        cellX.textContent = Math.round(point.x);

        const cellY = document.createElement("td");
        cellY.textContent = Math.round(point.y);

        row.appendChild(cellIndex);
        row.appendChild(cellX);
        row.appendChild(cellY);
        tableBody.appendChild(row);
    });
}

// Check if mouse is near a point
function getPointAtPosition(x, y) {
    return points.find(point => {
        const dx = point.x - x;
        const dy = point.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= pointRadius;
    });
}

// Start dragging if clicking on a point
canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const point = getPointAtPosition(x, y);

    if (point) {
        draggingPoint = point;
    } else {
        points.push({ x, y });
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
        drawPoints();
        updateTable();
    }
});

// Stop dragging on mouse up
canvas.addEventListener("mouseup", () => {
    draggingPoint = null;
});

// Function to clear all points
function clearAllPoints() {
    points.length = 0;  // Clear the points array
    drawPoints();       // Clear the canvas
    updateTable();      // Clear the table
}

// Function to add 5 random points
function addRandomPoint() {
    while (true) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const point = getPointAtPosition(x, y);
        if (!point) {
            points.push({ x, y });
            break;
        }
    }

    drawPoints();
    updateTable();
}

// Add event listener to the "Clear All Points" button
document.getElementById("clear-button").addEventListener("click", clearAllPoints);
document.getElementById("add-random-button").addEventListener("click", addRandomPoint);