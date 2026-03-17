#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import http.server
import socketserver
import json
import os
import time
import datetime
import threading
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse, parse_qs

import requests

PORT = 1212

# =========================
# 微信公众号配置（当前使用）
# =========================
WX_SUBSCRIPTION_APPID = "wx1768cb17c8e63074"       # 公众号 AppID
WX_SUBSCRIPTION_SECRET = "3f68651803b415c6872fa7ee78b9f02a"     # 公众号 AppSecret
WX_SUBSCRIPTION_THUMB_MEDIA_ID = "0kcitR-HCtLFmEcPgrjavfEMiZImeV4k2DWuV6kAMLu-zNclQDk6jBVR-mgMz2YL"  # 默认封面素材 ID

# =========================
# 微信服务号配置（预留，暂不使用）
# =========================
WX_SERVICE_APPID = "wxb58e0cbd032503b3"                 # 服务号 AppID
WX_SERVICE_SECRET = "a0833c5dfff152800d5cf5014159d200"               # 服务号 AppSecret
WX_SERVICE_THUMB_MEDIA_ID = "snvaurU1jlNMlE9JYbKsAJ6p-QKSBzOtANKPygymyEDYrO7LGBgxAOGzncPSDPL6"    # 服务号默认封面素材 ID

# =========================
# 缓冲区（同目录 buffer.json）
# =========================
BUFFER_LOCK = threading.Lock()


def _script_dir() -> str:
    return os.path.dirname(os.path.abspath(__file__))


def _buffer_file_path() -> str:
    return os.path.join(_script_dir(), "buffer.json")


def load_buffer() -> List[Dict[str, Any]]:
    path = _buffer_file_path()
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
    except json.JSONDecodeError:
        pass
    return []


def save_buffer(buf: List[Dict[str, Any]]) -> None:
    path = _buffer_file_path()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(buf, f, ensure_ascii=False, indent=2)


def save_failed_batch(batch: List[Dict[str, Any]], err: Exception) -> None:
    ts = int(time.time())
    path = os.path.join(_script_dir(), f"failed_batch_{ts}.json")
    payload = {"error": str(err), "batch": batch}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"[WeChat] Publish failed, batch saved to: {path}")


# =========================
# 微信公众号接口（你给的脚本内容融合）
# =========================
TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token"
DRAFT_ADD_URL = "https://api.weixin.qq.com/cgi-bin/draft/add"
MASS_SENDALL_URL = "https://api.weixin.qq.com/cgi-bin/message/mass/sendall"
FREEPUBLISH_SUBMIT_URL = "https://api.weixin.qq.com/cgi-bin/freepublish/submit"


def normalize_title(title: str) -> str:
    if len(title) > 32:
        return title[:31] + "…"
    return title


def normalize_author(author: Optional[str]) -> Optional[str]:
    if author is None:
        return None
    author = author.strip()
    if not author:
        return None
    return author[:16]


def normalize_digest(digest: Optional[str]) -> Optional[str]:
    if digest is None:
        return None
    digest = digest.strip()
    if not digest:
        return None
    return digest[:128]


@dataclass(frozen=True)
class DraftArticleNews:
    title: str
    content: str
    thumb_media_id: str

    article_type: str = "news"
    author: Optional[str] = None
    digest: Optional[str] = None
    content_source_url: Optional[str] = None

    need_open_comment: int = 0
    only_fans_can_comment: int = 0

    def to_payload(self, *, allow_digest: bool) -> Dict[str, Any]:
        safe_title = normalize_title(self.title)

        payload: Dict[str, Any] = {
            "article_type": self.article_type,
            "title": safe_title,
            "content": self.content,
            "content_source_url": self.content_source_url or "",
            "thumb_media_id": self.thumb_media_id,
            "need_open_comment": int(self.need_open_comment),
            "only_fans_can_comment": int(self.only_fans_can_comment),
        }

        safe_author = normalize_author(self.author)
        if safe_author:
            payload["author"] = safe_author

        if allow_digest:
            safe_digest = normalize_digest(self.digest)
            if safe_digest:
                payload["digest"] = safe_digest

        return payload


