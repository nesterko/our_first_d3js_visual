// a sample visualizaiton for the January@GSAS course 
// on Interactive Visualization, Day 2
// features: data-driven display updating, 
// display brushing
// sergiy 20140122
// Sergiy Nesterko // serge.nesterko@gmail.com // sergiy_nesterko@harvard.edu
// nesterko.com
//
// The idea of the exercise is to use drawPoints(obj) function to populate 
// the two linked displays with mock data from data.csv. The two plots would 
// plot different data on the same people, and identify them with mouseover 
// boxes.
// The exercise also provides boilerplate code to add basic controls to the 
// visualization (controls() function) in the form of the 'Update' button, 
// which would refresh the plots with new data from data.csv
// What if the data source (data.csv) was not a file, but rather a stream?
// How can we design our visualizations to update automatically rather than 
// having to press a button?
// That's for next time!
// sergiy 20140123

(function() {
  var args = getURIargs();

  // put in the custom style css for the visualization
  $('head').append('<link rel="stylesheet" href="' + 
    args.jspath + '/style.css">');

var dims = computeDims(args.c, args.w, args.h);

var w = dims.w,
h = dims.h;

// define plot margins for the plots (the same for both plots)
var m = {t : 10, r : 20, b : 40, l : 55};

// define individual svg container width, and also the width and height
// of the plotting g elements within each svg
var twoplots = w;
var pw = twoplots / 2 - m.r - m.l, ph = h - m.t - m.b;

// define a variable to keep track of our displays
var displays = [];

function init (container, title, w, h, xlab, ylab, data, name, xvar, yvar)
{
  // initialize the SVG container
  var con = d3.select("#" + container)
    .insert("div", ":first-child")
    .attr('class', 'ivisualcontainer');

  // add visualization title
  con.append("h2").html(title);

  // initialize the SVG element
  var svg = con.append("svg")
    .attr("width", twoplots / 2 - 10)
    .attr("height", h);

  // initialize the axes components
  var x = d3.scale.linear().range([0, pw]),
      y = d3.scale.linear().range([ph, 0]),
      xAxis = d3.svg.axis().scale(x).tickSize(5, 3, 1)
      yAxis = d3.svg.axis().scale(y).tickSize(5, 3, 1).orient("left");


  // initialize the domains of x and y
  // the domain of x will be the same throughout : [0, 1], but y's will change
  x.domain([0, 1]);
  y.domain([0, 1]);

  // initialize the g elements inside the svg container for x and y 
  // axes, and also for the plot itself. We are also calling the 
  // axis functions on the containers to keep track of domain changes, 
  // d3 shines here

  // TODO this line needs to be removed and the below needs to be uncommented in 
  // order to add axes to the plots
  var ycon = undefined, xcon = undefined;
  /*
  var ycon = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + m.l + "," + m.t + ")")
    .call(yAxis);

  // add the label to the y axis
  ycon.append("text").attr("class", "label").attr("x", 0).attr("y", 0)
      .attr("dy", "-2.5em").attr("text-anchor", "middle")
      .text(ylab)
      .attr("transform", "rotate(-90) translate(-" +
          parseFloat(ph / 2) + "," + 0 + ")");

  var xcon = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + m.l + "," + parseFloat(ph + m.t) + ")")
    .call(xAxis);

  // add the label to the x axis
  xcon.append("text")
    .attr("class", "label").attr("x", pw / 2)
    .attr("y", 0).attr("dy", "+2.5em")
    .attr("text-anchor", "middle")
    .text(xlab);
  */

  var plot = svg.append("g")
    .attr("transform", "translate(" + m.l + "," + m.t + ")");

  return {con : con, svg : svg, plot : plot, data : data,
    ycon : ycon, xcon : xcon,
    x : x, y : y, xAxis : xAxis, yAxis : yAxis,
    name : name, xvar : xvar, yvar : yvar};
}

var data = {display1 : [], display2 : []};

function processData (rawdata)
{
  var result = Object();
  result.alldata = rawdata.map(
      function (el) {
        el.hours_of_sleep_per_week = +el.hours_of_sleep_per_week;
        el.hours_of_work_per_week = +el.hours_of_work_per_week;
        el.n_of_d3_visuals_made_per_week = +el.n_of_d3_visuals_made_per_week;
        el.n_twitter_followers = +el.n_twitter_followers;
        return el;
      }
      );
  result.initial = [
    {text : 'Hello, World!'}
    ];
  // add plot-specific pieces of data
  var displaynames = displays.map( function (el) { return el.name; });
  result.colors = d3.scale.category10().domain(displaynames);
  return result;
}

function redraw ()
{
  displays.map(sayHello);
  repeat();
  return 0;
}

function range (dim, name)
{
  var vals = data.alldata.map(function (e) { return e[dim];});
  var tmp = [d3.min(vals), d3.max(vals)];
  return (tmp[0] == tmp[1]) ? [tmp[0] - 1, tmp[0] + 1] : tmp;
}

function mouseover (d, i)
{
  var con = d3.select("#" + args.c);
  // Since our information box is going to be appended into the 
  // overall visualization container, we need to find out its position
  // on the screen so that the absolutely positioned infobox shows up 
  // in the right place. It's easy to do this with jQuery
  var pos = $(con[0][0]).position();
  // d3.mouse returns the mouse coordinates relative to the spcified
  // container. Since we'll be appending the small infobox to the 
  // overall visualization container, we want the mouse coordinates 
  // relative to that.
  var mouse = d3.mouse(con[0][0]);
  var info = con.selectAll("div.uservisinfobox")
    .data([mouse]);
  // change the offset a little bit
  var cushion = [10, 10];
  // record the offset as part of the 'this' context, which in this 
  // case stands for the circle that initiated the mouseover event
  this._xoff = cushion[0] + mouse[0] + pos.left;
  this._yoff = cushion[1] + mouse[1] + pos.top;
  info.enter()
    .append("div")
    .attr("class", "uservisinfobox")
    .attr("style", "top : " + this._yoff + "px; " +
        "left : " + this._xoff + "px; opacity : 0;")
    .html("<p>" + d.name + "</p>" +
        "<p>" + d.comments + "</p>");
  info
    .html("<p>" + d.name + "</p>" +
        "<p>" + d.comments + "</p>")
    .transition().duration(250)
    .attr("style", "top : " + this._yoff + "px; " +
        "left : " + this._xoff + "px; opacity : 1;");
  // now that we have highlighting data, do the highlighting
  var sel = d3.selectAll('#' + args.c + ' circle').filter( (function (el) {
    return ((el.name == d.name) & (el.comments == d.comments));
  }));
  sel
    .style("stroke-width", 8)
    .style("stroke", "#000000")
    .style("stroke-opacity", 0.3);
  // perform the brushing: highlight the element on the other 
  // plot
  return 0;
}

function mousemove (d, i)
{
    var con, cushion, info, mouse, pos;
    con = d3.select("#" + args.c);
    pos = $(con[0][0]).position();
    mouse = d3.mouse(con[0][0]);
    info = con.select("div.uservisinfobox");
    cushion = [10, 10];
    this._xoff = cushion[0] + mouse[0] + pos.left;
    this._yoff = cushion[1] + mouse[1] + pos.top;
    info.attr("style", "top : " + this._yoff + "px; " + "left : " + 
        this._xoff + "px; opacity : 1");
    return 0;
  };

function mouseout (d, i)
{
  // smoothly remove the infobox
  d3.selectAll(".uservisinfobox")
    .transition().duration(250)
    .attr("style", "top : " + this._yoff + "px; " +
        "left : " + this._xoff + "px; opacity : 0;")
    .remove();
  // clean up the element highlighting
  d3.selectAll('#' + args.c + ' circle')
    .style("stroke-width", 0)
    .style("stroke-opacity", 1)
    .style("stroke", function (d) { return data.colors(this.display); });
  return 0;
}

function sayHello (obj)
{
  // define a transition from the first plotting color to the second one
  var displaynames = displays.map( function (el) { return el.name;});
  var interpolator = d3.interpolateRgb(data.colors(displaynames[0]),
      data.colors(displaynames[1]));
  // pick a random color
  var randomcolor = interpolator(Math.random());

  // pick random font size
  var randomsize = 36 + (Math.random() - 0.5) * 60;

  // also, set a random delay on the transition
  var randomdelay = Math.random() * 2000;

  // say hello to students
  var txt = obj.svg.selectAll('text.hello')
    .data(data.initial);

  txt.enter()
    .append('text')
    .attr('class', 'hello')
    .attr('x', w * 0.25)
    .attr('y', h * 0.5)
    .text( function (d) {return d.text;});

  txt.transition().duration(1000).delay(randomdelay)
    .style('font-size', randomsize)
    .attr('fill', randomcolor)
    .attr('stroke', randomcolor);
  return 0;
}

function moveCaptionsAround (displays)
{
  // set up some basic parameters
  var speed = 1e-1;
  var paddingy = 15, paddingx = 100;
  var counter = 0;
  displays.map(function (display)
    {
      // set random direction
      var multiplier = 30;
      var dx = multiplier * (Math.random() - 0.5);
      var dy = multiplier * (Math.random() - 0.5);
      d3.timer( function ()
          {
            counter += 1;
            var caption = display.svg.select('text.hello');
            var oldx = caption.attr('x');
            var oldy = caption.attr('y');
            var px = +oldx + speed * dx;
            var py = +oldy + speed * dy;
            dx = ((px > w * 0.5 - paddingx) | (px + dx < paddingx)) ? (-1 * dx) : dx;
            dy = ((py > h - paddingy) | (py + dy < paddingy)) ? (-1 * dy) : dy;
            caption.attr('x', +oldx + speed * dx).attr('y', +oldy + speed * dy);
          });
    });
  return 0;
}

function drawPoints (obj)
{
  obj.x.domain(range(obj.xvar, obj.name));
  obj.y.domain(range(obj.yvar, obj.name));

  var cir = obj.plot.selectAll("circle")
    .data(data.alldata, function (d, i) { return d.name + d.comments;});

  cir.enter()
    .append("circle")
    .attr("cx", function (d) { return obj.x(d[obj.xvar]); })
    .attr("cy", function (d) { return obj.y(d[obj.yvar]); })
    .attr("r", function (d) { return 5; })
    .style("stroke", function (d) { return data.colors(obj.name); })
    .style("fill", function (d) { return data.colors(obj.name); })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseout", mouseout)
    .each( function (el) {this.display = obj.name;});

  var tr = obj.svg.transition().duration(500);
  tr.select(".y.axis").call(obj.yAxis);
  tr.select(".x.axis").call(obj.xAxis);

  tr
    .selectAll("circle")
    .attr("cx", function (d) { return obj.x(d[obj.xvar]); })
    .attr("cy", function (d) { return obj.y(d[obj.yvar]); })
    .attr("r", function (d) { return 5; });

  return 0;
}

// controls function
function controls ()
{
  // create a container for visualization controls
  var leg = d3.select("#" + args.c).append("div")
    .attr("class", "ivisualcontainer userviscontrols");
  // add buttons to the container
  var controlsdata = [ { label : "Update", fn : function () {return 0;} } ];
  // remove this line in order to populate controls
  controlsdata = [];
  var controls = leg.selectAll("input")
    .data(controlsdata);
  var button = controls.enter()
    .append("input")
    .attr("type", "submit").attr("class", "button")
    .attr("value", function (d) { return d.label; })
    .on("click", function (d) { return d.fn(); });
  return 0;
}

function repeat ()
{
  setTimeout(redraw, 2000);
  return 0;
}

function visual (err, rawdata)
{
  displays.push(init(args.c, "", w,
      h, "x coordinate", "y coordinate", undefined, 'display2',
      'n_of_d3_visuals_made_per_week', 'n_twitter_followers'));

  displays.push(init(args.c, "", w, 
        h, "x coordinate", "", undefined, 'display1',
        'hours_of_sleep_per_week', 'hours_of_work_per_week'));

  data = processData(rawdata);
  redraw();
  controls();
  // remove this function for the exercise
  moveCaptionsAround(displays);
  return 0;
}

queue()
  .defer(d3.csv, args.jspath + '/data.csv')
  .await(visual);

return 0;
})();
