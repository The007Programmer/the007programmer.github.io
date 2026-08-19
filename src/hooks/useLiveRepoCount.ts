import { useEffect, useState } from "react"

export function useLiveRepoCount(fallback: number): number {
  const [count, setCount] = useState(fallback)

  useEffect(() => {
    let cancelled = false
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1200))

    Promise.race([
      fetch("https://api.github.com/users/The007Programmer").then((r) => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}`)
        return r.json()
      }),
      timeout,
    ])
      .then((data: { public_repos?: number }) => {
        if (!cancelled && typeof data.public_repos === "number") setCount(data.public_repos)
      })
      .catch(() => {
        /* keep the fallback — this is expected on a slow network, not an error to surface */
      })

    return () => { cancelled = true }
  }, [])

  return count
}
