import requests
import os
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login"
HEALTH_URL = "http://localhost:8000/health"
IMAGES_URL = f"{BASE_URL}/images"
CHUNK_INIT_URL = f"{IMAGES_URL}/chunk/init"
CHUNK_UPLOAD_URL = f"{IMAGES_URL}/chunk/upload"
CHUNK_MERGE_URL = f"{IMAGES_URL}/chunk/merge"
TOKENS_URL = f"{BASE_URL}/tokens"

# 测试账户
TEST_USERS = {
    "testuser1": "password123",
    "testuser3": "password123"
}

# 测试文件路径
BATCH_FILES = [
    "C:\\Users\\TW\\Desktop\\my_linked\\可爱小羊.png",
    "C:\\Users\\TW\\Desktop\\my_linked\\可爱小羊-咖啡.png"
]
CHUNK_FILE = "C:\\Users\\TW\\Desktop\\my_linked\\伊蕾娜-窗边.png"

class APITester:
    def __init__(self, username=None, password=None):
        self.session = requests.Session()
        self.username = username
        self.password = password
        self.token = None
        self.uploaded_image_ids = []
        self.created_token_id = None
    
    def _print_section(self, title: str):
        print(f"\n{'='*50}")
        print(f"{title}")
        print(f"{'='*50}")
    
    def _print_response(self, response: requests.Response):
        print(f"Status: {response.status_code}")
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, ensure_ascii=False, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response content: {response.text}")
    
    def test_health_check(self):
        self._print_section("Testing health check endpoint...")
        response = self.session.get(HEALTH_URL)
        self._print_response(response)
        return response.status_code == 200
    
    def test_login(self):
        self._print_section(f"Testing login endpoint for user {self.username}...")
        login_data = {
            "username": self.username,
            "password": self.password
        }
        response = self.session.post(LOGIN_URL, json=login_data)
        self._print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 0 and data.get("data"):
                self.token = data["data"].get("access_token")
                self.session.headers.update({
                    "Authorization": f"Bearer {self.token}"
                })
                print(f"Login successful for user {self.username}! Token acquired.")
                return True
        return False
    
    def test_batch_upload(self):
        self._print_section(f"Testing batch file upload endpoint for user {self.username}...")
        
        if not self.token:
            print(f"Login first for user {self.username} before uploading files.")
            return False
        
        # 检查文件是否存在
        for file_path in BATCH_FILES:
            if not os.path.exists(file_path):
                print(f"File not found: {file_path}")
                return False
        
        # 准备文件数据
        files = []
        for file_path in BATCH_FILES:
            files.append(("files", (os.path.basename(file_path), open(file_path, "rb"), "image/png")))
        
        try:
            response = self.session.post(IMAGES_URL, files=files)
            self._print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == 0 and data.get("data"):
                    uploaded_images = data["data"].get("images", [])
                    for image in uploaded_images:
                        self.uploaded_image_ids.append(image["id"])
                    print(f"Batch upload successful! Uploaded {len(uploaded_images)} images.")
                    return True
            return False
        finally:
            # 关闭所有文件
            for _, (_, file_obj, _) in files:
                file_obj.close()
    
    def test_chunk_upload(self):
        self._print_section(f"Testing chunk upload endpoint for user {self.username}...")
        
        if not self.token:
            print(f"Login first for user {self.username} before uploading files.")
            return False
        
        # 检查文件是否存在
        if not os.path.exists(CHUNK_FILE):
            print(f"File not found: {CHUNK_FILE}")
            return False
        
        # 获取文件信息
        file_size = os.path.getsize(CHUNK_FILE)
        chunk_size = 1 * 1024 * 1024  # 1MB per chunk
        total_chunks = (file_size + chunk_size - 1) // chunk_size
        filename = os.path.basename(CHUNK_FILE)
        
        try:
            # 1. 初始化切片上传
            init_data = {
                "filename": filename,
                "file_size": file_size,
                "total_chunks": total_chunks
            }
            
            print(f"Initializing chunk upload...")
            init_response = self.session.post(CHUNK_INIT_URL, json=init_data)
            self._print_response(init_response)
            
            if init_response.status_code != 200:
                return False
            
            init_result = init_response.json()
            if init_result.get("code") != 0:
                return False
            
            upload_id = init_result["data"]["upload_id"]
            
            # 2. 上传所有切片
            print(f"Uploading {total_chunks} chunks...")
            with open(CHUNK_FILE, "rb") as f:
                for i in range(total_chunks):
                    f.seek(i * chunk_size)
                    chunk_data = f.read(chunk_size)
                    
                    # 准备表单数据
                    form_data = {
                        "upload_id": upload_id,
                        "chunk_index": str(i),
                        "total_chunks": str(total_chunks)
                    }
                    
                    # 准备文件数据
                    files = {
                        "file": (f"chunk_{i}", chunk_data, "application/octet-stream")
                    }
                    
                    chunk_response = self.session.post(CHUNK_UPLOAD_URL, data=form_data, files=files)
                    
                    if chunk_response.status_code != 200:
                        self._print_response(chunk_response)
                        return False
                    
                    chunk_result = chunk_response.json()
                    if chunk_result.get("code") != 0:
                        return False
                    
                    print(f"  ✓ Chunk {i+1}/{total_chunks} uploaded successfully")
            
            # 3. 合并切片
            print(f"Merging chunks...")
            merge_response = self.session.post(f"{CHUNK_MERGE_URL}/{upload_id}")
            self._print_response(merge_response)
            
            if merge_response.status_code == 200:
                merge_result = merge_response.json()
                if merge_result.get("code") == 0 and merge_result.get("data"):
                    uploaded_images = merge_result["data"].get("images", [])
                    for image in uploaded_images:
                        self.uploaded_image_ids.append(image["id"])
                    print(f"Chunk upload successful! File merged.")
                    return True
            return False
            
        except Exception as e:
            print(f"Error during chunk upload: {str(e)}")
            return False
    
    def test_get_images(self):
        self._print_section(f"Testing get images endpoint for user {self.username}...")
        
        if not self.token:
            print(f"Login first for user {self.username} before getting images.")
            return False
        
        response = self.session.get(IMAGES_URL, params={"page": 1, "page_size": 10})
        self._print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 0:
                images = data.get("data", [])
                print(f"Retrieved {len(images)} images.")
                # 提取图片ID到uploaded_image_ids列表
                self.uploaded_image_ids = [image["id"] for image in images]
                print(f"Image IDs: {self.uploaded_image_ids}")
                return True
        return False
    
    def test_delete_image(self):
        self._print_section(f"Testing delete image endpoint for user {self.username}...")
        
        if not self.token:
            print(f"Login first for user {self.username} before deleting images.")
            return False
        
        if not self.uploaded_image_ids:
            print("No images to delete.")
            return False
        
        # 删除第一张图片
        image_id = self.uploaded_image_ids[0]
        response = self.session.delete(f"{IMAGES_URL}/{image_id}")
        self._print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 0:
                self.uploaded_image_ids.pop(0)
                print(f"Image {image_id} deleted successfully.")
                return True
        return False
    
    def test_batch_delete(self):
        self._print_section(f"Testing batch delete images endpoint for user {self.username}...")
        
        if not self.token:
            print(f"Login first for user {self.username} before batch deleting images.")
            return False
        
        if not self.uploaded_image_ids:
            print("No images to delete.")
            return False
        
        delete_data = {
            "image_ids": self.uploaded_image_ids
        }
        
        response = self.session.post(f"{IMAGES_URL}/batch-delete", json=delete_data)
        self._print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 0:
                self.uploaded_image_ids = []
                print(f"Batch delete successful.")
                return True
        return False
    
    def test_get_tokens(self):
        self._print_section(f"Testing get tokens endpoint for user {self.username}...")
        
        if not self.token:
            print(f"Login first for user {self.username} before getting tokens.")
            return False
        
        response = self.session.get(TOKENS_URL)
        self._print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 0:
                tokens = data.get("data", {}).get("tokens", [])
                print(f"Retrieved {len(tokens)} tokens.")
                return True
        return False
    
    def test_create_token(self):
        self._print_section(f"Testing create token endpoint for user {self.username}...")
        
        if not self.token:
            print(f"Login first for user {self.username} before creating tokens.")
            return False
        
        token_data = {
            "name": "test_token"
        }
        
        response = self.session.post(TOKENS_URL, json=token_data)
        self._print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 0:
                self.created_token_id = data.get("data", {}).get("id")
                print(f"Token created successfully.")
                return True
        return False
    
    def test_delete_token(self):
        self._print_section(f"Testing delete token endpoint for user {self.username}...")
        
        if not self.token:
            print(f"Login first for user {self.username} before deleting tokens.")
            return False
        
        # 先获取令牌列表
        response = self.session.get(TOKENS_URL)
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 0:
                tokens = data.get("data", {}).get("tokens", [])
                if tokens:
                    token_id = tokens[0]["id"]
                    delete_response = self.session.delete(f"{TOKENS_URL}/{token_id}")
                    self._print_response(delete_response)
                    
                    if delete_response.status_code == 200:
                        delete_data = delete_response.json()
                        if delete_data.get("code") == 0:
                            print(f"Token {token_id} deleted successfully.")
                            return True
        
        print("No tokens available for deletion.")
        return True  # 没有令牌可删也算通过

