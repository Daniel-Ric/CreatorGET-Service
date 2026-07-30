# Security Policy

## Project
CreatorGET-Service  
Repository: https://github.com/Daniel-Ric/CreatorGET-Service

---

## Supported Versions

Security fixes are provided for the current `master` branch. Forks and modified copies are not directly supported, but upstream reports are still welcome.

---

## What Is Considered a Security Issue

Please report issues that could affect the confidentiality, integrity, or availability of users, local data, or systems, including:

- command or terminal escape-sequence injection
- unsafe export paths, path traversal, or unintended file overwrite
- arbitrary code execution or unsafe process invocation
- secrets or private environment values exposed in code, logs, cache files, or exports
- malformed remote data that causes a realistic crash, excessive allocation, or persistent cache corruption
- validation failures that allow remote values to escape expected formats or trust boundaries
- insecure defaults likely to put user data or systems at risk

## Out of Scope

The following are generally not security vulnerabilities:

- typos, documentation issues, or normal CLI usability bugs
- public Minecraft Marketplace creator information being visible as intended
- theoretical attacks without a practical path or impact
- extremely high request volumes outside normal tool usage
- third-party dependency advisories that are not reachable in this project
- issues that require a fully trusted local user to deliberately modify their own files

---

## How To Report a Vulnerability

**Do not open a public GitHub issue with exploit details.**

Preferred private contact:

`discord.com/users/252138923952832523`

If private contact is not possible, open an issue titled `SECURITY:` with a way to contact you, but do not include exploit details, secrets, or proof-of-concept payloads publicly.

Include:

- the affected file, command, or workflow
- exact reproduction steps
- expected and actual behavior
- potential impact
- a minimal proof of concept, if safe

---

## Disclosure Policy

- Allow reasonable time to investigate and release a fix before public disclosure.
- Do not access, alter, or publish data that you do not own.
- Testing must use your own local environment and files.
- Public credit can be provided on request; anonymous reports are also respected.

---

## Handling of Leaked Secrets

If you discover a credential, token, or private value:

1. Report it privately.
2. Do not copy it into issues, pull requests, screenshots, or chat logs.
3. The affected value will be revoked or rotated and repository history cleaned if necessary.

---

## Security Practices in This Project

- Remote creator data is treated as untrusted input.
- Cache and export paths should remain explicit and bounded.
- Secrets and private environment files must not be committed.
- Network and filesystem failures should be handled without unsafe fallback behavior.
- Dependencies should be kept reasonably current.

---

## Proof-of-Concept Testing

Proofs of concept are allowed only against environments, files, and accounts you own. Do not target unrelated Minecraft, Microsoft, Mojang, PlayFab, creator, or user infrastructure.

Thank you for helping keep CreatorGET-Service safe.
