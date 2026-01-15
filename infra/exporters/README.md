# Infrastructure Exporters

This directory contains configuration files for infrastructure exporters used in the development environment.

## Exporters

- **Redis Exporter**: Monitors Redis metrics (memory, operations, connections)
- **PostgreSQL Exporter**: Monitors database metrics (connections, queries, locks)
- **Node Exporter**: Monitors system metrics (CPU, memory, disk)

## Usage

Exporters are automatically configured in `docker-compose.dev.yml` and do not require manual configuration files in most cases.

If custom configuration is needed, add YAML files here and reference them in the docker-compose services.
