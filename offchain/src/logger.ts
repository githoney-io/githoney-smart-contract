import path from "path";
import pino from "pino";

const PROJECT_ROOT = path.resolve();
// to direct pretty logs to stdout
const stdout = 1;

/**
 * Write logs into a file and to stdout as well.
 */
const transport = pino.transport({
  targets: [
    {
      target: "pino/file",
      level: "trace", // all levels
      options: { destination: `${PROJECT_ROOT}/app.log` },
    },
    {
      target: "pino-pretty",
      level: "info", // info and upper levels
      options: { destination: stdout },
    },
  ],
});

const logger = pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    // do not include `pid` field
    bindings: ({ hostname }) => ({ hostname }),
  },
}, transport);

export default logger;
