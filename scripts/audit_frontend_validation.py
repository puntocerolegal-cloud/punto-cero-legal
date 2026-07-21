#!/usr/bin/env python3
"""
AUDITOR AUTOMÁTICO DE FRONTEND - VALIDACIÓN
============================================
Script de auditoría que analiza componentes React en busca de errores comunes.
Versión de validación para probar detección de errores intencionales.

Uso:
    python scripts/audit_frontend_validation.py <ruta_al_archivo>
    
Ejemplo:
    python scripts/audit_frontend_validation.py frontend/src/modules/admin/pages/TestAuditScenario.jsx
"""

import re
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any


class AuditFinding:
    """Representa un hallazgo de auditoría."""
    
    def __init__(self, finding_id: int, module: str, path: str, error_type: str, 
                 severity: str, description: str, steps_to_reproduce: List[str],
                 expected_result: str, actual_result: str, line_number: int,
                 code_snippet: str, recommendation: str):
        self.finding_id = finding_id
        self.module = module
        self.path = path
        self.error_type = error_type
        self.severity = severity
        self.description = description
        self.steps_to_reproduce = steps_to_reproduce
        self.expected_result = expected_result
        self.actual_result = actual_result
        self.line_number = line_number
        self.code_snippet = code_snippet
        self.recommendation = recommendation
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.finding_id,
            "module": self.module,
            "path": self.path,
            "error_type": self.error_type,
            "severity": self.severity,
            "description": self.description,
            "steps_to_reproduce": self.steps_to_reproduce,
            "expected_result": self.expected_result,
            "actual_result": self.actual_result,
            "line_number": self.line_number,
            "code_snippet": self.code_snippet,
            "recommendation": self.recommendation
        }


