const canvas = document.getElementById("main-canvas");
const canvasWrapper = new Canvas(canvas);
let draggingPoint = null;


window.addEventListener("resize", canvasWrapper.HandleResize);


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
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    if (draggingPoint) {
        draggingPoint = canvasWrapper.MovePoint(draggingPoint, mouseX, mouseY);
    } else {
        let point = canvasWrapper.GetPointAtPosition(mouseX, mouseY);
        const popup = document.getElementById("popup");
        if (point) {
            canvas.style.cursor = "pointer";
            // Update popup content and position

            popup.style.display = "block";
            popup.style.left = `${event.clientX + 10}px`; // Offset popup slightly
            popup.style.top = `${event.clientY + 10}px`;
            popup.textContent = `Coordinates: (${Math.round(point.x)}, ${Math.round(point.y)})`;
        } else {
            canvas.style.cursor = "default";
            popup.style.display = "none";
        }
    }
});

// Stop dragging
canvas.addEventListener("mouseup", () => {
    draggingPoint = null;
});

function disableButton(buttonId) {
    document.getElementById(buttonId).disabled = true;
}

function enableButton(buttonId) {
    document.getElementById(buttonId).disabled = false;
}

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
    if (!canvasWrapper.IsInAlgorithm()) {
        console.log("Algorithm started");
        document.getElementById("visualize-fortune-button").innerText = "Exit";
        enableButton("next-button");
        enableButton("fast-forward-button");
        isPaused = true;
        document.getElementById("pause-button").innerText = "Auto-play";
        enableButton("pause-button");
        canvasWrapper.ToggleInAlgorithm();
        canvasWrapper.NextTransition();
    } else {
        console.log("Algorithm stopped");
        document.getElementById("visualize-fortune-button").innerText = "Start";
        disableButton("next-button");
        disableButton("fast-forward-button");
        document.getElementById("pause-button").innerText = "Auto-play";
        disableButton("pause-button");
        isPaused = true;
        canvasWrapper.ToggleInAlgorithm();
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

document.getElementById("smooth-transition").addEventListener("change", (event) => {
    console.log("Show circles.");
    canvasWrapper.ToggleSmoothTransitions()
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


