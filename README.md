# Simple Cyclejs Examples

These are a couple of examples I made while learning about
[cyclejs](http://cycle.js.org/).  The first is a list of counters you can add
to and remove from; each counter stores its state and can be modified.  The
new thing (to me) is that there is a sum of the values of all the counters
displayed.  This took some work, I need to learn more about RxJS...

The second example is a silly googly eye visualization.  The eyes move around
and follow the mouse.  Nothing too special, but it does show how components
can be reused and properties that we might normally think of as static (like
position, say) can easily be made dynamic using the stream based approach of
cycle.

To run these, `npm install`, then `npm run build-eyes` or `npm run
build-multicounter`, and open `index.html` in your browser.  No webserver
needed.
