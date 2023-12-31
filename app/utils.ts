import { createClient } from "redis";
import { S3Client } from "@aws-sdk/client-s3";

const redisClient = createClient({ 
  password: process.env.REDIS_PASSWORD ?? "",
  socket: {
    host: process.env.REDIS_HOST ?? "",
    port: Number(process.env.REDIS_PORT) ?? 6379,
  },
});
export const getRedisClient = async () => {
  if(redisClient.isOpen) return redisClient;
  return await redisClient.connect();
};

const s3Client = new S3Client({ 
  region: process.env.AWS_S3_REGION ?? "",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  }
});

export const getS3Client = async () => s3Client;