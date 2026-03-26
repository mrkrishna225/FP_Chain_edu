// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";
import "./AuditLog.sol";

/**
 * FeeVault.sol — NEW contract (Phase 2)
 *
 * Collects the fee when a teacher updates an answer sheet after an exam.
 * The fee is charged in ETH from the teacher's wallet via MetaMask.
 *
 * Fee: 0.001 ETH per answer-sheet update
 * Admin can withdraw accumulated fees.
 */
contract FeeVault {

    RoleManager public roleManager;
    AuditLog    public auditLog;

    uint256 public constant UPDATE_FEE = 0.001 ether;

    // teacher => total charged (wei)
    mapping(address => uint256) public totalCharged;

    // ─── Events ───────────────────────────────────────────────
    event TeacherCharged(address indexed teacher, uint256 amount, uint256 indexed examId);
    event FeesWithdrawn(address indexed admin, uint256 amount);

    // ─── Modifiers ────────────────────────────────────────────
    modifier onlyAdmin() {
        require(roleManager.isAdmin(msg.sender), "FeeVault: not admin");
        _;
    }

    modifier onlyTeacher() {
        require(roleManager.isTeacher(msg.sender), "FeeVault: not teacher");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────
    constructor(address _roleManager, address _auditLog) {
        roleManager = RoleManager(_roleManager);
        auditLog    = AuditLog(_auditLog);
    }

    // ─── Teacher pays fee for answer-sheet update ─────────────
    /**
     * Teacher calls this with msg.value == UPDATE_FEE.
     * Called BEFORE submitting the updated ResultLedger entry.
     */
    function chargeTeacher(uint256 examId) external payable onlyTeacher {
        require(msg.value == UPDATE_FEE, "FeeVault: must send exactly 0.001 ETH");
        totalCharged[msg.sender] += msg.value;
        auditLog.logEvent(
            "TeacherCharged",
            msg.sender,
            string(abi.encodePacked("Answer update fee for exam ", _uint2str(examId)))
        );
        emit TeacherCharged(msg.sender, msg.value, examId);
    }

    // ─── Admin withdraw ───────────────────────────────────────
    function withdraw() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "FeeVault: no balance");
        (bool ok, ) = payable(msg.sender).call{value: balance}("");
        require(ok, "FeeVault: transfer failed");
        emit FeesWithdrawn(msg.sender, balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Helper ───────────────────────────────────────────────
    function _uint2str(uint256 n) internal pure returns (string memory) {
        if (n == 0) return "0";
        uint256 j = n; uint256 len;
        while (j != 0) { len++; j /= 10; }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (n != 0) {
            k--;
            bstr[k] = bytes1(uint8(48 + (n % 10)));
            n /= 10;
        }
        return string(bstr);
    }
}