def _raise_if_wechat_error(data: Any, action: str) -> None:
    if not isinstance(data, dict):
        raise RuntimeError(f"{action}：返回不是 JSON 对象：{data!r}")

    errcode = data.get("errcode", 0)
    if errcode not in (0, None):
        raise RuntimeError(f"{action}失败：{json.dumps(data, ensure_ascii=False)}")


def fetch_access_token(
    appid: str,
    secret: str,
    *,
    timeout_seconds: int = 15,
    session: Optional[requests.Session] = None,
) -> str:
    sess = session or requests.Session()
    params = {"grant_type": "client_credential", "appid": appid, "secret": secret}
    resp = sess.get(TOKEN_URL, params=params, timeout=timeout_seconds)
    resp.raise_for_status()
    data = resp.json()
    _raise_if_wechat_error(data, "获取 access_token")

    token = data.get("access_token")
    if not token:
        raise RuntimeError(
            f"获取 access_token 失败：缺少 access_token 字段：{json.dumps(data, ensure_ascii=False)}"
        )
    return str(token)


def add_draft(
    access_token: str,
    articles: List[DraftArticleNews],
    *,
    timeout_seconds: int = 15,
    session: Optional[requests.Session] = None,
) -> Dict[str, Any]:
    if not articles:
        raise ValueError("articles 不能为空")
    if len(articles) > 8:
        raise ValueError("articles 篇数过多：请控制在合理范围内（常见上限 8）")

    sess = session or requests.Session()

    params = {"access_token": access_token}
    allow_digest = (len(articles) == 1)
    payload = {"articles": [a.to_payload(allow_digest=allow_digest) for a in articles]}

    resp = sess.post(
        DRAFT_ADD_URL,
        params=params,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        timeout=timeout_seconds,
    )
    resp.raise_for_status()
    data = resp.json()
    _raise_if_wechat_error(data, "新增草稿")
    return data


def mass_sendall_mpnews(
    access_token: str,
    media_id: str,
    *,
    is_to_all: bool = True,
    tag_id: Optional[int] = None,
    send_ignore_reprint: int = 0,
    timeout_seconds: int = 15,
    session: Optional[requests.Session] = None,
) -> Dict[str, Any]:
    sess = session or requests.Session()

    filter_obj: Dict[str, Any] = {"is_to_all": bool(is_to_all)}
    if not is_to_all:
        if tag_id is None:
            raise ValueError("当 is_to_all=False 时，必须提供 tag_id")
        filter_obj["tag_id"] = int(tag_id)

    payload = {
        "filter": filter_obj,
        "mpnews": {"media_id": media_id},
        "msgtype": "mpnews",
        "send_ignore_reprint": int(send_ignore_reprint),
    }

    resp = sess.post(
        MASS_SENDALL_URL,
        params={"access_token": access_token},
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        timeout=timeout_seconds,
    )
    resp.raise_for_status()
    data = resp.json()
    _raise_if_wechat_error(data, "群发")
    return data


def load_wechat_config() -> Tuple[str, str, str, int, int, Optional[int]]:
    """
    读取公众号配置（使用文件内常量）：
    - WX_SUBSCRIPTION_APPID: 公众号 AppID
    - WX_SUBSCRIPTION_SECRET: 公众号 AppSecret
    - WX_SUBSCRIPTION_THUMB_MEDIA_ID: 默认封面素材 ID
    """
    appid = WX_SUBSCRIPTION_APPID
    secret = WX_SUBSCRIPTION_SECRET
    thumb = WX_SUBSCRIPTION_THUMB_MEDIA_ID

    if not appid or appid == "your_subscription_appid_here":
        raise RuntimeError("缺少有效的 APPID 配置：请修改文件内 WX_SUBSCRIPTION_APPID")
    if not secret or secret == "your_subscription_secret_here":
        raise RuntimeError("缺少有效的 SECRET 配置：请修改文件内 WX_SUBSCRIPTION_SECRET")
    if not thumb or thumb == "your_thumb_media_id_here":
        raise RuntimeError("缺少有效的 THUMB_MEDIA_ID 配置：请修改文件内 WX_SUBSCRIPTION_THUMB_MEDIA_ID")

    timeout = 15
    send_ignore_reprint = 0
    tag_id = None  # 全量群发

    return appid, secret, thumb, timeout, send_ignore_reprint, tag_id


