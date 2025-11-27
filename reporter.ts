import type {
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";

type Counter = {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  timedOut: number;
  interrupted: number;
  duration: number;
};

type FileStats = {
  describes: Record<string, Counter>;
  tests: Counter;
  steps: Counter;
};

function makeCounter(): Counter {
  return {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
    interrupted: 0,
    duration: 0,
  };
}

class CustomReporter implements Reporter {
  private fileStats = new Map<string, FileStats>();
  private resultStartTimes = new WeakMap<TestResult, number>();

  onTestBegin(test: TestCase, result: TestResult) {
    this.resultStartTimes.set(result, Date.now());
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const file = test.location.file;
    if (!this.fileStats.has(file)) {
      this.fileStats.set(file, {
        describes: {},
        tests: makeCounter(),
        steps: makeCounter(),
      });
    }

    const stats = this.fileStats.get(file)!;

    // Describe block
    const path = test.titlePath().slice(0, -1);
    const topDescribe = path[0] || "(no describe)";

    if (topDescribe != "(no describe)") {
      if (!stats.describes[topDescribe]) {
        stats.describes[topDescribe] = makeCounter();
      }
      const d = stats.describes[topDescribe];
      d.total++;
      d[result.status]++;
      d.duration += result.duration;
    }

    // Test block
    stats.tests.total++;
    stats.tests[result.status]++;
    stats.tests.duration += result.duration;
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep) {
    // Ignore root steps like 'beforeEach'
    if (!step.category || step.category === "test") {
      const file = test.location.file;
      const stats = this.fileStats.get(file)!;

      stats.steps.total++;
      stats.steps[step.error ? "failed" : "passed"]++;
      stats.steps.duration += step.duration;
    }
  }

  onEnd() {
    for (const [file, stats] of this.fileStats.entries()) {
      console.group(`${file}`);

      // Describe
      console.groupCollapsed("Describe Blocks");
      for (const [describeName, d] of Object.entries(stats.describes)) {
        console.groupCollapsed(describeName);
        console.table(d);
        console.groupEnd();
      }
      console.groupEnd();

      // Tests
      console.groupCollapsed("Tests");
      console.table(stats.tests);
      console.groupEnd();

      // Test steps
      console.groupCollapsed("Test Steps");
      console.table(stats.steps);
      console.groupEnd();

      console.groupEnd();
    }
  }
}

module.exports = CustomReporter;
