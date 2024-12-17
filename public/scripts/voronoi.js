class Cell {
    constructor(site) {
        this.site = site; // voronoi site
        this.halfedges = []; // cell boundary
    }

    // removes halfedges and sorts them counterclockwise
    prepareHalfedges() {
        let iHalfedge = this.halfedges.length;

        while (iHalfedge--) {
            const edge = this.halfedges[iHalfedge].edge;
            if (!edge.va || !edge.vb) {
                this.halfedges.splice(iHalfedge, 1);
            }
        }

        this.halfedges.sort((a, b) => b.angle - a.angle); // sort counterclockwise
        return this.halfedges.length;
    }
}

class Halfedge {
    constructor(edge, lSite, rSite) {
        this.site = lSite; // site to the left
        this.edge = edge;

        // calculate angle to sort by; use perpendicular line if no rSite
        if (rSite) {
            this.angle = Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x);
        } else {
            const { va, vb } = edge;
            this.angle = edge.lSite === lSite
                ? Math.atan2(vb.x - va.x, va.y - vb.y)
                : Math.atan2(va.x - vb.x, vb.y - va.y);
        }
    }

    getStartpoint() {
        return this.edge.lSite === this.site ? this.edge.va : this.edge.vb;
    }

    getEndpoint() {
        return this.edge.lSite === this.site ? this.edge.vb : this.edge.va;
    }
}

class Edge {
    constructor(lSite, rSite, va = null, vb = null) {
        this.lSite = lSite;
        this.rSite = rSite;
        this.va = va; // starting vertex
        this.vb = vb; // ending vertex
    }

    setEdgeStartpoint(lSite, rSite, vertex) {
        if (!this.va && !this.vb) {
            this.va = vertex;
            this.lSite = lSite;
            this.rSite = rSite;
        } else if (this.lSite === rSite) {
            this.vb = vertex;
        } else {
            this.va = vertex;
        }
    }

    setEdgeEndpoint(lSite, rSite, vertex) {
        this.setEdgeStartpoint(rSite, lSite, vertex);
    }

}

class Diagram {
    constructor(site) {
        this.site = site;
    }
}

class Vertex {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Beachsection {
    constructor(site) {
        this.site = site;
    }
}

class CircleEvent {
    constructor() {
        this.arc = null;
        this.rbLeft = this.rbRight = null;
        this.rbPrevious = this.rbNext = null;
        this.rbParent = null;
        this.rbRed = false;
        this.site = null;
    }

}

class Voronoi {

    constructor() {
        // initialization of main structures
        this.vertices = [];
        this.edges = [];
        this.cells = [];

        // BBST for beachline and circle events
        this.beachline = new RedBlackTree();
        this.circleEvents = new RedBlackTree();
        this.firstCircleEvent = null;
    }

    // utility functions for floating point stuff

    eqEps(a, b) {
        return Math.abs(a - b) < 1e-9;
    }
    gtEps(a, b) {
        return a - b > 1e-9;
    }
    ltEps(a, b) {
        return b - a > 1e-9;
    }

    // resets internal state
    reset() {
        this.beachline = new RedBlackTree();
        this.circleEvents = new RedBlackTree();
        this.firstCircleEvent = null;
        this.vertices = [];
        this.edges = [];
        this.cells = [];
    }

    createVertex(x, y) {
        const v = new Vertex(x, y);
        this.vertices.push(v);
        return v;
    }

    createEdge(lSite, rSite, va, vb) {
        const edge = new Edge(lSite, rSite, null, null);
        this.edges.push(edge);
        
        if (va) edge.setEdgeStartpoint(lSite, rSite, va);
        if (vb) edge.setEdgeEndpoint(lSite, rSite, vb);

        // create halfedges for the left and right sites
        this.cells[lSite.voronoiId].halfedges.push(new Halfedge(edge, lSite, rSite));
        this.cells[rSite.voronoiId].halfedges.push(new Halfedge(edge, rSite, lSite));
        return edge;
    }

