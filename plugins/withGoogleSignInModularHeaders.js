const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// GoogleSignIn 9.x pulls in AppCheckCore (a Swift pod) that depends on
// GoogleUtilities and RecaptchaInterop. Those pods do not define modules, so
// when the project is built with static libraries (the Expo default) CocoaPods
// fails with:
//   "The Swift pod `AppCheckCore` depends upon `GoogleUtilities` and
//    `RecaptchaInterop`, which do not define modules."
// EAS regenerates the Podfile from scratch on every prebuild, so a manual edit
// to ios/Podfile is not enough. This plugin re-injects the required
// `:modular_headers => true` lines into the generated Podfile.
const POD_LINES = [
  "  # Required for AppCheckCore -> GoogleUtilities/RecaptchaInterop when using static libs.",
  "  pod 'GoogleUtilities', :modular_headers => true",
  "  pod 'RecaptchaInterop', :modular_headers => true",
].join("\n");

module.exports = function withGoogleSignInModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile"
      );
      let contents = fs.readFileSync(podfilePath, "utf8");

      if (!contents.includes("RecaptchaInterop', :modular_headers")) {
        contents = contents.replace(
          /(\n[ \t]*use_expo_modules!\n)/,
          `$1\n${POD_LINES}\n`
        );
        fs.writeFileSync(podfilePath, contents);
      }

      return cfg;
    },
  ]);
};
