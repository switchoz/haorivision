import { useEffect, useState } from "react";
import { api } from "../api";
import { tid } from "../../shared/testid";

export default function Flags() {
  const [flags, setFlags] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/admin/flags")
      .then(setFlags)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function toggle(k: string) {
    const next = { ...flags, [k]: !flags[k] };
    setFlags(next);
    try {
      await api("/api/admin/flags", {
        method: "POST",
        body: JSON.stringify({ [k]: next[k] }),
      });
    } catch (error) {
      console.error("Error updating flag:", error);
      // Revert on error
      setFlags(flags);
    }
  }

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div {...tid("admin-flags")}>
      <h1 className="text-2xl font-semibold mb-4">Feature Flags</h1>
      <ul className="space-y-2">
        {Object.keys(flags).map((k) => (
          <li
            key={k}
            className="flex items-center justify-between border p-3 rounded shadow-sm"
          >
            <span className="font-medium">{k}</span>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!flags[k]}
                onChange={() => toggle(k)}
                {...tid(`flag-${k}`)}
                className="w-4 h-4"
              />
              <span className={flags[k] ? "text-green-600" : "text-gray-500"}>
                {String(!!flags[k])}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
