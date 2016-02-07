import {Observable} from 'rx';
import Cycle from '@cycle/core';
import {svg, h, hr, div, button, p, makeDOMDriver} from '@cycle/dom';
import isolate from '@cycle/isolate';
import combineLatestObj from 'rx-combine-latest-obj';

function sigmoid(t, offset, sigma) {
  return 1/(1 + Math.pow(Math.E, -(t - offset) * sigma));
}

function internal_eye({sources, props}) {
  const left = props.left$, top = props.top$,
    width = props.width$, height = props.height$,
    mouse = sources.global_mousemove;

  const vtree$ = combineLatestObj({left, top, width, height, mouse})
    .map(({left, top, width, height, mouse}) => {
      const style = {
        position: "absolute",
        left: left + "px",
        top: top + "px",
        width: width + "px",
        height: height + "px"
      };
      const blue_color = "#1569C7";
      const center_x = width / 2 + left, center_y = height / 2 + top;
      const m_x = mouse.clientX, m_y = mouse.clientY;

      const vec_x = m_x - center_x, vec_y = m_y - center_y;
      const vec_len = Math.sqrt(vec_x*vec_x + vec_y*vec_y);

      const outer_r = width / 2 - 4, pupil_r = width / 12;
      const blue_r = width / 6;
      const scale = sigmoid(vec_len, 150, 1/120.0) * width / 4;

      const blue_center_x = vec_x / vec_len * scale + width / 2;
      const blue_center_y = vec_y / vec_len * scale + height / 2;

      const pupil_center_x = vec_x / vec_len * scale * 1.2 + width / 2;
      const pupil_center_y = vec_y / vec_len * scale * 1.2 + height / 2;

      return div(
        ".eye", {style}, [
          svg(
            "svg", {width: width, height: height}, [
              svg("ellipse", {cx: width / 2, cy: height / 2,
                rx: outer_r, ry: outer_r * 0.85, stroke: "black",
                "stroke-width": "3", fill: "none"}),
              svg("circle", {cx: blue_center_x, cy: blue_center_y,
                  r: blue_r, stroke: blue_color, fill: blue_color}),
              svg("circle", {cx: pupil_center_x, cy: pupil_center_y,
                  r: pupil_r, stroke: "black", fill: "black"})
          ])
      ]);
  });
  return {
    DOM: vtree$
  };
}

function eye({sources, props}) {
  return isolate(internal_eye)({sources, props});
}

const page_mousemove_driver = () => {
  return Observable.fromEventPattern(
    (h) => {
      document.addEventListener("mousemove", h, true);
    },
    (h) => {
      document.removeEventListener("mousemove", h, true);
    }
  );
};

const drivers = {
  DOM: makeDOMDriver("#main-container"),
  global_mousemove: page_mousemove_driver,
};

function moving_props(left_center, left_radius, left_speed,
                     top_center, top_radius, top_speed,
                     width, height) {
  const timer_rate = 10, freq_multiplier = 1 / (timer_rate * 5.0);
  return {
    left$: Observable.timer(0, timer_rate).map(
      t => left_radius * Math.sin(t * freq_multiplier * left_speed) + left_center),
    top$: Observable.timer(0, timer_rate).map(
      t => top_radius * Math.sin(t * freq_multiplier * top_speed) + top_center),
    width$: Observable.just(width),
    height$: Observable.just(height)
  };
}

function main(sources) {
  const window_width = window.innerWidth, window_height = window.innerHeight;
  const eye_size = Math.min(window_width, window_height) / 5;

  // make some crazy eyes moving all around
  const p1 = moving_props(window_width / 10, window_width / 12, 0.8,
                          window_height / 8, window_height / 10, 1,
                          eye_size, eye_size),
    p2 = moving_props(window_width / 2, window_width / 10, 0.7,
                      window_height / 10, window_height / 13, 1.3,
                      eye_size, eye_size),
    p3 = moving_props(window_width / 9, window_width / 11, 1.8,
                      window_height / 2, window_height / 9, 0.6,
                      eye_size, eye_size),
    p4 = moving_props(window_width / 2.5, window_width / 8, 1.85,
                      window_height / 1.5, 3 * window_height / 20, 1.55,
                      eye_size / 2, eye_size / 2),
    p5 = moving_props(window_width * 0.63, window_width / 14, 0.4,
                      window_height / 3, window_height / 6, 0.2,
                      eye_size * 2.5, eye_size * 2.5);

  const eye1 = eye({sources, props: p1}),
    eye2 = eye({sources, props: p2}),
    eye3 = eye({sources, props: p3}),
    eye4 = eye({sources, props: p4}),
    eye5 = eye({sources, props: p5});

  const vtree$ = Observable.just([eye1.DOM, eye2.DOM, eye3.DOM, eye4.DOM, eye5.DOM])
    .map(eyedom => div(eyedom));

  return {
    DOM: vtree$
  };
}

Cycle.run(main, drivers);
