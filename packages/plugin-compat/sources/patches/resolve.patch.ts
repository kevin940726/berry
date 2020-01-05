export const patch =
"diff --git a/lib/normalize-options.js b/lib/normalize-options.js\nindex 4b56904..0a1a65f 100644\nsemver exclusivity ^1.9\n--- a/lib/normalize-options.js\n+++ b/lib/normalize-options.js\n@@ -1,10 +1,88 @@\n-module.exports = function (x, opts) {\n-    /**\n-     * This file is purposefully a passthrough. It's expected that third-party\n-     * environments will override it at runtime in order to inject special logic\n-     * into `resolve` (by manipulating the options). One such example is the PnP\n-     * code path in Yarn.\n-     */\n-\n-    return opts || {};\n+// Info: this file has been generated by Yarn in accordance with the approval\n+// of the `resolve` maintainers. Bugs caused by a code located here should be\n+// opened against the Yarn repository.\n+\n+const path = require(`path`);\n+\n+module.exports = function (_, opts) {\n+  opts = opts || {};\n+\n+  if (opts.forceNodeResolution || !process.versions.pnp)\n+    return opts;\n+\n+  // It would be nice if we could throw, but that would break the transparent\n+  // compatibility with packages that use `resolve` today (such as Gulp). Since\n+  // it's the whole point of this patch, we don't.\n+  //\n+  // if (opts.packageIterator || opts.paths)\n+  //   throw new Error(`The \"packageIterator\" and \"paths\" options cannot be used in PnP environments. Set \"forceNodeResolution: true\" if absolutely needed, or branch on process.versions.pnp otherwise.`);\n+\n+  const pnp = require(`pnpapi`);\n+\n+  const packageIterator = function (request, basedir, getCandidates, opts) {\n+    // Extract the name of the package being requested (1=package name, 2=internal path)\n+    const parts = request.match(/^((?:@[^\\/]+\\/)?[^\\/]+)(\\/.*)?/);\n+    if (!parts)\n+      throw new Error(`Assertion failed: Expected the \"resolve\" package to call the \"paths\" callback with package names only (got \"${request}\")`);\n+\n+    // Make sure that basedir ends with a slash\n+    if (basedir.charAt(basedir.length - 1) !== `/`)\n+      basedir = path.join(basedir, `/`);\n+\n+    const api = pnp.findApiFromPath(basedir);\n+    if (api === null)\n+      return getCandidates();\n+\n+    // This is guaranteed to return the path to the \"package.json\" file from the given package\n+    const manifestPath = api.resolveToUnqualified(`${parts[1]}/package.json`, basedir, {\n+      considerBuiltins: false,\n+    });\n+\n+    if (manifestPath === null)\n+      throw new Error(`Assertion failed: The resolution thinks that \"${parts[1]}\" is a Node builtin`);\n+\n+    // Strip the package.json to get the package folder\n+    let packagePath = path.dirname(manifestPath);\n+\n+    // Attach the internal path to the resolved package directory\n+    if (typeof parts[2] !== `undefined`)\n+      packagePath = path.join(packagePath, parts[2]);\n+\n+    return [packagePath];\n+  };\n+\n+  const paths = function (request, basedir, opts) {\n+    return opts.packageIterator(request, basedir, () => [], opts).map(manifestPath => {\n+      // Stip the local named folder\n+      let nodeModules = path.dirname(manifestPath);\n+\n+      // Strip the scope named folder if needed\n+      if (request.match(/^@[^\\/]+\\//))\n+        nodeModules = path.dirname(nodeModules);\n+\n+      return nodeModules;\n+    });\n+  };\n+\n+  // We need to keep track whether we're in `packageIterator` or not so that\n+  // the code is compatible with both `resolve` 1.9+ and `resolve` 1.15+\n+  let isInsideIterator = false;\n+\n+  opts.packageIterator = function (request, basedir, getCandidates, opts) {\n+    isInsideIterator = true;\n+    try {\n+      return packageIterator(request, basedir, getCandidates, opts);\n+    } finally {\n+      isInsideIterator = false;\n+    }\n+  };\n+\n+  opts.paths = function (request, basedir, getNodeModulePaths, opts) {\n+    if (isInsideIterator)\n+      return getNodeModulePaths();\n+\n+    return paths(request, basedir, opts);\n+  };\n+\n+  return opts;\n };\n"
;
