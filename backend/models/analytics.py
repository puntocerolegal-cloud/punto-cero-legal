"""Modelos de Analytics — Punto Cero OS.

SOLO contrato de respuesta (no hay colección 'analytics' en MongoDB).
Analytics es una capa de lectura que agrega organizations, partners,
implementations, os_subscriptions y billing en tiempo real.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class AnalyticsMetrics(BaseModel):
    totalOrganizations: int = 0
    totalPartners: int = 0
    totalImplementations: int = 0
    totalSubscriptions: int = 0
    activeSubscriptions: int = 0
    MRR: float = 0
    ARR: float = 0
    monthlyRevenue: float = 0
    totalRevenue: float = 0
    averageTicket: float = 0
    collectionRate: float = 0
    implementationsCompleted: int = 0
    goLivesThisMonth: int = 0
    conversionRate: float = 0
    growthRate: float = 0


class RevenueAnalytics(BaseModel):
    MRR: float = 0
    ARR: float = 0
    monthlyRevenue: float = 0
    totalRevenue: float = 0
    averageTicket: float = 0
    collectionRate: float = 0
    accountsReceivable: float = 0
    revenueByVertical: List[Dict[str, Any]] = Field(default_factory=list)
    paymentMethods: List[Dict[str, Any]] = Field(default_factory=list)


class GrowthAnalytics(BaseModel):
    newOrganizations: int = 0
    newPartners: int = 0
    newImplementations: int = 0
    newSubscriptions: int = 0
    growthTrend: List[Dict[str, Any]] = Field(default_factory=list)
    growthPercentage: float = 0


class VerticalPerformance(BaseModel):
    name: str
    organizations: int = 0
    revenue: float = 0
    subscriptions: int = 0
    implementations: int = 0
    growth: float = 0
    conversionRate: float = 0
    health: str = "normal"


class ExecutiveInsights(BaseModel):
    topRevenueVertical: Optional[str] = None
    fastestGrowingVertical: Optional[str] = None
    bestConversionVertical: Optional[str] = None
    highestMRRVertical: Optional[str] = None
    highestRiskVertical: Optional[str] = None
    risks: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class FunnelMetrics(BaseModel):
    leads: int = 0
    implementations: int = 0
    subscriptions: int = 0
    customers: int = 0
    activeOrganizations: int = 0
    stages: List[Dict[str, Any]] = Field(default_factory=list)


class AnalyticsDashboardResponse(BaseModel):
    metrics: AnalyticsMetrics
    revenue: RevenueAnalytics
    growth: GrowthAnalytics
    verticals: List[VerticalPerformance]
    insights: ExecutiveInsights
    funnel: FunnelMetrics
