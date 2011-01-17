// Kevin Cantu (c) 2011 
// http://kevincantu.org & https://github.com/killerswan/dragons
//
// library to draw dragon curves in SVG
// requires: underscore.js


// When testing via Node.JS
// ------------------------
/*
var util = require("util");
var _ = require("/code/dragon/underscore.js")._;

var show = function (o) { 
   U = require("util");
   U.print(U.inspect(o) + "\n\n");
   return o;
}
*/


// MATRIX MATH
// -----------

Matrix = {};

Matrix.mult = function ( mat, vec ) {
   // map across the rows of the matrix
   return _.map(mat, function (row) {

      // detect size issue (meh)
      if (row.length != vec.length) { 
         console.log("matrix and vector size mismatch");
      }

      // fold across the columns to make a vector
      return _.foldl(_.zip(row, vec), 
                     function (sum, pair) {
                        return sum + pair[0] * pair[1];
                     }, 
                     0
      );
   });
};

Matrix.minus = function ( v1, v2 ) {
   // still only for vectors
   return _.map(_.zip(v1, v2), function (tup) { return tup[0]-tup[1]; });
}

Matrix.plus = function ( v1, v2 ) {
   // still only for vectors
   return _.map(_.zip(v1, v2), function (tup) { return tup[0]+tup[1]; });
}


// FUNCTIONAL STUFF
// ----------------

// Rather than map to each element of a list, 
// map to pairs of first+second, second+third, etc.
var mapBetween = function (xs, k) {
   // xs is an array
   // k is a function

   var pairs = function (list) {
      var ys = list.slice(1 /*, list.length */);
      var zs = _.zip(list, ys);

      // the last argument is solitary, not a pair, nix it
      zs.pop();

      return zs;
   }

   return _.map(pairs(xs), k);
}

// mapCat
var mapCatBetween = function (xs, k) {
   // should be able to fold, though...
   var combined = [];
   _.each( mapBetween(xs, k), 
      function (x) {
         combined = combined.concat(x);
      }
   )
   return combined;
}


// SVG STUFF
// ---------

// Turn a pair of points into an SVG path like "M1 1L2 2".
var toSVG = function (points) { 
   var a = points[0];
   var b = points[1];
   return "M" + a[0] + " " + a[1] + "L" + b[0] + " " + b[1];
}

// Turn a sequence of points into a larger SVG path.
var pathToSVG = function (points) {
   return mapCatBetween(points, toSVG).join('');
}

// Create the HTML text for an SVG tag containing a path.
var fullSVG = function (path) {
   var header = '<svg' +
                ' xmlns=\'http://www.w3.org/2000/svg\'' +
                ' style=\'height: 500px; width: 800px\'>'

   var polygon = '<path' + 
                 ' d=\'' + pathToSVG(path) + '\'' +
                 ' style=\'stroke:#000;stroke-width:2\'' + 
                 ' />';
   var footer = '</svg>'

   return header + polygon + footer;
}


// DRAGON CURVE MAKING
// -------------------

// Grow the curve from one sequence of points to the next, denser sequence.
var growPath = function (oldpath) {

   // depending on which side we want to grow a new point...
   var side = false;

   var left = [ [ 1/2,-1/2 ],
                [ 1/2, 1/2 ] ];

   var right = [ [ 1/2, 1/2 ],
                 [-1/2, 1/2 ] ];

   // one new point
   // this takes two points [a,b], returns [a, new]
   // next call will take [b,c], return [b,new], 
   var growNewPoint = function (pair) {
      var a = pair[0];
      var b = pair[1];
      side = !side; 
      var newPoint = Matrix.plus(a, Matrix.mult( side ? left : right, 
                                                 Matrix.minus(b, a) ));
      return [ a, newPoint ];
   } 

   // new path
   // map it to the pairs of the old path
   var path = mapCatBetween( oldpath, growNewPoint );
   path.push(oldpath[oldpath.length-1]); // append the last point

   return path;
}

// Grow the curve from one sequence to the Nth next sequence.
var growPathN = function (path, n) {
   var currentPath = path;
   for ( n; n > 0; n-=1 ) {
      currentPath = growPath(currentPath);
   } 
   return currentPath;
}

// Insert a dragon of order N within the HTML element, id,
// starting at one point and moving to another.
var dragon = function (id, start, end, orderN) {

   // The path begins as the sequence of start and end points. 
   var path = [start, end];

   var drawing = document.getElementById( id );
   drawing.innerHTML = fullSVG( growPathN( path, orderN ));
}

// Alternatively, insert a dragon, iterate, iterate, etc.
var stepDragon = function (id, start, end, orderN) {
   var drawing = document.getElementById( id );

   // Initial path
   var currentPath = [start, end];

   var n = orderN;

   // Recursive function (sure, dangerous in JavaScript, whatever)
   // used to make dragons. 
   var loop = function () {

      // Draw the current path.
      drawing.innerHTML = fullSVG(currentPath);

      // If we're not done...
      if (n > 0) {
         n -= 1;

         // Make the next path.
         currentPath = growPath(currentPath);

         // Delay, then recurse.
         window.setTimeout(loop, 900);
      }
   }

   // Start recursive dragon making.
   loop();
}


// Though maps are more accurate now, be careful where you swim!
