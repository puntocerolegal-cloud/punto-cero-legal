#!/usr/bin/env python3
"""
ACP v1.0 Validation Script
Validate ACP against Payment Core and Billing Core
"""

import sys
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from backend.tools.acp import certify_module
from backend.tools.acp.report_generator import ReportGenerator


# Reference scores from manual audits
REFERENCE_SCORES = {
    "payment": {
        "score": 97.25,
        "decision": "APPROVED",
        "name": "Payment Core",
    },
    "billing": {
        "score": 97.65,
        "decision": "APPROVED",
        "name": "Billing & Subscription Core",
    },
}

TOLERANCE = 5.0  # ±5 points


def validate_module(module_name: str) -> dict:
    """
    Validate a module against reference score
    
    Returns: {
        "module": str,
        "reference_score": float,
        "acp_score": float,
        "difference": float,
        "within_tolerance": bool,
        "decision_match": bool,
        "result": CertificationResult,
    }
    """
    print(f"\n{'='*70}")
    print(f"VALIDATING: {REFERENCE_SCORES[module_name]['name']}")
    print(f"{'='*70}")
    
    # Get reference
    reference = REFERENCE_SCORES[module_name]
    reference_score = reference["score"]
    
    print(f"\nReference Score: {reference_score:.2f}/100 ({reference['decision']})")
    print(f"Tolerance: ±{TOLERANCE} points ({reference_score - TOLERANCE:.2f} - {reference_score + TOLERANCE:.2f})")
    
    # Run ACP
    print(f"\nRunning ACP certification...")
    try:
        result = certify_module(module_name, f"backend/{module_name}")
        acp_score = result.overall_score
        difference = abs(acp_score - reference_score)
        within_tolerance = difference <= TOLERANCE
        decision_match = result.decision.value == reference["decision"]
        
        # Display result
        print(f"\n{'─'*70}")
        print(f"ACP Score: {acp_score:.2f}/100 ({result.decision.value})")
        print(f"Difference: {acp_score - reference_score:+.2f} points")
        print(f"Within Tolerance (±{TOLERANCE}): {'✅ YES' if within_tolerance else '❌ NO'}")
        print(f"Decision Match: {'✅ YES' if decision_match else '⚠️  DIFFERENT'}")
        print(f"{'─'*70}")
        
        # Dimension breakdown
        print(f"\nDimension Scores:")
        for dim, score in result.dimension_scores.to_dict().items():
            status = "✅" if score >= 85 else "⚠️"
            print(f"  {status} {dim}: {score:.1f}/100")
        
        # Findings summary
        if result.findings:
            critical = sum(1 for f in result.findings if f.severity.value == "critical")
            high = sum(1 for f in result.findings if f.severity.value == "high")
            medium = sum(1 for f in result.findings if f.severity.value == "medium")
            low = sum(1 for f in result.findings if f.severity.value == "low")
            
            print(f"\nFindings Summary:")
            if critical > 0:
                print(f"  🔴 Critical: {critical}")
            if high > 0:
                print(f"  🟠 High: {high}")
            if medium > 0:
                print(f"  🟡 Medium: {medium}")
            if low > 0:
                print(f"  🟢 Low: {low}")
        
        return {
            "module": module_name,
            "reference_score": reference_score,
            "acp_score": acp_score,
            "difference": acp_score - reference_score,
            "abs_difference": difference,
            "within_tolerance": within_tolerance,
            "decision_match": decision_match,
            "result": result,
        }
    
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "module": module_name,
            "error": str(e),
            "within_tolerance": False,
        }


