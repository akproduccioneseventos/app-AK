const fs = require('node:fs');
const path = require('node:path');
module.exports = class AuditReporter {
  onBegin(config, suite) {
    this.file = path.join(process.env.AK_AUDIT_RESULT_DIR, 'e2e-progress.json');
    this.data = { total: suite.allTests().length, started: new Date().toISOString(), results: [] };
    this.save();
  }
  onTestBegin(test) {
    this.data.current = { file: path.basename(test.location.file), title: test.title };
    this.save();
  }
  onTestEnd(test, result) {
    this.data.results.push({ file: path.basename(test.location.file), line: test.location.line,
      title: test.title, status: result.status, duration: result.duration,
      errors: result.errors.map(e => e.message?.replace(/\u001b\[[0-9;]*m/g, '').slice(0, 700)) });
    this.save();
  }
  onEnd(result) {
    this.data.final = result.status;
    this.data.finished = new Date().toISOString();
    this.save();
  }
  save() { fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2)); }
};
