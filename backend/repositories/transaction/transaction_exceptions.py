"""
Transaction Repository Custom Exceptions
Specific error types for transaction operations
"""


class TransactionError(Exception):
    """Base exception for transaction repository operations"""
    pass


class TransactionNotFound(TransactionError):
    """Raised when a transaction is not found"""
    pass


class DuplicatePaymentError(TransactionError):
    """Raised when payment_id already exists (unique constraint)"""
    pass


class InvalidTransactionStatus(TransactionError):
    """Raised when transaction status is invalid"""
    pass


class InvalidTransactionData(TransactionError):
    """Raised when transaction data is invalid or incomplete"""
    pass


class TransactionExpired(TransactionError):
    """Raised when transaction has expired"""
    pass
