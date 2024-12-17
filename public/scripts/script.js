const canvas = document.getElementById("main-canvas");
const canvasWrapper = new Canvas(canvas);
let draggingPoint = null;

// const points = [];
// const pointRadius = 5;
// let step = 0;
// let draggingPoint = null;
// let voronoi = new Voronoi();
// let steps = [];
// let isDone = false;
// let showBeachline = true;
// let showCircles = false;
// let sweepline = 0;
// let finalEdges = [];
// Set initial canvas dimensions
// function setCanvasDimensions() {
//     canvas.width = canvas.clientWidth;
//     canvas.height = canvas.clientHeight;
// }
//
// // Scale points when canvas resizes
// function scalePoints(oldWidth, oldHeight, newWidth, newHeight) {
//     points.forEach(point => {
//         point.x = (point.x / oldWidth) * newWidth;
//         point.y = (point.y / oldHeight) * newHeight;
//     });
// }
//
// // Function to handle resizing
// function handleResize() {
//     if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
//         const oldWidth = canvas.width;
//         const oldHeight = canvas.height;
//
//         setCanvasDimensions();
//
//         const newWidth = canvas.width;
//         const newHeight = canvas.height;
//
//         scalePoints(oldWidth, oldHeight, newWidth, newHeight);
//
//         drawVoronoi();
//         updateTable();
//     }
// }
//
// // Call this on load and attach to window resize event
// setCanvasDimensions();

window.addEventListener("resize", canvasWrapper.HandleResize);

// function addPoint(x, y) {
//     const point = getPointAtPosition(x, y);
//     if (!point) {
//         points.push({ x, y });
//         console.log(`Added point at (${x}, ${y}).`);
//         document.getElementById("n").innerText = `${points.length}`;
//     }
// }
// Function to compute and draw Voronoi diagram
// function drawVoronoi() {
//
//    // console.log(`Canvas dimensions: ${canvas.width} x ${canvas.height}`)
//     //console.log("Drawing Voronoi diagram...");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     drawPoints();
//
//     let result;
//     if (points.length > 1) {
//
//         // const voronoi = new Voronoi();
//         result = voronoi.compute(points, {xl: 0, xr: canvas.width, yt: 0, yb: canvas.height});
//
//         // Use the custom Voronoi class
//         //const voronoi = new Voronoi(points.map(p => new Point(p.x, p.y)), canvas.width, canvas.height);
//         // voronoi.update();
//
//         finalEdges = result.edges;
//
//         result.edges.forEach(edge => {
//             //console.log(`Edge from (${edge.vb.x}, ${edge.vb.y}) to (${edge.va.x}, ${edge.va.y})`);
//             drawEdge(edge);
//         });
//
//         drawPoints(); // Redraw points on top
//
//     } else if (points.length === 1) {
//         drawPoints();
//     }
// }
// function updateSweepLine(y) {
//     document.getElementById("sweep-line").innerText = `y = ${Math.round(y)}`;
// }
// // Function to draw all points
// function drawPoints() {
//    // console.log("Drawing points on canvas...");
//     points.forEach((point, index) => {
//         ctx.beginPath();
//         ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
//         ctx.fillStyle = "blue";
//         ctx.fill();
//         ctx.stroke();
//         //console.log(`Point ${index + 1} drawn at (${point.x}, ${point.y}).`);
//     });
// }
// // Function to update the coordinates table
// function updateTable() {
//     //console.log("Updating points table...");
//     const tableBody = document.getElementById("points-table").querySelector("tbody");
//     tableBody.innerHTML = "";
//     points.forEach((point, index) => {
//         const row = document.createElement("tr");
//         row.innerHTML = `<td>${index + 1}</td><td>${Math.round(point.x)}</td><td>${Math.round(point.y)}</td>`;
//         tableBody.appendChild(row);
//     });
//     drawVoronoi();
//     if (points.length > 1) {
//         enableButton("visualize-fortune-button");
//         document.getElementById("add-points").hidden = true;
//     } else {
//         disableButton("visualize-fortune-button");
//         document.getElementById("add-points").hidden = false;
//     }
//     if (step > 1) {
//         redraw();
//     }
// }

// Add point on click
canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const point = canvasWrapper.GetPointAtPosition(x, y);

    if (point) {
        draggingPoint = point;
        console.log(`Started dragging point at (${point.x}, ${point.y}).`);
    } else {
        canvasWrapper.AddPoint(x, y);
        draggingPoint = canvasWrapper.GetPointAtPosition(x, y);
    }
});

// Update point position while dragging
canvas.addEventListener("mousemove", (event) => {
    if (draggingPoint) {
        const rect = canvas.getBoundingClientRect();
        draggingPoint = canvasWrapper.MovePoint(draggingPoint, event.clientX - rect.left, event.clientY - rect.top);
    }
});

