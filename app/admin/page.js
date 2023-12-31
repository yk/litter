"use client";

import React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

export default function Admin() {
  const queryClient = useQueryClient();
  const [adminPassword, setAdminPassword] = React.useState("");

  const deleteAllPosts = React.useCallback(async () => {
    const res = await fetch("/api/posts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword || "",
      },
    });
    const json = await res.json();
    await queryClient.invalidateQueries(["posts"]);
    return json;
  }, [adminPassword, queryClient]);

  return (
    <main className="mx-8 my-8 flex flex-col gap-4">
      <div>
        <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded">
          Home
        </Link>
      </div>

      <div>
        <input
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="Admin Password"
          className="border border-gray-400 rounded px-4 py-2 text-black"
        />
      </div>

      <div>
        <button
          onClick={deleteAllPosts}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete All Posts
        </button>
      </div>
    </main>
  );
}