class FrontendAuditor:
    """Auditor automático de código frontend React."""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.file_name = Path(file_path).name
        self.module_name = Path(file_path).parent.name
        self.content = ""
        self.lines = []
        self.findings: List[AuditFinding] = []
        self.finding_counter = 0
    
    def load_file(self) -> bool:
        """Carga el archivo a auditar."""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                self.content = f.read()
                self.lines = self.content.split('\n')
            return True
        except Exception as e:
            print(f"❌ Error al cargar archivo: {e}")
            return False
    
    def add_finding(self, error_type: str, severity: str, description: str,
                    steps_to_reproduce: List[str], expected_result: str,
                    actual_result: str, line_number: int, code_snippet: str,
                    recommendation: str):
        """Agrega un hallazgo a la lista."""
        self.finding_counter += 1
        finding = AuditFinding(
            finding_id=self.finding_counter,
            module=self.module_name,
            path=self.file_path,
            error_type=error_type,
            severity=severity,
            description=description,
            steps_to_reproduce=steps_to_reproduce,
            expected_result=expected_result,
            actual_result=actual_result,
            line_number=line_number,
            code_snippet=code_snippet,
            recommendation=recommendation
        )
        self.findings.append(finding)
    
    # ==================== REGLAS DE AUDITORÍA ====================
    
    def check_button_without_onclick(self):
        """Detecta botones sin evento onClick."""
        pattern = r'<button[^>]*>(?![^<]*onClick)[^<]*</button>'
        for i, line in enumerate(self.lines, 1):
            if re.search(pattern, line, re.IGNORECASE):
                # Verificar que no sea un comentario
                if not line.strip().startswith('//') and not line.strip().startswith('/*'):
                    self.add_finding(
                        error_type="Botón sin evento onClick",
                        severity="MEDIA",
                        description="Botón visible sin manejador de eventos onClick",
                        steps_to_reproduce=[
                            "1. Abrir el componente en el navegador",
                            "2. Localizar el botón sin funcionalidad",
                            "3. Hacer clic en el botón",
                            "4. Observar que no ocurre ninguna acción"
                        ],
                        expected_result="El botón debe ejecutar una acción al hacer clic",
                        actual_result="El botón no tiene evento onClick o la función está vacía",
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendation="Agregar un manejador onClick con la lógica correspondiente"
                    )
    
    def check_functions_with_errors(self):
        """Detecta funciones que acceden a propiedades de objetos undefined."""
        pattern = r'(\w+)\.\w+.*;'
        for i, line in enumerate(self.lines, 1):
            if 'undefined' in line or 'null' in line:
                if '.' in line and '=' in line:
                    self.add_finding(
                        error_type="Acceso a propiedad de objeto undefined",
                        severity="ALTA",
                        description="Código que accede a propiedades de objetos undefined o null",
                        steps_to_reproduce=[
                            "1. Abrir la consola del navegador (F12)",
                            "2. Ejecutar la función que contiene el error",
                            "3. Observar el error en consola"
                        ],
                        expected_result="El código debe validar que el objeto existe antes de acceder a sus propiedades",
                        actual_result="Error en runtime: Cannot read properties of undefined",
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendation="Agregar validación: if (obj) { obj.propiedad } o usar optional chaining (?.)"
                    )
    
    def check_invalid_api_calls(self):
        """Detecta llamadas a APIs que no existen."""
        patterns = [
            r"fetch\(['\"](/api/[^'\"]+)['\"]\)",
            r"axios\.\w+\(['\"](/api/[^'\"]+)['\"]\)",
            r"\.get\(['\"](/api/[^'\"]+)['\"]\)",
            r"\.post\(['\"](/api/[^'\"]+)['\"]\)"
        ]
        
        # Obtener rutas definidas en el proyecto (simplificado)
        defined_routes = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/firms',
            '/api/cases',
            '/api/documents',
            '/api/clients',
            '/api/meetings'
        ]
        
        for i, line in enumerate(self.lines, 1):
            for pattern in patterns:
                matches = re.findall(pattern, line)
                for match in matches:
                    if match not in defined_routes:
                        self.add_finding(
                            error_type="Llamada a API inexistente",
                            severity="MEDIA",
                            description=f"Petición a endpoint que no existe: {match}",
                            steps_to_reproduce=[
                                "1. Abrir la consola de red (F12 > Network)",
                                "2. Ejecutar la función que hace la llamada API",
                                "3. Observar respuesta 404 Not Found"
                            ],
                            expected_result="La API debe responder con 200 OK y datos válidos",
                            actual_result=f"La API {match} no existe, retorna 404",
                            line_number=i,
                            code_snippet=line.strip(),
                            recommendation="Verificar que la ruta existe en el backend o corregir la URL"
                        )
    
    def check_form_validation(self):
        """Detecta formularios sin validación."""
        in_form = False
        form_line = 0
        has_required = False
        has_validation = False
        
        for i, line in enumerate(self.lines, 1):
            if '<form' in line.lower():
                in_form = True
                form_line = i
                has_required = False
                has_validation = False
            
            if in_form:
                if 'required' in line.lower():
                    has_required = True
                if 'validate' in line.lower() or 'validation' in line.lower():
                    has_validation = True
                
                if '</form>' in line.lower():
                    if not has_required and not has_validation:
                        self.add_finding(
                            error_type="Formulario sin validación",
                            severity="MEDIA",
                            description="Formulario sin validación de campos requeridos",
                            steps_to_reproduce=[
                                "1. Abrir el formulario",
                                "2. Dejar todos los campos vacíos",
                                "3. Hacer clic en enviar",
                                "4. Observar que el formulario se envía sin validación"
                            ],
                            expected_result="El formulario debe validar campos antes de enviar",
                            actual_result="El formulario se envía con campos vacíos",
                            line_number=form_line,
                            code_snippet=f"<form> (línea {form_line})",
                            recommendation="Agregar validación: required, patrones regex, o validación JS"
                        )
                    in_form = False
    
    def check_modal_without_close(self):
        """Detecta modales sin botón de cierre funcional."""
        in_modal = False
        modal_line = 0
        has_close_button = False
        
        for i, line in enumerate(self.lines, 1):
            if 'Modal' in line or 'modal' in line.lower():
                if 'return (' in line or 'div' in line:
                    in_modal = True
                    modal_line = i
                    has_close_button = False
            
            if in_modal:
                if 'onClick' in line and 'close' in line.lower():
                    has_close_button = True
                
                # Buscar cierre del modal
                if '</div>' in line and in_modal:
                    # Contar divs cerrados (simplificado)
                    pass
        
        # Detectar botones sin onClick en modales
        for i, line in enumerate(self.lines, 1):
            if '<button' in line and 'onClick' not in line:
                if i > modal_line and i < modal_line + 50:  # Dentro del modal
                    self.add_finding(
                        error_type="Modal sin botón de cierre funcional",
                        severity="MEDIA",
                        description="Modal con botón que no tiene evento onClick",
                        steps_to_reproduce=[
                            "1. Abrir el modal",
                            "2. Hacer clic en el botón 'Cerrar'",
                            "3. Observar que el modal no se cierra"
                        ],
                        expected_result="El botón debe cerrar el modal al hacer clic",
                        actual_result="El botón no tiene evento onClick",
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendation="Agregar onClick={() => setModalOpen(false)} al botón de cierre"
                    )
                    break
    
    def check_broken_links(self):
        """Detecta enlaces a rutas que no existen."""
        # Patrón para window.location.href o Link href
        patterns = [
            r"window\.location\.href\s*=\s*['\"]([^'\"]+)['\"]",
            r"href=['\"](/[^'\"]+)['\"]"
        ]
        
        defined_routes = [
            '/',
            '/login',
            '/register',
            '/dashboard',
            '/firm-os',
            '/admin',
            '/cases',
            '/documents'
        ]
        
        for i, line in enumerate(self.lines, 1):
            for pattern in patterns:
                matches = re.findall(pattern, line)
                for match in matches:
                    if match not in defined_routes and 'http' not in match:
                        self.add_finding(
                            error_type="Enlace roto",
                            severity="MEDIA",
                            description=f"Enlace a ruta que no existe: {match}",
                            steps_to_reproduce=[
                                "1. Hacer clic en el enlace",
                                "2. Observar página 404 Not Found"
                            ],
                            expected_result="La ruta debe existir y cargar la página correspondiente",
                            actual_result=f"La ruta {match} no está definida en el router",
                            line_number=i,
                            code_snippet=line.strip(),
                            recommendation="Crear la ruta en el router o corregir el enlace"
                        )
    
    def check_react_warnings(self):
        """Detecta warnings comunes de React."""
        # Uso de índice como key
        for i, line in enumerate(self.lines, 1):
            if 'key={' in line and 'index' in line:
                self.add_finding(
                    error_type="Warning de React - Key inválido",
                    severity="BAJA",
                    description="Uso de índice de array como key en lista",
                    steps_to_reproduce=[
                        "1. Abrir la consola del navegador (F12)",
                        "2. Observar warning de React sobre keys"
                    ],
                    expected_result="Usar un identificador único como key",
                    actual_result="Uso de index como key causa warning y problemas de rendimiento",
                    line_number=i,
                    code_snippet=line.strip(),
                    recommendation="Usar key={item.id} en lugar de key={index}"
                )
    
    def check_empty_state_handling(self):
        """Detecta arrays vacíos sin manejo de estado vacío."""
        for i, line in enumerate(self.lines, 1):
            if '[]' in line or 'empty' in line.lower():
                # Verificar si hay un componente de estado vacío cerca
                context = '\n'.join(self.lines[max(0, i-5):min(len(self.lines), i+5)])
                if 'EmptyState' not in context and 'Sin datos' not in context and 'No hay' not in context:
                    self.add_finding(
                        error_type="Estado vacío no manejado",
                        severity="BAJA",
                        description="Array vacío sin componente de estado vacío",
                        steps_to_reproduce=[
                            "1. Navegar al módulo sin datos",
                            "2. Observar que no hay mensaje de 'Sin datos'"
                        ],
                        expected_result="Mostrar mensaje amigable cuando no hay datos",
                        actual_result="El array vacío se muestra sin mensaje informativo",
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendation="Agregar componente EmptyState o mensaje 'Sin datos disponibles'"
                    )
                    break
    
    def check_console_errors(self):
        """Detecta console.error en lugar de sistema de logging."""
        for i, line in enumerate(self.lines, 1):
            if 'console.error' in line or 'console.log' in line:
                if not line.strip().startswith('//'):
                    self.add_finding(
                        error_type="Uso de console.error/log",
                        severity="MEDIA",
                        description="Uso de console.error en lugar de sistema de logging",
                        steps_to_reproduce=[
                            "1. Abrir la consola del navegador",
                            "2. Ejecutar el código que genera el error",
                            "3. Observar el log en consola"
                        ],
                        expected_result="Usar sistema de logging estructurado (logger, Sentry, etc.)",
                        actual_result="Uso de console.error que no se captura en producción",
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendation="Reemplazar console.error por logger.error() o sistema de logging"
                    )
    
    def check_required_fields(self):
        """Detecta campos de formulario sin atributo required."""
        for i, line in enumerate(self.lines, 1):
            if '<input' in line or '<select' in line or '<textarea' in line:
                if 'required' not in line.lower():
                    self.add_finding(
                        error_type="Campo obligatorio sin validación",
                        severity="ALTA",
                        description="Campo de formulario sin atributo required",
                        steps_to_reproduce=[
                            "1. Abrir el formulario",
                            "2. Dejar el campo vacío",
                            "3. Enviar el formulario",
                            "4. Observar que se envía sin validación"
                        ],
                        expected_result="El campo debe tener validación required",
                        actual_result="El campo se envía vacío sin validación",
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendation="Agregar atributo required o validación personalizada"
                    )
    
    # ==================== EJECUCIÓN DE AUDITORÍA ====================
    
    def run_audit(self) -> List[AuditFinding]:
        """Ejecuta todas las reglas de auditoría."""
        print(f"🔍 Iniciando auditoría de: {self.file_name}")
        print(f"📂 Ruta: {self.file_path}")
        print(f"📊 Líneas analizadas: {len(self.lines)}")
        print()
        
        # Ejecutar todas las reglas
        self.check_button_without_onclick()
        self.check_functions_with_errors()
        self.check_invalid_api_calls()
        self.check_form_validation()
        self.check_modal_without_close()
        self.check_broken_links()
        self.check_react_warnings()
        self.check_empty_state_handling()
        self.check_console_errors()
        self.check_required_fields()
        
        return self.findings
    
    def generate_report(self) -> Dict[str, Any]:
        """Genera reporte de auditoría en formato JSON."""
        report = {
            "audit_metadata": {
                "file": self.file_path,
                "file_name": self.file_name,
                "module": self.module_name,
                "audit_date": datetime.now().isoformat(),
                "total_lines": len(self.lines),
                "total_findings": len(self.findings)
            },
            "summary": {
                "critical": len([f for f in self.findings if f.severity == "CRÍTICA"]),
                "high": len([f for f in self.findings if f.severity == "ALTA"]),
                "medium": len([f for f in self.findings if f.severity == "MEDIA"]),
                "low": len([f for f in self.findings if f.severity == "BAJA"])
            },
            "findings": [f.to_dict() for f in self.findings]
        }
        return report
    
    def print_report(self):
        """Imprime reporte en consola."""
        print("=" * 80)
        print("📋 REPORTE DE AUDITORÍA")
        print("=" * 80)
        print()
        
        if not self.findings:
            print("✅ No se encontraron hallazgos.")
            return
        
        # Agrupar por severidad
        by_severity = {}
        for finding in self.findings:
            severity = finding.severity
            if severity not in by_severity:
                by_severity[severity] = []
            by_severity[severity].append(finding)
        
        # Imprimir por severidad
        severity_order = ["CRÍTICA", "ALTA", "MEDIA", "BAJA"]
        severity_emoji = {
            "CRÍTICA": "🔴",
            "ALTA": "🟠",
            "MEDIA": "🟡",
            "BAJA": "🔵"
        }
        
        for severity in severity_order:
            if severity in by_severity:
                findings = by_severity[severity]
                print(f"\n{severity_emoji[severity]} {severity} ({len(findings)} hallazgos)")
                print("-" * 80)
                
                for finding in findings:
                    print(f"\n[ID-{finding.finding_id:03d}] {finding.error_type}")
                    print(f"  Línea: {finding.line_number}")
                    print(f"  Descripción: {finding.description}")
                    print(f"  Código: {finding.code_snippet[:100]}")
                    print(f"  Recomendación: {finding.recommendation}")
        
        print("\n" + "=" * 80)
        print("📊 RESUMEN")
        print("=" * 80)
        print(f"Total hallazgos: {len(self.findings)}")
        for severity in severity_order:
            if severity in by_severity:
                print(f"  {severity_emoji[severity]} {severity}: {len(by_severity[severity])}")
        print()


