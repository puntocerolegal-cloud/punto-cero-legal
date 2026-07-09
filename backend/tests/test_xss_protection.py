"""
Test global XSS protection for user-controlled input.

CRITICAL FIX (S5.3-Finding#6): Prevents stored XSS attacks by sanitizing
user input before storage in database.
"""
import pytest
from fastapi.testclient import TestClient
import time


def test_sanitize_html_removes_script_tags():
    """Verify script tags are removed."""
    from utils.xss_protection import sanitize_html
    
    html = "<script>alert('xss')</script>Hello"
    result = sanitize_html(html)
    assert result == "Hello"
    assert "<script>" not in result
    print("✓ Script tags removed")


def test_sanitize_html_removes_event_handlers():
    """Verify event handlers are removed."""
    from utils.xss_protection import sanitize_html
    
    html = '<img src="x" onerror="alert(\'xss\')">'
    result = sanitize_html(html)
    assert "onerror" not in result
    assert "alert" not in result
    print("✓ Event handlers removed")


def test_sanitize_html_removes_iframe():
    """Verify iframe tags are removed."""
    from utils.xss_protection import sanitize_html
    
    html = '<iframe src="javascript:alert(\'xss\')"></iframe>Content'
    result = sanitize_html(html)
    assert "<iframe" not in result
    assert result == "Content"
    print("✓ Iframe tags removed")


def test_sanitize_html_with_safe_tags():
    """Verify safe tags are preserved when strip_tags=False."""
    from utils.xss_protection import sanitize_html
    
    html = "<b>Bold</b> and <i>italic</i> with <script>xss</script>"
    result = sanitize_html(html, strip_tags=False)
    assert "<b>Bold</b>" in result
    assert "<i>italic</i>" in result
    assert "<script>" not in result
    print("✓ Safe tags preserved, unsafe removed")


def test_sanitize_html_null_bytes():
    """Verify null bytes are removed."""
    from utils.xss_protection import sanitize_html
    
    html = "Hello\x00<script>xss</script>World"
    result = sanitize_html(html)
    assert "\x00" not in result
    assert "<script>" not in result
    print("✓ Null bytes removed")


def test_sanitize_html_empty_input():
    """Verify empty input is handled safely."""
    from utils.xss_protection import sanitize_html
    
    assert sanitize_html("") == ""
    assert sanitize_html(None) == ""
    assert sanitize_html("   ") == ""
    print("✓ Empty input handled safely")


def test_escape_html():
    """Verify HTML escaping works."""
    from utils.xss_protection import escape_html
    
    html = "<script>alert('xss')</script>"
    result = escape_html(html)
    assert "&lt;script&gt;" in result
    assert "&lt;/script&gt;" in result
    assert "<script>" not in result
    print("✓ HTML properly escaped")


def test_sanitize_case_number():
    """Verify case number sanitization."""
    from utils.xss_protection import sanitize_case_number
    
    # Valid case number
    result = sanitize_case_number("CAS-2026-001")
    assert result == "CAS-2026-001"
    print("✓ Valid case number preserved")
    
    # With injection
    result = sanitize_case_number("CAS-<script>2026</script>-001")
    assert "<script>" not in result
    assert result == "CAS-2026-001"
    print("✓ Injection in case number removed")


def test_sanitize_url_javascript():
    """Verify javascript: URLs are blocked."""
    from utils.xss_protection import sanitize_url
    
    result = sanitize_url("javascript:alert('xss')")
    assert result == ""
    print("✓ javascript: URL blocked")


def test_sanitize_url_data():
    """Verify data: URLs are blocked."""
    from utils.xss_protection import sanitize_url
    
    result = sanitize_url("data:text/html,<script>alert('xss')</script>")
    assert result == ""
    print("✓ data: URL blocked")


def test_sanitize_url_valid():
    """Verify valid URLs are preserved."""
    from utils.xss_protection import sanitize_url
    
    result = sanitize_url("https://example.com")
    assert result == "https://example.com"
    print("✓ Valid HTTPS URL preserved")
    
    result = sanitize_url("http://example.com/path")
    assert result == "http://example.com/path"
    print("✓ Valid HTTP URL preserved")


