**Persona:**
You are a senior full-stack security engineer with 10+ years experience auditing and hardening production web applications. You specialize in Content Security Policy (CSP), web security standards, and refactoring legacy UI code to comply with modern browser security requirements. You write clean, maintainable, production-grade code and explain your reasoning clearly.

**Objective:**
Perform a **full audit, identification, and remediation** of all CSP-related issues across the entire website (both admin and client sides), specifically resolving the following recurring error:

> "Executing inline event handler violates the following Content Security Policy directive 'script-src-attr 'self''. Either the 'unsafe-inline' keyword, a hash ('sha256-...'), or a nonce ('nonce-...') is required to enable inline execution."

This error is currently causing **broken UI actions** including:

* Buttons not functioning
* Form submissions blocked
* Product interactions failing
* Admin actions unresponsive
* Client-side cart interactions broken
* Misc features failing silently due to CSP restrictions

**High-Level Requirements:**

1. **Scan the entire codebase** (all templates, scripts, components, assets) for CSP violations.
2. Identify every instance of:

   * inline event handlers (`onclick`, `onchange`, etc.)
   * embedded `<script>` tags
   * inline JavaScript attributes
   * inline style attributes tied to JS execution
   * script injection points from libraries
   * dynamically inserted scripts with no nonce
3. Implement a **complete and future-proof fix**, using one of these strategies (whichever is best fit):

   * Centralize event handlers into external scripts with addEventListener()
   * Refactor components to use delegated event listeners
   * Remove inline behavior entirely
   * Implement nonce-based CSP
   * Implement hash-based CSP (rare, only if needed)
4. Avoid using **unsafe-inline**, unless absolutely necessary as a temporary fallback.
5. Ensure the fix **supports all existing site functionality**, including:

   * Admin panel actions
   * Product CRUD operations
   * Shop interactions (add to cart, filters, pagination)
   * Authentication
   * Responsive UI behavior

---

## 🔍 **Scope of Audit**

You must review AND fix CSP issues on **all pages, components, and flows**, specifically:

### Client Side:

* Home page
* Product listing pages
* Filters, pagination, search
* Product detail pages
* Add to cart
* Checkout interactions
* Navigation + modals
* Cart side drawer

### Admin Side:

* Login page
* Dashboard
* Products table
* Category management
* Order management
* Product creation/edit forms
* Image upload tools

### Cross-Cutting:

* Reusable components
* Buttons, icons, tooltips
* Form validation handlers
* Image handlers
* Search bars
* Pagination controls

This must include **desktop and mobile versions**.

---

## 🛠️ **Technical Expectations**

You must:

1. Remove all inline JS safely.
2. Replace inline handlers with:

   * external script modules
   * modular functions and/or classes
   * delegated listeners where appropriate
3. Update templates accordingly.
4. Ensure event binding works after DOM mutations.
5. Modularize scripts to prevent regressions.
6. Maintain or improve UX.

---

## 📄 Deliverables

### 1. Full Audit Report (Brief)

* List of all affected files
* Type of violation
* Root cause
* Severity + impact

### 2. Full Remediation Plan

* Architecture changes
* Code organization strategy
* CSP strategy + configuration

### 3. Complete Code Fixes

* Updated HTML files (if needed)
* Updated JS files
* New utility modules/components

### 4. Updated **CSP Headers**

Example expectations:

* No unsafe-inline
* No unsafe-eval
* Nonce or hash strategy documented
* Script consolidation

### 5. Regression Testing Plan

* Pages to test
* Features to verify
* Expected behavior

---

## ⚠️ Non-Negotiable Requirements

* Existing features must still work
* Buttons must work everywhere
* Forms must submit correctly
* No visible breakage or UX regression
* No console errors or warnings after fix
* Code must be maintainable
* No hacky workarounds

---

## 🔬 Testing Expectations

After implementation, verify that:

* No CSP violations appear in the console
* All interactive elements function correctly
* Admin workflows are stable
* Client-side workflows are stable
* Mobile UI remains unaffected

---

## 📦 Repository Structure Assumption

Assume typical structure (adjust as needed):

```
/admin
  /pages
  /components
  /scripts

/client
  /pages
  /components
  /scripts

/public
  assets, css, icons, js
```

Detect missing or inconsistent organization
and correct where appropriate.

---

## 📈 Performance Considerations

* No large JS bundles
* No blocking scripts
* Defer or async where capacity exists
* Avoid regressions in load time

---

## ☑️ Acceptance Criteria

The issue:

> "Executing inline event handler violates CSP…"

must be fully eliminated across the entire website.

The site must function normally for all actions.

The fix must be **scalable, secure, and maintainable**.

---

## 🧠 Final Output

Provide:

1. Audit summary
2. Proposed architecture and changes
3. File-by-file patches or unified diff
4. Full updated CSP header
5. Manual testing plan

When ready, begin remediation.


Note: do this in a new branch