    createBorderEdge(lSite, va, vb) {
        const edge = new Edge(lSite, null, va, vb);
        this.edges.push(edge);
        return edge;
    }

    leftBreakPoint(arc, sweepLineY) {
        if (this.eqEps(arc.site.y, sweepLineY)) return arc.site.x; // degenerate case: focus is on the sweepLineY
        if (!arc.rbPrevious) return -Infinity; // no predecessor means breakpoint is at -Infinity
        if (this.eqEps(arc.rbPrevious.site.y, sweepLineY)) return arc.rbPrevious.site.x; // degenerate case: left focus is on the sweepLineY
        const hl = arc.rbPrevious.site.x - arc.site.x; // horizontal distance between focuses
        const aby2 = (1 / (arc.site.y - sweepLineY)) - (1 / (arc.rbPrevious.site.y - sweepLineY)); // difference in coefficients
        if (!aby2) return (arc.site.x + arc.rbPrevious.site.x) / 2; // special case: parabolas are equidistant so return midpoint between focus

        // solve for the breakpoint using quadratic formula
        const b = hl / (arc.rbPrevious.site.y - sweepLineY); // linear term in the quadratic equation
        const discriminant = (b * b) - (2 * aby2) * (
            (hl * hl / (-2 * (arc.rbPrevious.site.y - sweepLineY))) - arc.rbPrevious.site.y +
            ((arc.rbPrevious.site.y - sweepLineY) / 2) + arc.site.y - ((arc.site.y - sweepLineY) / 2)
        );
        return (-b + Math.sqrt(discriminant)) / aby2 + arc.site.x;
    }

    rightBreakPoint(arc, sweepLineY) {
        // the right breakpoint is the left breakpoint of the right neighbor
        if (arc.rbNext) return this.leftBreakPoint(arc.rbNext, sweepLineY);

        // fallback: if no right neighbor exists
        return arc.site.y === sweepLineY ? arc.site.x : Infinity;
    }


    detachBeachsection(beachsection) {
        this.detachCircleEvent(beachsection); // detach potentially attached circle event
        this.beachline.Remove(beachsection); // remove from RB-tree
    }

    removeBeachsection(beachsection) {
        const circle = beachsection.circleEvent;
        const x = circle.x;
        const y = circle.ycenter;
        const vertex = this.createVertex(x, y);

        // get neighboring arcs
        let previous = beachsection.rbPrevious;
        let next = beachsection.rbNext;
        const disappearingTransitions = [beachsection];
        const abs_fn = Math.abs;

        // remove the collapsed beach section from the beachline
        this.detachBeachsection(beachsection);

        // look left
        let lArc = previous;
        while (lArc.circleEvent && abs_fn(x - lArc.circleEvent.x) < 1e-9 && abs_fn(y - lArc.circleEvent.ycenter) < 1e-9) {
            previous = lArc.rbPrevious;
            disappearingTransitions.unshift(lArc);
            this.detachBeachsection(lArc);
            lArc = previous;
        }

        // add the leftmost arc
        disappearingTransitions.unshift(lArc);
        this.detachCircleEvent(lArc);

        // look right
        let rArc = next;
        while (rArc.circleEvent && abs_fn(x - rArc.circleEvent.x) < 1e-9 && abs_fn(y - rArc.circleEvent.ycenter) < 1e-9) {
            next = rArc.rbNext;
            disappearingTransitions.push(rArc);
            this.detachBeachsection(rArc);
            rArc = next;
        }

        // add the rightmost arc
        disappearingTransitions.push(rArc);
        this.detachCircleEvent(rArc);

        // set the start point for edges between disappearing transitions
        const nArcs = disappearingTransitions.length;
        for (let iArc = 1; iArc < nArcs; iArc++) {
            rArc = disappearingTransitions[iArc];
            lArc = disappearingTransitions[iArc - 1];
            rArc.edge.setEdgeStartpoint(lArc.site, rArc.site, vertex);
        }

        // create a new edge between leftmost and rightmost arcs
        lArc = disappearingTransitions[0];
        rArc = disappearingTransitions[nArcs - 1];
        rArc.edge = this.createEdge(lArc.site, rArc.site, undefined, vertex);

        // check for circle events
        this.attachCircleEvent(lArc);
        this.attachCircleEvent(rArc);
    }

