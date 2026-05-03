# Prompts, Spec, and Implementation Plan

## User Spec

Build a mission-critical Incident Management System that ingests high-volume signals, debounces related failures, persists raw and structured data separately, alerts responders by component strategy, and provides a workflow UI with mandatory RCA before closure.

## Plan

1. Create a single repository with `/backend` and `/frontend`.
2. Implement async ingestion with rate limiting, bounded queue backpressure, debouncing, retrying writes, health checks, and throughput metrics.
3. Store raw signal payloads in an append-only data lake and structured work items/RCA records in transactional SQLite.
4. Maintain a hot-path dashboard cache and timeseries aggregation sink.
5. Implement alerting with the Strategy pattern and lifecycle transitions with State-pattern classes.
6. Build a React dashboard with active incident feed, detail view, raw signal inspection, status transitions, and RCA form.
7. Add sample outage simulation, Docker Compose, and focused backend tests.

## Backpressure Notes

The ingestion endpoint never performs slow persistence directly. It validates the request, applies a token-bucket limiter, and enqueues into a bounded queue. When the queue is full, it returns `503 Service Unavailable`, making overload explicit and recoverable.

