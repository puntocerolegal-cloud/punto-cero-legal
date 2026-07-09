#!/usr/bin/env python3
"""
Architecture Certification Platform (ACP v1.0)
Command-line interface for module certification
"""

import sys
import argparse
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.tools.acp import certify_module
from backend.tools.acp.report_generator import ReportGenerator


def main():
    parser = argparse.ArgumentParser(
        description="Certify a module against Architecture Constitution v1.0"
    )
    
    parser.add_argument(
        "module",
        help="Module name to certify (e.g., 'payment', 'billing', 'organizations')"
    )
    
    parser.add_argument(
        "--path", "-p",
        help="Path to module (defaults to backend/{module})",
        default=None
    )
    
    parser.add_argument(
        "--output", "-o",
        help="Output directory for reports (defaults to ./reports)",
        default="./reports"
    )
    
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Suppress verbose output"
    )
    
    args = parser.parse_args()
    
    # Determine module path
    if args.path:
        module_path = args.path
    else:
        module_path = f"backend/{args.module}"
    
    # Verify module exists
    if not Path(module_path).exists():
        print(f"❌ Module not found: {module_path}")
        return 1
    
    # Run certification
    try:
        result = certify_module(args.module, module_path)
        
        # Display result
        if not args.quiet:
            print()
            print(f"{'='*60}")
            print(f"CERTIFICATION RESULT: {result.decision.value}")
            print(f"{'='*60}")
            print(f"Module: {result.module_name}")
            print(f"Overall Score: {result.overall_score:.2f}/100")
            print()
            print("Dimension Scores:")
            for dim, score in result.dimension_scores.to_dict().items():
                status = "✅" if score >= 90 else "⚠️" if score >= 85 else "❌"
                print(f"  {status} {dim}: {score:.1f}/100")
            print()
        
        # Generate reports
        print(f"Generating reports to {args.output}...")
        report_gen = ReportGenerator(result)
        report_gen.generate_all(args.output)
        
        print()
        if result.decision.value == "APPROVED":
            print(f"✅ {result.module_name} is CERTIFIED and approved for production!")
            return 0
        elif result.decision.value == "CONDITIONAL":
            print(f"⚠️  {result.module_name} is CONDITIONALLY APPROVED. Review conditions above.")
            return 1
        else:
            print(f"❌ {result.module_name} is REJECTED. Critical issues must be resolved.")
            return 2
    
    except Exception as e:
        print(f"❌ Certification failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 2


if __name__ == "__main__":
    sys.exit(main())
