import React from "react";
import { TrashIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import Link from "next/link";
import {PostBox, PostDisplay} from "../components/post-displays";

import posts from "../../worker/data.jsonl";

export default function Bye() {
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
        <Link href="https://youtu.be/v8O_tSF_o50" className="absolute right-0 mr-8">
        Litter is over. Click here for background.
        </Link>
      </header>
      <main className="mt-[100px] mb-[120px]">
        <div>
          <ul>
            {posts &&
              posts.map(({ id, createdAt, ...post }) => (
                <li key={id}>
                    <PostBox>
                    <PostDisplay {...post} username="anonymous" createdAt={
                        new Date(parseFloat(createdAt)).toLocaleString()
                    } />
                    </PostBox>
                </li>
              ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
