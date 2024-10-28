const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
const points = [];
let draggingPoint = null;

// Set canvas width and height based on its CSS-defined size
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Function to draw all points
function drawPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "blue";
        ctx.fill();
        ctx.stroke();
    });
}

// Add a point at the click location
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    points.push({ x, y });
    drawPoints();
});

// Check if mouse is near a point
function getPointAtPosition(x, y) {
    return points.find(point => {
        const dx = point.x - x;
        const dy = point.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 5;
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
    }
});

// Update point position while dragging
canvas.addEventListener("mousemove", (event) => {
    if (draggingPoint) {
        const rect = canvas.getBoundingClientRect();
        draggingPoint.x = event.clientX - rect.left;
        draggingPoint.y = event.clientY - rect.top;
        drawPoints();
    }
});

// Stop dragging on mouse up
canvas.addEventListener("mouseup", () => {
    draggingPoint = null;
});
