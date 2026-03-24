import fs from "fs";
import path from "path";

const pr = process.env.PR_NUMBER || "local";
const root = process.cwd();
const inDir = path.join(root, "test-results");
const outDir = path.join(root, "visual-pages", "pr", String(pr));

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function copy(src, dst) {
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

function scanDiffs(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/-diff\.png$/i.test(name)) files.push(p);
    }
  };
  walk(dir);
  return files;
}

function makeRel(base, p) {
  return p.replace(base + path.sep, "").replace(/\\/g, "/");
}

const diffs = scanDiffs(inDir);
ensureDir(outDir);

const entries = [];
for (const diffPath of diffs) {
  const base = diffPath.replace(/-diff\.png$/i, "");
  const expected = base + "-expected.png";
  const actual = base + "-actual.png";
  const name = path.basename(base);
  const dstFolder = path.join(
    outDir,
    path.relative(inDir, path.dirname(diffPath)),
  );
  ensureDir(dstFolder);
  const out = {
    name,
    expected: makeRel(outDir, path.join(dstFolder, name + "-expected.png")),
    actual: makeRel(outDir, path.join(dstFolder, name + "-actual.png")),
    diff: makeRel(outDir, path.join(dstFolder, name + "-diff.png")),
  };
  if (fs.existsSync(expected))
    copy(expected, path.join(dstFolder, name + "-expected.png"));
  if (fs.existsSync(actual))
    copy(actual, path.join(dstFolder, name + "-actual.png"));
  copy(diffPath, path.join(dstFolder, name + "-diff.png"));
  entries.push(out);
}

const indexHtml = `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Visual Diffs — PR #${pr}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,-apple-system; margin:24px;}
    h1{font-size:20px;margin:0 0 16px;}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
    figure{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    figcaption{font:12px/1.4 monospace;color:#374151;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    img{max-width:100%;height:auto;border-radius:8px;display:block}
    .row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
    .label{font-size:11px;color:#6b7280;margin:8px 0 4px}
  </style>
</head><body>
  <h1>Visual Diffs — PR #${pr}</h1>
  <p>Total: ${entries.length}</p>
  <div class="grid">
    ${entries
      .map(
        (e) => `
      <figure>
        <figcaption>${e.name}</figcaption>
        <div class="label">Expected · Actual · Diff</div>
        <div class="row">
          <img src="${e.expected}" alt="expected"/>
          <img src="${e.actual}"   alt="actual"/>
          <img src="${e.diff}"     alt="diff"/>
        </div>
      </figure>
    `,
      )
      .join("")}
  </div>
</body></html>`;

fs.writeFileSync(path.join(outDir, "index.html"), indexHtml, "utf-8");
fs.writeFileSync(
  path.join(outDir, "index.json"),
  JSON.stringify(entries.slice(0, 6), null, 2),
);
console.log(`Built visual pages for PR #${pr}: ${entries.length} diffs`);
