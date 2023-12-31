import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import Moment from "react-moment";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function LikesDisplay({ postId, self_liked, num_likes }) {
  const { status } = useSession();

  const router = useRouter();
  const queryClient = useQueryClient();

  const onLike = React.useCallback(async () => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    await fetch(`/api/posts/${postId}/likes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    queryClient.invalidateQueries(["posts", postId, "likes"]);
  }, [status, router, postId, queryClient]);

  return (
    <div className="mt-6 flex flex-row gap-2 items-center">
      <button className="h-8 w-8 text-gray-300" onClick={() => onLike()}>
        {self_liked ? <HeartIconSolid /> : <HeartIconOutline />}
      </button>
      <span className="text-gray-400">{num_likes || 0}</span>
    </div>
  );
}

function PostDisplay({ id, text, img_url, createdAt, username }) {
  const { data: likesData } = useQuery({
    queryKey: ["posts", id, "likes"],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}/likes`);
      return await res.json();
    },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  });
  return (
    <article className="flex flex-col">
      <div className="flex flex-row gap-4">
        <span className="text-gray-500">{`@${username}`}</span>
        <span className="text-gray-500">
          <Moment fromNow unix>
            {createdAt / 1000}
          </Moment>
        </span>
      </div>
      <div>
        {text && <p className="mt-2 mb-2 text-lg">{text}</p>}
        {img_url && (
          <Image
            src={img_url}
            width={512}
            height={512}
            className="mt-2"
            alt="post image"
          />
        )}
      </div>
      {likesData && <LikesDisplay postId={id} {...likesData} />}
    </article>
  );
}

export default function Post({ id }) {
  const { data, isLoading } = useQuery({
    queryKey: ["posts", id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}`);
      return await res.json();
    },
  });
  return (
    <div className="px-16 py-8 border-b border-gray-500">
      <ErrorBoundary
        fallback={
          <div className="text-red-600">Post cannot be rendered....</div>
        }
      >
        {isLoading && <div>Loading...</div>}
        {data && <PostDisplay {...data} />}
      </ErrorBoundary>
    </div>
  );
}