// Stop dragging
canvas.addEventListener("mouseup", () => {
    draggingPoint = null;
});


// // Clear all points
// function clearAllPoints() {
//     points.length = 0;
//     document.getElementById("n").innerText = `0`;
//     console.log("Cleared all points.");
//     drawVoronoi();
//     updateTable();
//     startOver();
// }
//
// // Add random point
// function addRandomPoint() {
//     while (true) {
//         const x = Math.random() * canvas.width;
//         const y = Math.random() * canvas.height;
//         const point = getPointAtPosition(x, y);
//         if (!point) {
//             addPoint(x, y);
//             break;
//         }
//     }
//     drawVoronoi();
//     updateTable();
// }
// Check if mouse is near a point
// function getPointAtPosition(x, y) {
//     return points.find(point => {
//         const dx = point.x - x;
//         const dy = point.y - y;
//         return Math.sqrt(dx * dx + dy * dy) <= pointRadius;
//     });
// }


function disableButton(buttonId) {
    document.getElementById(buttonId).disabled = true;
}

function enableButton(buttonId) {
    document.getElementById(buttonId).disabled = false;
}

// function startOver() {
//     step = 0;
//     started = false;
//     sweepline = 0;
//     prevLines = [];
//     prevEdges = [];
//     document.getElementById("i-num").innerText = step;
//     disableButton("next-button");
//     disableButton("back-button");
//     disableButton("fast-forward-button");
//     disableButton("pause-button");
//     document.getElementById("visualize-fortune-button").innerText = "Start";
//     if (points.length > 1) {
//         enableButton("visualize-fortune-button");
//         document.getElementById("add-points").hidden = true;
//     } else {
//         disableButton("visualize-fortune-button");
//         document.getElementById("add-points").hidden = false;
//     }
// }

document.addEventListener("DOMContentLoaded", () => {
    canvasWrapper.AddRandomPoints(10);
});


// Event listeners for buttons
document.getElementById("clear-button").addEventListener("click", () => {
    console.log("Clear button clicked.");
    canvasWrapper.ClearAllPoints();
});

document.getElementById("add-random-button").addEventListener("click", () => {
    console.log("Add random point button clicked.");
    canvasWrapper.AddRandomPoint()
});

// let started = false;

document.getElementById("visualize-fortune-button").addEventListener("click", () => {
    if (canvasWrapper.IsEndOfAlgorithm()) {
        console.log("Algorithm started");
        document.getElementById("visualize-fortune-button").innerText = "Exit";
        enableButton("next-button");
        enableButton("fast-forward-button");
        isPaused = true;
        document.getElementById("pause-button").innerText = "Auto-play";
        enableButton("pause-button");
        canvasWrapper.NextTransition();
    } else {
        console.log("Algorithm stopped");
        document.getElementById("visualize-fortune-button").innerText = "Start";
        disableButton("next-button");
        disableButton("fast-forward-button");
        document.getElementById("pause-button").innerText = "Auto-play";
        disableButton("pause-button");
        isPaused = true;
        canvasWrapper.ExitAlgorithm();
    }
});

let isPaused = true;

document.getElementById("pause-button").addEventListener("click", () => {
    if (isPaused) {
        isPaused = false;
        document.getElementById("pause-button").innerText = "Pause";
        canvasWrapper.NextTransition(true, true);
        console.log("Unpaused.");
        disableButton("back-button");
        disableButton("next-button");
        disableButton("fast-forward-button");
        disableButton("visualize-fortune-button");
    } else {
        isPaused = true;
        document.getElementById("pause-button").innerText = "Auto-play";
        console.log("Paused.");
        canvasWrapper.PauseAutoPlay();

        enableButton("back-button");
        enableButton("next-button");
        enableButton("fast-forward-button");
        enableButton("visualize-fortune-button");
    }
});

document.getElementById("fast-forward-button").addEventListener("click", () => {
    console.log("Fast forward.");
    canvasWrapper.SkipTransition(3);
});

document.getElementById("next-button").addEventListener("click", () => {
    console.log("Next.");
    enableButton("back-button");
    canvasWrapper.NextTransition(true);
});

document.getElementById("back-button").addEventListener("click", () => {
    console.log("Back.");
    canvasWrapper.PreviousTransition(true);

});

document.getElementById("show-beachline").addEventListener("change", (event) => {
    console.log("Show beachline.");
    canvasWrapper.ToggleShowBeachline();
});

document.getElementById("show-circle-events").addEventListener("change", (event) => {
    console.log("Show circles.");
    canvasWrapper.ToggleShowCircles();
});

// Speed mapping
const speedMap = {
    1: 0.2,
    2: 0.3,
    3: 0.5,
    4: 0.75,
    5: 1,
    6: 1.5,
    7: 2,
    8: 2.5,
    9: 3
};

