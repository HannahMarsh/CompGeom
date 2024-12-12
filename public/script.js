const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
const points = [];
const pointRadius = 5;
let step = 0;
let draggingPoint = null;
let voronoi = new Voronoi();
let steps = [];
let isDone = false;


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

        // const voronoi = new Voronoi();
        result = voronoi.compute(points, {xl: 0, xr: canvas.width, yt: 0, yb: canvas.height});

        // Use the custom Voronoi class
        //const voronoi = new Voronoi(points.map(p => new Point(p.x, p.y)), canvas.width, canvas.height);
        // voronoi.update();

        result.edges.forEach(edge => {
            console.log(`Edge from (${edge.vb.x}, ${edge.vb.y}) to (${edge.va.x}, ${edge.va.y})`);
            drawEdge(edge);
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
    startOver();
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
        startOver();
    }
});

// Stop dragging
canvas.addEventListener("mouseup", () => {
    draggingPoint = null;
    startOver();
});

// Clear all points
function clearAllPoints() {
    points.length = 0;
    console.log("Cleared all points.");
    drawVoronoi();
    updateTable();
    startOver();
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
    startOver();
}



// Check if mouse is near a point
function getPointAtPosition(x, y) {
    return points.find(point => {
        const dx = point.x - x;
        const dy = point.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= pointRadius;
    });
}

function disableButton(buttonId) {
    document.getElementById(buttonId).disabled = true;
}

function enableButton(buttonId) {
    document.getElementById(buttonId).disabled = false;
}

function startOver() {
    step = 0;
    document.getElementById("i-num").innerText = step;
    disableButton("next-button");
    disableButton("back-button");
    disableButton("fast-forward-button");
    disableButton("pause-button");
    if (points.length > 1) {
        enableButton("visualize-fortune-button");
        document.getElementById("add-points").hidden = true;
    } else {
        disableButton("visualize-fortune-button");
        document.getElementById("add-points").hidden = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    for (let i = 0; i < 10; i++) {
        addRandomPoint();
    }
});


// Event listeners for buttons
document.getElementById("clear-button").addEventListener("click", () => {
    console.log("Clear button clicked.");
    clearAllPoints();
});

document.getElementById("add-random-button").addEventListener("click", () => {
    console.log("Add random point button clicked.");
    addRandomPoint();
});

document.getElementById("visualize-fortune-button").addEventListener("click", () => {
    console.log("Algorithm started");
    disableButton("clear-button");
    disableButton("add-random-button");
    disableButton("back-button");
    enableButton("next-button");
    enableButton("fast-forward-button");
    enableButton("pause-button");
    initializeAlgorithm();
});

document.getElementById("next-button").addEventListener("click", () => {
    console.log("Next.");
    enableButton("back-button");
    nextStep();
    if (isDone) {
        disableButton("next-button");
    }
});

document.getElementById("back-button").addEventListener("click", () => {
    console.log("Back.");
    backStep();
    if (step === 1) {
        disableButton("back-button");
    }
    enableButton("next-button");

});


function initializeAlgorithm() {
    const bbox = { xl: 0, xr: canvas.width, yt: 0, yb: canvas.height };
    step = 1;
    document.getElementById("i-num").innerText = step;
    let result = voronoi.computeStepByStep(points, bbox, step);
    drawResult(result);
}

function nextStep() {
    const bbox = { xl: 0, xr: canvas.width, yt: 0, yb: canvas.height };
    step++;
    document.getElementById("i-num").innerText = step;
    let result = voronoi.computeStepByStep(points, bbox, step);
    drawResult(result);
    if (result.i < step) {
        isDone = true;
    }
}

function backStep() {
    const bbox = { xl: 0, xr: canvas.width, yt: 0, yb: canvas.height };
    step--;
    document.getElementById("i-num").innerText = step;
    let result = voronoi.computeStepByStep(points, bbox, step);
    drawResult(result);
}

function visualizeStep(stepp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoints();
    stepp.beachline.forEach(section => {
        drawParabola(section.site, voronoi.bbox.yt);
    });
    stepp.edges.forEach(edge => {
        drawEdge(edge);
    });
}

function drawParabola(focus, directrix) {
    ctx.beginPath();
    const step = 1; // Precision
    for (let x = 0; x < canvas.width; x += step) {
        const y = ((x - focus.x) ** 2) / (2 * (focus.y - directrix)) + (focus.y + directrix) / 2;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "red";
    ctx.stroke();
}

function drawEdge(edge) {
    ctx.beginPath();
    ctx.moveTo(edge.vb.x, edge.vb.y);
    ctx.lineTo(edge.va.x, edge.va.y);
    ctx.strokeStyle = 'black'; // Edge color
    ctx.stroke();
}

function drawResult(result) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    result.edges.forEach(edge => {
        console.log(`Edge from (${edge.vb.x}, ${edge.vb.y}) to (${edge.va.x}, ${edge.va.y})`);
        drawEdge(edge);
    });
    drawPoints(); // Redraw points on top
    if (result.processedSites) {
        result.processedSites.forEach(site => {
            drawPoint(site, "green");
        });
    }
    if (result.unprocessedSites) {
        result.unprocessedSites.forEach(site => {
            drawPoint(site, "white");
        });
    }
    if (result.sweepLine) {
        drawHorizontalLine(result.sweepLine, "red");
    }
    if (result.beachlineArcs && result.sweepLine) {
        drawArcs(result.beachlineArcs, result.sweepLine, "blue")
    }
    if (result.circleEvents) {
        result.circleEvents.forEach(circleEvent => {
            drawCircle(result.circleEvent);
        });
    }
    if (result.beachline) {
        drawPoint({ x: result.beachline.x, y: result.beachline.y }, "red");
        // if (result.firstCircleEvent?.arc) {
        //     //drawArc(result.firstCircleEvent.arc, result.beachline.y, voronoi.bbox);
        //     drawParabola(result.firstCircleEvent.arc.site, result.beachline.y);
        // }
    }


}

function drawArcs(beachlineArcs, sweepLine, color) {
    ctx.beginPath();

    beachlineArcs.forEach(arc => {
        const h = arc.site.x;
        const k = arc.site.y;
        const d = sweepLine;

        // Calculate parabola for x values between breakpoints
        const left = arc.leftBreakpoint;
        const right = arc.rightBreakpoint;

        if (left === -Infinity || right === Infinity || d === k) {
            // Skip infinite or degenerate cases
            return;
        }

        const st = (right - left) / 1000; // Adjust step size for smoothness

        if (st > 0) {
            for (let x = left; x <= right; x += st) {
                const y = ((x - h) ** 2) / (2 * (k - d)) + (k + d) / 2;
                if (x === left) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        }
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}


function drawPoint(point, color) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
}

function drawHorizontalLine(y, color) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function drawCircle(circleEvent) {
    // Extract properties
    if (circleEvent) {
        const x = circleEvent.x; // Circle center X-coordinate
        const y = circleEvent.y; // Circle center Y-coordinate
        const r = circleEvent.radius; // Circle radius

        // Set drawing properties
        ctx.beginPath(); // Begin a new path
        ctx.arc(x, y, r, 0, 2 * Math.PI); // Draw the circle
        ctx.strokeStyle = "blue"; // Set the circle color
        ctx.lineWidth = 2; // Set the line width
        ctx.stroke(); // Draw the stroke of the circle

        // Optionally label or indicate the center point of the circle
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI); // Draw a small dot at the center
        ctx.fillStyle = "red"; // Center point color
        ctx.fill(); // Fill the center point
    }
}




