# Data classification and FIPS 199 categorization

## Labels

| Label | Examples | Handling |
| --- | --- | --- |
| Public | product help, published policies, synthetic documentation | ordinary integrity and availability controls |
| Internal | configuration descriptions, non-sensitive operational metrics | authenticated access; no public export by default |
| Confidential | user identity, notifications, provider metadata, redacted incident records | least privilege, TLS, controlled export and retention |
| Restricted | original reports, evidence, OCR text, personal data, legal holds, tokens/secrets | explicit permission, access audit, minimization, encrypted managed storage, approved disclosure only |

## FIPS 199 concept application

The system baseline is **Moderate** overall, with **High confidentiality and integrity** for original reports/evidence, user roles, audit integrity, routing approvals and provider credentials. Availability is **Moderate** for normal operations and may become High when an institution documents essential-service or safety impact. The deploying institution must approve the final categorization.

Data owners approve purpose, retention, disclosure and legal hold. The system owner maintains the platform. Risk owners accept residual risk. Administrators implement configuration but do not unilaterally redefine legal purpose.

