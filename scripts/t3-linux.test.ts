import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import { promisify } from "node:util";

import { assert, it } from "@effect/vitest";

const execFileAsync = promisify(execFile);
const repoRoot = NodePath.resolve(import.meta.dirname, "..");

it("builds Linux x64 with the latest official nightly version", async () => {
  const fixtureRoot = await mkdtemp(NodePath.join(NodeOS.tmpdir(), "t3-linux-test-"));
  const binDir = NodePath.join(fixtureRoot, "bin");
  const vpArgsPath = NodePath.join(fixtureRoot, "vp-args");
  const appImagePath = NodePath.join(fixtureRoot, "nightly.AppImage");
  const installedMarkerPath = NodePath.join(fixtureRoot, ".local/opt/t3-code/installed-version");

  try {
    await execFileAsync("mkdir", ["-p", binDir]);
    await execFileAsync("mkdir", ["-p", NodePath.dirname(installedMarkerPath)]);
    await writeFile(installedMarkerPath, "stable\n");
    await writeFile(
      NodePath.join(binDir, "git"),
      `#!/usr/bin/env bash
if [[ "$1 $2 $3" == "remote get-url upstream" ]]; then
  printf '%s\\n' 'git@github.com:pingdotgg/t3code.git'
elif [[ "$1" == "ls-remote" ]]; then
  printf '%s\\n' \\
    'aaa refs/tags/v0.0.34-nightly.20260823.1168' \\
    'bbb refs/tags/v0.0.34-nightly.20260823.1169' \\
    'ccc refs/tags/v0.0.33'
else
  exit 2
fi
`,
      { mode: 0o755 },
    );
    await writeFile(
      NodePath.join(binDir, "vp"),
      `#!/usr/bin/env bash
printf '%s\\n' "$@" > "$T3_TEST_VP_ARGS"
mkdir -p release
cp "$T3_TEST_APPIMAGE" release/T3-Code-Nightly.AppImage
`,
      { mode: 0o755 },
    );
    await writeFile(NodePath.join(binDir, "cargo"), "#!/usr/bin/env bash\nexit 0\n", {
      mode: 0o755,
    });
    await writeFile(
      appImagePath,
      `#!/usr/bin/env bash
if [[ "\${1:-}" != "--appimage-extract" ]]; then
  exit 2
fi
mkdir -p squashfs-root
printf '%s\\n' '#!/usr/bin/env bash' > squashfs-root/AppRun
chmod +x squashfs-root/AppRun
printf '%s\\n' 'nightly' > squashfs-root/installed-version
`,
      { mode: 0o755 },
    );

    const { stdout } = await execFileAsync(NodePath.join(repoRoot, "t3-linux"), {
      cwd: repoRoot,
      env: {
        ...process.env,
        HOME: fixtureRoot,
        PATH: `${binDir}:${process.env.PATH ?? ""}`,
        T3_TEST_APPIMAGE: appImagePath,
        T3_TEST_VP_ARGS: vpArgsPath,
      },
    });

    assert.include(stdout, "v0.0.34-nightly.20260823.1169");
    assert.equal(
      await readFile(vpArgsPath, "utf8"),
      [
        "run",
        "dist:desktop:artifact",
        "--platform",
        "linux",
        "--target",
        "AppImage",
        "--arch",
        "x64",
        "--build-version",
        "0.0.34-nightly.20260823.1169",
        "",
      ].join("\n"),
    );
    assert.equal(await readFile(installedMarkerPath, "utf8"), "nightly\n");
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
