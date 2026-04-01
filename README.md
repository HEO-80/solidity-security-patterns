<div align="center">

<br/>

# 🛡️ Solidity Security Patterns

### Know the attack. Write the fix. Ship with confidence.

A practical reference of the most critical smart contract vulnerabilities —
each with a vulnerable version, a secure fix, and a full test suite that proves it works.

<br/>

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.x-f7df1e?style=for-the-badge)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.x-4e5ee4?style=for-the-badge&logo=openzeppelin&logoColor=white)](https://openzeppelin.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-c792ea?style=for-the-badge)](LICENSE)

<br/>

> **80% of DeFi hacks come from smart contract vulnerabilities.**
> This repo shows exactly what they look like — and how to stop them.

<br/>

</div>

---

## 💼 Looking to hire?

If you need someone who understands not just *how* to write smart contracts,
but *how they get exploited* — you're in the right place.

- 🔍 **Security-focused development** — every contract I write follows the patterns in this repo
- 🧪 **Exploit testing** — I write tests that simulate real attacks, not just happy paths
- 📋 **Mini audits** — structured review against a production-grade checklist
- ⚡ **DeFi & MEV experience** — flash loans, arbitrage, and on-chain attack vectors

> 📩 Available for freelance work — [Upwork](#) · [Fiverr](#) · [LinkedIn](https://linkedin.com/in/hectorob)

---

## 🎯 Who is this for?

| Profile | Why this helps |
|---------|---------------|
| **Solidity developers** | Learn attack patterns before you ship vulnerable code |
| **DeFi founders** | Understand what an auditor looks for in your contracts |
| **Web3 students** | The most practical security reference you'll find |
| **Clients hiring devs** | Use the checklist to evaluate who you hire |

---

## ⚠️ Vulnerability Patterns Covered

| # | Pattern | Risk Level | Status |
|---|---------|------------|--------|
| 01 | [Reentrancy Attack](./contracts/01-reentrancy/) | 🔴 Critical | ✅ Done |
| 02 | [Integer Overflow / Underflow](./contracts/02-integer-overflow/) | 🔴 Critical | ✅ Done |
| 03 | [Access Control Failure](./contracts/03-access-control/) | 🔴 Critical | ✅ Done |
| 04 | [Front-Running](./contracts/04-front-running/) | 🟠 High | ✅ Done |
| 05 | [Gas Griefing](./contracts/05-gas-griefing/) | 🟠 High | ✅ Done |
| 06 | [Flash Loan Attack](./contracts/06-flash-loan-attack/) | 🔴 Critical | ✅ Done |
| 07 | [Unchecked Return Values](./contracts/07-unchecked-return/) | 🟠 High | ⏳ Soon |
| 08 | [Timestamp Dependence](./contracts/08-timestamp-dependence/) | 🟡 Medium | ⏳ Soon |
| 09 | [Delegatecall Injection](./contracts/09-delegatecall/) | 🔴 Critical | ⏳ Soon |
| 10 | [Oracle Manipulation](./contracts/10-oracle-manipulation/) | 🔴 Critical | ⏳ Soon |

---

## 🗂️ Structure per Pattern

Each vulnerability folder contains exactly three files:
```
01-reentrancy/
├── Vulnerable.sol      # The broken contract — DO NOT use in production
├── Secure.sol          # The fixed version with explanation comments
└── README.md           # What the attack is, how it works, how to fix it
```

And in `/test`:
```
test/
└── 01-reentrancy.test.js   # Simulates the actual exploit, then proves the fix
```

---

## 🧰 Tech Stack

<div align="center">

<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
<img src="https://img.shields.io/badge/Hardhat-f7df1e?style=for-the-badge&logoColor=black"/>
<img src="https://img.shields.io/badge/OpenZeppelin-4e5ee4?style=for-the-badge&logo=openzeppelin&logoColor=white"/>
<img src="https://img.shields.io/badge/Ethers.js-2535a0?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Mocha-8d6748?style=for-the-badge&logo=mocha&logoColor=white"/>
<img src="https://img.shields.io/badge/Chai-a30701?style=for-the-badge"/>

</div>

---

## ⚙️ Setup
```bash
git clone https://github.com/HEO-80/solidity-security-patterns.git
cd solidity-security-patterns
npm install
npx hardhat test
```

---

## 📋 Audit Checklist

A production-grade checklist based on the patterns in this repo.
Use it before deploying any contract to mainnet.

→ [View CHECKLIST.md](./CHECKLIST.md)

---

## 📖 Deep Dives

- [PATTERNS.md](./PATTERNS.md) — Full explanation of every attack vector with real hack examples
- [EXPLANATION.md](./EXPLANATION.md) — Why smart contract security is fundamentally different from web2

---

## 🔴 Real Hacks Referenced

| Protocol | Year | Vulnerability | Lost |
|----------|------|---------------|------|
| The DAO | 2016 | Reentrancy | $60M |
| Poly Network | 2021 | Access Control | $611M |
| Cream Finance | 2021 | Flash Loan + Oracle | $130M |
| Nomad Bridge | 2022 | Unchecked Return | $190M |
| Euler Finance | 2023 | Flash Loan Logic | $197M |

> These weren't theoretical. They happened. The patterns are documented here.

---

## 👤 Author

**Héctor Oviedo** — Full Stack Developer & DeFi Researcher

[![GitHub](https://img.shields.io/badge/GitHub-HEO--80-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/HEO-80)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-hectorob-0077b5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/hectorob)

---

## 📄 License

MIT — use it, learn from it, don't deploy the vulnerable contracts.

[![License: MIT](https://img.shields.io/badge/License-MIT-c792ea?style=for-the-badge)](LICENSE)

---

<div align="center">

*Vulnerable. Fixed. Tested. That's the only way to learn security.*

</div>