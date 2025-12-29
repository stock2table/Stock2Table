# Image Integration Testing Playbook

## Image Handling Rules

1. **Always use base64-encoded images** for all tests and requests
2. **Accepted formats:** JPEG, PNG, WEBP only
3. **Do not use:** SVG, BMP, HEIC, or other formats
4. **Image quality:** Must contain real visual features (objects, edges, textures, shadows)
5. **No blank/solid-color images**

## Image Processing Rules

### Format Conversion
- If image is not PNG/JPEG/WEBP, transcode to PNG or JPEG before upload
- Always re-detect and update MIME type after transformations

### Animated Images
- If animated (GIF, APNG, WEBP animation), extract first frame only

### Size Optimization
- Resize large images to reasonable bounds (avoid oversized payloads)
- Recommended max dimensions: 1920x1080

## Testing Process

### 1. Test Image Upload
```python
import base64
from PIL import Image
import io

# Load and convert image
with open('test_image.jpg', 'rb') as f:
    img_data = f.read()
    base64_image = base64.b64encode(img_data).decode('utf-8')

# Send to API
response = requests.post(
    'http://localhost:8001/api/scan-ingredient',
    json={'image': base64_image},
    headers={'Authorization': f'Bearer {session_token}'}
)
```

### 2. Validate Response
```python
# Expected response format
{
    "ingredients": [
        {
            "name": "tomato",
            "quantity": 2,
            "unit": "pieces",
            "confidence": 0.95
        }
    ]
}
```

## Success Indicators
- Image successfully converted to base64
- API accepts and processes image
- AI returns ingredient identification
- Response time < 10 seconds

## Common Issues

### Issue: Invalid MIME type
**Solution:** Re-detect MIME after any transformation

### Issue: Image too large
**Solution:** Resize before encoding to base64

### Issue: Blank response
**Solution:** Ensure image has real content (not solid color)
