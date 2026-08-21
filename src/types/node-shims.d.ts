// The project has no @types/node and does not want one: nothing in the app runs
// on node. A single test needs to read index.css off disk to prove the seam's
// hard-coded ground colours still match the tokens, so declare just that.
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string
}
