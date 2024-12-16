// const canvas = document.getElementById("main-canvas");
// const ctx = canvas.getContext("2d");

class Canvas {
  constructor(canvas, pointRadius = 5) {
    this.pointRadius = pointRadius;
    this.canvas = canvas;
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.bbox = { xl: 0, xr: this.canvas.width, yt: 0, yb: this.canvas.height };
    this.ctx = this.canvas.getContext("2d");
    this.voronoi = new Voronoi();
    this.results = [];
    this.points = [];
    this.step = 0;
    this.showBeachline = true;
    this.showCircles = false;
    this.animationSpeed = 1;
    this.interruptedAnimation = false;
    this.initialized = false;
  }

  Width() {
    return this.canvas.width;
  }

  Height() {
    return this.canvas.height;
  }


  HandleResize() {
    const oldWidth = this.Width();
    const oldHeight = this.Height();
    const newWidth = this.canvas.clientWidth
    const newHeight = this.canvas.clientHeight

    if (oldWidth !== newWidth || oldHeight !== newHeight) {
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
      this.bbox = { xl: 0, xr: this.canvas.width, yt: 0, yb: this.canvas.height };
      const wScale = newWidth / oldWidth;
      const hScale = newHeight / oldHeight;
      this.points.forEach(point => {
        point.x = point.x * wScale;
        point.y = point.y * hScale;
      });
    }
  }

  GetPointAtPosition(x, y) {
    return this.points.find(point => {
      const dx = point.x - x;
      const dy = point.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= this.pointRadius;
    });
  }

  ClearCanvas() {
    this.ctx.clearRect(0, 0, this.Width(), this.Height());
  }

  ClearAllPoints() {
    this.points.length = 0;
    this.initialized = false;
    this.ComputeVoronoi()
    this.DrawCurrentState();
  }

  AddPoint(x, y, redraw = true) {
    const point = this.GetPointAtPosition(x, y);
    if (!point) {
      this.points.push({ x, y });
      console.log(`Added point at (${x}, ${y}).`);
      if (redraw) {
        if (this.points.length > 1 && this.step === this.results.length - 1) {
          this.initialized = false;
        }
        this.ComputeVoronoi();
        this.DrawCurrentState();
      }
      if (this.points.length === 1) {
        document.getElementById("visualize-fortune-button").disabled = false;
      }
      return true;
    } else {
      return false;
    }
  }

  MovePoint(point, newX, newY) {
    if (!point) {
      return null;
    }
    let p = this.GetPointAtPosition(point.x, point.y);
    if (p) {
      let oldx = p.x;
      let oldy = p.y;
      p.x = this.GetBoundX(newX);
      p.y = this.GetBoundY(newY);
      if (oldx === p.x && oldy === p.y) {
        return p;
      }
      this.ComputeVoronoi()
      this.DrawCurrentState();
      return p;
    }
    return null;
  }

  AddRandomPoint() {
    this.AddRandomPoints(1);
  }

  AddRandomPoints(numPoints = 1) {
    for (let i = 0; i < numPoints; i++) {
      while (true) {
        const x = Math.random() * this.Width();
        const y = Math.random() * this.Height();
        if (this.AddPoint(x, y, false)) {
          break;
        }
      }
    }
    this.ComputeVoronoi()
    this.DrawCurrentState();
  }

  ComputeVoronoi() {
    this.results.length = 0;
    if (this.points.length > 1) {
      console.log("Computing Voronoi diagram.")
      let finalResult = this.voronoi.compute(this.points, this.bbox);

      let lastsweepLine = -1;
      for (let i = finalResult.i; i >= 0; i--) {
        let result = this.voronoi.computeStepByStep(this.points, this.bbox, i);
        if (result.sweepLine !== lastsweepLine) {
          lastsweepLine = result.sweepLine;
          this.results.unshift(result);
        }
      }

      if (!this.initialized) {
        this.step = this.results.length - 1; //finalResult.i;
        this.initialized = true;
      }
    } else {
      console.log("Not enough points to compute Voronoi diagram.");
    }
  }

  GetFinalResult() {
    if (this.results? this.results.length > 0 : false) {
      return this.results[this.results.length - 1];
    }
    return null;
  }

  GetCurrentResult() {
    if (this.initialized && this.step < (this.results?.length ?? 0) ) {
      return this.results[this.step];
    } else {
      return null;
    }
  }

