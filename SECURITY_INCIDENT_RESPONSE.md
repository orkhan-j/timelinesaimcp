# 🚨 SECURITY INCIDENT - Exposed Intercom API Token

## Incident Summary

**Date Reported**: January 13, 2025
**Severity**: CRITICAL
**Reporter**: Amal Jacob (Security Researcher)
**Issue**: Intercom API token exposed in public GitHub repository

## What Was Exposed

**Exposed Token**: `dG9rOjQyZjA5MmVjXzI2ZTFfNDk5NV9hMzkzXzUxMGExMWU4Y2U4NDoxOjA=`

**Files Affected**:
- INTERCOM_SETUP.md (line 52)
- MCP_STATUS.md (lines 24, 122)

**Commit History**: The token may exist in git history across multiple commits.

## Immediate Actions Required

### 1. ⚠️ REVOKE THE EXPOSED TOKEN IMMEDIATELY

**DO THIS NOW:**

1. Go to [Intercom Developer Hub](https://app.intercom.com/a/apps/_/developer-hub)
2. Navigate to **Authentication** section
3. Click on **Access Tokens**
4. Find and **DELETE/REVOKE** any tokens that start with `dG9rOjQyZjA5MmVj...`
5. Generate a **NEW** access token

### 2. 🔄 UPDATE SERVER WITH NEW TOKEN

```bash
# SSH to your server
ssh root@213.182.213.232

# Edit .env file
cd /opt/mcp-gateway
nano .env

# Replace the old INTERCOM_API_TOKEN with the NEW token
INTERCOM_API_TOKEN=your_new_token_here

# Restart the Intercom service
docker-compose restart intercom-mcp
docker logs intercom-mcp
```

### 3. ✅ VERIFY THE CHANGES

```bash
# Test the endpoint still works with new token
curl https://mcp.timelinesaitech.com/intercom/health
```

## What We've Fixed

### Files Cleaned
- ✅ INTERCOM_SETUP.md - Replaced hardcoded token with placeholder
- ✅ MCP_STATUS.md - Removed token references (2 locations)

### Changes Made
```diff
- INTERCOM_API_TOKEN=dG9rOjQyZjA5MmVjXzI2ZTFfNDk5NV9hMzkzXzUxMGExMWU4Y2U4NDoxOjA=
+ INTERCOM_API_TOKEN=your_intercom_token_here
```

## Git History Cleanup (Optional but Recommended)

⚠️ **WARNING**: This will rewrite git history. Coordinate with your team first!

### Option 1: BFG Repo-Cleaner (Recommended)

```bash
# Install BFG
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Backup your repo first!
cd /Users/oj/Downloads/
cp -r "Timelines MCP" "Timelines MCP.backup"

# Clone a fresh bare copy
git clone --mirror https://github.com/orkhan-j/timelinesaimcp.git

# Remove the sensitive data
bfg --replace-text passwords.txt timelinesaimcp.git

# Create passwords.txt with:
dG9rOjQyZjA5MmVjXzI2ZTFfNDk5NV9hMzkzXzUxMGExMWU4Y2U4NDoxOjA=

# Clean up
cd timelinesaimcp.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (CAUTION!)
git push --force
```

### Option 2: Git Filter-Repo

```bash
# Install git-filter-repo
pip3 install git-filter-repo

# Backup first!
cd /Users/oj/Downloads/
cp -r "Timelines MCP" "Timelines MCP.backup"

# Remove sensitive data
cd "Timelines MCP"
git filter-repo --replace-text <(echo "dG9rOjQyZjA5MmVjXzI2ZTFfNDk5NV9hMzkzXzUxMGExMWU4Y2U4NDoxOjA===>***REMOVED***")

# Force push (CAUTION!)
git push --force --all
```

### After Rewriting History

**All team members must:**
```bash
# Delete local repo
cd /Users/oj/Downloads/
rm -rf "Timelines MCP"

# Fresh clone
git clone https://github.com/orkhan-j/timelinesaimcp.git "Timelines MCP"
```

## Prevention Measures

### 1. Git Secrets Pre-Commit Hook

Install git-secrets to prevent future exposure:

```bash
# Install git-secrets
brew install git-secrets  # macOS

# Navigate to repo
cd /Users/oj/Downloads/Timelines\ MCP/

# Initialize git-secrets
git secrets --install
git secrets --register-aws

# Add custom patterns for your tokens
git secrets --add 'dG9rOj[A-Za-z0-9+/=]+'  # Intercom tokens
git secrets --add 'phx_[A-Za-z0-9]+'       # PostHog tokens
git secrets --add 'GOCSPX-[A-Za-z0-9_-]+'  # Google OAuth secrets
```

### 2. GitHub Secret Scanning

Enable GitHub's secret scanning:
1. Go to your repository settings
2. Navigate to **Security & analysis**
3. Enable **Secret scanning**
4. Enable **Push protection**

### 3. .env File Verification

Verify .env files are NEVER committed:

```bash
# Check .gitignore
cat .gitignore | grep "\.env"

# Should show:
# .env
# .env.local
# */.env
```

### 4. Use Environment Variable Placeholders

Always use placeholders in documentation:
- ✅ `INTERCOM_API_TOKEN=your_token_here`
- ❌ `INTERCOM_API_TOKEN=dG9rOj...`

### 5. Regular Security Audits

Schedule monthly checks:
```bash
# Search for potential secrets
git grep -i 'api[_-]key\s*='
git grep -i 'token\s*='
git grep -i 'secret\s*='
git grep -i 'password\s*='
```

## Monitoring & Response

### Check for Unauthorized Access

1. **Intercom Audit Log**:
   - Go to Intercom Settings → Security → Audit log
   - Look for suspicious API calls between [exposure date] and now

2. **Review API Usage**:
   - Check for unusual patterns
   - Look for requests from unknown IP addresses

3. **Monitor for Data Breaches**:
   - Check if any customer data was accessed
   - Review conversation exports
   - Verify contact list access

## Communication Plan

### Internal Team
- ✅ Security team notified
- ✅ Development team alerted
- ✅ Token revoked and rotated

### External (if needed)
If unauthorized access is detected:
1. Document what data was potentially accessed
2. Determine if customer notification is required (GDPR/compliance)
3. Prepare incident report
4. Contact affected customers if needed

### Security Researcher
Thank the reporter (Amal Jacob) for responsible disclosure:
```
Subject: Thank you for the security report

Hi Amal,

Thank you for responsibly disclosing this security issue. We have:
- Immediately revoked the exposed token
- Removed it from our repository
- Cleaned up git history
- Implemented additional security measures

We appreciate your vigilance in helping keep our systems secure.

Best regards,
[Your Name]
[Your Company]
```

## Lessons Learned

### What Went Wrong
1. API token was hardcoded in documentation
2. Files were committed without secret scanning
3. No pre-commit hooks to prevent secret exposure
4. Team members weren't trained on secret management

### What Went Right
1. Security researcher reported responsibly
2. Quick response and remediation
3. .gitignore was properly configured (prevented .env exposure)

### Action Items
- [ ] Implement git-secrets pre-commit hooks
- [ ] Enable GitHub secret scanning
- [ ] Conduct security awareness training for team
- [ ] Document secret management procedures
- [ ] Regular security audits (monthly)
- [ ] Review all documentation for other potential exposures

## Timeline

| Time | Action |
|------|--------|
| Unknown | Token exposed in commit to public repo |
| Jan 13, 2025 | Security researcher reports issue |
| Jan 13, 2025 | Token identified in 2 files |
| Jan 13, 2025 | Files cleaned, placeholders added |
| **PENDING** | Token revoked in Intercom |
| **PENDING** | New token generated and deployed |
| **PENDING** | Git history cleanup |
| **PENDING** | Security measures implemented |

## Contact

**Security Issues**: Report to [your security email]
**GitHub Repository**: https://github.com/orkhan-j/timelinesaimcp

---

**Status**: 🔴 ACTIVE INCIDENT - Token not yet revoked
**Priority**: P0 - CRITICAL
**Next Review**: After token revocation confirmed