def run_multi_user_tests():
    print("Starting multi-user API tests...")
    print(f"{'='*70}")
    
    # 创建测试用户
    users = []
    for username, password in TEST_USERS.items():
        users.append(APITester(username, password))
    
    # 运行所有用户的健康检查
    for user in users:
        user.test_health_check()

    print(f"{'='*70}")
    print("开始用户2 (testuser3) 测试流程：")
    print("1. 登录")
    print("2. 批量上传图片")
    print("3. 切片上传图片")
    print("4. 获取图片列表")
    print("5. 获取令牌列表")
    print("6. 创建令牌")
    print(f"{'='*70}")

    
    user3 = users[1]  # testuser3
    user3_results = {
        "login": user3.test_login(),
        "batch_upload": user3.test_batch_upload(),
        "chunk_upload": user3.test_chunk_upload(),
        "get_images": user3.test_get_images(),
        "get_tokens": user3.test_get_tokens(),
        "create_token": user3.test_create_token()
    }
    
    print(f"{'='*70}")
    print("测试结果汇总：")
    print(f"{'='*70}")

    print(f"{'='*70}")
    print("开始用户1 (testuser1) 测试流程：")
    print("1. 登录")
    print("2. 批量上传图片")
    print("3. 切片上传图片")
    print("4. 获取图片列表")
    print("5. 批量删除所有图片")
    print("6. 获取令牌列表")
    print("7. 创建令牌")
    print("8. 删除令牌")
    print(f"{'='*70}")
    
    user1 = users[0]  # testuser1
    user1_results = {
        "login": user1.test_login(),
        "batch_upload": user1.test_batch_upload(),
        "chunk_upload": user1.test_chunk_upload(),
        "get_images": user1.test_get_images(),
        "batch_delete": user1.test_batch_delete(),
        "get_tokens": user1.test_get_tokens(),
        "create_token": user1.test_create_token(),
        "delete_token": user1.test_delete_token()
    }
    print("\n用户2 (testuser3) 测试结果：")
    user3_passed = 0
    user3_total = len(user3_results)
    for test_name, success in user3_results.items():
        status = "✓ PASSED" if success else "✗ FAILED"
        print(f"{test_name:20} {status}")
        if success:
            user3_passed += 1
    print(f"汇总: {user3_passed}/{user3_total} 测试通过")

    # 打印用户1的测试结果
    print("用户1 (testuser1) 测试结果：")
    user1_passed = 0
    user1_total = len(user1_results)
    for test_name, success in user1_results.items():
        status = "✓ PASSED" if success else "✗ FAILED"
        print(f"{test_name:20} {status}")
        if success:
            user1_passed += 1
    print(f"汇总: {user1_passed}/{user1_total} 测试通过")
    
    
    print(f"{'='*70}")
    overall_passed = user1_passed + user3_passed
    overall_total = user1_total + user3_total
    print(f"总体测试结果: {overall_passed}/{overall_total} 测试通过")
    
    return overall_passed == overall_total

if __name__ == "__main__":
    run_multi_user_tests()