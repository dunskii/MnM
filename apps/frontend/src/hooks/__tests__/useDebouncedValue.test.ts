// ===========================================
// useDebouncedValue Hook Tests
// ===========================================
// Unit tests for debounce hook

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300));

    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated' });

    // Value should not be updated yet
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(299);
    });

    // Still not updated
    expect(result.current).toBe('initial');

    // Complete debounce delay
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Now it should be updated
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // Rapid updates
    rerender({ value: 'update1' });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'update2' });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'update3' });

    // Still at initial value
    expect(result.current).toBe('initial');

    // Complete delay from last update
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should show final value
    expect(result.current).toBe('update3');
  });

  it('should use default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current).toBe('updated');
  });

  it('should work with different types', () => {
    // Number
    const { result: numResult, rerender: numRerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: 0 } }
    );

    numRerender({ value: 42 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(numResult.current).toBe(42);

    // Object
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: { foo: 'bar' } } }
    );

    objRerender({ value: { foo: 'baz' } });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(objResult.current).toEqual({ foo: 'baz' });

    // Array
    const { result: arrResult, rerender: arrRerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: [1, 2, 3] } }
    );

    arrRerender({ value: [4, 5, 6] });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(arrResult.current).toEqual([4, 5, 6]);
  });

  it('should cleanup timer on unmount', () => {
    // Use real timers for this test since we need actual cleanup
    vi.useRealTimers();
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => useDebouncedValue('test', 300));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    // Change both value and delay
    rerender({ value: 'updated', delay: 500 });

    // Wait old delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Not updated yet because new delay is 500ms
    expect(result.current).toBe('initial');

    // Complete new delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('updated');
  });
});
