const { createHash } = require("crypto")

exports.generateHash = function(char) {
  const hash = createHash("md5");
  hash.update(char);
  return hash.digest("hex").slice(0);
}