class Voronoi {
    constructor(points, width, height) {
        this.point_list = points; // List of points to process
        this.box_x = width; // Width of the bounding box
        this.box_y = height; // Height of the bounding box
        this.reset();
    }

    // Resets the state of the Voronoi diagram
    reset() {
        this.event_list = new SortedQueue(); // Priority queue for events
        this.beachline_root = null; // Root of the beachline (parabolic arcs)
        this.voronoi_vertex = []; // List of Voronoi vertices
        this.edges = []; // List of Voronoi edges
    }

    // Main update function to compute the Voronoi diagram
    update() {
        console.log("Updating Voronoi diagram...");
        this.reset();

        let points = [];
        for (const p of this.point_list) {
            points.push(new Event("point", p));
        }
        this.event_list.points = points;

        let e = null;
        while (this.event_list.length > 0) {
            e = this.event_list.extract_first();
            console.log(`Processing event: ${e.type} at (${e.position.x}, ${e.position.y})`);
            if (e.type === "point") {
                this.point_event(e.position);
            } else if (e.active) {
                this.circle_event(e);
            }
        }

        console.log("Completing Voronoi edges...");
        this.complete_segments(e?.position);
    }

    // Handles a point event during the sweep
    point_event(p) {
        let q = this.beachline_root;

        if (!q) {
            console.log(`Adding first arc for point (${p.x}, ${p.y})`);
            this.beachline_root = new Arc(null, null, p, null, null);
        } else {
            while (q.right && this.parabola_intersection(p.y, q.focus, q.right.focus) <= p.x) {
                q = q.right;
            }

            console.log(`Splitting arc for point (${p.x}, ${p.y})`);

            let e_qp = new Edge(q.focus, p, p.x); // Edge from q to p
            let e_pq = new Edge(p, q.focus, p.x); // Edge from p to q


            let arc_p = new Arc(q, null, p, e_qp, e_pq);
            let arc_qr = new Arc(arc_p, q.right, q.focus, e_pq, q.edge.right);
            if (q.right) q.right.left = arc_qr;
            arc_p.right = arc_qr;
            q.right = arc_p;
            q.edge.right = e_qp;

            if (q.event) q.event.active = false; // Disable old event

            this.add_circle_event(p, q);
            this.add_circle_event(p, arc_qr);

            this.edges.push(e_qp, e_pq);
        }
    }

    // Handles a circle event during the sweep
    circle_event(e) {
        let arc = e.caller;
        let p = e.position;
        let edge_new = new Edge(arc.left.focus, arc.right.focus);

        console.log(`Handling circle event at (${p.x}, ${p.y})`);

        if (arc.left.event) arc.left.event.active = false;
        if (arc.right.event) arc.right.event.active = false;

        arc.left.edge.right = edge_new;
        arc.right.edge.left = edge_new;
        arc.left.right = arc.right;
        arc.right.left = arc.left;

        this.edges.push(edge_new);

        if (!this.point_outside(e.vertex)) {
            this.voronoi_vertex.push(e.vertex);
        }

        arc.edge.left.end = arc.edge.right.end = edge_new.start = e.vertex;

        this.add_circle_event(p, arc.left);
        this.add_circle_event(p, arc.right);
    }

    // Adds a circle event if conditions are met
    add_circle_event(p, arc) {
        if (arc.left && arc.right) {
            let a = arc.left.focus;
            let b = arc.focus;
            let c = arc.right.focus;

            if ((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y) > 0) {
                let new_inters = this.edge_intersection(arc.edge.left, arc.edge.right);
                let circle_radius = Math.sqrt((new_inters.x - arc.focus.x) ** 2 + (new_inters.y - arc.focus.y) ** 2);
                let event_pos = circle_radius + new_inters.y;

                if (event_pos > p.y && new_inters.y < this.box_y) {
                    let e = new Event("circle", new Point(new_inters.x, event_pos), arc, new_inters);
                    arc.event = e;
                    this.event_list.insert(e);
                    console.log(`Added circle event at (${e.position.x}, ${e.position.y})`);
                }
            }
        }
    }

    // Computes the intersection of two parabolas
    parabola_intersection(y, f1, f2) {
        let fyDiff = f1.y - f2.y;
        if (fyDiff === 0) return (f1.x + f2.x) / 2;
        let fxDiff = f1.x - f2.x;
        let b1md = f1.y - y;
        let b2md = f2.y - y;
        let h1 = (-f1.x * b2md + f2.x * b1md) / fyDiff;
        let h2 = Math.sqrt(b1md * b2md * (fxDiff ** 2 + fyDiff ** 2)) / fyDiff;

        return h1 + h2;
    }

