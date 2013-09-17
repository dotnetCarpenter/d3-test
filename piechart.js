(function(d3, doc, win, dataset) {
  "use strict";
  // configuration
  var size        = (win.innerWidth*0.8)/2.1, //height/width
    radius        = size/2, // set the radius to half the diameter
    color         = d3.scale.category20b(), //builtin range of colors
    nextIndex     = function(value) { // calculate the next dataset index
                      value = value || 0;
                      return function () {
                        return (value++ % dataset.length);
                      };
                    }(),
    initialDS     = dataset[nextIndex()], // maintain a local variable with our current dataset - thx d3(!)
    pie           = d3.layout.pie() // get a pie object structure
                    .value(function(d) { return d.value; })
                    .sort(null), // disable sort-by-value
    arc           = d3.svg.arc()
                      .outerRadius(radius),
    svg           = d3.select("svg") // select the SVG from the DOM
                      .attr("width", size)  // adjust size
                      .attr("height", size) // adjust size
                      .attr("viewBox", -radius + ","+ -radius +"," + size + "," + size) // move pie to center
                      .on("click", printSvg("svgOutput")), // setup debugging
    path          = svg.selectAll("g.sector path")
                      .data(pie(initialDS))
                      .attr("fill", function(d, i) {
                        return color(i);
                      })
                      .attr("d", arc)
                      .each(function(d) { // store the initial angles
                        this._current = d;
                      }),
    text          = svg.selectAll("text")
                      .data(pie(initialDS))
                      .attr("transform", moveText)
                      .text(setText)
                      .attr("text-anchor", "middle"); //center the text on it's origin
  initialDS = null;
  // program
  var btnAnimate = d3.select("#btnAnimate")
    .on("click.animate", q(run))  // start animation and set start/stop function
    .on("click.value", function() { // toggle the value on the button
      var t = toggle("Stop", "Start");
      return function() {
        this.value = t();
      };
    }());

  d3.select("#svgOutput")
    .attr("contentEditable", "true")
    .on("keypress", throttle(updateSVG, 1000));

  function updateSVG() {
    if(updateSVG.updating)
      return;
    updateSVG.updating = true;
    var wrapper = doc.getElementById("svgWrapper");
    svg.remove(); // remove svg
    wrapper.innerHTML = this.textContent; // copy text from code element to new domFragment
    svg = d3.select(wrapper.firstChild);
    path = svg.selectAll("g.sector path"),
    text = svg.selectAll("text"),
    updateSVG.updating = false;
  }
  updateSVG.updating = false;
  /**
   * Labels
   */
  function setText(d) {
    // console.log("data sent to the setText function");
    var d = d.data || d,
        value = d.value;
    return value === 100 ? "HIV infected 100%" : (value > 0 ? d.label + " " + d.value + "%" : "");
  }

  /**
   * Animation functions
   */
  function change() {
    var data = dataset[nextIndex()];
    path
      .data(pie(data))
      .transition()
      .duration(1000)
      .attrTween("d", arcTween); // redraw the arcs
    text
      .data(pie(data))
      .transition()      
      .duration(1000)
      .attr("transform", moveText)
      .text(setText)
      .attr("text-anchor", "middle") //center the text on it's origin
  }
  // Store the displayed angles in _current.
  // Then, interpolate from _current to the new angles.
  // During the transition, _current is updated in-place by d3.interpolate.
  function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return arc(i(t));
    };
  }
  function moveText(d) {
    // we have to make sure to set these before calling arc.centroid
    d.innerRadius = 10;
    d.outerRadius = radius;
    // // console.log("after adding in radius");
    // console.dir(d);
    return "translate(" + arc.centroid(d) + ")";
  }

  /*           *
   * Utilities *
   */
  function throttle(f, delay){
    var timer = null;
    return function(){
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = window.setTimeout(function(){
            f.apply(context, args);
        },
        delay || 500);
    };
  }
  function run() {
    var id = win.setInterval(change, 1500);
    change();
    return function() {
      win.clearInterval(id);
      return run;
    };
  }
  // if a function returns a function, "q" will call the return function from a function call.
  // if a function returns something else, "q" will break everything
  function q(fn) {
    var fn = fn;
    return function() {
      return fn = fn();
    }
  }

  function toggle(v1,v2) {
    var t = false;
    return function() {
      return t = !t, t ? v1 : v2;
    }
  }

  function printSvg(out) {
    // print out svg
    var out = out instanceof win.Element ? out : doc.getElementById(''+out),
        serializer = new win.XMLSerializer(),
        oldNode;
    out.style.height = size + "px";
    return function() {
      if(oldNode)
        out.removeChild(oldNode);
      oldNode = out.appendChild(
        doc.createTextNode(
          serializer.serializeToString(
            doc.getElementsByTagName("svg")[0]
          )
        )
      )          
    }
  }
  
}(d3, document, window, dataset));