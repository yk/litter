import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getRedisClient } from "../../../../utils";

export const dynamic = "force-dynamic";

export async function GET(req, { params: { id } }) {
  const client = await getRedisClient();
  const session = await getServerSession(req);
  const username = session?.user?.name;
  const self_liked = username && await client.sIsMember(`likes:${id}`, username);
  const num_likes = await client.sCard(`likes:${id}`);
  return NextResponse.json({ self_liked, num_likes }, { status: 200 });
}

export async function POST(req, {params: { id } }) {
  const session = await getServerSession(req);
  const username = session?.user?.name;
  if (!username) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const client = await getRedisClient();
  try {
    const self_liked = await client.sIsMember(`likes:${id}`, username);
    if (self_liked) {
      await client.sRem(`likes:${id}`, username);
    } else {
      await client.sAdd(`likes:${id}`, username);
    }
    return NextResponse.json({ id }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