    // Finds the intersection point of two edges
    edge_intersection(e1, e2) {
        if (e1.m === Infinity) return new Point(e1.start.x, e2.getY(e1.start.x));
        if (e2.m === Infinity) return new Point(e2.start.x, e1.getY(e2.start.x));
        let mdif = e1.m - e2.m;
        if (mdif === 0) return null;
        let x = (e2.q - e1.q) / mdif;
        let y = e1.getY(x);
        return new Point(x, y);
    }

    // Completes any remaining segments
    complete_segments(last) {
        console.log("Finalizing edges...");
        let r = this.beachline_root;
    
        while (r) {
            let e = r.edge.right;
            if (e && !e.end && e.start) {
                let intersections = [];
    
                // Check intersection with vertical boundaries (x = 0 and x = box_x)
                let y_at_x0 = e.getY(0);
                if (y_at_x0 >= 0 && y_at_x0 <= this.box_y) {
                    intersections.push(new Point(0, y_at_x0));
                }
    
                let y_at_xmax = e.getY(this.box_x);
                if (y_at_xmax >= 0 && y_at_xmax <= this.box_y) {
                    intersections.push(new Point(this.box_x, y_at_xmax));
                }
    
                // Check intersection with horizontal boundaries (y = 0 and y = box_y)
                let x_at_y0 = e.getX(0);
                if (x_at_y0 >= 0 && x_at_y0 <= this.box_x) {
                    intersections.push(new Point(x_at_y0, 0));
                }
    
                let x_at_ymax = e.getX(this.box_y);
                if (x_at_ymax >= 0 && x_at_ymax <= this.box_x) {
                    intersections.push(new Point(x_at_ymax, this.box_y));
                }
    
                // Extend edge in both directions
                if (intersections.length >= 2) {
                    // Sort intersections by proximity to the edge's start point
                    intersections.sort((a, b) => {
                        let da = Math.hypot(a.x - e.start.x, a.y - e.start.y);
                        let db = Math.hypot(b.x - e.start.x, b.y - e.start.y);
                        return da - db;
                    });
    
                    // Assign both start and end points
                    if (this.point_list.length == 2) {
                        e.start = intersections[0];
                        e.end = intersections[1];
                        console.log(`Edge completed from (${e.start.x}, ${e.start.y}) to (${e.end.x}, ${e.end.y})`);
                    }
                }
            }
            r = r.right;
        }
    
        // Filter out invalid edges
        this.edges = this.edges.filter(edge => edge.start && edge.end);
    }
    
    
    
    

    point_outside(p) {
        return p.x < 0 || p.x > this.box_x || p.y < 0 || p.y > this.box_y;
    }
}

class Arc {
    constructor(left, right, focus, leftEdge, rightEdge) {
        this.left = left;
        this.right = right;
        this.focus = focus;
        this.edge = { left: leftEdge, right: rightEdge };
        this.event = null;
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Edge {
    constructor(p1, p2, startx) {
        this.m = -(p1.x - p2.x) / (p1.y - p2.y);
        this.q = (0.5 * (p1.x ** 2 - p2.x ** 2 + p1.y ** 2 - p2.y ** 2)) / (p1.y - p2.y);
        this.arc = { left: p1, right: p2 };
        this.start = startx ? new Point(startx, this.getY(startx)) : null;
        this.end = null;
    }

    getY(x) {
        return this.m * x + this.q;
    }

    getX(y) {
        return (y - this.q) / this.m;
    }
}

class Event {
    constructor(type, position, caller = null, vertex = null) {
        this.type = type; // "point" or "circle"
        this.position = position;
        this.caller = caller; // Reference to the arc for circle events
        this.vertex = vertex; // Voronoi vertex for circle events
        this.active = true; // Indicates whether the event is still active
    }
}

class SortedQueue {
    constructor(events = []) {
        this.list = events;
        this.sort();
    }

    get length() {
        return this.list.length;
    }

    extract_first() {
        return this.list.shift();
    }

    insert(event) {
        this.list.push(event);
        this.sort();
    }

    set points(events) {
        this.list = events;
        this.sort();
    }

    sort() {
        this.list.sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    }
}