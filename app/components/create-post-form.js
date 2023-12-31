"use client";

import React from "react";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

// form for post creation with text and image
export default function CreatePostForm({ onSubmit, className, cooldown }) {
  const [text, setText] = React.useState("");
  const [image, setImage] = React.useState(null);

  const createPost = async (e) => {
    e.preventDefault();
    //read image as data url
    const encoded_img = image
      ? await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target.result;
            resolve(result);
          };
          reader.readAsDataURL(image);
        })
      : null;
    await onSubmit({ text, encoded_img });
    setText("");
    setImage(null);
  };

  const { status } = useSession();

  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <div className="h-full flex flex-row w-screen justify-between bg-black">
        <div className="flex flex-col w-full justify-center items-center">
          <Link
            href="/login"
            className="text-xl px-8 py-4 border border-1 border-gray-500 rounded-md"
          >
            Login to create a post
          </Link>
        </div>
      </div>
    );
  }

  if (cooldown) {
    return (
      <div className="h-full flex flex-row w-screen justify-between bg-black">
        <div className="flex flex-col w-full justify-center items-center">
          <span className="text-xl px-8 py-4 border-gray-500 rounded-md">
            Please wait 30 seconds before creating another post
          </span>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={createPost}
      className="h-full flex flex-row w-screen justify-between bg-black"
    >
      <textarea
        type="text"
        name="text"
        placeholder="Type your message here..."
        className="resize-none block flex-grow bg-black px-4 py-4 text-lg"
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyUp={(e) => {
          // submit on shift-enter
          if (e.key === "Enter" && e.shiftKey) {
            createPost(e);
          }
        }}
      />
      <div className="w-32 border-0 border-l border-gray-700">
        {image ? (
          <div className="w-full h-full relative">
            <Image
              src={URL.createObjectURL(image)}
              width={256}
              height={256}
              alt="image to upload"
            />
            <button
              type="button"
              onClick={() => setImage(null)}
              className={clsx(
                "block absolute bottom-0 bg-black text-white w-full px-1 py-1",
                "hover:bg-gray-900 hover:cursor-pointer"
              )}
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <label
              htmlFor="image"
              className={clsx(
                "flex flex-col h-full w-full justify-center items-center",
                "hover:bg-gray-900 hover:cursor-pointer"
              )}
            >
              Add Image
            </label>
            <input
              id="image"
              type="file"
              name="image"
              placeholder="Image"
              className="hidden"
              onChange={(e) => setImage(e.target.files[0])}
              accept="image/*"
            />
          </>
        )}
      </div>
      <button
        type="submit"
        disabled={!(text || image)}
        className={clsx(
          "flex flex-col w-32 justify-center items-center",
          "border-0 border-l border-gray-700 hover:bg-gray-900 hover:cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        Create
      </button>
    </form>
  );
}
