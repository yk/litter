"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreatePostForm from "./components/create-post-form";
import Post from "./components/post";
import { TrashIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import Link from "next/link";

export default function Home() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts");
      return await res.json();
    },
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 10,
  });

  const { posts, cooldown } = data || { posts: [], cooldown: false };

  const createPost = async ({ text, encoded_img }) => {
    if (!(text || encoded_img)) return;
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, encoded_img }),
    });
    const json = await res.json();
    await queryClient.invalidateQueries(["posts"]);
    return json;
  };

  const { data: session, status } = useSession();
  const username = session?.user?.name;

  return (
    <div className="flex flex-col relative">
      <header
        className={clsx(
          "fixed top-0 w-screen h-[100px] bg-black border-b border-gray-500",
          "py-8 flex flex-row justify-center items-center gap-4"
        )}
      >
        <TrashIcon className="w-8 h-8" />
        <h1 className="text-4xl">Litter</h1>
        <Link href="/login" className="absolute right-0 mr-8">
          {username ? `Logged in as @${username}` : "Login"}
        </Link>
      </header>
      <main className="mt-[100px] mb-[120px]">
        {isLoading && (
          <div className="flex flex-row justify-center mt-28 text-2xl text-gray-400">
            Loading...
          </div>
        )}
        <div>
          <ul>
            {posts &&
              posts.map(({ id }) => (
                <li key={id}>
                  <Post
                    id={id}
                    onLike={(params) => onLike({ id, ...params })}
                  />
                </li>
              ))}
          </ul>
        </div>
      </main>
      <footer className="fixed bottom-0 w-screen border-t border-gray-500 h-[120px]">
        <CreatePostForm onSubmit={createPost} cooldown={cooldown}/>
      </footer>
    </div>
  );
}
