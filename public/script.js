const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
const points = [];
const colors = [];
const pointRadius = 5;
let draggingPoint = null;
//const initialColors = [5,27,40,75,100,147,173,206,242,286,336];
//const intitialIndexes = [10,6,3,8,4,7,2,9,1,5,0];
const initialColors = [286,173,65,242,100,195,40,330,135,5];


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
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    setCanvasDimensions();

    const newWidth = canvas.width;
    const newHeight = canvas.height;

    scalePoints(oldWidth, oldHeight, newWidth, newHeight);

    drawVoronoi();
    updateTable();
}

// Call this on load and attach to window resize event
setCanvasDimensions();
window.addEventListener("resize", handleResize);

function getColor(index) {
    if (index < initialColors.length) {
        return `hsl(${initialColors[index]}, 70%, 85%)`;
    } else {
        return `hsl(${calculateFurthestHue()}, 100%, 85%)`; //`hsl(${Math.random() * 360}, 70%, 85%)`;
    }
}

// Helper function to calculate the hue furthest from the existing ones
function calculateFurthestHue() {
    const existingHues = colors.map(hsl => {
        const match = hsl.match(/hsl\((\d+),/); // Regex to capture the hue value
        return match ? parseInt(match[1], 10) : null; // Parse hue as an integer
    });
    const step = 1; // Fine granularity for searching hues
    let maxDistance = -1;
    let bestHue = 0;

    for (let hue = 0; hue < 360; hue += step) {
        const minDistance = Math.min(
            ...existingHues.map(existingHue => angularDistance(hue, existingHue))
        );
        if (minDistance > maxDistance) {
            maxDistance = minDistance;
            bestHue = hue;
        }
    }

    return bestHue;
}

// Helper function to calculate angular distance between two hues
function angularDistance(h1, h2) {
    const diff = Math.abs(h1 - h2);
    return Math.min(diff, 360 - diff); // Account for circular wraparound
}

function addPoint(x, y) {
    const point = getPointAtPosition(x, y);
    if (!point) {
        points.push({ x, y });
        const color = getColor(points.length - 1); //`hsl(${Math.random() * 360}, 70%, 85%)`;
        colors.push(color);
        console.log(`Added point at (${x}, ${y}) with color ${color}.`);
    }
}

// Function to compute and draw Voronoi diagram
function drawVoronoi() {
    //console.log("Drawing Voronoi diagram...");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoints();

    if (points.length > 1) {
        const voronoi = d3.voronoi()
            .extent([[0, 0], [canvas.width, canvas.height]])
            .polygons(points.map(p => [p.x, p.y]));

        // Generate colors for each point
        // const colors = points.map(() => `hsl(${Math.random() * 360}, 70%, 80%)`);

        voronoi.forEach((cell, index) => {
            if (cell) {
                ctx.beginPath();
                ctx.moveTo(cell[0][0], cell[0][1]);
                cell.forEach(([x, y]) => ctx.lineTo(x, y));
                ctx.closePath();

                // Fill with a unique color
                ctx.fillStyle = colors[index];
                ctx.fill();

                // Stroke the outline in gray
                ctx.strokeStyle = 'black';
                ctx.stroke();
            }
        });
        // Draw the points on top of the cells
        drawPoints();
    } else if (points.length == 1) {
        // Set the fill style to the HSL color
        ctx.fillStyle = colors[0];

        // Fill the entire canvas
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