def main():
    """Función principal."""
    if len(sys.argv) < 2:
        print("❌ Uso: python scripts/audit_frontend_validation.py <ruta_al_archivo>")
        print("Ejemplo: python scripts/audit_frontend_validation.py frontend/src/modules/admin/pages/TestAuditScenario.jsx")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # Verificar que el archivo existe
    if not Path(file_path).exists():
        print(f"❌ Error: El archivo {file_path} no existe")
        sys.exit(1)
    
    # Crear auditor
    auditor = FrontendAuditor(file_path)
    
    # Cargar archivo
    if not auditor.load_file():
        sys.exit(1)
    
    # Ejecutar auditoría
    findings = auditor.run_audit()
    
    # Generar reporte
    report = auditor.generate_report()
    
    # Imprimir reporte en consola
    auditor.print_report()
    
    # Guardar reporte JSON
    output_file = f"audit_report_{Path(file_path).stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Reporte guardado en: {output_file}")
    
    # Retornar código de salida basado en hallazgos
    if len(findings) == 0:
        print("\n✅ Auditoría exitosa: No se encontraron errores")
        sys.exit(0)
    else:
        print(f"\n⚠️  Auditoría completada: {len(findings)} hallazgos detectados")
        sys.exit(1)


if __name__ == "__main__":
    main()