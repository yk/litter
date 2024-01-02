from typing import Callable, Awaitable

from urllib.parse import urlparse
import tempfile
import uuid
import io
import os
from openai import AsyncOpenAI
import aiohttp
import asyncio
import base64
from loguru import logger
import dotenv
from PIL import Image
import redis.asyncio as redis
import boto3


class OpenAIClient:
    def __init__(
        self,
        api_key: str,
        upload_img_fn: Callable[[bytes, str], Awaitable[str]],
        delete_img_fn: Callable[[str], Awaitable[None]],
        debug_store_img: bool = False,
    ):
        self.api_client = AsyncOpenAI(api_key=api_key)
        self.upload_img_fn = upload_img_fn
        self.delete_img_fn = delete_img_fn
        self.debug_store_img = debug_store_img

    async def guess_message(self, caption: str) -> str:
        completion = await self.api_client.chat.completions.create(
            model="gpt-3.5-turbo",
            max_tokens=512,
            messages=[
                {
                    "role": "user",
                    "content": f"""
  I have a new social network, where text posts get encrypted into image descriptions.
  Your job is to decrypt these messages and guess the original post.
  Here is the procedure:
  - a user posts a text post
  - the text is used as the input of an AI text-to-image generator
  - the image is fed to an AI image captioning model
  This is the output of the captioning model:
  --- BEGIN CAPTION ---
  "{caption}"
  --- END CAPTION ---
  Your task:
  - Guess the original post.
  - Take your best shot.
  - Write directly the text you think was originally written by the user.
  - Write from the perspective of the original user.
  - The original message is not neccesarily visual or descriptive. Rather it is probably a simple message like one would find on Twitter.
  - Output just one line with your guess, nothing else!
  """.strip(),
                },
            ],
        )
        guess = completion.choices[0].message.content
        if not guess:
            raise ValueError("Empty or missing guess")
        return guess.strip().strip('"')

    async def get_img_caption(self, img_url) -> str:
        completion = await self.api_client.chat.completions.create(
            model="gpt-4-vision-preview",
            max_tokens=512,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe this image to a person with impaired vision. Be short and concise.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": img_url,
                            },
                        },
                    ],
                },
            ],
        )
        caption = completion.choices[0].message.content
        if not caption:
            raise ValueError("Empty or missing caption")
        return caption

    async def create_img(self, caption: str, upload_to_key: str | None = None) -> str:
        response = await self.api_client.images.generate(
            model="dall-e-3",
            size="1024x1024",
            quality="standard",
            n=1,
            prompt=f"{caption}\n#notext #message #animageisworthathousandwords",
        )
        img_url = response.data[0].url
        if not img_url:
            raise ValueError("Empty or missing image url")
        async with aiohttp.ClientSession() as session:
            async with session.get(img_url) as resp:
                content = await resp.read()
        with tempfile.NamedTemporaryFile(suffix=".png") as f:
            f.write(content)
            f.flush()
            img = Image.open(f.name)
        if self.debug_store_img:
            img.save("debug.jpg")
        bytes_io = io.BytesIO()
        img.save(bytes_io, format="JPEG")
        content = bytes_io.getvalue()
        if upload_to_key:
            img_url = await self.upload_img_fn(content, upload_to_key)
            return img_url
        encoded_img = base64.b64encode(content)
        data_url = f"data:image/png;base64,{encoded_img.decode('utf-8')}"
        return data_url


