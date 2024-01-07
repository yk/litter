"use client";

import React from "react";
import { TrashIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import Link from "next/link";
import { PostBox, PostDisplay } from "../components/post-displays";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import posts from "../../worker/data.jsonl";

const allPosts = Object.values(posts);

const postHeights = allPosts.map((post) => {
  let height = 128;
  if (post.text) {
    height += 64 + 32;
  }
  if (post.img_url) {
    height += 512;
  }
  return height;
});

const ListRow = ({ index, style }) => {
  const post = allPosts[index];
  return (
    <div style={style}>
      <PostBox className={"h-full"}>
        <PostDisplay
          {...post}
          username="anonymous"
          createdAt={new Date(parseFloat(post.createdAt)).toLocaleString()}
        />
      </PostBox>
    </div>
  );
};

export default function Bye() {
  return (
    <div className="flex flex-col relative h-screen w-screen">
      <header
        className={clsx(
          "fixed top-0 w-screen h-[100px] bg-black border-b border-gray-500",
          "py-8 flex flex-row justify-center items-center gap-4"
        )}
      >
        <TrashIcon className="w-8 h-8" />
        <h1 className="text-4xl">Litter</h1>
        <Link
          href="https://youtu.be/v8O_tSF_o50"
          className="absolute right-0 mr-8"
        >
          Litter is over. Click here for background.
        </Link>
      </header>
      <main className="mt-[100px] h-full">
        {allPosts && (
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={allPosts.length}
                itemSize={(index) => postHeights[index]}
                width={width}
              >
                {ListRow}
              </List>
            )}
          </AutoSizer>
        )}
      </main>
    </div>
  );
}
