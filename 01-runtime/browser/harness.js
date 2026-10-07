/**
 * Experience Engine browser benchmark harness.
 *
 * Usage:
 *   const harness = createBrowserHarness({ switchExperience, getExperience });
 *   await harness.measureSwitch({ culture: "ar-EG", theme: "luxury", motion: "smooth" });
 */
export function createBrowserHarness({ switchExperience, getExperience }) {
  let active = null;

  const now = () => performance.now();

  function startFrameSampler() {
    const samples = [];
    let running = true;
    let previous = now();

    const tick = (timestamp) => {
      if (!running) return;
      const delta = timestamp - previous;
      previous = timestamp;
      samples.push(delta);
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    return {
      stop() {
        running = false;
      },
      getDroppedFrames() {
        return samples.filter((delta) => delta > 16.7).length;
      },
      getSamples() {
        return [...samples];
      },
    };
  }

  function observeLongTasks() {
    const entries = [];
    if (!("PerformanceObserver" in window)) {
      return {
        disconnect() {},
        getCount() { return 0; },
      };
    }

    let observer = null;
    try {
      observer = new PerformanceObserver((list) => {
        entries.push(...list.getEntries());
      });
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      // Some browsers may not support longtask.
    }

    return {
      disconnect() {
        observer?.disconnect();
      },
      getCount() {
        return entries.length;
      },
    };
  }

  function observeCLS() {
    let cls = 0;

    if (!("PerformanceObserver" in window)) {
      return {
        disconnect() {},
        getCLS() { return 0; },
      };
    }

    let observer = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
    } catch {
      // Some browsers may not support layout-shift.
    }

    return {
      disconnect() {
        observer?.disconnect();
      },
      getCLS() {
        return cls;
      },
    };
  }

  async function waitForPaint() {
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  async function measureSwitch(request) {
    if (active) return active;

    const started = now();
    const frameSampler = startFrameSampler();
    const longTasks = observeLongTasks();
    const layoutShift = observeCLS();

    let resourceReady = started;
    let transitionStart = started;
    let transitionEnd = started;

    performance.mark("experience-switch-start");

    try {
      const promise = Promise.resolve(
        switchExperience(request, {
          onResourceReady: () => {
            resourceReady = now();
            performance.mark("experience-resource-ready");
          },
          onTransitionStart: () => {
            transitionStart = now();
            performance.mark("experience-transition-start");
          },
          onTransitionEnd: () => {
            transitionEnd = now();
            performance.mark("experience-transition-end");
          },
        }),
      );

      await promise;
      await waitForPaint();

      const ended = now();
      const resolved = getExperience?.();

      performance.mark("experience-switch-end");

      const result = {
        request,
        switchLatencyMs: ended - started,
        resourceWaitMs: resourceReady - started,
        transitionDurationMs: Math.max(0, transitionEnd - transitionStart),
        commitToPaintMs: ended - transitionEnd,
        cls: layoutShift.getCLS(),
        longTasks: longTasks.getCount(),
        droppedFrames: frameSampler.getDroppedFrames(),
        finalExperience: resolved ?? null,
        timestamp: new Date().toISOString(),
      };

      return result;
    } finally {
      frameSampler.stop();
      longTasks.disconnect();
      layoutShift.disconnect();
      active = null;
    }
  }

  return {
    measureSwitch,
  };
}