class KVClient:
    def __init__(
        self,
        redis_client: redis.Redis,
        openai_client: OpenAIClient,
        modify: bool = False,
    ):
        self.redis_client = redis_client
        self.openai_client = openai_client
        self.modify = modify

    async def process_pending_post(self, key: str):
        logger.debug(f"Processing {key}")
        post = await self.redis_client.hgetall(key)  # type: ignore
        created_at = int(post["createdAt"])
        logger.debug(f"Created at {created_at}")

        if self.modify:
            if text := post.get("text"):
                logger.debug(f"Text: {text}")
                prompt = f"""
Create an image that visually transmits the following message:
--- BEGIN MESSAGE ---
{text}
--- END MESSAGE ---
Make the message into a pictogram, a visual representation of the message.
Do not use text.
""".strip()
                img_url = await self.openai_client.create_img(prompt)
                logger.debug(f"Image url: {len(img_url)=}")
                caption = await self.openai_client.get_img_caption(img_url)
                logger.debug(f"Caption: {caption}")
                new_text = await self.openai_client.guess_message(caption)
                logger.debug(f"New text: {new_text}")
                await self.redis_client.hset(key, "text", new_text)  # type: ignore
            if img_url := post.get("img_url"):
                logger.debug(f"Image url: {img_url}")
                caption = await self.openai_client.get_img_caption(img_url)
                await self.openai_client.delete_img_fn(img_url)
                logger.debug(f"Caption: {caption}")
                new_img_key = f"processed/{uuid.uuid4()}.jpg"
                new_img_url = await self.openai_client.create_img(
                    caption, upload_to_key=new_img_key
                )
                logger.debug(f"New image url: {len(new_img_url)}")
                await self.redis_client.hset(key, "img_url", new_img_url)  # type: ignore

        await self.redis_client.zadd("posts", {key: -created_at})

    async def get_all_pending_keys(self) -> list[str]:
        keys = []
        while True:
            key = await self.redis_client.lpop("pending")  # type: ignore
            if not key:
                break
            keys.append(key)
        return keys

    async def process_pending(self):
        try:
            pending_keys = await self.get_all_pending_keys()
            if not pending_keys:
                return
            logger.info(f"Processing {len(pending_keys)} pending posts")
            results = await asyncio.gather(
                *[self.process_pending_post(key) for key in pending_keys],
                return_exceptions=True,
            )
            for key, result in zip(pending_keys, results):
                if isinstance(result, Exception):
                    try:
                        raise result
                    except Exception as e:
                        logger.exception(f"Error processing {key}: {e}")
        except Exception as e:
            logger.exception(f"Error processing pending posts: {e}")

    async def process_pending_loop(self):
        while True:
            await self.process_pending()
            await asyncio.sleep(5)


def get_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise ValueError(f"Missing env var {name}")
    return value


if __name__ == "__main__":
    config = {
        **os.environ,
        **dotenv.dotenv_values("../.env"),
        **dotenv.dotenv_values("../.env.local"),
        **dotenv.dotenv_values("../.env.development.local"),
        **dotenv.dotenv_values(".env"),
        **dotenv.dotenv_values(".env.local"),
        **dotenv.dotenv_values(".env.development.local"),
    }

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=config["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=config["AWS_SECRET_ACCESS_KEY"],
        region_name=config["AWS_S3_REGION"],
    )


    def upload_img_sync(content: bytes, key: str) -> str:
        s3_client.upload_fileobj(
            io.BytesIO(content),
            config["AWS_BUCKET_NAME"],
            key,
        )
        url = f"https://{config['AWS_BUCKET_NAME']}.s3.amazonaws.com/{key}"
        return url
    
    def upload_img(content: bytes, key: str) -> Awaitable[str]:
        return asyncio.to_thread(upload_img_sync, content, key)
    
    def delete_img_sync(img_url: str) -> None:
        parsed_url = urlparse(img_url)
        key = parsed_url.path[1:]
        logger.debug(f"Deleting {key}")
        s3_client.delete_object(
            Bucket=config["AWS_BUCKET_NAME"],
            Key=key,
        )
    
    def delete_img(img_url: str) -> Awaitable[None]:
        return asyncio.to_thread(delete_img_sync, img_url)

    client = OpenAIClient(api_key=config["OPENAI_API_KEY"], upload_img_fn=upload_img, delete_img_fn=delete_img,
        debug_store_img=(config.get("DEBUG_STORE_IMG") in ["1", "true", "True"]),
    )

    redis_client = redis.Redis(
        host=config["REDIS_HOST"],
        port=int(config["REDIS_PORT"]),
        password=config["REDIS_PASSWORD"],
        decode_responses=True,
    )

    kv_client = KVClient(
        redis_client=redis_client,
        openai_client=client,
        modify=True,
    )
    loop = asyncio.get_event_loop()
    loop.run_until_complete(kv_client.process_pending_loop())