    addBeachsection(site) {
        const x = site.x, directrix = site.y;
        let lArc, rArc, dxl, dxr;

        let node = this.beachline.root;
        while (node) {
            dxl = this.leftBreakPoint(node, directrix) - x;
            if (dxl > 1e-9) {
                node = node.rbLeft; // move left if x falls before the left edge
            } else {
                dxr = x - this.rightBreakPoint(node, directrix);
                if (dxr > 1e-9) {
                    node = node.rbRight; // move right if x falls after the right edge
                } else {
                    if (dxl > -1e-9) {
                        lArc = node.rbPrevious;
                        rArc = node;
                    } else if (dxr > -1e-9) {
                        lArc = node;
                        rArc = node.rbNext;
                    } else {
                        lArc = rArc = node; // x falls within the existing arc
                    }
                    break;
                }
            }
        }

        const newArc = new Beachsection(site);
        this.beachline.Insert(lArc, newArc);

        // case 1: first beach section on the beachline
        if (!lArc && !rArc) {
            return;
        }

        // case 2: new section splits an existing section
        if (lArc === rArc) {
            this.detachCircleEvent(lArc); // invalidate circle event for the split arc
            rArc = new Beachsection(lArc.site); // duplicate the split arc
            this.beachline.Insert(newArc, rArc);

            // create a new edge between the two new transitions
            newArc.edge = rArc.edge = this.createEdge(lArc.site, newArc.site);

            // check for collapsing arcs and create circle events
            this.attachCircleEvent(lArc);
            this.attachCircleEvent(rArc);
            return;
        }

        // case 3: new section is the last one on the beachline
        if (lArc && !rArc) {
            newArc.edge = this.createEdge(lArc.site, newArc.site);
            return;
        }

        // case 4: new section falls exactly between two existing sections
        if (lArc !== rArc) {
            this.detachCircleEvent(lArc);
            this.detachCircleEvent(rArc);

            // calculate the new vertex where the old transition disappears
            const lSite = lArc.site;
            const ax = lSite.x, ay = lSite.y;
            const bx = site.x - ax, by = site.y - ay;
            const rSite = rArc.site;
            const cx = rSite.x - ax, cy = rSite.y - ay;

            const d = 2 * (bx * cy - by * cx); // determinant
            const hb = bx * bx + by * by;
            const hc = cx * cx + cy * cy;
            const vertex = this.createVertex(
                (cy * hb - by * hc) / d + ax,
                (bx * hc - cx * hb) / d + ay
            );

            // create new edges at the vertex
            rArc.edge.setEdgeStartpoint(lSite, rSite, vertex);
            newArc.edge = this.createEdge(lSite, site, undefined, vertex);
            rArc.edge = this.createEdge(site, rSite, undefined, vertex);

            // check for potential circle events for the neighboring arcs
            this.attachCircleEvent(lArc);
            this.attachCircleEvent(rArc);
        }
    }

