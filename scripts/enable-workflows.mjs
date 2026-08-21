#!/usr/bin/env node
/**
 * Moves the parked workflow files into .github/workflows/ and stages them.
 *
 * They are parked in .github/workflows-pending/ because GitHub rejects any push
 * that writes .github/workflows/ from an app/token without the `workflows`
 * permission. Running this from your own machine (where your git credentials do
 * have that permission) activates CI and CodeQL.
 *
 *   npm run ci:enable
 *   git commit -m "ci: enable CI and CodeQL workflows"
 *   git push
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const PENDING = join('.github', 'workflows-pending');
const TARGET = join('.github', 'workflows');
const FILES = ['ci.yml', 'codeql.yml'];

if (!existsSync(PENDING)) {
  console.log('Nothing to do — .github/workflows-pending/ does not exist.');
  console.log('The workflows are most likely already enabled in .github/workflows/.');
  process.exit(0);
}

const git = (...args) => {
  try {
    execFileSync('git', args, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

mkdirSync(TARGET, { recursive: true });

let moved = 0;
for (const file of FILES) {
  const from = join(PENDING, file);
  const to = join(TARGET, file);

  if (!existsSync(from)) {
    console.log(`skip    ${from} (not found)`);
    continue;
  }
  if (existsSync(to)) {
    console.log(`skip    ${to} (already exists)`);
    continue;
  }

  // Prefer `git mv` so history follows the file; fall back to a plain rename.
  if (!git('mv', from, to)) {
    renameSync(from, to);
    git('add', to);
  }
  console.log(`enabled ${to}`);
  moved += 1;
}

const readme = join(PENDING, 'README.md');
if (existsSync(readme)) {
  if (!git('rm', '-q', readme)) rmSync(readme);
  console.log(`removed ${readme}`);
}

try {
  rmSync(PENDING, { recursive: true, force: true });
} catch {
  /* directory not empty — leave it alone */
}

git('add', '-A', '.github');

console.log(
  moved > 0
    ? '\nDone. Next:\n  git commit -m "ci: enable CI and CodeQL workflows"\n  git push\n'
    : '\nNo files were moved.\n',
);
