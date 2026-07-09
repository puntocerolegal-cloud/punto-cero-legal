"""
KNOWLEDGE LOADER

Intelligent knowledge retrieval and context injection.

Loads from single sources of truth:
- Master Book (system knowledge)
- Founder Legacy (founder wisdom)
- Policies (business rules)
- Playbooks (operational guides)
- Knowledge Library (vertical-specific)

No duplication, no hardcoding, configuration-driven.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from enum import Enum
from datetime import datetime


class KnowledgeSource(str, Enum):
    """Knowledge source types"""
    MASTER_BOOK = "master_book"
    FOUNDER_LEGACY = "founder_legacy"
    POLICIES = "policies"
    PLAYBOOKS = "playbooks"
    LIBRARY = "library"
    VERTICAL_SPECIFIC = "vertical_specific"


@dataclass
class KnowledgeDocument:
    """Single knowledge document or chunk"""
    source: KnowledgeSource
    document_id: str
    title: str
    content: str
    vertical: Optional[str] = None
    tags: List[str] = None
    relevance_score: float = 0.0
    last_updated: datetime = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.last_updated is None:
            self.last_updated = datetime.now()


@dataclass
class KnowledgeContext:
    """Context for knowledge injection into agent response"""
    retrieved_documents: List[KnowledgeDocument]
    relevant_policies: List[str]
    relevant_playbook_steps: List[str]
    founder_wisdom: Optional[str] = None
    query: str = ""
    confidence: float = 0.0
    source_summary: Dict[str, int] = None
    
    def __post_init__(self):
        if self.source_summary is None:
            self.source_summary = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "documents_found": len(self.retrieved_documents),
            "confidence": self.confidence,
            "sources_used": self.source_summary,
            "has_founder_wisdom": self.founder_wisdom is not None,
        }


class KnowledgeLoader:
    """
    Loads knowledge from Master Book, Founder Legacy, Policies, and Playbooks.
    
    Phase 1: In-memory store with configuration
    Phase 2: File-based or database loading
    Phase 3: Semantic search and embeddings
    
    Usage:
    ```python
    loader = KnowledgeLoader(vertical="legal")
    
    # Load context for a query
    context = loader.load_context(
        query="pricing for legal services",
        agent_type="commercial",
        vertical="legal"
    )
    
    # Get relevant knowledge
    documents = context.retrieved_documents
    
    # Inject into response
    response = agent_response + context_to_text(context)
    ```
    """
    
    def __init__(self, vertical: str = "generic"):
        self.vertical = vertical
        self.documents: Dict[str, KnowledgeDocument] = {}
        self.policies: Dict[str, str] = {}
        self.playbooks: Dict[str, List[str]] = {}
        self.founder_wisdom: Dict[str, str] = {}
        
        # Initialize with placeholder structure
        self._initialize_knowledge()
    
    def _initialize_knowledge(self):
        """Initialize knowledge base placeholder"""
        # Policies
        self.policies["commercial_approach"] = (
            "Always consultative, never aggressive. Listen first, understand needs, "
            "then guide toward solutions that create mutual value."
        )
        
        self.policies["escalation_criteria"] = (
            "Escalate when: urgent legal matters, customer is angry, complex situations, "
            "VIP accounts, or matter exceeds Darwin's scope."
        )
        
        self.policies["response_guidelines"] = (
            "Keep responses short (1-3 sentences). Use customer's name. Be empathetic. "
            "Show understanding. Avoid robotic language. Use simple Spanish."
        )
        
        # Playbooks
        self.playbooks["sales_discovery"] = [
            "1. Greet warmly and establish rapport",
            "2. Ask about their specific legal needs",
            "3. Understand their pain points and concerns",
            "4. Show how Punto Cero can help",
            "5. Propose next steps without pressure",
        ]
        
        self.playbooks["client_support"] = [
            "1. Greet returning client by name",
            "2. Acknowledge their concern empathetically",
            "3. Provide status or update",
            "4. Offer next steps or escalation",
            "5. Confirm resolution or transfer",
        ]
        
        self.playbooks["lawyer_recruitment"] = [
            "1. Explain platform value proposition",
            "2. Detail commission structure and benefits",
            "3. Walk through onboarding process",
            "4. Answer concerns about workload",
            "5. Invite to demo or trial period",
        ]
        
        # Founder wisdom (from FOUNDER_LEGACY)
        self.founder_wisdom["core_philosophy"] = (
            "Technology should serve lawyers and clients, not replace them. "
            "Our mission is to democratize legal services while maintaining quality."
        )
        
        self.founder_wisdom["customer_obsession"] = (
            "Every feature, every interaction, every decision should be made "
            "with the customer's best interest in mind. If in doubt, choose empathy."
        )
        
        self.founder_wisdom["professionalism"] = (
            "We represent professionalism in everything we do. Quality, reliability, "
            "and integrity are non-negotiable."
        )
    
    def load_context(
        self,
        query: str,
        agent_type: str,
        vertical: Optional[str] = None,
        conversation_history: Optional[List[str]] = None
    ) -> KnowledgeContext:
        """Load relevant knowledge context for agent"""
        
        if vertical is None:
            vertical = self.vertical
        
        # Retrieve relevant documents
        documents = self._retrieve_documents(query, vertical, agent_type)
        
        # Get relevant policies
        policies = self._get_relevant_policies(agent_type)
        
        # Get relevant playbook
        playbook_steps = self._get_playbook_steps(agent_type)
        
        # Get founder wisdom if relevant
        wisdom = self._get_founder_wisdom(agent_type)
        
        # Calculate confidence
        confidence = self._calculate_confidence(query, documents)
        
        return KnowledgeContext(
            retrieved_documents=documents,
            relevant_policies=policies,
            relevant_playbook_steps=playbook_steps,
            founder_wisdom=wisdom,
            query=query,
            confidence=confidence,
            source_summary=self._get_source_summary(documents)
        )
    
    def _retrieve_documents(
        self,
        query: str,
        vertical: str,
        agent_type: str
    ) -> List[KnowledgeDocument]:
        """Retrieve relevant documents (Phase 1: simple keyword matching)"""
        # Phase 1: Simple keyword matching
        # Phase 2: Will use semantic search
        # Phase 3: Will use embeddings
        
        relevant_docs = []
        
        # In Phase 2, this would query Master Book, Founder Legacy, etc.
        # For now, return placeholder
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["precio", "price", "cost", "costo"]):
            relevant_docs.append(KnowledgeDocument(
                source=KnowledgeSource.MASTER_BOOK,
                document_id="pricing_01",
                title="Pricing Structure",
                content="Punto Cero offers flexible pricing: hourly, per-case, or subscription models.",
                vertical=vertical
            ))
        
        if any(word in query_lower for word in ["beneficio", "benefit", "ventaja"]):
            relevant_docs.append(KnowledgeDocument(
                source=KnowledgeSource.MASTER_BOOK,
                document_id="benefits_01",
                title="Platform Benefits",
                content="Access to pre-qualified clients, modern tools, administrative support, and professional network.",
                vertical=vertical
            ))
        
        if any(word in query_lower for word in ["caso", "case", "cliente", "client"]):
            relevant_docs.append(KnowledgeDocument(
                source=KnowledgeSource.PLAYBOOKS,
                document_id="cases_01",
                title="Case Management",
                content="All cases are tracked with full documentation, status updates, and client communication.",
                vertical=vertical
            ))
        
        return relevant_docs
    
    def _get_relevant_policies(self, agent_type: str) -> List[str]:
        """Get policies relevant to agent type"""
        relevant = [
            self.policies.get("commercial_approach", ""),
            self.policies.get("response_guidelines", ""),
        ]
        
        if agent_type in ["support", "client"]:
            relevant.append(self.policies.get("escalation_criteria", ""))
        
        return [p for p in relevant if p]
    
    def _get_playbook_steps(self, agent_type: str) -> List[str]:
        """Get playbook steps for agent type"""
        if agent_type == "commercial":
            return self.playbooks.get("sales_discovery", [])
        elif agent_type == "client":
            return self.playbooks.get("client_support", [])
        elif agent_type == "lawyer":
            return self.playbooks.get("lawyer_recruitment", [])
        else:
            return []
    
    def _get_founder_wisdom(self, agent_type: str) -> Optional[str]:
        """Get relevant founder wisdom"""
        # All agents should be guided by founder philosophy
        return self.founder_wisdom.get("core_philosophy")
    
    def _calculate_confidence(
        self,
        query: str,
        documents: List[KnowledgeDocument]
    ) -> float:
        """Calculate confidence in retrieved knowledge"""
        # Phase 1: Simple metric
        # Phase 2: Semantic similarity scoring
        if not documents:
            return 0.5
        
        # More documents = higher confidence
        base_confidence = min(0.95, 0.6 + (len(documents) * 0.15))
        return base_confidence
    
    def _get_source_summary(self, documents: List[KnowledgeDocument]) -> Dict[str, int]:
        """Count documents by source"""
        summary = {}
        for doc in documents:
            source = doc.source.value
            summary[source] = summary.get(source, 0) + 1
        return summary
    
    def add_document(self, document: KnowledgeDocument):
        """Add document to knowledge base"""
        self.documents[document.document_id] = document
    
    def get_document(self, doc_id: str) -> Optional[KnowledgeDocument]:
        """Retrieve document by ID"""
        return self.documents.get(doc_id)
    
    def search_documents(
        self,
        query: str,
        vertical: Optional[str] = None
    ) -> List[KnowledgeDocument]:
        """Search documents by query"""
        results = []
        query_lower = query.lower()
        
        for doc in self.documents.values():
            # Filter by vertical if specified
            if vertical and doc.vertical != vertical:
                continue
            
            # Simple keyword matching
            if query_lower in doc.content.lower() or query_lower in doc.title.lower():
                results.append(doc)
        
        return results
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get knowledge base statistics"""
        return {
            "total_documents": len(self.documents),
            "total_policies": len(self.policies),
            "total_playbooks": len(self.playbooks),
            "total_wisdom": len(self.founder_wisdom),
            "vertical": self.vertical,
            "last_updated": datetime.now().isoformat(),
        }


def context_to_text(context: KnowledgeContext) -> str:
    """Convert knowledge context to readable text for injection into response"""
    lines = []
    
    # Add relevant policies
    if context.relevant_policies:
        lines.append("\n📋 GUIDING PRINCIPLES:")
        for policy in context.relevant_policies[:2]:
            lines.append(f"• {policy}")
    
    # Add playbook if available
    if context.relevant_playbook_steps:
        lines.append("\n📋 RECOMMENDED APPROACH:")
        for step in context.relevant_playbook_steps[:2]:
            lines.append(step)
    
    return "\n".join(lines)