    attachCircleEvent(arc) {
        // get the neighboring arcs (left and right)
        const lArc = arc.rbPrevious, rArc = arc.rbNext;

        // exit early if no valid neighbors exist
        if (!lArc || !rArc) return;

        // extract site positions for left, current, and right arcs
        const lSite = lArc.site,
            cSite = arc.site,
            rSite = rArc.site;

        // skip if left and right sites are identical (no valid circle)
        if (lSite === rSite) return;

        // calculate relative positions with origin at cSite
        const bx = cSite.x, by = cSite.y; // center site (origin)
        const ax = lSite.x - bx, ay = lSite.y - by; // left site
        const cx = rSite.x - bx, cy = rSite.y - by; // right site

        // check if points l -> c -> r are clockwise; skip if not
        const d = 2 * (ax * cy - ay * cx); // determinant
        if (d >= -2e-12) return; // precision safeguard

        // compute center of the circumcircle relative to cSite
        const ha = ax * ax + ay * ay; // squared distance from lSite to cSite
        const hc = cx * cx + cy * cy; // squared distance from rSite to cSite
        const x = (cy * ha - ay * hc) / d; // x offset
        const y = (ax * hc - cx * ha) / d; // y offset
        const ycenter = y + by; // absolute y-coordinate of center

        // create a new circle event
        const circleEvent = new CircleEvent();
        circleEvent.arc = arc;
        circleEvent.site = cSite;
        circleEvent.x = x + bx; // absolute x-coordinate of center
        circleEvent.y = ycenter + Math.sqrt(x * x + y * y); // bottom of the circle
        circleEvent.ycenter = ycenter;

        // attach the circle event to the arc
        arc.circleEvent = circleEvent;

        // find the insertion point in the circle event RB-tree
        let node = this.circleEvents.root;
        let predecessor = null;

        while (node) {
            // compare circle events based on y (then x if equal)
            if (circleEvent.y < node.y || (circleEvent.y === node.y && circleEvent.x <= node.x)) {
                if (node.rbLeft) {
                    node = node.rbLeft;
                } else {
                    predecessor = node.rbPrevious;
                    break;
                }
            } else {
                if (node.rbRight) {
                    node = node.rbRight;
                } else {
                    predecessor = node;
                    break;
                }
            }
        }

        // insert the circle event into the RB-tree
        this.circleEvents.Insert(predecessor, circleEvent);

        // update the first circle event if needed
        if (!predecessor) {
            this.firstCircleEvent = circleEvent;
        }
    }



    detachCircleEvent(arc) {
        var circleEvent = arc.circleEvent;
        if (circleEvent) {
            if (!circleEvent.rbPrevious) {
                this.firstCircleEvent = circleEvent.rbNext;
            }
            this.circleEvents.Remove(circleEvent); // remove from RB-tree
            arc.circleEvent = null;
        }
    }