def load_service_config() -> Tuple[str, str, str, int]:
    """
    读取服务号配置（使用文件内常量）：
    - WX_SERVICE_APPID: 服务号 AppID
    - WX_SERVICE_SECRET: 服务号 AppSecret
    - WX_SERVICE_THUMB_MEDIA_ID: 服务号默认封面素材 ID
    """
    appid = WX_SERVICE_APPID
    secret = WX_SERVICE_SECRET
    thumb = WX_SERVICE_THUMB_MEDIA_ID

    if not appid or appid == "your_service_appid_here":
        raise RuntimeError("缺少有效的服务号 APPID 配置：请修改文件内 WX_SERVICE_APPID")
    if not secret or secret == "your_service_secret_here":
        raise RuntimeError("缺少有效的服务号 SECRET 配置：请修改文件内 WX_SERVICE_SECRET")
    if not thumb or thumb == "your_service_thumb_media_id":
        raise RuntimeError("缺少有效的服务号 THUMB_MEDIA_ID 配置：请修改文件内 WX_SERVICE_THUMB_MEDIA_ID")

    timeout = 15

    return appid, secret, thumb, timeout


def freepublish_submit(
    access_token: str,
    media_id: str,
    *,
    timeout_seconds: int = 15,
    session: Optional[requests.Session] = None,
) -> Dict[str, Any]:
    """
    发布草稿：将草稿箱中的草稿发布为正式图文消息
    文档：https://developers.weixin.qq.com/doc/service/api/public/api_freepublish_submit.html
    返回：{ "publish_id": "xxx" }
    """
    sess = session or requests.Session()

    payload = {"media_id": media_id}

    resp = sess.post(
        FREEPUBLISH_SUBMIT_URL,
        params={"access_token": access_token},
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        timeout=timeout_seconds,
    )
    resp.raise_for_status()
    data = resp.json()
    _raise_if_wechat_error(data, "发布草稿")
    return data


def publish_single_to_service_account(article: Dict[str, Any]) -> None:
    """
    使用服务号凭据发布单篇文章：
    1. 调用 draft/add 新建草稿
    2. 调用 freepublish/submit 发布该草稿

    入参：单篇文章 dict，包含 title/summary/content/link 等字段
    """
    appid, secret, default_thumb, timeout = load_service_config()

    sess = requests.Session()

    title = str(article.get("title", "") or "无标题")
    summary = str(article.get("summary", "") or "")
    content = str(article.get("content", "") or "")
    link = str(article.get("link", "") or "")
    thumb_media_id = str(article.get("thumb_media_id") or default_thumb).strip()

    if not thumb_media_id:
        raise RuntimeError("服务号 thumb_media_id 为空：请设置 WX_SERVICE_THUMB_MEDIA_ID 或在提交中提供 thumb_media_id")

    draft_article = DraftArticleNews(
        title=title,
        content=content,
        thumb_media_id=thumb_media_id,
        author=None,
        digest=summary,
        content_source_url=link,
        need_open_comment=0,
        only_fans_can_comment=0,
    )

    # 1) 获取 access_token 并新建草稿
    access_token_1 = fetch_access_token(appid, secret, timeout_seconds=timeout, session=sess)
    draft_result = add_draft(access_token_1, [draft_article], timeout_seconds=timeout, session=sess)
    print("=== [ServiceAccount] draft_add result ===")
    print(json.dumps(draft_result, ensure_ascii=False, indent=2))

    media_id = draft_result.get("media_id")
    if not media_id:
        raise RuntimeError(f"服务号新增草稿成功但未返回 media_id：{json.dumps(draft_result, ensure_ascii=False)}")

    print(f"[ServiceAccount] media_id = {media_id}")

    # 2) 获取 access_token 并发布草稿
    access_token_2 = fetch_access_token(appid, secret, timeout_seconds=timeout, session=sess)
    publish_result = freepublish_submit(access_token_2, media_id, timeout_seconds=timeout, session=sess)
    print("=== [ServiceAccount] freepublish_submit result ===")
    print(json.dumps(publish_result, ensure_ascii=False, indent=2))