def validate_reproducibility(module_name: str, runs: int = 3) -> dict:
    """
    Validate that ACP produces same result on multiple runs
    """
    print(f"\n{'='*70}")
    print(f"STRESS TEST: Reproducibility ({runs} runs)")
    print(f"{'='*70}")
    
    scores = []
    for i in range(runs):
        try:
            result = certify_module(module_name, f"backend/{module_name}")
            scores.append(result.overall_score)
            print(f"  Run {i+1}: {result.overall_score:.2f}/100")
        except Exception as e:
            print(f"  Run {i+1}: ❌ ERROR: {str(e)}")
            return {
                "reproducible": False,
                "error": str(e),
            }
    
    # Check if all scores are identical
    all_same = len(set(scores)) == 1
    print(f"\nAll Scores Identical: {'✅ YES' if all_same else '❌ NO'}")
    
    if not all_same:
        print(f"  Scores: {scores}")
        print(f"  Range: {min(scores):.2f} - {max(scores):.2f}")
    
    return {
        "reproducible": all_same,
        "scores": scores,
        "consistent": len(set(scores)) == 1,
    }


def generate_validation_report(results: dict) -> str:
    """Generate comprehensive validation report"""
    
    payment_result = results.get("payment", {})
    billing_result = results.get("billing", {})
    payment_repro = results.get("payment_reproducibility", {})
    billing_repro = results.get("billing_reproducibility", {})
    
    # Determine overall validation status
    payment_valid = payment_result.get("within_tolerance", False)
    billing_valid = billing_result.get("within_tolerance", False)
    repro_valid = payment_repro.get("reproducible", False) and billing_repro.get("reproducible", False)
    
    overall_valid = payment_valid and billing_valid and repro_valid
    
    lines = [
        "# ACP V1.0 VALIDATION REPORT",
        "",
        f"**Validation Date**: {datetime.now().isoformat()}",
        "",
        "## EXECUTIVE SUMMARY",
        "",
    ]
    
    if overall_valid:
        lines.append("✅ **ACP v1.0 VALIDATION SUCCESSFUL**")
        lines.append("")
        lines.append("The Architecture Certification Platform has been validated against reference modules")
        lines.append("and is ready for official certification as the standard certification tool for")
        lines.append("Punto Cero System OS.")
    else:
        lines.append("⚠️  **ACP v1.0 VALIDATION INCOMPLETE**")
        lines.append("")
        lines.append("ACP did not meet all validation criteria. Review findings below.")
    
    # Phase 1 & 3: Payment Core Results
    lines.extend([
        "",
        "## PHASE 1 & 3: PAYMENT CORE VALIDATION",
        "",
    ])
    
    if "error" not in payment_result:
        lines.append(f"| Metric | Reference | ACP | Difference | Status |")
        lines.append(f"|--------|-----------|-----|------------|--------|")
        lines.append(
            f"| Score | {payment_result['reference_score']:.2f} | {payment_result['acp_score']:.2f} | "
            f"{payment_result['difference']:+.2f} | {'✅ PASS' if payment_result['within_tolerance'] else '❌ FAIL'} |"
        )
        lines.append(f"| Decision | APPROVED | {payment_result['result'].decision.value} | "
                    f"{'✅ MATCH' if payment_result['decision_match'] else '⚠️  DIFF'} |")
        lines.append("")
        lines.append(f"**Deviation**: {payment_result['abs_difference']:.2f} points (±{TOLERANCE} tolerance)")
        lines.append(f"**Within Tolerance**: {'✅ YES' if payment_result['within_tolerance'] else '❌ NO'}")
        lines.append("")
        
        # Dimensions
        lines.append("### Dimension Scores (Payment)")
        lines.append("")
        for dim, score in payment_result['result'].dimension_scores.to_dict().items():
            status = "✅" if score >= 85 else "⚠️"
            lines.append(f"- {status} {dim}: {score:.1f}/100")
    else:
        lines.append(f"❌ ERROR: {payment_result['error']}")
    
    # Phase 2 & 3: Billing Core Results
    lines.extend([
        "",
        "## PHASE 2 & 3: BILLING CORE VALIDATION",
        "",
    ])
    
    if "error" not in billing_result:
        lines.append(f"| Metric | Reference | ACP | Difference | Status |")
        lines.append(f"|--------|-----------|-----|------------|--------|")
        lines.append(
            f"| Score | {billing_result['reference_score']:.2f} | {billing_result['acp_score']:.2f} | "
            f"{billing_result['difference']:+.2f} | {'✅ PASS' if billing_result['within_tolerance'] else '❌ FAIL'} |"
        )
        lines.append(f"| Decision | APPROVED | {billing_result['result'].decision.value} | "
                    f"{'✅ MATCH' if billing_result['decision_match'] else '⚠️  DIFF'} |")
        lines.append("")
        lines.append(f"**Deviation**: {billing_result['abs_difference']:.2f} points (±{TOLERANCE} tolerance)")
        lines.append(f"**Within Tolerance**: {'✅ YES' if billing_result['within_tolerance'] else '❌ NO'}")
        lines.append("")
        
        # Dimensions
        lines.append("### Dimension Scores (Billing)")
        lines.append("")
        for dim, score in billing_result['result'].dimension_scores.to_dict().items():
            status = "✅" if score >= 85 else "⚠️"
            lines.append(f"- {status} {dim}: {score:.1f}/100")
    else:
        lines.append(f"❌ ERROR: {billing_result['error']}")
    
    # Phase 7: Stress Test Results
    lines.extend([
        "",
        "## PHASE 7: STRESS TEST (Reproducibility)",
        "",
    ])
    
    if payment_repro.get("reproducible"):
        lines.append("✅ **Payment Core**: Reproducible (3 identical runs)")
    else:
        lines.append("❌ **Payment Core**: NOT reproducible")
    
    if billing_repro.get("reproducible"):
        lines.append("✅ **Billing Core**: Reproducible (3 identical runs)")
    else:
        lines.append("❌ **Billing Core**: NOT reproducible")
    
    # Phase 8: Decision
    lines.extend([
        "",
        "## PHASE 8: ARCHITECTURE BOARD DECISION",
        "",
    ])
    
    if overall_valid:
        lines.append("### ✅ DECISION: APPROVED")
        lines.append("")
        lines.append("**The Architecture Certification Platform v1.0 is officially certified**")
        lines.append("**as the standard certification tool for Punto Cero System OS.**")
        lines.append("")
        lines.append("**Rationale**:")
        lines.append(f"- Payment Core: {payment_result['acp_score']:.2f}/100 (ref: {payment_result['reference_score']:.2f}, diff: {payment_result['difference']:+.2f})")
        lines.append(f"- Billing Core: {billing_result['acp_score']:.2f}/100 (ref: {billing_result['reference_score']:.2f}, diff: {billing_result['difference']:+.2f})")
        lines.append("- Reproducibility: ✅ Confirmed")
        lines.append("- All deviations within ±5 point tolerance")
        lines.append("")
        lines.append("**Authorization**: ACP is approved to certify all future modules (Organizations, Cases, etc.)")
    elif payment_valid and billing_valid:
        lines.append("### ⚠️  DECISION: CONDITIONAL")
        lines.append("")
        lines.append("**The Architecture Certification Platform v1.0 is conditionally approved**")
        lines.append("")
        lines.append("**Conditions**:")
        if not payment_repro.get("reproducible"):
            lines.append("- Payment Core reproducibility test must pass")
        if not billing_repro.get("reproducible"):
            lines.append("- Billing Core reproducibility test must pass")
    else:
        lines.append("### ❌ DECISION: REJECTED")
        lines.append("")
        lines.append("**The Architecture Certification Platform v1.0 is not certified.**")
        lines.append("")
        if not payment_valid:
            lines.append(f"- Payment Core validation failed: {payment_result['abs_difference']:.2f} points deviation")
        if not billing_valid:
            lines.append(f"- Billing Core validation failed: {billing_result['abs_difference']:.2f} points deviation")
    
    # Summary and Recommendations
    lines.extend([
        "",
        "## VALIDATION SUMMARY",
        "",
        "| Criterion | Result |",
        "|-----------|--------|",
        f"| Payment Score (±5) | {'✅ PASS' if payment_result.get('within_tolerance') else '❌ FAIL'} |",
        f"| Billing Score (±5) | {'✅ PASS' if billing_result.get('within_tolerance') else '❌ FAIL'} |",
        f"| Reproducibility | {'✅ PASS' if repro_valid else '❌ FAIL'} |",
        f"| Decision Match | {'✅ PASS' if (payment_result.get('decision_match') and billing_result.get('decision_match')) else '⚠️  PARTIAL' if (payment_result.get('decision_match') or billing_result.get('decision_match')) else '❌ FAIL'} |",
        f"| Overall Validation | {'✅ PASSED' if overall_valid else '⚠️  CONDITIONAL' if (payment_valid and billing_valid) else '❌ FAILED'} |",
        "",
    ])
    
    if overall_valid:
        lines.extend([
            "## OFFICIAL CERTIFICATION",
            "",
            "```",
            "ARCHITECTURE CERTIFICATION PLATFORM v1.0",
            "",
            "STATUS: ✅ OFFICIALLY CERTIFIED",
            "",
            "Approved by: Architecture Governance Board",
            "Authority: Architecture Constitution v1.0",
            "",
            "Authorized to certify every future module of Punto Cero System OS.",
            "",
            "Reference Modules:",
            "✅ Payment Core (97.25/100)",
            "✅ Billing & Subscription Core (97.65/100)",
            "",
            "Next Authorized Certification: Organizations (S1.5)",
            "",
            "Effective: Immediately upon board approval",
            "```",
        ])
    
    return "\n".join(lines)


