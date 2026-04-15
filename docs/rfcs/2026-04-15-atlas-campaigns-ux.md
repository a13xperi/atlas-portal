# Briefing: Atlas Campaign-First UX (Content-to-Thread)

## Executive Summary
The Atlas Campaign-First UX initiative, as outlined in the RFC dated April 15, 2026, aims to transform the content creation process for financial analysts. By shifting from a single-post mindset to a "Campaign-First" architecture, the platform enables the conversion of long-form reports and articles into sequenced, high-impact threads for X (formerly Twitter). The core value proposition lies in its ability to not only split text but to "re-craft" insights through specific analyst voice profiles while maintaining rigorous crypto-specific compliance standards. This document details the technical requirements, user interface components, and strategic differentiators that define the Atlas MVP.

## Strategic Themes and Analysis

### 1. Analyst-Centric Workflow and Voice Customization
The Atlas platform distinguishes itself from generic thread-splitting tools by focusing on the "Analyst-First Workflow." Rather than simply dividing a document into smaller chunks, the system uses "voice profiles" to re-craft content into specific narrative angles, such as:
*   **Contrarian:** Challenging market consensus.
*   **Data:** Leading with quantitative insights.
*   **Prediction:** Offering forward-looking market outlooks.

This ensures that the output feels like the work of a professional analyst rather than a machine-generated summary.

### 2. Integrated Crypto Compliance
A central pillar of the Atlas architecture is a sophisticated compliance engine. Given the regulated nature of financial analysis, the system includes:
*   **Sentiment Detection:** An Oracle-driven analysis that labels content as Bullish, Bearish, or Neutral.
*   **NFA Detection:** Automatic scanning for "Not Financial Advice" (NFA) disclosures, which are mandatory when bullish or bearish sentiments are detected.
*   **Manual Oversight:** To maintain compliance integrity, the RFC explicitly forbids "auto-posting" based on sentiment; a human must always "push the button."

### 3. Real-Time Market Integration
Unlike static content tools, Atlas provides "On-Chain Context." This feature links tweet drafts directly to live Atlas alerts and momentum signals. This ensures that the content is not only well-written but also backed by real-time, verifiable market data, providing a tangible "Atlas Edge" in the information-dense crypto landscape.

---

## Technical Infrastructure

### API Specifications
The backend infrastructure is designed to handle bulk operations and sequence management through specific endpoints under `api.campaigns`.

| Endpoint | Method | Purpose | Key Parameters |
| :--- | :--- | :--- | :--- |
| `/api/campaigns/batch-generate` | POST | Converts a report/PDF into multiple drafts. | `content`, `sourceType`, `blendId` |
| `/api/campaigns/:id/reorder` | PATCH | Updates the sequence of drafts within a campaign. | `orderedDraftIds` |
| `/api/campaigns/:id/publish` | POST | Queues or publishes all approved drafts in order. | `publishNow`, `delayMinutes` |
| `/api/campaigns/:id/compliance` | GET | Scans for crypto-specific risks (NFA, disclosures). | N/A (Returns warnings/disclaimers) |

### Frontend Component Architecture
The user interface is structured to facilitate a seamless transition from raw content to a polished thread. Key components include:

*   **CampaignSequencer.tsx:** Utilizes a drag-and-drop interface (via dnd-kit) to allow analysts to physically order their narrative.
*   **ThreadPreview.tsx:** Provides a mobile-first interactive preview of how the thread will appear to X users.
*   **SentimentBadge.tsx:** A visual indicator of the Oracle’s content analysis (Bullish/Bearish/Neutral).
*   **ComplianceOverlay.tsx:** A mandatory modal/banner that acts as a gatekeeper, triggering if required disclosures are missing prior to publication.

---

## Key Quotes and Contextual Significance

> **"Atlas doesn't just split text; it re-crafts insights into specific angles (Contrarian, Data, Prediction) based on the analyst's voice profile."**
*   *Significance:* This highlights the platform’s primary differentiator against competitors like Typefully. It emphasizes the AI's role as a creative partner rather than a simple formatting tool.

> **"AI must not have 'the button' for compliance reasons."**
*   *Significance:* This is a critical philosophical and legal boundary for the project. It confirms that while the AI assists in drafting, human accountability remains the final check in the publishing process.

> **"Directly links drafts to live Atlas alerts and momentum signals, ensuring content is always backed by real-time market data."**
*   *Significance:* This underscores the integration of the "Atlas Edge," moving the tool beyond a CMS and into a data-driven content engine.

---

## Scope and Roadmap (MVP Constraints)

The RFC establishes clear boundaries for the Version 1 (v1) release to ensure a focused and stable product.

### In-Scope for MVP
*   **Platform Focus:** Exclusive support for X (Twitter).
*   **Content Type:** Text-based threads only.
*   **Core Feature:** Durable campaign structures and thread sequencing.

### Out-of-Scope (What NOT to Build in v1)
*   **Automated Posting:** No AI-driven "auto-posting" based on sentiment triggers.
*   **Multimedia:** Support for images and video threads is deferred.
*   **Cross-Platform Expansion:** No support for Threads or Farcaster in the initial release.

---

## Actionable Insights

*   **Prioritize Voice Profile Accuracy:** The success of the "re-crafting" feature depends on the system's ability to distinguish between "Contrarian" and "Data" voice profiles.
*   **Mandatory Compliance Gates:** The `ComplianceOverlay` and `NFA detection` must be non-negotiable features, as they represent the primary risk-mitigation strategy for regulated analysts.
*   **Efficiency in Bulk Operations:** The `batch-generate` and `reorder` endpoints are the backbone of the "Campaign-First" UX; their performance and reliability will determine the tool's adoption among high-volume analysts.
*   **Mobile-First Design:** Given that `ThreadPreview.tsx` is mobile-first, the content creation process must ensure that insights remain readable and impactful on small screens.