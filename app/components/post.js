import React from "react";
import Moment from "react-moment";
import { ErrorBoundary } from "react-error-boundary";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LikesDisplay, PostBox, PostDisplay } from "./post-displays";

function LikesContainer({ postId, self_liked, num_likes }) {
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
    <LikesDisplay self_liked={self_liked} num_likes={num_likes} onLike={onLike} />
  );
}

function PostContainer({ id, createdAt, ...props }) {
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
    <PostDisplay id={id} {...props} createdAt={<Moment fromNow unix>{createdAt / 1000}</Moment>}>
    {likesData && <LikesContainer postId={id} {...likesData} />}
    </PostDisplay>
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
    <PostBox>
      <ErrorBoundary
        fallback={
          <div className="text-red-600">Post cannot be rendered....</div>
        }
      >
        {isLoading && <div>Loading...</div>}
        {data && <PostContainer {...data} />}
      </ErrorBoundary>
    </PostBox>
  );
}
