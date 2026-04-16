# ⚡ Glovo AI · Arquitectura de Triggers Asíncronos

> **Práctica 3 — Automatización con Inteligencia Artificial**  
> *Propuesta técnica comparativa: Evento vs Cron vs Polling para flujos en tiempo real y batch en operaciones de delivery.*

[![IA](https://img.shields.io/badge/IA-Gemini%2FQwen-8E75B2)](https://ai.google.dev/)
[![Arquitectura](https://img.shields.io/badge/Arquitectura-Event--Driven%20%26%20Batch-blue)](#)
[![Idempotencia](https://img.shields.io/badge/Idempotencia-Robust-green)](#)
[![Latencia](https://img.shields.io/badge/Latencia-%3C2s%20%7C%20%3C2h-yellow)](#)
[![Académico](https://img.shields.io/badge/Módulo-Automatización%20IA-purple)](#)

---

## 📖 Descripción del Proyecto

Este repositorio documenta el diseño arquitectónico para automatizar dos flujos operativos críticos en **Glovo**:

| Flujo | Objetivo | Trigger Seleccionado | Latencia Objetivo |
|-------|----------|---------------------|-------------------|
| **A · Tiempo Real** | Respuesta inmediata a incidencias (pedidos retrasados, entregas fallidas, reclamaciones) | 🔄 Evento asíncrono (Webhook + Message Broker) | `< 2 segundos` |
| **B · Batch Diario** | Consolidación de métricas e informes por zona para operaciones | ⏰ Cron programado (Scheduler) | Ventana `03:00 - 04:00 UTC` |

La propuesta justifica técnicamente la selección de triggers, define estrategias de idempotencia robustas y mitiga riesgos operativos mediante patrones de arquitectura distribuida.

---

## 🗺️ Arquitectura de Flujos

### 🔵 Flujo A — Respuesta Inmediata (Event-Driven)

```mermaid
graph LR
    A[App/Sistema Logístico] -->|Evento: delivery_delayed| B[Message Broker Kafka/Pulsar]
    B --> C[Worker Consumer]
    C --> D{Validación Idempotencia}
    D -->|Nueva| E[Procesar: Reasignar/Notificar/Reembolsar]
    D -->|Duplicada COMPLETED| F[Descartar silenciosamente]
    D -->|Duplicada FAILED| G[Reejecutar con mismo payload]
    E --> H[CRM / Notificaciones / Pagos]
    H --> I[Ack + Registro en Redis]
    
    style D fill:#f9f,stroke:#333
    style E fill:#9f9,stroke:#333
