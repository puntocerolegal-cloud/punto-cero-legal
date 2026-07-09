"""Report Generator — Generate certification reports"""

from pathlib import Path
from .models import CertificationResult, Severity


class ReportGenerator:
    """Generate professional certification reports"""
    
    def __init__(self, result: CertificationResult):
        self.result = result
    
    def generate_all(self, output_dir: str = "./reports") -> None:
        """Generate all reports"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Generate scorecard
        scorecard = self._generate_scorecard()
        scorecard_file = output_path / f"{self.result.module_name.upper()}_SCORECARD.md"
        scorecard_file.write_text(scorecard)
        print(f"   ✓ Report: {scorecard_file}")
        
        # Generate certification report
        cert_report = self._generate_certification()
        cert_file = output_path / f"{self.result.module_name.upper()}_CERTIFICATION.md"
        cert_file.write_text(cert_report)
        print(f"   ✓ Report: {cert_file}")
        
        # Generate findings report
        if self.result.findings:
            findings = self._generate_findings()
            findings_file = output_path / f"{self.result.module_name.upper()}_FINDINGS.md"
            findings_file.write_text(findings)
            print(f"   ✓ Report: {findings_file}")
    
    def _generate_scorecard(self) -> str:
        """Generate final scorecard"""
        scores = self.result.dimension_scores.to_dict()
        
        lines = [
            f"# CERTIFICATION SCORECARD",
            f"## {self.result.module_name.upper()} Module",
            "",
            f"**Decision**: {self.result.decision.value}",
            f"**Overall Score**: {self.result.overall_score:.2f}/100",
            f"**Timestamp**: {self.result.timestamp}",
            "",
            "## Dimension Scores",
            "",
            "| Dimension | Score | Target | Status |",
            "|-----------|-------|--------|--------|",
        ]
        
        for dim, score in scores.items():
            target = 90 if dim != "Tenant Isolation" else 100
            status = "✅" if score >= target else "⚠️" if score >= 85 else "❌"
            lines.append(f"| {dim} | {score:.1f}/100 | ≥ {target} | {status} |")
        
        lines.extend([
            "",
            "## Decision Details",
            "",
        ])
        
        if self.result.decision.value == "APPROVED":
            lines.append("✅ **APPROVED FOR PRODUCTION**")
        elif self.result.decision.value == "CONDITIONAL":
            lines.append("⚠️ **CONDITIONALLY APPROVED**")
            lines.append("")
            lines.append("### Conditions")
            for cond in self.result.conditions:
                lines.append(f"- {cond}")
        else:
            lines.append("❌ **REJECTED**")
            lines.append("")
            lines.append("### Blockers")
            for blocker in self.result.blockers:
                lines.append(f"- {blocker}")
        
        return "\n".join(lines)
    
    def _generate_certification(self) -> str:
        """Generate comprehensive certification report"""
        lines = [
            f"# CERTIFICATION REPORT",
            f"## {self.result.module_name.upper()} Module",
            "",
            f"**Assessment Date**: {self.result.timestamp}",
            f"**Overall Score**: {self.result.overall_score:.2f}/100",
            f"**Decision**: {self.result.decision.value}",
            "",
            "## Summary",
            "",
        ]
        
        if self.result.decision.value == "APPROVED":
            lines.append(
                f"The {self.result.module_name} module is **APPROVED** for production deployment. "
                f"All architecture criteria have been met with a score of {self.result.overall_score:.2f}/100."
            )
        elif self.result.decision.value == "CONDITIONAL":
            lines.append(
                f"The {self.result.module_name} module is **CONDITIONALLY APPROVED**. "
                f"Minor issues have been identified but are mitigated. Score: {self.result.overall_score:.2f}/100."
            )
        else:
            lines.append(
                f"The {self.result.module_name} module is **NOT CERTIFIED**. "
                f"Critical issues must be resolved before deployment. Score: {self.result.overall_score:.2f}/100."
            )
        
        lines.extend([
            "",
            "## Dimension Scores",
            "",
        ])
        
        for dim, score in self.result.dimension_scores.to_dict().items():
            lines.append(f"- **{dim}**: {score:.1f}/100")
        
        if self.result.findings:
            lines.extend([
                "",
                "## Findings",
                "",
            ])
            
            for finding in self.result.findings:
                severity_icon = {
                    "critical": "🔴",
                    "high": "🟠",
                    "medium": "🟡",
                    "low": "🟢",
                }[finding.severity.value]
                
                lines.extend([
                    f"### {severity_icon} {finding.title}",
                    "",
                    f"{finding.description}",
                    "",
                ])
                
                if finding.recommendation:
                    lines.append(f"**Recommendation**: {finding.recommendation}")
                    lines.append("")
        
        return "\n".join(lines)
    
    def _generate_findings(self) -> str:
        """Generate detailed findings report"""
        lines = [
            f"# FINDINGS REPORT",
            f"## {self.result.module_name.upper()} Module",
            "",
            f"**Total Findings**: {len(self.result.findings)}",
            "",
        ]
        
        # Group by severity
        by_severity = {}
        for finding in self.result.findings:
            severity = finding.severity.value
            if severity not in by_severity:
                by_severity[severity] = []
            by_severity[severity].append(finding)
        
        for severity in ["critical", "high", "medium", "low"]:
            if severity in by_severity:
                lines.append(f"## {severity.upper()} ({len(by_severity[severity])})")
                lines.append("")
                
                for finding in by_severity[severity]:
                    lines.extend([
                        f"### {finding.title}",
                        "",
                        f"{finding.description}",
                        "",
                    ])
                    
                    if finding.recommendation:
                        lines.append(f"**Recommendation**: {finding.recommendation}")
                        lines.append("")
        
        return "\n".join(lines)
