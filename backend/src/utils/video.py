import ffmpeg
import os
import tempfile
from typing import Tuple, Optional
from src.config import settings

async def extract_video_metadata(video_path: str) -> Optional[dict]:
    """提取视频元数据"""
    try:
        probe = ffmpeg.probe(video_path)
        video_stream = next((stream for stream in probe["streams"] if stream["codec_type"] == "video"), None)
        if not video_stream:
            return None
        
        metadata = {
            "width": int(video_stream.get("width", 0)),
            "height": int(video_stream.get("height", 0)),
            "duration": int(float(probe.get("format", {}).get("duration", 0.0))),
            "bitrate": int(int(probe.get("format", {}).get("bit_rate", 0)) / 1000) if probe.get("format", {}).get("bit_rate") else 0,
            "fps": eval(video_stream.get("r_frame_rate", "0/1")) if video_stream.get("r_frame_rate") else 0
        }
        metadata["resolution"] = f"{metadata['width']}x{metadata['height']}"
        return metadata
    except Exception as e:
        print(f"提取视频元数据失败: {str(e)}")
        return None

async def generate_video_cover(video_path: str, cover_path: str) -> bool:
    """生成视频封面"""
    try:
        # 使用FFmpeg提取第一帧作为封面
        process = (ffmpeg
         .input(video_path, ss=1)  # 从第1秒开始，避免黑屏
         .filter('scale', settings.VIDEO_COVER_WIDTH, -1)  # 调整封面宽度，保持比例
         .output(cover_path, vframes=1, q=settings.VIDEO_COVER_QUALITY)  # 调整质量，不指定格式，让FFmpeg根据扩展名自动判断
         .run_async(pipe_stdout=True, pipe_stderr=True))
        
        stdout, stderr = process.communicate()
        if process.returncode != 0:
            print(f"生成视频封面失败: FFmpeg错误码 {process.returncode}")
            print(f"FFmpeg stderr: {stderr.decode() if stderr else '无'}")
            print(f"FFmpeg stdout: {stdout.decode() if stdout else '无'}")
            return False
        return True
    except Exception as e:
        print(f"生成视频封面失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def generate_video_urls(filename: str, url: str, cover_url: str = None) -> dict:
    """生成不同格式的视频地址"""
    import html
    # 转义特殊字符，防止XSS攻击
    escaped_filename = html.escape(filename)
    escaped_url = html.escape(url)
    result = {
        "url": url,
        "markdown": f"![{escaped_filename}]({escaped_url})",
        "html": f"<video src=\"{escaped_url}\" controls alt=\"{escaped_filename}\"></video>",
    }
    if cover_url:
        escaped_cover_url = html.escape(cover_url)
        result["cover_url"] = cover_url
        result["html_with_cover"] = f"<video poster=\"{escaped_cover_url}\" src=\"{escaped_url}\" controls alt=\"{escaped_filename}\"></video>"
    return result
