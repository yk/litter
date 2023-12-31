import { NextResponse } from "next/server";
import { getRedisClient } from "../../../utils";

export const dynamic = "force-dynamic";

export async function GET(req, { params: { id } }) {
  const client = await getRedisClient();
  const post = await client.hGetAll(`post:${id}`);
  return NextResponse.json({...post}, { status: 200 });
}