    connectEdge(edge, bbox) {
        // skip if end point already connected
        var vb = edge.vb;
        if (!!vb) {
            return true;
        }

        // make local copy for performance purpose
        var va = edge.va,
            xl = bbox.xl,
            xr = bbox.xr,
            yt = bbox.yt,
            yb = bbox.yb,
            lSite = edge.lSite,
            rSite = edge.rSite,
            lx = lSite.x,
            ly = lSite.y,
            rx = rSite.x,
            ry = rSite.y,
            fx = (lx + rx) / 2,
            fy = (ly + ry) / 2,
            fm, fb;

        // if we reach here, this means cells which use this edge will need
        // to be closed, whether because the edge was removed, or because it
        // was connected to the bounding box.
        this.cells[lSite.voronoiId].closeMe = true;
        this.cells[rSite.voronoiId].closeMe = true;

        // get the line equation of the bisector if line is not vertical
        if (ry !== ly) {
            fm = (lx - rx) / (ry - ly);
            fb = fy - fm * fx;
        }

        // remember, direction of line (relative to left site):
        // upward: left.x < right.x
        // downward: left.x > right.x
        // horizontal: left.x == right.x
        // upward: left.x < right.x
        // rightward: left.y < right.y
        // leftward: left.y > right.y
        // vertical: left.y == right.y
        //
        // depending on the direction, find the best side of the
        // bounding box to use to determine a reasonable start point
        // While at it, since we have the values which define the line,
        // clip the end of va if it is outside the bbox.
        // which does not do well sometimes due to loss of arithmetic
        // precision. The code here doesn't degrade if one of the vertex is
        // at a huge distance.

        // special case: vertical line
        if (fm === undefined) {
            // doesn't intersect with viewport
            if (fx < xl || fx >= xr) {
                return false;
            }
            // downward
            if (lx > rx) {
                if (!va || va.y < yt) {
                    va = this.createVertex(fx, yt);
                } else if (va.y >= yb) {
                    return false;
                }
                vb = this.createVertex(fx, yb);
            }
            // upward
            else {
                if (!va || va.y > yb) {
                    va = this.createVertex(fx, yb);
                } else if (va.y < yt) {
                    return false;
                }
                vb = this.createVertex(fx, yt);
            }
        }
            // closer to vertical than horizontal, connect start point to the
        // top or bottom side of the bounding box
        else if (fm < -1 || fm > 1) {
            // downward
            if (lx > rx) {
                if (!va || va.y < yt) {
                    va = this.createVertex((yt - fb) / fm, yt);
                } else if (va.y >= yb) {
                    return false;
                }
                vb = this.createVertex((yb - fb) / fm, yb);
            }
            // upward
            else {
                if (!va || va.y > yb) {
                    va = this.createVertex((yb - fb) / fm, yb);
                } else if (va.y < yt) {
                    return false;
                }
                vb = this.createVertex((yt - fb) / fm, yt);
            }
        }
            // closer to horizontal than vertical, connect start point to the
        // left or right side of the bounding box
        else {
            // rightward
            if (ly < ry) {
                if (!va || va.x < xl) {
                    va = this.createVertex(xl, fm * xl + fb);
                } else if (va.x >= xr) {
                    return false;
                }
                vb = this.createVertex(xr, fm * xr + fb);
            }
            // leftward
            else {
                if (!va || va.x > xr) {
                    va = this.createVertex(xr, fm * xr + fb);
                } else if (va.x < xl) {
                    return false;
                }
                vb = this.createVertex(xl, fm * xl + fb);
            }
        }
        edge.va = va;
        edge.vb = vb;

        return true;
    }

    clipEdge(edge, bbox) {
        var ax = edge.va.x,
            ay = edge.va.y,
            bx = edge.vb.x,
            by = edge.vb.y,
            t0 = 0,
            t1 = 1,
            dx = bx - ax,
            dy = by - ay;
        // left
        var q = ax - bbox.xl;
        if (dx === 0 && q < 0) {
            return false;
        }
        var r = -q / dx;
        if (dx < 0) {
            if (r < t0) {
                return false;
            }
            if (r < t1) {
                t1 = r;
            }
        } else if (dx > 0) {
            if (r > t1) {
                return false;
            }
            if (r > t0) {
                t0 = r;
            }
        }
        // right
        q = bbox.xr - ax;
        if (dx === 0 && q < 0) {
            return false;
        }
        r = q / dx;
        if (dx < 0) {
            if (r > t1) {
                return false;
            }
            if (r > t0) {
                t0 = r;
            }
        } else if (dx > 0) {
            if (r < t0) {
                return false;
            }
            if (r < t1) {
                t1 = r;
            }
        }
        // top
        q = ay - bbox.yt;
        if (dy === 0 && q < 0) {
            return false;
        }
        r = -q / dy;
        if (dy < 0) {
            if (r < t0) {
                return false;
            }
            if (r < t1) {
                t1 = r;
            }
        } else if (dy > 0) {
            if (r > t1) {
                return false;
            }
            if (r > t0) {
                t0 = r;
            }
        }
        // bottom
        q = bbox.yb - ay;
        if (dy === 0 && q < 0) {
            return false;
        }
        r = q / dy;
        if (dy < 0) {
            if (r > t1) {
                return false;
            }
            if (r > t0) {
                t0 = r;
            }
        } else if (dy > 0) {
            if (r < t0) {
                return false;
            }
            if (r < t1) {
                t1 = r;
            }
        }

        // if we reach this point, Voronoi edge is within bbox

        // if t0 > 0, va needs to change
        // we need to create a new vertex rather
        // than modifying the existing one, since the existing
        // one is likely shared with at least another edge
        if (t0 > 0) {
            edge.va = this.createVertex(ax + t0 * dx, ay + t0 * dy);
        }

        // if t1 < 1, vb needs to change
        // we need to create a new vertex rather
        // than modifying the existing one, since the existing
        // one is likely shared with at least another edge
        if (t1 < 1) {
            edge.vb = this.createVertex(ax + t1 * dx, ay + t1 * dy);
        }

        // va and/or vb were clipped, thus we will need to close
        // cells which use this edge.
        if (t0 > 0 || t1 < 1) {
            this.cells[edge.lSite.voronoiId].closeMe = true;
            this.cells[edge.rSite.voronoiId].closeMe = true;
        }

        return true;
    }

