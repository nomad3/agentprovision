"""Retry and circuit breaker utilities for resilient operations."""
import asyncio
import functools
import logging
import time
from typing import Type, Union, Tuple, Callable, Any

logger = logging.getLogger(__name__)


def retry_with_backoff(
    retries: int = 3,
    backoff_in_seconds: float = 1.0,
    exceptions: Union[Type[Exception], Tuple[Type[Exception], ...]] = (Exception,),
    error_message: str = "Operation failed",
    max_attempts: int = None,
    initial_delay: float = None,
):
    """Decorator to retry an async function with exponential backoff.

    Args:
        retries: Number of times to retry.
        backoff_in_seconds: Initial backoff time in seconds.
        exceptions: Exception types to catch and retry on.
        error_message: Message to log on failure.
        max_attempts: Alias for retries (for compatibility).
        initial_delay: Alias for backoff_in_seconds (for compatibility).
    """
    actual_retries = max_attempts if max_attempts is not None else retries
    actual_backoff = initial_delay if initial_delay is not None else backoff_in_seconds

    def decorator(func: Callable[..., Any]):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            attempt = 0
            while True:
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    attempt += 1
                    if attempt > actual_retries:
                        logger.error(f"{error_message}: {e} - Max retries ({actual_retries}) exceeded.")
                        raise
                    sleep_time = actual_backoff * (2 ** (attempt - 1))
                    logger.warning(f"{error_message}: {e} - Retrying in {sleep_time}s (Attempt {attempt}/{actual_retries})")
                    await asyncio.sleep(sleep_time)
        return wrapper
    return decorator


class CircuitBreaker:
    """Circuit breaker pattern for fault tolerance.

    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Failing, requests are rejected immediately
    - HALF_OPEN: Testing recovery, allowing limited requests
    """

    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = self.CLOSED
        self.failures = 0
        self.last_failure_time = None

    def record_failure(self):
        """Record a failure and potentially open the circuit."""
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = self.OPEN
            logger.warning(f"Circuit breaker opened after {self.failures} failures")

    def record_success(self):
        """Record a success and reset the circuit."""
        self.failures = 0
        self.state = self.CLOSED

    def can_execute(self) -> bool:
        """Check if a request can be executed."""
        if self.state == self.CLOSED:
            return True
        if self.state == self.OPEN:
            if self.last_failure_time and (time.time() - self.last_failure_time) > self.recovery_timeout:
                self.state = self.HALF_OPEN
                logger.info("Circuit breaker entering half-open state")
                return True
            return False
        # HALF_OPEN - allow the request to test recovery
        return True

    def __repr__(self):
        return f"<CircuitBreaker(state={self.state}, failures={self.failures})>"
