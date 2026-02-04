# Changelog

All notable changes to the Deluthium Ecosystem Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-04

### Added
- Hummingbot Market Maker WebSocket connector (`hummingbot-mm`)
- Docker Compose profiles for selective service startup
- API Monitor authentication middleware with rate limiting
- Comprehensive API Reference documentation
- Resource limits for all containers
- Health checks for portal, api-monitor, postgres, and redis services

### Changed
- Pinned all Docker base images to specific versions
- Secured database credentials (no default passwords)
- Redis now requires authentication
- PostgreSQL and Redis ports no longer exposed by default

### Security
- JWT token input is now silent in setup script
- Environment file permissions set to 600
- Added input validation for CCXT container
- Implemented constant-time comparison for API keys

## [1.0.0] - 2026-02-04

### Added
- Initial release of Deluthium Ecosystem Hub
- CCXT development environment with Python, TypeScript, PHP support
- Hummingbot trading bot integration
- 0x Protocol v4 RFQ adapter
- 1inch Limit Order V4 adapter
- Market Maker example (Go)
- Market Maker Portal (Next.js)
- API Monitor service
- One-click Docker Compose setup
- Interactive setup script
- Comprehensive documentation

### Supported Chains
- BSC Mainnet (Chain ID: 56)
- Base Mainnet (Chain ID: 8453)

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.1.0 | 2026-02-04 | Security hardening, Hummingbot MM mode |
| 1.0.0 | 2026-02-04 | Initial release |