    clipEdges(bbox) {
        // connect all dangling edges to bounding box
        // or get rid of them if it can't be done
        var edges = this.edges,
            iEdge = edges.length,
            edge,
            abs_fn = Math.abs;

        // iterate backward so we can splice safely
        while (iEdge--) {
            edge = edges[iEdge];
            // edge is removed if:
            //   it is wholly outside the bounding box
            //   it is looking more like a point than a line
            if (!this.connectEdge(edge, bbox) ||
                !this.clipEdge(edge, bbox) ||
                (abs_fn(edge.va.x - edge.vb.x) < 1e-9 && abs_fn(edge.va.y - edge.vb.y) < 1e-9)) {
                edge.va = edge.vb = null;
                edges.splice(iEdge, 1);
            }
        }
    }

    closeCells(bbox) {
        var xl = bbox.xl,
            xr = bbox.xr,
            yt = bbox.yt,
            yb = bbox.yb,
            cells = this.cells,
            iCell = cells.length,
            cell,
            iLeft,
            halfedges, nHalfedges,
            edge,
            va, vb, vz,
            lastBorderSegment,
            abs_fn = Math.abs;

        while (iCell--) {
            cell = cells[iCell];
            // prune, order halfedges counterclockwise, then add missing ones
            // required to close cells
            if (!cell.prepareHalfedges()) {
                continue;
            }
            if (!cell.closeMe) {
                continue;
            }
            // find first 'unclosed' point.
            // an 'unclosed' point will be the end point of a halfedge which
            // does not match the start point of the following halfedge
            halfedges = cell.halfedges;
            nHalfedges = halfedges.length;
            // special case: only one site, in which case, the viewport is the cell
            // ...

            // all other cases
            iLeft = 0;
            while (iLeft < nHalfedges) {
                va = halfedges[iLeft].getEndpoint();
                vz = halfedges[(iLeft + 1) % nHalfedges].getStartpoint();
                // if end point is not equal to start point, we need to add the missing
                // halfedge(s) up to vz
                if (abs_fn(va.x - vz.x) >= 1e-9 || abs_fn(va.y - vz.y) >= 1e-9) {

                    // "Holes" in the halfedges are not necessarily always adjacent.

                    // find entry point:
                    switch (true) {

                        // walk downward along left side
                        case this.eqEps(va.x, xl) && this.ltEps(va.y, yb):
                            lastBorderSegment = this.eqEps(vz.x, xl);
                            vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
                            edge = this.createBorderEdge(cell.site, va, vb);
                            iLeft++;
                            halfedges.splice(iLeft, 0, new Halfedge(edge, cell.site, null));
                            nHalfedges++;
                            if (lastBorderSegment) {
                                break;
                            }
                            va = vb;
                        // fall through

                        // walk rightward along bottom side
                        case this.eqEps(va.y, yb) && this.ltEps(va.x, xr):
                            lastBorderSegment = this.eqEps(vz.y, yb);
                            vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
                            edge = this.createBorderEdge(cell.site, va, vb);
                            iLeft++;
                            halfedges.splice(iLeft, 0, new Halfedge(edge, cell.site, null));
                            nHalfedges++;
                            if (lastBorderSegment) {
                                break;
                            }
                            va = vb;
                        // fall through

                        // walk upward along right side
                        case this.eqEps(va.x, xr) && this.gtEps(va.y, yt):
                            lastBorderSegment = this.eqEps(vz.x, xr);
                            vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
                            edge = this.createBorderEdge(cell.site, va, vb);
                            iLeft++;
                            halfedges.splice(iLeft, 0, new Halfedge(edge, cell.site, null));
                            nHalfedges++;
                            if (lastBorderSegment) {
                                break;
                            }
                            va = vb;
                        // fall through

                        // walk leftward along top side
                        case this.eqEps(va.y, yt) && this.gtEps(va.x, xl):
                            lastBorderSegment = this.eqEps(vz.y, yt);
                            vb = this.createVertex(lastBorderSegment ? vz.x : xl, yt);
                            edge = this.createBorderEdge(cell.site, va, vb);
                            iLeft++;
                            halfedges.splice(iLeft, 0, new Halfedge(edge, cell.site, null));
                            nHalfedges++;
                            if (lastBorderSegment) {
                                break;
                            }
                            va = vb;
                            // fall through

                            // walk downward along left side
                            lastBorderSegment = this.eqEps(vz.x, xl);
                            vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
                            edge = this.createBorderEdge(cell.site, va, vb);
                            iLeft++;
                            halfedges.splice(iLeft, 0, new Halfedge(edge, cell.site, null));
                            nHalfedges++;
                            if (lastBorderSegment) {
                                break;
                            }
                            va = vb;
                            // fall through

                            // walk rightward along bottom side
                            lastBorderSegment = this.eqEps(vz.y, yb);
                            vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
                            edge = this.createBorderEdge(cell.site, va, vb);
                            iLeft++;
                            halfedges.splice(iLeft, 0, new Halfedge(edge, cell.site, null));
                            nHalfedges++;
                            if (lastBorderSegment) {
                                break;
                            }
                            va = vb;
                            // fall through

                            // walk upward along right side
                            lastBorderSegment = this.eqEps(vz.x, xr);
                            vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
                            edge = this.createBorderEdge(cell.site, va, vb);
                            iLeft++;
                            halfedges.splice(iLeft, 0, new Halfedge(edge, cell.site, null));
                            nHalfedges++;
                            if (lastBorderSegment) {
                                break;
                            }
                        // fall through

                        default:
                            throw "Voronoi.closeCells() > this makes no sense!";
                    }
                }
                iLeft++;
            }
            cell.closeMe = false;
        }
    }