let animationSpeed = speedMap[5]; // Default speed for value 5
const speedSlider = document.getElementById("speed-slider");
const speedDisplay = document.getElementById("speed-display");

// Event listener to update speed
speedSlider.addEventListener("input", () => {
    const sliderValue = parseInt(speedSlider.value, 10);
    animationSpeed = speedMap[sliderValue];
    speedDisplay.textContent = `${animationSpeed}x`;
    console.log(`Current animation speed: ${animationSpeed}x`);
    canvasWrapper.UpdateSpeed(animationSpeed);
});



// function initializeAlgorithm() {
//     const bbox = { xl: 0, xr: canvas.width, yt: 0, yb: canvas.height };
//     step = 0;
//     document.getElementById("i-num").innerText = step;
//     let result = voronoi.computeStepByStep(points, bbox, step);
//     drawResult(result, false);
// }
//
// async function nextStep(smooth) {
//     const bbox = {xl: 0, xr: canvas.width, yt: 0, yb: canvas.height};
//
//     // for (;;) {
//     //     let oldsweep = sweepline;
//
//     if (smooth) {
//         if (isAnimating) {
//             return;
//         }
//         isAnimating = true;
//         step++;
//         document.getElementById("i-num").innerText = step;
//         let result = voronoi.computeStepByStep(points, bbox, step);
//         if (result.i < step) {
//             isDone = true;
//             // break;
//         }
//         try {
//             await drawResult(result, smooth);
//         } finally {
//             isAnimating = false;
//         }
//
//     } else {
//         step++;
//         document.getElementById("i-num").innerText = step;
//         let result = voronoi.computeStepByStep(points, bbox, step);
//         drawResult(result, smooth);
//         if (result.i < step) {
//             isDone = true;
//             // break;
//         }
//     }
//     // if (oldsweep !== result.sweepLine) {
//     //     break;
//     // }
//
//     //}
// }
//
// function redraw() {
//     const bbox = { xl: 0, xr: canvas.width, yt: 0, yb: canvas.height };
//     let result = voronoi.computeStepByStep(points, bbox, step);
//     drawResult(result, false);
// }
//
// function backStep() {
//     const bbox = { xl: 0, xr: canvas.width, yt: 0, yb: canvas.height };
//     step--;
//     document.getElementById("i-num").innerText = step;
//     let result = voronoi.computeStepByStep(points, bbox, step);
//     drawResult(result, true);
// }
//
// function drawEdge(edge) {
//     let isFinalEdge = !!finalEdges.find(e => {
//         return e.va.x === edge.va.x && e.va.y === edge.va.y && e.vb.x === edge.vb.x && e.vb.y === edge.vb.y;
//     });
//
//     ctx.beginPath();
//     ctx.moveTo(edge.vb.x, edge.vb.y);
//     ctx.lineTo(edge.va.x, edge.va.y);
//     ctx.strokeStyle = isFinalEdge ? "black" : "grey" // Edge color
//
//     ctx.lineWidth = isFinalEdge ? 2 : 1; // Set the line width
//     ctx.stroke();
// }

// function drawEdge(edge) {
//     // Generate a random color for each edge
//     const randomColor = `hsl(${Math.random() * 360}, 100%, 50%)`; // Random hue
//     ctx.beginPath();
//     ctx.moveTo(edge.vb.x, edge.vb.y);
//     ctx.lineTo(edge.va.x, edge.va.y);
//     ctx.strokeStyle = randomColor; // Assign the random color
//     ctx.stroke();
// }


// let prevLines = [];
// let prevEdges = [];
// let isAnimating = false;

