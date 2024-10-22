document.addEventListener('DOMContentLoaded', () => {
    const primalCanvas = document.getElementById('primal-canvas');
    const dualCanvas = document.getElementById('dual-canvas');
    const primalCtx = primalCanvas.getContext('2d');
    const dualCtx = dualCanvas.getContext('2d');
    const canvasWidth = primalCanvas.width;
    const canvasHeight = primalCanvas.height;

    // Draw the initial coordinate system for both canvases
    drawCoordinateSystem(primalCtx, canvasWidth, canvasHeight);
    drawCoordinateSystem(dualCtx, canvasWidth, canvasHeight);

    // Add event listener for clicks on the primal canvas
    primalCanvas.addEventListener('click', function(event) {
        // Get mouse position in canvas coordinates
        const rect = primalCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Translate to the coordinate system with the origin at the center
        const canvasX = (x - canvasWidth / 2) / 20;  // Scale down by 20 (to match grid scaling)
        const canvasY = -(y - canvasHeight / 2) / 20;  // Inverted because canvas Y increases downwards

        // Draw the point on the primal plane
        drawCoordinateSystem(primalCtx, canvasWidth, canvasHeight);  // Redraw the grid
        drawPoint(primalCtx, canvasX, canvasY);

        // Transform the point to the dual plane (point -> line)
        const line = transformToDual({x: canvasX, y: canvasY});
        drawCoordinateSystem(dualCtx, canvasWidth, canvasHeight);  // Redraw the grid
        drawLine(dualCtx, line.m, line.b);
    });

    // Function to transform point to line (dual)
    function transformToDual(point) {
        const m = point.x;
        const b = -point.y;
        return { m, b };
    }

    // Draw point on primal plane
    function drawPoint(ctx, x, y) {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(x * 20 + canvasWidth / 2, -y * 20 + canvasHeight / 2, 5, 0, Math.PI * 2);  // Scale and center point
        ctx.fill();
    }
    
    // Draw line on dual plane
    function drawLine(ctx, m, b) {
        ctx.strokeStyle = 'red';
        ctx.beginPath();

        // Determine the Y value at the left edge (x = 0)
        const yAtLeftEdge = b * 20 + canvasHeight / 2;

        // Determine the Y value at the right edge (x = canvas width)
        const yAtRightEdge = (m * (canvasWidth / 2) + b) * 20 + canvasHeight / 2;

        // Move to the left edge (x = 0, y = yAtLeftEdge)
        ctx.moveTo(0, yAtLeftEdge);

        // Draw line to the right edge (x = canvas width, y = yAtRightEdge)
        ctx.lineTo(canvasWidth, yAtRightEdge);

        ctx.stroke();
    }


    // Function to draw the coordinate system
    function drawCoordinateSystem(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);  // Clear canvas before drawing

        // Draw the grid
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';  // Light grey grid lines
        ctx.lineWidth = 1;
        const step = 20;  // Distance between grid lines

        for (let x = 0; x <= width; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y <= height; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw the axes
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        // Y-axis (vertical)
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();

        // X-axis (horizontal)
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }
});
