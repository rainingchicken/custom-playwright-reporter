import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";
import fs from "fs";
import path from "path";
import Table from "cli-table3";
type MyType = {
  [key: string]: string;
};

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

    if (!stats.describes[topDescribe]) {
      stats.describes[topDescribe] = makeCounter();
    }
    const d = stats.describes[topDescribe];
    d.total++;
    d[result.status]++;
    d.duration += result.duration;

    // Test block
    stats.tests.total++;
    stats.tests[result.status]++;
    stats.tests.duration += result.duration;

    const table = new Table({
      head: ["Name", "Age", "Occ", "A", "B"],
    });

    table.push(
      ["Aliceeeeeeeeeeeeeeeeeee", 20, "job1", "a", "v"],
      ["Bob", 30, "job2", "aa", "vgf"]
    );

    process.stdout.write(table.toString() + "\n");

    // Tests
    console.log(`::group::Tests`);
    console.table(stats.tests);
    console.log("::endgroup::");
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
      console.log(`::group::${file}`);

      // Describe
      console.log(`::group::Describe`);
      for (const [describeName, d] of Object.entries(stats.describes)) {
        console.groupCollapsed(describeName);
        console.table(d);
        console.log("::endgroup::");
      }
      console.log("::endgroup::");
    }
  }
}

module.exports = CustomReporter;

// class CustomReporter implements Reporter {
//   private results: any = [];
//   constructor() {
//     this.results = [];
//   }
//   onTestEnd(test: TestCase, result: TestResult): void {
//     const stepTitles =
//       result.steps
//         ?.map((step) => (step.category == "test.step" ? step.title : ""))
//         .join(", ") || "";
//     const error = result.error?.message || "";
//     const trace =
//       result.attachments?.find((a) => a.name === "trace")?.path || null;

//     this.results.push({
//       testName: test.title,
//       steps: stepTitles,
//       status: result.status,
//       timeTaken: (result.duration / 1000).toFixed(2) + "s",
//       errorMessage: error,
//       tracePath: trace,
//     });

//     const table = new Table({
//       head: ["Name", "Age"],
//     });

//     table.push(["Alice", 20], ["Bob", 30]);

//     process.stdout.write(table.toString() + "\n");
//   }

//   formatBadge(status: "passed" | "failed" | "skipped") {
//     const colors = {
//       passed: "#4CAF50",
//       failed: "#F44336",
//       skipped: "#FFC107",
//     };
//     const color = colors[status] || "#bdbdbd";
//     return `<span class="badge" style="background:${color}">${
//       status[0].toUpperCase() + status.slice(1)
//     }</span>`;
//   }

//   buildTestRows() {
//     return this.results
//       .map((test: any, index: any) => {
//         const stepsArray = test.steps
//           ? test.steps
//               .split(",")
//               .map((s: any) => s.trim())
//               .filter(Boolean)
//           : [];
//         const stepsHTML = stepsArray.length
//           ? `<details><summary>View Steps</summary><ol>${stepsArray
//               .map((s: any) => `<li>${s}</li>`)
//               .join("")}</ol></details>`
//           : "";

//         const errorHTML =
//           test.status === "failed" && test.errorMessage
//             ? `<pre class="error-text">${test.errorMessage}</pre>`
//             : "";

//         const traceLinkHTML = test.tracePath
//           ? `<a href="${test.tracePath}" target="_blank">Open Trace</a>`
//           : "";

//         return `
//         <tr>
//           <td>${index + 1}</td>
//           <td>${test.testName}</td>
//           <td class="wrap-text">${stepsHTML}${errorHTML}${
//           traceLinkHTML ? `<br>${traceLinkHTML}` : ""
//         }</td>
//           <td>${this.formatBadge(test.status)}</td>
//           <td>${test.timeTaken}</td>
//         </tr>
//       `;
//       })
//       .join("");
//   }

//   generateHTMLReport(summary: any) {
//     const { total, passed, failed, skipped } = summary;
//     const testRows = this.buildTestRows();

//     return `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Playwright Test Report</title>
//         <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
//         <link href="https://fonts.googleapis.com/css?family=Inter:400,600,700&display=swap" rel="stylesheet">
//         <style>
//           body {
//             font-family: 'Inter', sans-serif;
//             background: #f3f4f6;
//             margin: 0;
//             padding: 0;
//             color: #1f2937;
//           }
//           .header {
//             background: #1e293b;
//             padding: 2rem 1rem;
//             text-align: center;
//             color: white;
//           }
//           .header h1 {
//             margin: 0;
//             font-size: 2.5rem;
//           }
//           .cards {
//             display: flex;
//             justify-content: center;
//             flex-wrap: wrap;
//             gap: 1rem;
//             margin: 2rem auto;
//           }
//           .card {
//             background: white;
//             border-radius: 10px;
//             box-shadow: 0 2px 10px rgba(0,0,0,0.05);
//             padding: 1rem 2rem;
//             text-align: center;
//             min-width: 120px;
//           }
//           .card .count {
//             font-size: 2rem;
//             font-weight: bold;
//           }
//           .card.passed { border-left: 5px solid #4CAF50; }
//           .card.failed { border-left: 5px solid #F44336; }
//           .card.skipped { border-left: 5px solid #FFC107; }

