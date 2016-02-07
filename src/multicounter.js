import {Observable} from 'rx';
import Cycle from '@cycle/core';
import {hr, div, button, p, makeDOMDriver} from '@cycle/dom';
import isolate from '@cycle/isolate';
import combineLatestObj from 'rx-combine-latest-obj';

/* Make a list of "counters", each keeps track of its count
 * and has a + and - button to modify the count.  The counter_list
 * component can add and remove counters dynamically.
 */
function internal_counter(sources) {
  let action$ = Observable.merge(
    sources.DOM.select(".decrement").events("click").map(ev => -1),
    sources.DOM.select(".increment").events("click").map(ev => +1)
  );
  let count$ = action$.startWith(0).shareReplay().scan((x,y) => x+y)
  return {
    DOM: count$.map(count =>
        div(".counter", [
          button(".decrement", "Decrement"),
          button(".increment", "Increment"),
          p("Counter: " + count)
        ])
      ),
    count$
  };
}

function counter(sources) {
  return isolate(internal_counter)(sources);
}

function intent(sources) {
  return {
    add_counter$: sources.DOM.select(".add_counter")
      .events("click")
      .map(() => counter(sources)),
    remove_counter$: sources.DOM.select(".remove_counter")
      .events("click")
      .map(event => parseInt(event.target.value))
  };
}

function model({add_counter$, remove_counter$}) {
  const counters$ = Observable
    .merge(add_counter$.map(
      ctr$ => ctr$s => [...ctr$s, ctr$]
    ))
    .merge(remove_counter$.map(
      index => ctr$s => ctr$s.filter((_, i) => index !== i)
    ))
    .startWith([])
    .scan((ctrs$, callback) => callback(ctrs$))
    .share();

  const count$ = counters$.flatMapLatest(ctrs => Observable.combineLatest(
    ctrs.map(c => c.count$)).map(arr => arr.reduce((p, c) => p+c, 0))).startWith(0);
  return {
    counters$: counters$,
    count$: count$
  };
}

function view({counters$, count$}) {
  return counters$.combineLatest(
    count$, (counters, count) => {
      return div(".counter-list",
        [button(".add_counter", "Add"),
        div(".counters", [
          counters.map(
            (counter, index) => div(".counter-list-item",
              [counter.DOM,
              button(".remove_counter", {attributes: {value: index}}, "Remove"),
              hr()]
            )
          )
        ]),
        p("Total count: " + count)
      ])
    }
  );
}

function counter_list(sources) {
  const vtree$ = view(model(intent(sources)));

  return {
    DOM: vtree$
  };
}

function main(sources) {
  const vtree$ = counter_list(sources).DOM;

  return {
    DOM: vtree$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
