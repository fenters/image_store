import requests
import os

# 手动创建的token
TOKEN = "ckamazfsjRXvbvlOZbUdP50JA-lPL8Y0mp6WzJJJNOA"
BASE_URL = "http://localhost"

# 测试图片目录
TEST_IMAGE_DIR = "./assets"  # 自动从该目录选择测试图片
TEST_IMAGE_PATH = ""  # 将自动检测

# 自动检测测试图片
def detect_test_images():
    """自动检测测试图片"""
    image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    image_files = []
    
    if os.path.exists(TEST_IMAGE_DIR):
        for file in os.listdir(TEST_IMAGE_DIR):
            ext = os.path.splitext(file)[1].lower()
            if ext in image_extensions:
                image_files.append(os.path.join(TEST_IMAGE_DIR, file))
    
    return image_files

# 设置请求头
headers = {
    "Authorization": f"Bearer {TOKEN}"
}




def test_get_images():
    """测试获取图片列表"""
    print("=== 测试获取图片列表 ===")
    response = requests.get(f"{BASE_URL}/api/images", headers=headers)
    if response.status_code == 200:
        data = response.json()
        images = data.get("data", [])
        print(f"✓ 成功获取图片列表，共 {len(images)} 张图片")
        return images
    else:
        print(f"✗ 获取图片列表失败，状态码: {response.status_code}")
        print(f"错误信息: {response.text}")
        return []


def test_upload_single_image():
    """测试上传单张图片"""
    print("\n=== 测试上传单张图片 ===")
    
    # 自动检测测试图片
    test_images = detect_test_images()
    if not test_images:
        print(f"✗ 测试图片目录中没有找到图片: {TEST_IMAGE_DIR}")
        return None
    
    # 选择第一张图片
    test_image_path = test_images[0]
    print(f"使用测试图片: {test_image_path}")
    
    with open(test_image_path, "rb") as f:
        files = {
            "files": f,
            "nicnames": "测试图片"
        }
        response = requests.post(f"{BASE_URL}/api/images", headers=headers, files=files)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 0:
                uploaded = data.get("data", {}).get("uploaded", 0)
                print(f"✓ 成功上传 {uploaded} 张图片")
                images = data.get("data", {}).get("images", [])
                return images[0] if images else None
            else:
                print(f"✗ 上传失败: {data.get('message')}")
                return None
        else:
            print(f"✗ 上传失败，状态码: {response.status_code}")
            print(f"错误信息: {response.text}")
            return None


def test_upload_multiple_images():
    """测试上传多张图片"""
    print("\n=== 测试上传多张图片 ===")
    
    # 自动检测测试图片
    test_images = detect_test_images()
    if not test_images:
        print(f"✗ 测试图片目录中没有找到图片: {TEST_IMAGE_DIR}")
        return []
    
    # 选择前两张图片（如果有）
    selected_images = test_images[:2]
    print(f"使用测试图片: {[os.path.basename(img) for img in selected_images]}")
    
    # 准备多个文件
    files = []
    for i, img_path in enumerate(selected_images):
        files.append(("files", (os.path.basename(img_path), open(img_path, "rb"), f"image/{os.path.splitext(img_path)[1][1:]}")))
        files.append(("nicnames", f"测试图片{i+1}"))
    
    response = requests.post(f"{BASE_URL}/api/images", headers=headers, files=files)
    
    # 关闭文件
    for file_tuple in files:
        if hasattr(file_tuple[1], "close"):
            file_tuple[1].close()
    
    if response.status_code == 200:
        data = response.json()
        if data.get("code") == 0:
            uploaded = data.get("data", {}).get("uploaded", 0)
            print(f"✓ 成功上传 {uploaded} 张图片")
            images = data.get("data", {}).get("images", [])
            return images
        else:
            print(f"✗ 上传失败: {data.get('message')}")
            return []
    else:
        print(f"✗ 上传失败，状态码: {response.status_code}")
        print(f"错误信息: {response.text}")
        return []


def test_delete_single_image(image_id):
    """测试删除单张图片"""
    print(f"\n=== 测试删除单张图片 (ID: {image_id}) ===")
    response = requests.delete(f"{BASE_URL}/api/images/{image_id}", headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data.get("code") == 0:
            print(f"✓ 成功删除图片 (ID: {image_id})")
            return True
        else:
            print(f"✗ 删除失败: {data.get('message')}")
            return False
    else:
        print(f"✗ 删除失败，状态码: {response.status_code}")
        print(f"错误信息: {response.text}")
        return False


def test_delete_batch_images(image_ids):
    """测试批量删除图片"""
    print(f"\n=== 测试批量删除图片 ===")
    print(f"要删除的图片ID: {image_ids}")
    
    response = requests.post(
        f"{BASE_URL}/api/images/batch-delete",
        headers=headers,
        json={"image_ids": image_ids}
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("code") == 0:
            deleted = data.get("data", {}).get("deleted", 0)
            failed = data.get("data", {}).get("failed", 0)
            print(f"✓ 批量删除完成，成功删除 {deleted} 张，失败 {failed} 张")
            return True
        else:
            print(f"✗ 批量删除失败: {data.get('message')}")
            return False
    else:
        print(f"✗ 批量删除失败，状态码: {response.status_code}")
        print(f"错误信息: {response.text}")
        return False


def main():
    """主测试函数"""
    print("开始测试手动创建的token功能...")
    print(f"测试环境: {BASE_URL}")
    
    # 自动检测测试图片
    test_images = detect_test_images()
    if not test_images:
        print(f"✗ 测试图片目录中没有找到图片: {TEST_IMAGE_DIR}")
        print("请确保测试图片目录中有图片文件")
        return
    
    print(f"✓ 检测到 {len(test_images)} 张测试图片")
    
    # 1. 初始获取图片列表
    initial_images = test_get_images()
    initial_count = len(initial_images)
    
    # 2. 上传单张图片
    uploaded_image = test_upload_single_image()
    uploaded_image_id = uploaded_image.get("id") if uploaded_image else None
    
    # 3. 上传多张图片
    batch_images = test_upload_multiple_images()
    batch_image_ids = [img.get("id") for img in batch_images]
    
    # 4. 上传后获取图片列表
    after_upload_images = test_get_images()
    after_upload_count = len(after_upload_images)
    
    # 5. 验证上传成功
    expected_count = initial_count + (1 if uploaded_image_id else 0) + len(batch_image_ids)
    if after_upload_count == expected_count:
        print(f"✓ 图片上传验证成功，预期: {expected_count}，实际: {after_upload_count}")
    else:
        print(f"✗ 图片上传验证失败，预期: {expected_count}，实际: {after_upload_count}")
    
    # 6. 删除单张图片
    if uploaded_image_id:
        test_delete_single_image(uploaded_image_id)
    
    # 7. 批量删除图片
    if batch_image_ids:
        test_delete_batch_images(batch_image_ids)
    
    # 8. 最终获取图片列表
    final_images = test_get_images()
    final_count = len(final_images)
    
    # 9. 验证删除成功
    expected_final_count = initial_count
    if final_count == expected_final_count:
        print(f"✓ 图片删除验证成功，预期: {expected_final_count}，实际: {final_count}")
    else:
        print(f"✗ 图片删除验证失败，预期: {expected_final_count}，实际: {final_count}")
    
    print("\n=== 测试完成 ===")
    print(f"初始图片数量: {initial_count}")
    print(f"最终图片数量: {final_count}")
    print(f"测试结果: {'✓ 全部测试通过' if final_count == initial_count else '✗ 部分测试失败'}")


if __name__ == "__main__":
    main()
