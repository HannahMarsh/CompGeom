document.addEventListener('DOMContentLoaded', () => {
    const transformBtn = document.getElementById('transform-btn');
    const pointInput = document.getElementById('point-input');
    const primalCanvas = document.getElementById('primal-canvas');
    const dualCanvas = document.getElementById('dual-canvas');
    const primalCtx = primalCanvas.getContext('2d');
    const dualCtx = dualCanvas.getContext('2d');

    // Handle transformation when button is clicked
    transformBtn.addEventListener('click', () => {
        const point = parsePoint(pointInput.value);
        if (point) {
            drawPoint(primalCtx, point.x, point.y);
            const line = transformToDual(point);
            drawLine(dualCtx, line.m, line.b);
        } else {
            alert('Please enter a valid point in the form x, y');
        }
    });

    // Function to parse point input
    function parsePoint(input) {
        const coords = input.split(',').map(coord => parseFloat(coord.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            return { x: coords[0], y: coords[1] };
        }
        return null;
    }

    // Function to transform point to line (dual)
    function transformToDual(point) {
        const m = point.x;
        const b = -point.y;
        return { m, b };
    }

    // Draw point on primal plane
    function drawPoint(ctx, x, y) {
        ctx.clearRect(0, 0, primalCanvas.width, primalCanvas.height);  // Clear canvas
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(x * 20 + 200, -y * 20 + 200, 5, 0, Math.PI * 2);  // Scaling and centering point
        ctx.fill();
    }

    // Draw line on dual plane
    function drawLine(ctx, m, b) {
        ctx.clearRect(0, 0, dualCanvas.width, dualCanvas.height);  // Clear canvas
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(0, b * 20 + 200);  // Scale and position
        ctx.lineTo(400, (m * 20 + b) * 20 + 200);
        ctx.stroke();
    }
});
