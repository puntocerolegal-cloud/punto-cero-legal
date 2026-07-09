"""Utility functions for code analysis"""

import os
import re
from pathlib import Path
from typing import List, Dict, Tuple, Optional


def find_python_files(directory: str) -> List[Path]:
    """Find all Python files in directory"""
    path = Path(directory)
    if not path.exists():
        return []
    return list(path.rglob("*.py"))


def read_file(file_path: str) -> str:
    """Read file content"""
    try:
        with open(file_path, 'r') as f:
            return f.read()
    except Exception:
        return ""


def find_class_names(content: str) -> List[str]:
    """Extract class names from Python code"""
    pattern = r'^class\s+(\w+)'
    return re.findall(pattern, content, re.MULTILINE)


def find_method_names(content: str) -> List[str]:
    """Extract method names from Python code"""
    pattern = r'^\s+def\s+(\w+)'
    return re.findall(pattern, content, re.MULTILINE)


def class_extends(content: str, class_name: str, parent_name: str) -> bool:
    """Check if class extends parent"""
    pattern = rf'class\s+{class_name}\s*\(.*{parent_name}.*\)'
    return bool(re.search(pattern, content))


def uses_tenant_aware_query(content: str) -> bool:
    """Check if code uses TenantAwareQuery"""
    return "TenantAwareQuery" in content


def uses_firm_id(content: str) -> bool:
    """Check if code references firm_id"""
    return "firm_id" in content


def uses_request_id(content: str) -> bool:
    """Check if code references request_id"""
    return "request_id" in content


def has_logging(content: str) -> bool:
    """Check if code has logging"""
    return bool(re.search(r'logger\.(debug|info|warning|error)', content))


def has_error_handling(content: str) -> bool:
    """Check if code has try/except"""
    return "except" in content and "raise" in content


def has_direct_mongodb(content: str) -> bool:
    """Check for direct MongoDB access"""
    patterns = [
        r'db\.\w+\.find',
        r'db\.\w+\.insert',
        r'db\.\w+\.update',
        r'db\.\w+\.delete',
        r'self\.collection\.find',
    ]
    return any(re.search(p, content) for p in patterns)


def find_imports(content: str) -> List[str]:
    """Extract imported modules"""
    pattern = r'^(?:from|import)\s+(\S+)'
    return re.findall(pattern, content, re.MULTILINE)


def count_repositories(directory: str) -> int:
    """Count repository classes (extend BaseRepository)"""
    count = 0
    for file_path in find_python_files(directory):
        content = read_file(str(file_path))
        if "BaseRepository" in content and "class" in content:
            count += len([c for c in find_class_names(content) 
                         if class_extends(content, c, "BaseRepository")])
    return count


def count_services(directory: str) -> int:
    """Count service classes"""
    count = 0
    for file_path in find_python_files(directory):
        if "service" in str(file_path).lower():
            content = read_file(str(file_path))
            count += len([c for c in find_class_names(content) 
                         if c.endswith("Service")])
    return count


def get_method_coverage(content: str, keyword: str) -> Tuple[int, int]:
    """
    Get coverage of keyword in methods.
    
    Returns: (methods_with_keyword, total_methods)
    """
    methods = find_method_names(content)
    
    if not methods:
        return 0, 0
    
    # Simple heuristic: check if keyword appears before next method
    with_keyword = 0
    for method in methods:
        # Find method and check next 10 lines
        pattern = rf'def\s+{method}\s*\([^)]*\):.*?' + keyword
        if re.search(pattern, content, re.DOTALL):
            with_keyword += 1
    
    return with_keyword, len(methods)


def extract_rest_endpoints(content: str) -> List[Tuple[str, str]]:
    """Extract REST endpoints (path, method)"""
    endpoints = []
    
    # Find @router.get/post/put/delete decorators
    pattern = r'@router\.(get|post|put|delete|patch)\s*\(\s*["\']([^"\']+)'
    matches = re.findall(pattern, content)
    
    for method, path in matches:
        endpoints.append((path, method.upper()))
    
    return endpoints


def has_breaking_changes(old_content: str, new_content: str) -> List[str]:
    """
    Detect breaking changes between two versions.
    
    Returns: list of breaking changes
    """
    changes = []
    
    # Extract endpoints
    old_endpoints = set(extract_rest_endpoints(old_content))
    new_endpoints = set(extract_rest_endpoints(new_content))
    
    # Removed endpoints
    removed = old_endpoints - new_endpoints
    if removed:
        changes.append(f"Removed endpoints: {removed}")
    
    return changes


def calculate_firm_id_coverage(content: str) -> float:
    """Calculate percentage of methods with firm_id parameter"""
    # Simple heuristic: look for firm_id in method signatures
    methods = find_method_names(content)
    
    if not methods:
        return 0.0
    
    with_firm_id = sum(1 for m in methods 
                       if re.search(rf'def\s+{m}\s*\([^)]*firm_id', content))
    
    return (with_firm_id / len(methods)) * 100.0 if methods else 0.0


def calculate_request_id_coverage(content: str) -> float:
    """Calculate percentage of methods with request_id parameter"""
    methods = find_method_names(content)
    
    if not methods:
        return 0.0
    
    with_request_id = sum(1 for m in methods 
                          if re.search(rf'def\s+{m}\s*\([^)]*request_id', content))
    
    return (with_request_id / len(methods)) * 100.0 if methods else 0.0


def calculate_logging_coverage(content: str) -> float:
    """Calculate percentage of methods with logging"""
    methods = find_method_names(content)
    
    if not methods:
        return 0.0
    
    with_logging = sum(1 for m in methods 
                       if re.search(rf'def\s+{m}.*?logger\.', content, re.DOTALL))
    
    return (with_logging / len(methods)) * 100.0 if methods else 0.0


def find_repos_in_directory(directory: str) -> Dict[str, str]:
    """Find all repository files"""
    repos = {}
    
    repos_dir = Path(directory) / "repositories"
    if repos_dir.exists():
        for file_path in repos_dir.glob("*_repository.py"):
            content = read_file(str(file_path))
            classes = find_class_names(content)
            for cls in classes:
                if class_extends(content, cls, "BaseRepository"):
                    repos[cls] = str(file_path)
    
    return repos


def find_services_in_directory(directory: str) -> Dict[str, str]:
    """Find all service files"""
    services = {}
    
    services_dir = Path(directory) / "services"
    if services_dir.exists():
        for file_path in services_dir.glob("*_service.py"):
            content = read_file(str(file_path))
            classes = find_class_names(content)
            for cls in classes:
                if cls.endswith("Service"):
                    services[cls] = str(file_path)
    
    return services