// async function drawResult(result, smooth) {
//
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     result.edges.forEach(edge => {
//         drawEdge(edge);
//     });
//     points.forEach(point => {
//         drawPoint(point, "blue");
//     });
//
//     if (result.sweepLine) {
//         let s = Math.abs(sweepline, result.sweepLine) < 0.001 ? 0 : sweepline < result.sweepLine ? 1 : -1; // Determine direction
//         if (s !== 0) {
//             let arcs = result.beachlineArcs;
//             let edges = prevEdges.pop();
//             if (s < 0) {
//                 arcs = prevLines.pop()
//                 edges = result.edges;
//             } else if (s > 0) {
//                 prevLines.push(arcs)
//                 if (edges) {
//                     prevEdges.push(edges);
//                 }
//                 prevEdges.push(result.edges);
//             }
//             if (smooth) {
//                 // Smoothly move the sweep line
//
//                 if (sweepline !== result.sweepLine) {
//
//                     let sleepTime = 500 / Math.abs(result.sweepLine - sweepline)
//
//                     for (let i = sweepline; s > 0 ? i <= result.sweepLine : i >= result.sweepLine; i += s) {
//                         ctx.clearRect(0, 0, canvas.width, canvas.height);
//
//                         // Redraw edges
//                         edges?.forEach(edge => {
//                             drawEdge(edge);
//                         });
//
//                         points.forEach(point => {
//                             drawPoint(point, point.y > i ? "white" : point.y === i ? "red" : "blue");
//                         });
//
//                         // Draw moving sweep line
//                         drawHorizontalLine(i, "red");
//
//                         if (arcs && showBeachline) {
//                             drawArcs(arcs, i, "blue", 0, canvas.width)
//                         }
//                         if (result.circleEvents && showCircles) {
//                             result.circleEvents.forEach(circleEvent => {
//                                 drawCircle(circleEvent.x, circleEvent.y, circleEvent.radius);
//                             });
//                         }
//
//                         await sleep(sleepTime); // Smooth transition delay (adjust as needed)
//                     }
//
//                 }
//             } else {
//                 ctx.clearRect(0, 0, canvas.width, canvas.height);
//             }
//         } else {
//             ctx.clearRect(0, 0, canvas.width, canvas.height);
//         }
//         sweepline = result.sweepLine;
//         updateSweepLine(sweepline);
//
//         document.getElementById("arcs").innerText = `${result.beachlineArcs.length}`;
//         document.getElementById("breakpoints").innerText = result.beachlineArcs.map(arc => `(${Math.round(arc.leftBreakpoint)}, ${Math.round(arc.rightBreakpoint)})`).join(",\n").replaceAll(`Infinity`, `∞`);
//         drawHorizontalLine(sweepline, "red");
//
//         result.edges.forEach(edge => {
//             drawEdge(edge);
//         });
//         points.forEach(point => {
//             drawPoint(point, point.y > sweepline ? "white" : point.y === sweepline ? "red" : "blue");
//         });
//         if (result.beachlineArcs && showBeachline) {
//             drawArcs(result.beachlineArcs, sweepline, "blue", 0, canvas.width)
//         }
//         if (result.circleEvents && showCircles) {
//             result.circleEvents.forEach(circleEvent => {
//                 drawCircle(circleEvent.x, circleEvent.y, circleEvent.radius);
//             });
//         }
//     }
//
// }
//
// function drawParabola(h, k, d, color) {
//
// }

// function drawArcs(beachlineArcs, sweepLine, color, lbox, rbox) {
//     ctx.beginPath();
//
//     beachlineArcs.forEach(arc => {
//         const h = arc.site.x;
//         const k = arc.site.y;
//         const d = sweepLine;
//
//         // Calculate parabola for x values between breakpoints
//         let left = arc.leftBreakpoint;
//         let right = arc.rightBreakpoint;
//
//         if (Math.abs(d - k) < 0.001) {
//             // Skip infinite or degenerate cases
//             console.log("Degenerate case");
//             return;
//         }
//
//         if (left === -Infinity) {
//             left = lbox;
//         }
//
//         if (right === Infinity) {
//             right = rbox;
//         }
//
//         const st = (right - left) / 1000; // Adjust step size for smoothness
//
//         if (st > 0) {
//             for (let x = left; x <= right; x += st) {
//                 const y = ((x - h) ** 2) / (2 * (k - d)) + (k + d) / 2;
//                 if (x === left) {
//                     ctx.moveTo(x, y);
//                 } else {
//                     ctx.lineTo(x, y);
//                 }
//             }
//         }
//     });
//
//     ctx.strokeStyle = color;
//     ctx.lineWidth = 2;
//     ctx.stroke();
// }


// function drawPoint(point, color) {
//     ctx.beginPath();
//     ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
//     ctx.fillStyle = color;
//     ctx.strokeStyle = "black"; // Set the circle color
//     ctx.lineWidth = 2; // Set the line width
//     ctx.fill();
//     ctx.stroke();
// }
//
// function drawHorizontalLine(y, color) {
//     ctx.beginPath();
//     ctx.moveTo(0, y);
//     ctx.lineTo(canvas.width, y);
//     ctx.strokeStyle = color;
//     ctx.stroke();
// }
//
// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }
//
// function drawCircle(x, y, r) {
//
//
//         // Set drawing properties
//         ctx.beginPath(); // Begin a new path
//         ctx.arc(x, y, r, 0, 2 * Math.PI); // Draw the circle
//         ctx.strokeStyle = "purple"; // Set the circle color
//         ctx.lineWidth = 1; // Set the line width
//         ctx.stroke(); // Draw the stroke of the circle
//
//         // Optionally label or indicate the center point of the circle
//         ctx.beginPath();
//         ctx.arc(x, y, 2, 0, 2 * Math.PI); // Draw a small dot at the center
//         ctx.fillStyle = "red"; // Center point color
//         ctx.fill(); // Fill the center point
//
// }