  DrawPoint(point, outlineColor = "black", fillColor = "blue") {
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, this.pointRadius, 0, 2 * Math.PI);
    this.ctx.fillStyle = fillColor;
    this.ctx.strokeStyle = outlineColor;
    this.ctx.lineWidth = 2; // Set the line width
    this.ctx.fill();
    this.ctx.stroke();
  }

  DrawPoints() {
    if ((this.points?.length ?? 0) === 1) {
      this.points.forEach(point => {
        this.DrawPoint(point)
      });
      return true;
    }
    let drewPoints = false;
    let sweepLine = this.GetCurrentResult()?.sweepLine ?? Math.max(this.bbox.yb, this.bbox.yt);
    let inAlg = this.step < this.results.length;

    if ((this.points?.length ?? 0) > 1) {
      this.points.forEach(point => {
        drewPoints = true;
        if (inAlg) {
          this.DrawPoint(point, "black", point.y > sweepLine ? "white" : point.y < sweepLine ? "blue" : "red");
        } else {
            this.DrawPoint(point);
        }
      });
    }
    return drewPoints;
  }

  DrawEdge(edge) {
    let isFinalEdge = this.GetFinalResult()?.edges?.find(e => {
      return e.va.x === edge.va.x && e.va.y === edge.va.y && e.vb.x === edge.vb.x && e.vb.y === edge.vb.y;
    }) ?? false

    this.ctx.beginPath();
    this.ctx.moveTo(edge.vb.x, edge.vb.y);
    this.ctx.lineTo(edge.va.x, edge.va.y);
    this.ctx.strokeStyle = isFinalEdge ? "black" : "grey" // Edge color
    this.ctx.lineWidth = isFinalEdge ? 2 : 1; // Set the line width
    this.ctx.stroke();
  }

  DrawEdges() {
    let drewEdge = false;
    this.GetCurrentResult()?.edges?.forEach(edge => {
      this.DrawEdge(edge)
      drewEdge = true;
    });
    return drewEdge;
  }

  DrawHorizontalLine(y, color) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.Width(), y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  IsWithinBounds(point) {
    let x = false;
    if (this.bbox.xl < this.bbox.xr && !(point.x >= this.bbox.xl && point.x <= this.bbox.xr)) {
      return false;
    } else if (this.bbox.xl >= this.bbox.xr && !(point.x <= this.bbox.xl && point.x >= this.bbox.xr)) {
      return false;
    } else if (this.bbox.yt < this.bbox.yb && !(point.y >= this.bbox.yt && point.y <= this.bbox.yb)) {
      return false;
    } else return !(this.bbox.yt >= this.bbox.yb && !(point.y <= this.bbox.yt && point.y >= this.bbox.yb));
  }

  GetBoundX(xValue) {
    if (this.bbox.xl < this.bbox.xr) {
        return Math.min(Math.max(xValue, this.bbox.xl), this.bbox.xr);
    } else {
        return Math.min(Math.max(xValue, this.bbox.xr), this.bbox.xl);
    }
  }

  GetBoundY(yValue) {
    if (this.bbox.yt < this.bbox.yb) {
        return Math.min(Math.max(yValue, this.bbox.yt), this.bbox.yb);
    } else {
        return Math.min(Math.max(yValue, this.bbox.yb), this.bbox.yt);
    }
  }

  DrawSweepLine() {
    let drewSweepLine = false;
    if (this.GetCurrentResult()) {
      this.DrawHorizontalLine(this.GetCurrentResult()?.sweepLine, "red");
      return true;
    }
    return false;
  }

  DrawParabola(arc, sweepLine, color) {
    this.ctx.beginPath();
    const h = arc.site.x;
    const k = arc.site.y;
    const d = sweepLine;

    // Calculate parabola for x values between breakpoints
    let left = this.GetBoundX(arc.leftBreakpoint);
    let right = this.GetBoundX(arc.rightBreakpoint);

    if (Math.abs(d - k) < 0.001 || Math.abs(left - right) < 0.001) {
      // Skip infinite or degenerate cases
      console.log("Degenerate case");
      return;
    }

    if (left > right) {
      const oldLeft = left;
      left = right;
      right = oldLeft;
    }

    const st = Math.max(0.1, (right - left) / 1000);

    for (let x = left; x <= right; x += st) {
      const y = ((x - h) ** 2) / (2 * (k - d)) + (k + d) / 2;
      if (x === left) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  DrawBeachLines2(sweepLine, color = "blue") {
    let sites = this.points.filter(point => point.y < sweepLine);
    let left = Math.min(this.bbox.xl, this.bbox.xr);
    let right = Math.max(this.bbox.xl, this.bbox.xr);
    let step = (Math.abs(left - right)) / 1000;
    let first = false;

    this.ctx.beginPath();

    for (let x = left; x <= right; x += step) {
      let y = Math.max(...sites.map(site => {
        let h = site.x;
        let k = site.y;
        let d = sweepLine;
        return ((x - h) ** 2) / (2 * (k - d)) + (k + d) / 2;
      }))



      if (y < Math.max(this.bbox.yt, this.bbox.yb) && y > Math.min(this.bbox.yt, this.bbox.yb)) {
        if (first) {
          this.ctx.lineTo(x, y);
        } else {
          first = true;
        }
        this.ctx.moveTo(x, y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

    }
  }

  DrawBeachLines(result = null, sweepLine = -1, color = "blue") {
    if (result) {
      if (this.showBeachline) {
        this.DrawBeachLines2(sweepLine, color);
        return true;
      }
    }
    return false;
    //
    // if (!result) {
    //   result = this.GetCurrentResult();
    //   if (result && (sweepLine === -1)) {
    //     sweepLine = result.sweepLine;
    //   }
    // }
    //
    // let drewBeachLines = false;
    // if (this.showBeachline && result) {
    //   result.beachlineArcs?.forEach(arc => {
    //     this.DrawParabola(arc, sweepLine, color);
    //     drewBeachLines = true;
    //   });
    // }
    // return drewBeachLines;
  }

  DrawCircle(circleEvent, lineColor = "purple", centerColor = "red") {
    let x = circleEvent.x;
    let y = circleEvent.y;
    let r = circleEvent.radius;

    // Set drawing properties
    this.ctx.beginPath(); // Begin a new path
    this.ctx.arc(x, y, r, 0, 2 * Math.PI); // Draw the circle
    this.ctx.strokeStyle = lineColor; // Set the circle color
    this.ctx.lineWidth = 1; // Set the line width
    this.ctx.stroke(); // Draw the stroke of the circle

    // Optionally label or indicate the center point of the circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, 2, 0, 2 * Math.PI); // Draw a small dot at the center
    this.ctx.fillStyle = centerColor; // Center point color
    this.ctx.fill(); // Fill the center point

  }

  DrawCircleEvents() {
    let drewCircleEvents = false;
    if (this.showCircles && this.GetCurrentResult()) {
      this.GetCurrentResult().circleEvents?.forEach(circleEvent => {
        this.DrawCircle(circleEvent);
        drewCircleEvents = true;
      });
    }
    return drewCircleEvents;
  }

  NextTransition(smooth = true, autoPlay = false) {
    return this.Transition(smooth, false, autoPlay);
  }

  PreviousTransition(smooth = true, autoPlay = false) {
    return this.Transition(smooth, true, autoPlay);
  }

  SkipTransition(skip) {
    if (this.interruptedAnimation) {
        return;
    }
    this.interruptedAnimation = true;
    for (let i = 0; i < Math.abs(skip); i++) {
        if (skip > 0) {
            if (!this.NextTransition(false)) {
              break;
            }
        } else {
            if (!this.PreviousTransition(false)) {
              break;
            }
        }
    }
    this.interruptedAnimation = false;
  }

  ToggleShowBeachline() {
    this.showBeachline = !this.showBeachline;
    this.DrawCurrentState();
  }

  ToggleShowCircles() {
    this.showCircles = !this.showCircles;
    this.DrawCurrentState();
  }

  PauseAutoPlay() {
    this.interruptedAnimation = true;
  }

  GetStep() {
    return this.step;
  }

  ExitAlgorithm() {
    this.step = this.results.length - 1;
    this.DrawCurrentState();
  }

  IsEndOfAlgorithm() {
    return this.step === this.results.length - 1;
  }

  Transition(smooth = true, previous = false, autoPlay = false) {

    if ((this.points?.length ?? 0) < 2 || this.results.length <= 1) {
        return false;
    }

    let lastStep = this.step;
    let currentStep = (this.step + (previous ? -1 : 1)) % (this.results.length);
    let nextStep = (this.step + (previous ? -2 : 2)) % (this.results.length);

    this.step = currentStep;

    if ((lastStep === this.results.length - 1) && !previous) {
      lastStep = currentStep;
    } else if ((currentStep === this.results.length - 1) && !previous) {
      nextStep = currentStep;
    } else if ((lastStep === 0) && previous) {
      lastStep = currentStep;
    } else if ((currentStep === 0) && previous) {
      nextStep = currentStep;
    }

    let lastResult = this.results[lastStep];
    let currentResult = this.results[currentStep];
    let nextResult = this.results[nextStep];

    let lastSweepLine = lastResult.sweepLine;
    let currentSweepLine = currentResult.sweepLine;
    let nextSweepLine = nextResult.sweepLine;

    if (lastStep === currentStep && lastStep === 0 && !previous) {
      lastSweepLine = Math.min(this.bbox.yt, this.bbox.yb);
    }

    if (smooth && (lastSweepLine !== currentSweepLine)) {

      let valuesOfI = [];

      for (let i = lastSweepLine; previous ? i > currentSweepLine : i <= currentSweepLine; i += ((previous ? -1 : 1) * this.animationSpeed)) {
        valuesOfI.push(i);
      }

      this.Animate(valuesOfI, 0, currentResult, autoPlay);

    }
    this.DrawCurrentState();
    return true;
  }

  DrawCurrentState() {
    this.ClearCanvas();
    this.DrawEdges();
    this.DrawBeachLines();
    this.DrawCircleEvents();
    this.DrawSweepLine();
    this.DrawPoints();
  }

  Animate(valuesOfI, index, lastResult, autoPlay) {
    if (this.interruptedAnimation) {
      this.interruptedAnimation = false;
      return;
    }
    if (index >= valuesOfI.length) {
      if (autoPlay) {
        this.NextTransition(true, true)
      }
      return;
    }
    const i = valuesOfI[index];
    const frame = () => {
      if (this.interruptedAnimation) {
        this.interruptedAnimation = false;
        return;
      }
      this.ClearCanvas();
      this.DrawEdges();
      this.DrawBeachLines(lastResult, i);
      this.DrawCircleEvents();
      this.DrawHorizontalLine(i, "red");
      this.DrawPoints();
      this.Animate(valuesOfI, index + 1, lastResult, autoPlay);
    };
    requestAnimationFrame(frame);
  }
}