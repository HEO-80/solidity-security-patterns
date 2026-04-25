# 01 — Reentrancy Attack 🔴 Critical

## What is it?

A reentrancy attack happens when an external contract calls back into your contract
before your first execution finishes. If your state hasn't been updated yet,
the attacker can drain funds repeatedly in a single transaction.

## How the attack works
Attacker.attack()
→ bank.deposit(1 ETH)
→ bank.withdraw()
→ sends ETH to Attacker
→ Attacker.receive() fires
→ bank.withdraw() again  ← re-enters before balance is zeroed
→ sends ETH again
→ loops until bank is empty

## The vulnerable code

```solidity
function withdraw() external {
    uint256 amount = balances[msg.sender];
    require(amount > 0, "Nothing to withdraw");

    (bool success, ) = msg.sender.call{value: amount}(""); // ❌ external call first
    require(success, "Transfer failed");

    balances[msg.sender] = 0; // ❌ state update too late
}
```

## The fix

Two layers of protection — defense in depth:

**Fix 1 — Checks-Effects-Interactions (CEI) pattern:**
Zero the balance BEFORE the external call.

```solidity
balances[msg.sender] = 0;                          // ✅ state first
(bool success, ) = msg.sender.call{value: amount}(""); // then transfer
```

**Fix 2 — OpenZeppelin ReentrancyGuard:**
The `nonReentrant` modifier locks the function at the EVM level.
Even if CEI is accidentally broken, re-entry is blocked.

## Real hack

**The DAO — 2016 — $60M lost**

The attacker exploited the exact pattern above on a decentralized fund.
The Ethereum community had to hard-fork the chain to recover funds.
This is the exploit that split Ethereum and Ethereum Classic.

## Test results
01 - Reentrancy Attack
VulnerableBank
✅ allows an attacker to drain the bank via reentrancy
SecureBank
✅ blocks the reentrancy attack — exploit reverts

## Key rule

> **Always follow Checks → Effects → Interactions.**
> Never make external calls before updating your state.
