import { NextResponse } from "next/server";
import { getPosts, createPost, deleteAllPosts, getCooldown } from "./actions";
import { getServerSession } from "next-auth/next";
import { headers } from 'next/headers'

export const dynamic = "force-dynamic";

export async function GET(req) {
  const searchParams = new URL(req.url).searchParams;
  const { cursor = 0 } = searchParams;
  const posts = await getPosts({ cursor });

  let cooldown = false;
  const session = await getServerSession(req);
  const username = session?.user?.name;
  if(username) {
    cooldown = await getCooldown({ username });
  }
  return NextResponse.json({ posts, cooldown }, { status: 200 });
}

export async function POST(req) {
  const session = await getServerSession(req);
  const username = session?.user?.name;
  if (!username) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const { text, encoded_img } = await req.json();
  try {
    const { id } = await createPost({ text, encoded_img, username });
    console.log("created post", { id });
    return NextResponse.json({ id }, { status: 200 });
  } catch (e) {
    console.log("error creating post", { e });
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// delete all posts
export async function DELETE(){
  const reqHeaders = headers();
  const adminPassword = reqHeaders.get("X-Admin-Password");
  console.log({adminPassword})
  if(!process.env.ADMIN_PASSWORD || adminPassword !== process.env.ADMIN_PASSWORD){
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  await deleteAllPosts();
  return NextResponse.json({}, { status: 200 });
}
