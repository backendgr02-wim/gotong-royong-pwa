"""Test: bikin post dengan foto via browser automation."""
import sys, os, io, base64
from playwright.sync_api import sync_playwright
from PIL import Image

# Bikin dummy PNG kecil (100x100, ~300 bytes)
img = Image.new("RGB", (100, 100), color=(255, 0, 0))
buf = io.BytesIO()
img.save(buf, format="PNG")
img_bytes = buf.getvalue()

URL = "http://localhost:6789"
EMAIL = "wimxwim@gmail.com"
PASS = os.environ.get("TEST_PASS", "")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context()
    page = ctx.new_page()

    # 1. Buka halaman
    page.goto(f"{URL}/masuk")
    page.wait_for_load_state("networkidle")
    print(f"Page title: {page.title()}")

    # 2. Login
    page.fill('input[name="email"]', EMAIL)
    page.fill('input[name="sandi"]', PASS)
    page.click('button[type="submit"]')
    page.wait_for_load_state("networkidle")
    print(f"After login URL: {page.url}")

    # 3. Navigate to feed
    if "komunitas" not in page.url:
        page.goto(f"{URL}/komunitas")
        page.wait_for_load_state("networkidle")
    print(f"Feed URL: {page.url}")

    # 4. Bikin post dengan foto
    page.fill('textarea[name="isi"]', "Test upload foto via Playwright " + "A" * 50)
    
    # Upload file via file input
    file_input = page.locator('input[type="file"]')
    if file_input.count() > 0:
        file_input.set_input_files(
            {"name": "test-photo.png", "mimeType": "image/png", "buffer": img_bytes}
        )
        print("File attached")
    else:
        print("No file input found!")

    # 5. Submit
    page.click('button[type="submit"]')
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    print(f"After submit URL: {page.url}")
    
    # 6. Check for success
    content = page.content()
    if "Test upload foto" in content:
        print("SUCCESS: Post with photo appears in feed!")
    elif "error" in content.lower() or "gagal" in content.lower():
        print("ERROR: Something went wrong")
        # Get error text
        for el in page.locator('[role="alert"], .error, .text-red').all():
            print(f"Error element: {el.text_content()}")
    else:
        print("UNCERTAIN - saving screenshot")
        page.screenshot(path="/tmp/upload-test-result.png")
    
    # Save network errors
    for req in page.request.all():
        if req.failure:
            print(f"REQUEST FAILED: {req.url} -> {req.failure}")
    
    browser.close()