//           .chart-container {
//             background: white;
//             border-radius: 10px;
//             margin: 0 auto 2rem;
//             padding: 1rem;
//             width: 360px;
//             box-shadow: 0 2px 10px rgba(0,0,0,0.05);
//           }

//           .table-container {
//             max-width: 95%;
//             margin: 0 auto 3rem;
//             overflow-x: auto;
//             background: white;
//             border-radius: 10px;
//             box-shadow: 0 2px 10px rgba(0,0,0,0.05);
//           }
//           table {
//             width: 100%;
//             border-collapse: collapse;
//             font-size: 1rem;
//           }
//           th, td {
//             padding: 0.75rem;
//             text-align: left;
//             border-bottom: 1px solid #e5e7eb;
//           }
//           th {
//             background: #1e293b;
//             color: white;
//             position: sticky;
//             top: 0;
//           }
//           tr:nth-child(even) {
//             background: #f9fafb;
//           }
//           .badge {
//             display: inline-block;
//             padding: 4px 10px;
//             border-radius: 20px;
//             color: white;
//             font-size: 0.85rem;
//             font-weight: 600;
//           }
//           .wrap-text {
//             white-space: pre-wrap;
//             word-wrap: break-word;
//           }
//           .wrap-text ol {
//             padding-left: 1.2rem;
//             margin: 0;
//           }
//           .wrap-text li {
//             margin-bottom: 0.3rem;
//           }
//           .error-text {
//             margin-top: 0.5rem;
//             color: #e11d48;
//             background: #ffe4e6;
//             border-left: 3px solid #dc2626;
//             padding: 0.5rem;
//             font-size: 0.9rem;
//             overflow-x: auto;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="header">
//           <h1>Playwright Test Report</h1>
//         </div>
//         <div class="cards">
//           <div class="card passed"><div class="count">${passed}</div><div>Passed</div></div>
//           <div class="card failed"><div class="count">${failed}</div><div>Failed</div></div>
//           <div class="card skipped"><div class="count">${skipped}</div><div>Skipped</div></div>
//           <div class="card"><div class="count">${total}</div><div>Total</div></div>
//         </div>
//         <div class="chart-container">
//           <canvas id="donutChart"></canvas>
//         </div>
//         <div class="table-container">
//           <table>
//             <thead>
//               <tr>
//                 <th>Sr.No</th>
//                 <th>Test Name</th>
//                 <th>Steps / Error / Trace</th>
//                 <th>Status</th>
//                 <th>Time Taken</th>
//               </tr>
//             </thead>
//             <tbody>${testRows}</tbody>
//           </table>
//         </div>
//         <script>
//           const ctx = document.getElementById('donutChart').getContext('2d');
//           new Chart(ctx, {
//             type: 'doughnut',
//             data: {
//               labels: ['Passed', 'Failed', 'Skipped'],
//               datasets: [{
//                 data: [${passed}, ${failed}, ${skipped}],
//                 backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
//                 hoverOffset: 6
//               }]
//             },
//             options: {
//               responsive: true,
//               plugins: {
//                 legend: {
//                   display: true,
//                   position: 'bottom',
//                   labels: { font: { size: 14 } }
//                 }
//               },
//               cutout: '70%',
//               maintainAspectRatio: false
//             }
//           });
//         </script>
//       </body>
//       </html>
//     `;
//   }

//   onEnd(
//     result: FullResult
//   ): Promise<{ status?: FullResult["status"] } | undefined | void> | void {
//     const pad = (n: any) => n.toString().padStart(2, "0");

//     let specFileName = "all";
//     for (const arg of process.argv) {
//       if (arg.endsWith(".spec.ts") || arg.endsWith(".spec.js")) {
//         specFileName = path.basename(arg, path.extname(arg));
//         break;
//       }
//     }

//     const now = new Date();
//     const timestamp = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(
//       now.getSeconds()
//     )}__${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now
//       .getFullYear()
//       .toString()
//       .slice(-2)}`;
//     const outputDir = path.join(
//       "playwright-report",
//       `${specFileName}_${timestamp}`
//     );
//     fs.mkdirSync(outputDir, { recursive: true });

//     const summary = {
//       passed: this.results.filter((t: any) => t.status === "passed").length,
//       failed: this.results.filter((t: any) => t.status === "failed").length,
//       skipped: this.results.filter((t: any) => t.status === "skipped").length,
//       total: this.results.length,
//     };

//     const htmlContent = this.generateHTMLReport(summary);
//     const jsonPath = path.join(outputDir, "report.json");
//     const htmlPath = path.join(outputDir, "index.html");

//     fs.writeFileSync(htmlPath, htmlContent);
//     fs.writeFileSync(
//       jsonPath,
//       JSON.stringify({ summary, results: this.results }, null, 2)
//     );

//     console.log(
//       `***************************************************************************************************`
//     );
//     console.log(`✅ HTML Report saved at: ${htmlPath}`);
//     console.log(`✅ JSON Report saved at: ${jsonPath}`);
//     console.log(
//       `***************************************************************************************************`
//     );
//   }
// }

// module.exports = CustomReporter;