def publish_latest_three_to_wechat(latest_three: List[Dict[str, Any]]) -> None:
    """
    入参：最新三篇（每个 dict 至少含 title/summary/content/link）
    行为：draft_add(3篇) -> 取 media_id -> mass/sendall
    """
    if len(latest_three) != 3:
        raise ValueError("publish_latest_three_to_wechat 需要恰好 3 篇文章")

    appid, secret, default_thumb, timeout, send_ignore_reprint, tag_id = load_wechat_config()
    is_to_all = (tag_id is None)

    sess = requests.Session()

    articles: List[DraftArticleNews] = []
    for item in latest_three:
        title = str(item.get("title", "") or "无标题")
        summary = str(item.get("summary", "") or "")
        content = str(item.get("content", "") or "")
        link = str(item.get("link", "") or "")

        thumb_media_id = str(item.get("thumb_media_id") or default_thumb).strip()
        if not thumb_media_id:
            raise RuntimeError("thumb_media_id 为空：请设置 WX_THUMB_MEDIA_ID 或在提交中提供 thumb_media_id")

        articles.append(
            DraftArticleNews(
                title=title,
                content=content,
                thumb_media_id=thumb_media_id,
                author=None,
                digest=summary,               # 多图文时脚本不会发送 digest 字段（符合你原逻辑）
                content_source_url=link,      # 这里使用“链接”
                need_open_comment=0,
                only_fans_can_comment=0,
            )
        )

    # 1) 每次调用前刷新 token：新增草稿
    access_token_1 = fetch_access_token(appid, secret, timeout_seconds=timeout, session=sess)
    draft_result = add_draft(access_token_1, articles, timeout_seconds=timeout, session=sess)
    print("=== [WeChat] draft_add result ===")
    print(json.dumps(draft_result, ensure_ascii=False, indent=2))

    media_id = draft_result.get("media_id")
    if not media_id:
        raise RuntimeError(f"新增草稿成功但未返回 media_id：{json.dumps(draft_result, ensure_ascii=False)}")

    print(f"[WeChat] media_id = {media_id}")

    # 2) 每次调用前刷新 token：群发
    access_token_2 = fetch_access_token(appid, secret, timeout_seconds=timeout, session=sess)
    mass_result = mass_sendall_mpnews(
        access_token_2,
        media_id,
        is_to_all=is_to_all,
        tag_id=tag_id,
        send_ignore_reprint=send_ignore_reprint,
        timeout_seconds=timeout,
        session=sess,
    )
    print("=== [WeChat] mass/sendall result ===")
    print(json.dumps(mass_result, ensure_ascii=False, indent=2))


