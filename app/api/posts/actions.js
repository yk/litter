"use server";

import { getRedisClient, getS3Client } from "../../utils";
import { nanoid } from "nanoid";
import moment from "moment";
import { dataUriToBuffer } from "data-uri-to-buffer";
import { Image } from "image-js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const getPosts = async ({ offset = 0, limit = 10 }) => {
  // const postIds = await kv.zrange("posts", offset, limit);
  const client = await getRedisClient();
  const postIds = await client.zRange("posts", offset, limit);
  const posts = await Promise.all(
    postIds.map(async (postId) => {
      const post = await client.hGetAll(postId);
      return post;
    })
  );
  return posts;
};

export const getCooldown = async ({ username }) => {
  const client = await getRedisClient();
  const cooldown = await client.get(`cooldown:${username}`);
  return !!cooldown;
};

const putImage = async (encoded_img) => {
  const parsedUri = dataUriToBuffer(encoded_img);
  const [dataType, _] = parsedUri.type.split("/");
  if (dataType !== "image") throw new Error("Not an image");
  let image = await Image.load(parsedUri.buffer);
  if (image.width > 1024) {
    image = image.resize({ width: 1024 });
  }
  if (image.height > 1024) {
    image = image.resize({ height: 1024 });
  }
  if (image.width > 1024) {
    image = image.resize({ width: 1024 });
  }
  const buffer = image.toBuffer({ format: "jpeg" });
  const fileName = moment().format("YYYY_MM_DD_hh_mm_ss_a");
  const key = `uploads/${fileName}.jpeg`;
  const s3Client = await getS3Client();
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: "image/jpeg",
  }));
  const url = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  return url;
};

export const createPost = async ({ text, encoded_img, username }) => {
  const client = await getRedisClient();
  const cooldown = await client.get(`cooldown:${username}`);
  if (cooldown) throw new Error("Cooldown in effect");
  text = text || "";
  encoded_img = encoded_img || "";
  if (!(text || encoded_img)) throw new Error("Text or image required");
  let img_url = "";
  if (encoded_img) {
    img_url = await putImage(encoded_img);
  }
  const id = nanoid();
  const key = `post:${id}`;
  const createdAt = Date.now();
  const newPost = { id, text, img_url, createdAt, username };
  await client.hSet(key, [...Object.entries(newPost).flat()]);
  await client.rPush("pending", key);
  await client.set(`cooldown:${username}`, "true", { EX: 30 });
  return { id };
};

export const deleteAllPosts = async () => {
  const client = await getRedisClient();
  await client.del("pending");
  await client.del("posts");
  const keys = await client.keys("post:*");
  keys.forEach(async (key) => {
    await client.del(key);
  });
  (await client.keys("cooldown:*")).forEach(async (key) => {
    await client.del(key);
  });
};
