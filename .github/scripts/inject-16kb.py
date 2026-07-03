#!/usr/bin/env python3
"""
Inject a 16 KB memory page alignment block into android/build.gradle.

Google Play blocks Production updates for AAB files whose native .so
libraries aren't aligned to 16 KB page boundaries. RN 0.76 aligns its
own libs but does not force third-party modules (react-native-iap,
several expo-* modules) to do the same.

This script appends a subprojects{} block that flips
useLegacyPackaging.jniLibs=false on every Android subproject so their
.so files get the modern 16 KB packaging.

Idempotent: if the block is already present, does nothing.
Kept as a separate file so the workflow YAML doesn't have to embed a
multi-line Groovy heredoc (which broke the YAML block scalar indent).
"""

import os
import sys

BUILD_GRADLE = "android/build.gradle"

GRADLE_BLOCK = r"""

// 16 KB memory page alignment for Android 15+ Play Store compliance.
// Force every Android subproject to use modern packaging so all .so files
// (react-native-iap, expo-*, RN core, everything) align to 16 KB pages
// instead of the legacy 4 KB.
subprojects {
    afterEvaluate { proj ->
        try {
            if (proj.hasProperty("android")) {
                proj.android.packagingOptions.jniLibs.useLegacyPackaging = false
                println "[16KB] Modernised packaging for: ${proj.name}"
            }
        } catch (Throwable t) {
            // Some subprojects (e.g. pure Java libraries) don't expose
            // packagingOptions.jniLibs — skip them silently. Not fatal.
            println "[16KB] Skipping ${proj.name}: ${t.message}"
        }
    }
}
"""


def main():
    if not os.path.exists(BUILD_GRADLE):
        print(f"ERROR: {BUILD_GRADLE} not found (did prebuild run first?)", file=sys.stderr)
        sys.exit(1)

    with open(BUILD_GRADLE, "r") as f:
        current = f.read()

    if "useLegacyPackaging" in current:
        print("16 KB alignment block already present — skipping (idempotent)")
    else:
        with open(BUILD_GRADLE, "a") as f:
            f.write(GRADLE_BLOCK)
        print(f"Appended 16 KB alignment block to {BUILD_GRADLE}")

    print()
    print(f"=== Last 25 lines of {BUILD_GRADLE} ===")
    os.system(f"tail -25 {BUILD_GRADLE}")


if __name__ == "__main__":
    main()