def main():
    """Main validation flow"""
    print("\n" + "="*70)
    print("ACP V1.0 VALIDATION SUITE")
    print("Architecture Certification Platform")
    print("="*70)
    
    results = {}
    
    # Phase 1 & 3: Validate Payment Core
    print("\n[PHASE 1 & 3] Validating Payment Core...")
    results["payment"] = validate_module("payment")
    
    # Phase 2 & 3: Validate Billing Core
    print("\n[PHASE 2 & 3] Validating Billing Core...")
    results["billing"] = validate_module("billing")
    
    # Phase 7: Stress Test Reproducibility
    print("\n[PHASE 7] Testing Reproducibility...")
    results["payment_reproducibility"] = validate_reproducibility("payment")
    results["billing_reproducibility"] = validate_reproducibility("billing")
    
    # Generate validation report
    print("\n[REPORTING] Generating validation report...")
    report = generate_validation_report(results)
    
    # Save report
    report_file = Path("ACP_VALIDATION_REPORT.md")
    report_file.write_text(report)
    print(f"✅ Report saved: {report_file}")
    
    # Print summary
    print("\n" + "="*70)
    print("VALIDATION COMPLETE")
    print("="*70)
    
    payment_valid = results["payment"].get("within_tolerance", False)
    billing_valid = results["billing"].get("within_tolerance", False)
    repro_valid = results["payment_reproducibility"].get("reproducible", False) and \
                  results["billing_reproducibility"].get("reproducible", False)
    
    overall_valid = payment_valid and billing_valid and repro_valid
    
    if overall_valid:
        print("✅ ACP v1.0 VALIDATION: PASSED")
        print(f"   Payment: {results['payment']['acp_score']:.2f} (ref: {results['payment']['reference_score']:.2f})")
        print(f"   Billing: {results['billing']['acp_score']:.2f} (ref: {results['billing']['reference_score']:.2f})")
        print(f"   Reproducibility: ✅ Confirmed")
        return 0
    else:
        print("⚠️  ACP v1.0 VALIDATION: INCOMPLETE")
        return 1


if __name__ == "__main__":
    sys.exit(main())
