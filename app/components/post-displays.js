import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";

export function PostBox({ children }) {
  return <div className="px-16 py-8 border-b border-gray-500">{children}</div>;
}

export function PostDisplay({ text, img_url, createdAt, username, children }) {
  return (
    <article className="flex flex-col">
      <div className="flex flex-row gap-4">
        <span className="text-gray-500">{`@${username}`}</span>
        <span className="text-gray-500">
        {createdAt}
        </span>
      </div>
      <div>
        {text && <p className="mt-2 mb-2 text-lg">{text}</p>}
        {img_url && (
          <img
            src={img_url}
            width={512}
            height={512}
            className="mt-2"
            alt="post image"
          />
        )}
      </div>
      {children}
    </article>
  );
}

export function LikesDisplay({ self_liked, num_likes, onLike }) {
  return (
    <div className="mt-6 flex flex-row gap-2 items-center">
      <button className="h-8 w-8 text-gray-300" onClick={() => onLike()}>
        {self_liked ? <HeartIconSolid /> : <HeartIconOutline />}
      </button>
      <span className="text-gray-400">{num_likes || 0}</span>
    </div>
  );
}