    compute(sites, bbox) {
        // to measure execution time
        var startTime = new Date();

        // init internal state
        this.reset();

        // Initialize site event queue
        var siteEvents = sites.slice(0);
        siteEvents.sort(function (a, b) {
            var r = b.y - a.y;
            if (r) {
                return r;
            }
            return b.x - a.x;
        });

        // process queue
        var site = siteEvents.pop(),
            siteid = 0,
            xsitex, // to avoid duplicate sites
            xsitey,
            cells = this.cells,
            circle;

        let step_i = -1;

        // main loop
        for (; ;) {
            step_i++;
            // we need to figure whether we handle a site or circle event
            // for this we find out if there is a site event and it is
            // 'earlier' than the circle event
            circle = this.firstCircleEvent;

            // add beach section
            if (site && (!circle || site.y < circle.y || (site.y === circle.y && site.x < circle.x))) {
                // only if site is not a duplicate
                if (site.x !== xsitex || site.y !== xsitey) {
                    // first create cell for new site
                    cells[siteid] = new Cell(site);
                    site.voronoiId = siteid++;
                    // then create a beachsection for that site
                    this.addBeachsection(site);
                    // remember last site coords to detect duplicate
                    xsitey = site.y;
                    xsitex = site.x;
                }
                site = siteEvents.pop();
            }

            // remove beach section
            else if (circle) {
                this.removeBeachsection(circle.arc);
            }

            // all done, quit
            else {
                break;
            }
        }

        // wrapping-up:
        //   connect dangling edges to bounding box
        //   cut edges as per bounding box
        //   discard edges completely outside bounding box
        //   discard edges which are point-like
        this.clipEdges(bbox);

        //   add missing edges in order to close opened cells
        this.closeCells(bbox);

        // to measure execution time
        var stopTime = new Date();

        // prepare return values
        var diagram = new Diagram();
        diagram.cells = this.cells;
        diagram.edges = this.edges;
        diagram.vertices = this.vertices;
        diagram.execTime = stopTime.getTime() - startTime.getTime();
        diagram.i = step_i;

        // clean up
        this.reset();

        return diagram;
    }

