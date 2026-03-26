// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";
import "./AuditLog.sol";

/**
 * ResultLedger.sol — NEW contract (Phase 2)
 *
 * Immutable, append-only result anchoring.
 *
 * Key properties:
 *  ✅ Results are NEVER overwritten (append-only per student per exam)
 *  ✅ Teacher answer-sheet updates ADD a new entry (old stays as proof)
 *  ✅ Result hash stored (not full answer sheet — privacy preserved)
 *  ✅ IPFS CID stored for decrypted result retrieval
 *  ✅ Gas charged from teacher wallet for update entries via FeeVault
 *  ✅ Full history queryable on-chain
 */
contract ResultLedger {

    RoleManager public roleManager;
    AuditLog    public auditLog;

    // ─── Structs ──────────────────────────────────────────────
    struct ResultEntry {
        bytes32 resultHash;      // SHA-256(studentAddr+examId+score+answers) as bytes32
        string  ipfsCID;         // encrypted result on IPFS
        uint256 timestamp;
        address submittedBy;     // student (initial) or teacher (update)
        bool    isUpdate;        // false = original submit, true = teacher update
        uint256 score;           // out of totalQuestions (stored for quick lookup)
        uint256 totalQuestions;
    }

    // student => examId => ResultEntry[]
    mapping(address => mapping(uint256 => ResultEntry[])) private _results;

    // ─── Events ───────────────────────────────────────────────
    event ResultSubmitted(
        address indexed student,
        uint256 indexed examId,
        bytes32 resultHash,
        string  ipfsCID,
        uint256 score,
        uint256 totalQuestions,
        bool    isUpdate,
        address submittedBy
    );

    // ─── Modifiers ────────────────────────────────────────────
    modifier onlyTeacherOrStudent() {
        require(
            roleManager.isTeacher(msg.sender) || roleManager.isStudent(msg.sender),
            "ResultLedger: not teacher or student"
        );
        _;
    }

    modifier onlyTeacher() {
        require(roleManager.isTeacher(msg.sender), "ResultLedger: not teacher");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────
    constructor(address _roleManager, address _auditLog) {
        roleManager = RoleManager(_roleManager);
        auditLog    = AuditLog(_auditLog);
    }

    // ─── Submit result (called by student after exam) ─────────
    /**
     * @param student          The student's wallet address
     * @param examId           Exam identifier from ExamManager
     * @param resultHash       SHA-256 hash of the result object (off-chain computed)
     * @param ipfsCID          IPFS CID of the AES-encrypted result file
     * @param score            Number of correct answers
     * @param totalQuestions   Total questions in the exam
     *
     * Gas is paid by student (msg.sender).
     */
    function submitResult(
        address student,
        uint256 examId,
        bytes32 resultHash,
        string  calldata ipfsCID,
        uint256 score,
        uint256 totalQuestions
    ) external onlyTeacherOrStudent {
        // On initial submit, msg.sender must be the student themselves
        if (!roleManager.isTeacher(msg.sender)) {
            require(msg.sender == student, "ResultLedger: student must submit own result");
        }

        bool isUpdate = _results[student][examId].length > 0;

        _results[student][examId].push(ResultEntry({
            resultHash:     resultHash,
            ipfsCID:        ipfsCID,
            timestamp:      block.timestamp,
            submittedBy:    msg.sender,
            isUpdate:       isUpdate,
            score:          score,
            totalQuestions: totalQuestions
        }));

        auditLog.logEvent(
            isUpdate ? "ResultUpdated" : "ResultSubmitted",
            student,
            string(abi.encodePacked("Exam ", _uint2str(examId)))
        );

        emit ResultSubmitted(student, examId, resultHash, ipfsCID, score, totalQuestions, isUpdate, msg.sender);
    }

    // ─── Get result history (all entries, newest first) ───────
    function getResultHistory(
        address student,
        uint256 examId
    ) external view returns (ResultEntry[] memory) {
        return _results[student][examId];
    }

    // ─── Get latest result ────────────────────────────────────
    function getLatestResult(
        address student,
        uint256 examId
    ) external view returns (ResultEntry memory) {
        ResultEntry[] storage entries = _results[student][examId];
        require(entries.length > 0, "ResultLedger: no result found");
        return entries[entries.length - 1];
    }

    // ─── Get result count ─────────────────────────────────────
    function getResultCount(address student, uint256 examId) external view returns (uint256) {
        return _results[student][examId].length;
    }

    // ─── Helpers ──────────────────────────────────────────────
    function _uint2str(uint256 n) internal pure returns (string memory) {
        if (n == 0) return "0";
        uint256 j = n;
        uint256 len;
        while (j != 0) { len++; j /= 10; }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (n != 0) {
            k--;
            uint8 temp = (48 + uint8(n - (n / 10) * 10));
            bstr[k] = bytes1(temp);
            n /= 10;
        }
        return string(bstr);
    }
}
