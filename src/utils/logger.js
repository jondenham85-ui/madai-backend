const logger = {
  info(message) {
    console.log(`[MADSI][INFO] ${message}`);
  },
  warn(message) {
    console.warn(`[MADSI][WARN] ${message}`);
  },
  error(message) {
    console.error(`[MADSI][ERROR] ${message}`);
  },
};

module.exports = logger;
