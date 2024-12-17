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
    this.showCircles = true;
    this.smoothTransitions = true;
    this.animationSpeed = 100;
    this.interruptedAnimation = false;
    this.initialized = false;
    this.circleEvents = [];
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
      this.DrawCurrentState()
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
      this.UpdateTable();
      console.log(`Added point at (${x}, ${y}).`);
      if (redraw) {
        if (this.points.length > 1 && this.step === this.results.length - 1) {
          this.initialized = false;
        }
        this.initialized = false;
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
        if (this.AddPoint(x, y, true)) {
          break;
        }
      }
    }
    this.ComputeVoronoi()
    this.DrawCurrentState();
  }

  ComputeVoronoi() {
    this.results.length = 0;
    this.circleEvents.length = 0;
    if (this.points.length > 1) {
      console.log("Computing Voronoi diagram.")
      let finalResult = this.voronoi.compute(this.points, this.bbox);

      let yValues = this.points.map(point => {
        return point.y;
      });


      yValues.sort((a, b) => {
        return a - b;
      });

      let steps = yValues.map(y => {
        return {
          y: y,
          step1: 0,
          step2: 0,
          circleEvents: [],
          edges: [],
          numArcs: 0
        }
      })

      let lastsweepLine = -1;
      for (let i = 0; i <= finalResult.i; i++) {
        let result = this.voronoi.computeStepByStep(this.points, this.bbox, i);
        let st = steps.find(step => {
            return Math.abs(step.y - result.sweepLine) < 0.001;
        });
        if (!st) {
          st = steps.find(step => {
            return Math.abs(step.y - lastsweepLine) < 0.001;
          });
        }
        if (st) {
          st.numArcs = Math.max(st.numArcs, result.beachlineArcs?.length ?? 0);
          result.circleEvents?.forEach(circleEvent => {
            if (!st.circleEvents.find(ce => {
              return ce.x === circleEvent.x && ce.y === circleEvent.y && ce.radius === circleEvent.radius;
            })) {
              st.circleEvents.push({
                x: circleEvent.x,
                y: circleEvent.y,
                radius: circleEvent.radius
              });
            }
          });
          if (result.sweepLine !== lastsweepLine) {
            let s = steps.find(step => {
              return step.y === result.sweepLine;
            });
            if (s) {
              s.step1 = i;
            }
            if (lastsweepLine !== -1) {
              steps.find(step => {
                return step.y === lastsweepLine;
              }).step2 = i - 1;
            }
            lastsweepLine = result.sweepLine;
          }
        }
      }

      let maxY = Math.max(...yValues);
        let st = steps.find(step => {
          return Math.abs(step.y - maxY) < 0.001;
        });
        if (st) {
          finalResult.edges.forEach(edge => {
              st.edges.push({
                va: {
                  x: edge.va.x,
                  y: edge.va.y
                },
                vb: {
                  x: edge.vb.x,
                  y: edge.vb.y
                }
              });
          })
        }

      lastsweepLine = -1;
      for (let i = finalResult.i - 1; i >= 0; i--) {
        let result = this.voronoi.computeStepByStep(this.points, this.bbox, i);
        if (result.sweepLine !== lastsweepLine) {
          lastsweepLine = result.sweepLine;
          if (result.sweepLine !== maxY) {
            let st = steps.find(step => {
              return Math.abs(step.y - result.sweepLine) < 0.001;
            });
            if (st) {
              result.edges.forEach(edge => {
                if (!st.edges.find(e => {
                  return this.Equals(e.va.x, edge.va.x) && this.Equals(e.va.y, edge.va.y) && this.Equals(e.vb.x, edge.vb.x) && this.Equals(e.vb.y, edge.vb.y);
                  //e.va.x === edge.va.x && e.va.y === edge.va.y && e.vb.x === edge.vb.x && e.vb.y === edge.vb.y;
                })) {
                  st.edges.push({
                    va: {
                      x: edge.va.x,
                      y: edge.va.y
                    },
                    vb: {
                      x: edge.vb.x,
                      y: edge.vb.y
                    }
                  });
                } else {
                  console.log("Edge already exists.")
                }
              })
            }
          }
        }
      }

      this.results = steps;

      if (!this.initialized) {
        this.step = this.results.length - 1; //finalResult.i;
        this.UpdateStep();
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

  Equals(a, b) {
    return Math.abs(a - b) < 0.001;
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

  ToggleSmoothTransitions() {
    this.smoothTransitions = !this.smoothTransitions;
  }

  DrawPoints() {
    if (!this.initialized || (this.points?.length ?? 0) === 1) {
      this.points.forEach(point => {
        this.DrawPoint(point)
      });
      return true;
    }
    let drewPoints = false;
    let sweepLine = this.GetCurrentResult()?.y ?? Math.max(this.bbox.yb, this.bbox.yt);
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

  DrawEdges(step = -1) {
    if (step === -1) {
      step = this.step;
    }
    let drewEdge = false;
    this.results[step]?.edges?.forEach(edge => {
      this.DrawEdge(edge)
      drewEdge = true;
    });
    return drewEdge;
  }

  DrawHorizontalLine(y, color) {
    if (y) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.Width(), y);
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
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
      this.DrawHorizontalLine(this.GetCurrentResult()?.y, "red");
      return true;
    }
    return false;
  }

  DrawBeachLines2(sweepLine = -1, color = "blue") {
    if (sweepLine === -1) {
        sweepLine = this.GetCurrentResult()?.y ?? -1;
    }
    if (this.showBeachline && sweepLine !== -1 && this.step < this.results.length - 1) {
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
  }

  DrawBeachLines(sweepLine = -1, fillColor = "rgba(0, 0, 255, 0.2)") {
    if (sweepLine === -1) {
      sweepLine = this.GetCurrentResult()?.y ?? -1;
    }

    if (this.showBeachline && sweepLine !== -1 && this.step < this.results.length - 1) {
      let sites = this.points.filter(point => point.y < sweepLine);
      let left = Math.min(this.bbox.xl, this.bbox.xr);
      let right = Math.max(this.bbox.xl, this.bbox.xr);
      let step = (Math.abs(left - right)) / 1000;

      this.ctx.beginPath(); // Start path

      // Move to the top-left corner of the bounding box
      this.ctx.moveTo(left, Math.min(this.bbox.yt, this.bbox.yb));

      // Draw the parabola curve
      for (let x = left; x <= right; x += step) {
        let y = Math.max(...sites.map(site => {
          let h = site.x;
          let k = site.y;
          let d = sweepLine;
          return ((x - h) ** 2) / (2 * (k - d)) + (k + d) / 2;
        }));

        // Draw the curve but only within the bounding box
        if (y < Math.max(this.bbox.yt, this.bbox.yb) && y > Math.min(this.bbox.yt, this.bbox.yb)) {
          this.ctx.lineTo(x, y);
        }
      }

      // Close the path upwards to the top boundary
      this.ctx.lineTo(right, Math.min(this.bbox.yt, this.bbox.yb)); // Top-right corner
      this.ctx.lineTo(left, Math.min(this.bbox.yt, this.bbox.yb));  // Back to top-left corner

      // Set fill style and fill the area above the parabola
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();

      // Stroke the beach line curve
      this.ctx.strokeStyle = "white";
      this.ctx.lineWidth = 0;
      this.ctx.stroke();

      this.ctx.closePath();

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
          this.ctx.strokeStyle = "blue";
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        }

      }
    }
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
    if (this.showCircles && this.GetCurrentResult() && this.step < this.results.length - 1) {
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

  UpdateTable() {
    //console.log("Updating points table...");
    const tableBody = document.getElementById("points-table").querySelector("tbody");
    tableBody.innerHTML = "";
    this.points.sort((a, b) => {return a.y - b.y}).forEach((point, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${index + 1}</td><td>${Math.round(point.x)}</td><td>${Math.round(point.y)}</td>`;
      tableBody.appendChild(row);
    });
  }

  GetStep() {
    return this.step;
  }

  ExitAlgorithm() {
    this.step = this.results.length - 1;
    this.UpdateStep();
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

    // this.step = currentStep;
    // this.UpdateStep();

    if ((lastStep === this.results.length - 1) && (currentStep === 0) && !previous) {
      lastStep = currentStep; // lastStep = currentStep;
    } else if ((lastStep === 0) && previous) {
      lastStep = currentStep;
    }

    let lastResult = this.results[lastStep];
    let currentResult = this.results[currentStep];

    let lastSweepLine = lastResult.y;
    let currentSweepLine = currentResult.y;

    if (lastStep === currentStep && lastStep === 0 && !previous) {
      lastSweepLine = Math.min(this.bbox.yt, this.bbox.yb);
    } if (lastStep === currentStep && lastStep === 0 && previous) {
      currentSweepLine = Math.min(this.bbox.yt, this.bbox.yb);
    } else if (lastStep === currentStep && lastStep === this.results.length - 1 && previous) {
      lastSweepLine = Math.max(this.bbox.yt, this.bbox.yb);
    } else if (lastStep === currentStep && lastStep === this.results.length - 1 && !previous) {
      currentSweepLine = Math.max(this.bbox.yt, this.bbox.yb);
    }

    if (smooth && this.smoothTransitions && (lastSweepLine !== currentSweepLine)) {

      let valuesOfI = [];

      let step = (previous ? -1 : 1) * Math.max(0.3, Math.abs((currentSweepLine - lastSweepLine) / this.animationSpeed));

      for (let i = lastSweepLine; previous ? i > currentSweepLine : i <= currentSweepLine; i += step) {
        valuesOfI.push(i);
      }

      if (currentStep === this.results.length - 1 && !previous) {
        this.Animate(valuesOfI, 0, currentStep, autoPlay);
      } else {
        this.Animate(valuesOfI, 0, currentStep, autoPlay);
      }

    } else {
      this.step = currentStep;
      this.UpdateStep();
      this.DrawCurrentState();
    }
    return true;
  }

  DrawCurrentState() {
    this.ClearCanvas();
    this.DrawEdges();
    this.DrawBeachLines();
    this.DrawCircleEvents();
    this.DrawSweepLine();
    this.DrawPoints();
    this.UpdateSweepLine(this.GetCurrentResult()?.y ?? Math.min(this.bbox.yt, this.bbox.yb));
  }

  UpdateSpeed(speed) {
    this.animationSpeed = 100 / speed;
  }

  UpdateSweepLine(y) {
    document.getElementById("sweep-line").innerText = `y = ${Math.round(y)}`;
  }

  UpdateStep() {
    document.getElementById("i-num").innerText = `${Math.round(this.step)}`;
    this.UpdateArcs();
    this.UpdateEdges();
  }

  UpdateArcs() {
    document.getElementById("arcs").innerText = `${this.GetCurrentResult()?.numArcs ?? 0}`;
  }

  UpdateEdges() {
    let numEdges = this.GetCurrentResult()?.edges?.filter(
        (edge) => {
            return edge.va.x !== edge.vb.x && edge.va.y !== edge.vb.y;
        }
    )?.length ?? 0;
    document.getElementById("edges").innerText = `${numEdges}`;
  }

  Animate(valuesOfI, index, step, autoPlay) {
    if (this.interruptedAnimation) {
      this.interruptedAnimation = false;
      this.step = step;
      this.UpdateStep();
      this.DrawCurrentState();
      this.DrawHorizontalLine(valuesOfI[valuesOfI.length - 1], "red");
      return;
    }
    if (index >= valuesOfI.length) {
      this.step = step;
      this.UpdateStep();
      this.DrawCurrentState();
      this.DrawHorizontalLine(valuesOfI[valuesOfI.length - 1], "red");
      if (autoPlay) {
        requestAnimationFrame(() => this.NextTransition(true, true));
      }
      return;
    }
    const i = valuesOfI[index];
    const frame = () => {
      if (this.interruptedAnimation) {
        this.interruptedAnimation = false;
        this.step = step;
        this.UpdateStep();
        this.DrawCurrentState();
        this.DrawHorizontalLine(valuesOfI[valuesOfI.length - 1], "red");
        return;
      }
      this.UpdateSweepLine(i);
      this.ClearCanvas();
      this.DrawEdges(step);
      this.DrawBeachLines(i);
      this.DrawCircleEvents();
      this.DrawHorizontalLine(i, "red");
      this.DrawPoints();
      this.Animate(valuesOfI, index + 1, step, autoPlay);
    };
    requestAnimationFrame(frame);
  }
}