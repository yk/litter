import main
import asyncio
import redis.asyncio as redis
import aiofiles
import json


async def dump_data(redis_client: redis.Redis):
    async with aiofiles.open("data.jsonl", "w") as f:
        async for key, _ in redis_client.zscan_iter("posts", match="*"):
            post = await redis_client.hgetall(key) # type: ignore
            post.pop("username")
            await f.write(json.dumps(post) + "\n")

if __name__ == "__main__":
    config = main.create_config()
    redis_client = main.create_redis_client(config)

    loop = asyncio.get_event_loop()
    loop.run_until_complete(dump_data(redis_client=redis_client))