# =========================
# HTTP Server
# =========================
class BlogHandler(http.server.BaseHTTPRequestHandler):
    def _guess_public_link(self, file_id: str) -> str:
        """
        生成“链接”（给 buffer 与公众号 content_source_url 用）
        优先 PUBLIC_BASE_URL，其次 Host + X-Forwarded-Proto，再否则返回相对路径
        """
        public_base = os.getenv("PUBLIC_BASE_URL", "").strip().rstrip("/")
        if public_base:
            return f"{public_base}/pages/blog/View.html?id={file_id}"

        host = (self.headers.get("Host") or "").strip()
        proto = (self.headers.get("X-Forwarded-Proto") or "http").strip()
        if host:
            return f"{proto}://{host}/pages/blog/View.html?id={file_id}"

        # 最差兜底
        return f"blog/View.html?id={file_id}"

    def do_GET(self):
        parsed_path = urlparse(self.path)
        query_params = parse_qs(parsed_path.query)

        if query_params.get('getnew', [''])[0] == '1':
            base_dir = os.path.dirname(os.path.abspath(__file__))
            list_dir = os.path.normpath(os.path.join(base_dir, '../pages'))
            list_file = os.path.join(list_dir, 'blog.json')

            data_store = {"posts": []}
            if os.path.exists(list_file):
                try:
                    with open(list_file, 'r', encoding='utf-8') as f:
                        loaded_data = json.load(f)
                        if isinstance(loaded_data, dict) and "posts" in loaded_data:
                            data_store = loaded_data
                except json.JSONDecodeError:
                    pass

            posts = data_store.get("posts", [])
            latest_posts = posts[-10:]
            latest_posts.reverse()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(latest_posts, ensure_ascii=False).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        print("HIT POST:", self.path)
        # 1. 获取并解析请求数据
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
        except (ValueError, json.JSONDecodeError):
            self.send_error(400, "Invalid JSON data")
            return

        # 2. 准备目录路径
        base_dir = os.path.dirname(os.path.abspath(__file__))
        article_dir = os.path.normpath(os.path.join(base_dir, '../pages/blog'))
        list_dir = os.path.normpath(os.path.join(base_dir, '../pages'))
        list_file = os.path.join(list_dir, 'blog.json')

        os.makedirs(article_dir, exist_ok=True)
        os.makedirs(list_dir, exist_ok=True)

        # 3. 准备数据
        file_id = str(int(time.time()))
        filename = f"{file_id}.json"
        file_path = os.path.join(article_dir, filename)

        now = datetime.datetime.now()
        date_str = f"{now.year}年{now.month}月{now.day}日"

        title = request_data.get('标题', '无标题')
        content = request_data.get('正文', '')
        summary = request_data.get('摘要', '')
        tags_raw = request_data.get('tag', [])

        # 可选：允许前端传 thumb_media_id 覆盖默认封面
        thumb_media_id = (request_data.get("thumb_media_id") or "").strip()

        # 可选：允许前端直接传“链接”
        link = (request_data.get("链接") or request_data.get("link") or "").strip()
        if not link:
            link = self._guess_public_link(file_id)

        # 4. 保存单篇文章的数据为 JSON 文件（详情页不存摘要）
        article_json_content = {
            "标题": title,
            "日期": date_str,
            "正文": content,
            "tag": tags_raw
        }

        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(article_json_content, f, ensure_ascii=False, indent=4)
            print(f"Generated article JSON: {file_path}")
        except IOError as e:
            self.send_error(500, f"File write error: {e}")
            return

        # 5. 更新文章列表 (blog.json)
        data_store = {"posts": []}
        if os.path.exists(list_file):
            try:
                with open(list_file, 'r', encoding='utf-8') as f:
                    loaded_data = json.load(f)
                    if isinstance(loaded_data, dict) and "posts" in loaded_data:
                        data_store = loaded_data
            except json.JSONDecodeError:
                pass

        new_post_entry = {
            "date": date_str,
            "title": title,
            "content": summary,
            "path": f"blog/View.html?id={file_id}"
        }
        data_store["posts"].append(new_post_entry)

        try:
            with open(list_file, 'w', encoding='utf-8') as f:
                json.dump(data_store, f, ensure_ascii=False, indent=2)
        except IOError as e:
            self.send_error(500, f"List update error: {e}")
            return

        # 6. 写入缓冲区；若 >=3 则取“最新三篇”并清空整个缓冲区
        latest_three: Optional[List[Dict[str, Any]]] = None

        buffer_item = {
            "title": title,
            "summary": summary,
            "content": content,
            "link": link,                           # 你要求的“链接”
            "path": f"blog/View.html?id={file_id}",  # 保留相对路径（可选）
            "id": file_id,
            "date": date_str,
        }
        if thumb_media_id:
            buffer_item["thumb_media_id"] = thumb_media_id

        # 6.5. 使用服务号发布单篇文章（草稿 + freepublish），失败不影响后续流程
        try:
            publish_single_to_service_account(buffer_item)
        except Exception as e:
            print(f"[ServiceAccount] Error publishing single article: {e}")

        with BUFFER_LOCK:
            buf = load_buffer()
            buf.append(buffer_item)

            if len(buf) >= 3:
                latest_three = buf[-3:]  # 取最新三篇
                buf = []                 # 清空整个缓冲区

            save_buffer(buf)

        # 7. 如果触发了三篇发布，则调用微信发布函数（失败不影响本次入库）
        if latest_three is not None:
            try:
                publish_latest_three_to_wechat(latest_three)
            except Exception as e:
                print(f"[WeChat] Error: {e}")
                save_failed_batch(latest_three, e)

        # 8. 返回成功响应
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {"status": "ok", "id": file_id}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), BlogHandler) as httpd:
        print(f"Serving JSON API on port {PORT}")
        httpd.serve_forever()
