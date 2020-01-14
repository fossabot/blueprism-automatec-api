require("dotenv").config();
const packageJson = require("../package.json");
const app = require("./app");
const fs = require("fs");
const http = require("http");
const https = require("https");
let debug = require("debug")(`express:${packageJson.name}`);

const {
  BP_API_CERT_FILE_NAME,
  BP_API_CERT_PW,
  BP_API_HTTPS,
  BP_API_IP,
  BP_API_PORT,
  NODE_ENV,
} = process.env;
const port = BP_API_PORT || "3000";
let server;

// Use console.log if not debugging
if (!debug.enabled) {
  debug = console.log; // eslint-disable-line no-console
}
debug(`Version: ${packageJson.version}`);
debug(`Env: ${NODE_ENV}`);
debug(
  "Note: configuration can be done via .env file in this directory and/or via env variables",
);

// Create HTTP or HTTPS server.
if (BP_API_HTTPS === "true") {
  try {
    const options = {
      passphrase: BP_API_CERT_PW,
      pfx: fs.readFileSync(BP_API_CERT_FILE_NAME), // eslint-disable-line security/detect-non-literal-fs-filename
    };
    server = https.createServer(options, app);
  } catch (error) {
    if (error.message === "mac verify failure") {
      debug(
        "Error: Please check whether certificate password stored in .env (or env variable) file is correct",
      );
    } else if (error.code === "ENOENT") {
      debug(
        `Error: ${error.message}. Generate self signed certificate, set correct cert path in .env file (or env variable) or switch to non-secure HTTP instead of HTTPS in .env file (or env variable).`,
      );
    } else {
      debug(`Error: ${error.message}`);
    }
    process.exit(1);
  }
} else {
  server = http.createServer(app);
}

server.on("error", error => {
  debug(error);
});
server.on("listening", () => {
  const addr = server.address();
  debug(
    `Listening on ${addr.family} address ${BP_API_IP}, port ${
      addr.port
    }, using ${BP_API_HTTPS ? "HTTPS" : "HTTP"}`,
  );
});

server.listen(port, BP_API_IP);