    computeStepByStep(sites, bbox, step) {
        // init internal state
        this.reset();

        // Initialize site event queue
        var siteEvents = sites.slice(0);
        siteEvents.sort(function (a, b) {
            var r = b.y - a.y;
            if (r) {
                return r;
            }
            return b.x - a.x;
        });

        // process queue
        var site = siteEvents.pop(),
            siteid = 0,
            xsitex, // to avoid duplicate sites
            xsitey,
            cells = this.cells,
            circle;

        let i;

        // main loop
        for (i = 0; i < step; i++) {
            // we need to figure whether we handle a site or circle event
            // for this we find out if there is a site event and it is
            // 'earlier' than the circle event
            circle = this.firstCircleEvent;

            // add beach section
            if (site && (!circle || site.y < circle.y || (site.y === circle.y && site.x < circle.x))) {
                // only if site is not a duplicate
                if (site.x !== xsitex || site.y !== xsitey) {
                    // first create cell for new site
                    cells[siteid] = new Cell(site);
                    site.voronoiId = siteid++;
                    // then create a beachsection for that site
                    this.addBeachsection(site);
                    // remember last site coords to detect duplicate
                    xsitey = site.y;
                    xsitex = site.x;
                }
                site = siteEvents.pop();
            }

            // remove beach section
            else if (circle) {
                this.removeBeachsection(circle.arc);
            }

            // all done, quit
            else {
                break;
            }
        }

        // wrapping-up:
        //   connect dangling edges to bounding box
        //   cut edges as per bounding box
        //   discard edges completely outside bounding box
        //   discard edges which are point-like
        this.clipEdges(bbox);

        //   add missing edges in order to close opened cells
        this.closeCells(bbox);

        // to measure execution time
        var stopTime = new Date();

        // prepare return values
        var diagram = new Diagram();
        diagram.cells = this.cells;
        diagram.edges = this.edges;
        diagram.vertices = this.vertices;
        diagram.i = i;
        diagram.beachline = site; // this.getBeachline()?.map(arc => arc?.site).sort((a, b) => b.y - a.y).at(0);
        if (diagram.beachline) {
            diagram.beachlineArcs = this.getBeachlineArcs(diagram.beachline);
            diagram.circleEvents = this.getActiveCircleEvents();
            diagram.sweepLine = site.y;
        }

        // clean up
        this.reset();

        return diagram;
    }

    getBeachlineArcs(beachline) {
        const beachlineArcs = [];
        let arc = this.beachline?.getLeftmost(this.beachline?.root);
        while (arc) {
            beachlineArcs.push({
                site: arc.site,
                leftBreakpoint: this.leftBreakPoint(arc, beachline.y),
                rightBreakpoint: this.rightBreakPoint(arc, beachline.y),
            });
            arc = arc.rbNext;
        }
        return beachlineArcs;
    }

    getActiveCircleEvents() {
        const circleEvents = [];
        let event = this.firstCircleEvent;
        while (event) {
            circleEvents.push({
                x: event.x,
                y: event.ycenter,
                radius: Math.sqrt((event.x - event.arc.site.x) ** 2 + (event.ycenter - event.arc.site.y) ** 2),
                arc: event.arc,
            });
            event = event.rbNext;
        }
        return circleEvents;
    }

}