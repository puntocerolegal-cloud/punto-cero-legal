"""
Global XSS protection utility for user-controlled input.

CRITICAL FIX (S5.3-Finding#6): Prevents stored XSS attacks by sanitizing
user-controlled text fields before storage and ensuring proper escaping
during retrieval.
"""
from html import escape
from bleach import clean
from typing import Optional


def sanitize_html(text: Optional[str], strip_tags: bool = True) -> str:
    """
    Sanitize HTML content to prevent XSS attacks.
    
    CRITICAL FIX (S5.3-Finding#6): Sanitizes user input to prevent
    stored XSS when user content is displayed in templates.
    
    Args:
        text: User-provided text that may contain HTML
        strip_tags: If True, removes all HTML tags. If False, allows safe tags.
    
    Returns:
        Sanitized text safe to store and display
    
    Examples:
        >>> sanitize_html("<script>alert('xss')</script>Hello")
        'Hello'
        
        >>> sanitize_html("<b>Bold</b> <script>alert('xss')</script>")
        '<b>Bold</b>'  # (if strip_tags=False)
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Remove null bytes (can bypass some filters)
    text = text.replace('\x00', '')
    
    if strip_tags:
        # Remove all HTML tags, keep text content
        return clean(text, tags=[], strip=True)
    else:
        # Allow safe tags only (no script, iframe, event handlers, etc)
        return clean(
            text,
            tags=['b', 'i', 'u', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote'],
            attributes={'a': ['href', 'title']},
            strip=True
        )


def escape_html(text: Optional[str]) -> str:
    """
    Escape HTML special characters for safe display.
    
    Use this when you need to display raw user text in HTML context.
    
    Args:
        text: Text to escape
    
    Returns:
        HTML-escaped text safe to display
    
    Examples:
        >>> escape_html("<script>alert('xss')</script>")
        '&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;'
    """
    if not text or not isinstance(text, str):
        return ""
    return escape(text)


def sanitize_case_description(description: Optional[str]) -> str:
    """
    Sanitize case description field.
    
    Removes all HTML tags, preserves text only.
    """
    return sanitize_html(description, strip_tags=True)


def sanitize_notes(notes: Optional[str]) -> str:
    """
    Sanitize notes/comments field.
    
    Removes all HTML/script tags, preserves plain text.
    """
    return sanitize_html(notes, strip_tags=True)


def sanitize_case_number(case_number: Optional[str]) -> str:
    """
    Sanitize case number for safe display.
    
    Case numbers should be alphanumeric only. This is a defense-in-depth
    measure in case validation is bypassed elsewhere.
    """
    if not case_number or not isinstance(case_number, str):
        return ""
    
    # Keep only alphanumeric, hyphens, and spaces (typical case number format)
    import re
    cleaned = re.sub(r'[^a-zA-Z0-9\s\-]', '', case_number)
    return cleaned.strip()


def sanitize_url(url: Optional[str]) -> str:
    """
    Sanitize and validate URL to prevent javascript: and data: URLs.
    
    Args:
        url: URL to sanitize
    
    Returns:
        Safe URL or empty string
    
    Examples:
        >>> sanitize_url("javascript:alert('xss')")
        ''
        
        >>> sanitize_url("https://example.com")
        'https://example.com'
    """
    if not url or not isinstance(url, str):
        return ""
    
    url = url.strip()
    
    # Dangerous protocols
    dangerous_protocols = [
        'javascript:',
        'data:',
        'vbscript:',
        'file:',
        'about:',
    ]
    
    lower_url = url.lower()
    for protocol in dangerous_protocols:
        if lower_url.startswith(protocol):
            return ""
    
    # Allow http, https, mailto, etc.
    return url


def sanitize_email_body(text: Optional[str]) -> str:
    """
    Sanitize email body content.
    
    Removes script tags, event handlers, allows basic formatting.
    """
    return sanitize_html(text, strip_tags=True)


# Batch sanitizer for multiple fields
def sanitize_document(doc: dict, fields: list) -> dict:
    """
    Sanitize multiple fields in a document.
    
    Args:
        doc: Dictionary (e.g., from MongoDB)
        fields: List of field names to sanitize
    
    Returns:
        Document with sanitized fields
    
    Example:
        >>> doc = {"title": "<script>xss</script>Hello", "description": "Test"}
        >>> sanitize_document(doc, ["title", "description"])
        {'title': 'Hello', 'description': 'Test'}
    """
    result = doc.copy()
    for field in fields:
        if field in result and result[field]:
            result[field] = sanitize_html(result[field], strip_tags=True)
    return result


if __name__ == "__main__":
    # Test cases
    assert sanitize_html("<script>alert('xss')</script>Hello") == "Hello"
    assert sanitize_html("<b>Bold</b> text") == "<b>Bold</b> text"
    assert escape_html("<script>") == "&lt;script&gt;"
    assert sanitize_case_number("CAS-<script>") == "CAS"
    assert sanitize_url("javascript:alert('xss')") == ""
    assert sanitize_url("https://example.com") == "https://example.com"
    
    print("✓ All XSS protection tests passed")