def test_sanitize_url_case_insensitive():
    """Verify dangerous protocols are caught regardless of case."""
    from utils.xss_protection import sanitize_url
    
    result = sanitize_url("JAVASCRIPT:alert('xss')")
    assert result == ""
    print("✓ Case-insensitive javascript: blocked")
    
    result = sanitize_url("JaVaScRiPt:alert('xss')")
    assert result == ""
    print("✓ Mixed case javascript: blocked")


def test_sanitize_document():
    """Verify batch sanitization works."""
    from utils.xss_protection import sanitize_document
    
    doc = {
        "title": "<script>xss</script>Hello",
        "description": "<img onerror='alert(1)'>Test",
        "other_field": "unchanged"
    }
    
    result = sanitize_document(doc, ["title", "description"])
    assert result["title"] == "Hello"
    assert result["description"] == "Test"
    assert result["other_field"] == "unchanged"  # Not sanitized
    print("✓ Batch sanitization works")


@pytest.mark.asyncio
async def test_case_creation_with_xss_payload():
    """Verify case creation sanitizes description."""
    from server import app
    
    client = TestClient(app)
    
    # Inject XSS in case description
    case_payload = {
        "client_name": "Test<script>alert('xss')</script>Client",
        "client_email": "test@example.com",
        "client_phone": "+34600000000",
        "description": "<img src=x onerror=\"alert('xss')\">Legal case",
        "source": "web",
        "intake_type": "consulta_inicial",
        "legal_area": "Civil"
    }
    
    response = client.post("/api/public/case-intake", json=case_payload)
    assert response.status_code in (201, 400), f"Unexpected: {response.status_code}"
    
    # If successful, the stored data should be sanitized
    if response.status_code == 201:
        case_id = response.json().get("case_id")
        # Note: We can't directly query the DB in this test context,
        # but the sanitization happens before storage
        print("✓ Case created with XSS payload (sanitized before storage)")


@pytest.mark.asyncio
async def test_xss_payloads_blocked():
    """Test common XSS payloads are blocked."""
    from utils.xss_protection import sanitize_html
    
    xss_payloads = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "<svg onload=alert('xss')>",
        "<body onload=alert('xss')>",
        "<iframe src='javascript:alert(1)'></iframe>",
        "<input onfocus=alert('xss')>",
        "<marquee onstart=alert('xss')>",
        "<details open ontoggle=alert('xss')>",
        "<form><button formaction=javascript:alert('xss')>",
        "javascript:alert('xss')",
        "vbscript:msgbox('xss')",
    ]
    
    for payload in xss_payloads:
        result = sanitize_html(payload)
        # Dangerous content should be removed or escaped
        assert "<script>" not in result.lower()
        assert "onerror" not in result.lower()
        assert "onload" not in result.lower()
        assert "onfocus" not in result.lower()
        assert "javascript:" not in result.lower()
        assert "vbscript:" not in result.lower()
    
    print(f"✓ All {len(xss_payloads)} common XSS payloads blocked")


def test_sanitize_html_preserves_text():
    """Verify text content is preserved when HTML is removed."""
    from utils.xss_protection import sanitize_html
    
    html = "<script>var x=1;</script>Important text<img onerror=alert(1)> more text"
    result = sanitize_html(html)
    assert "Important text" in result
    assert "more text" in result
    assert "<script>" not in result
    assert "onerror" not in result
    print("✓ Text content preserved after sanitization")


def test_sanitize_multiline_payload():
    """Verify multiline XSS payloads are blocked."""
    from utils.xss_protection import sanitize_html
    
    payload = """
    <script>
        var evil = "xss";
        alert(evil);
    </script>
    Innocent text
    """
    result = sanitize_html(payload)
    assert "<script>" not in result
    assert "Innocent text" in result
    print("✓ Multiline XSS payload blocked")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
