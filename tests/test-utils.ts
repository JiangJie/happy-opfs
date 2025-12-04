/**
 * Test utilities for better assertion reporting and test organization.
 */

export interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
}

export interface TestSuite {
    name: string;
    results: TestResult[];
    passed: number;
    failed: number;
}

const suites: TestSuite[] = [];
let currentSuite: TestSuite | null = null;

/**
 * Start a new test suite.
 */
export function describe(name: string, fn: () => void | Promise<void>): Promise<void> {
    currentSuite = {
        name,
        results: [],
        passed: 0,
        failed: 0,
    };
    suites.push(currentSuite);

    console.group(`%c[Suite] ${name}`, 'color: #6366f1; font-weight: bold');

    const result = fn();
    if (result instanceof Promise) {
        return result.then(() => {
            console.groupEnd();
        });
    }

    console.groupEnd();
    return Promise.resolve();
}

/**
 * Run a single test case.
 */
export async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
    try {
        await fn();
        if (currentSuite) {
            currentSuite.results.push({ name, passed: true });
            currentSuite.passed++;
        }
        console.log(`  %c✓ ${name}`, 'color: #22c55e');
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        if (currentSuite) {
            currentSuite.results.push({ name, passed: false, error });
            currentSuite.failed++;
        }
        console.log(`  %c✗ ${name}`, 'color: #ef4444');
        console.error(`    Error: ${error}`);
    }
}

/**
 * Assert that a condition is true.
 */
export function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? 'Assertion failed');
    }
}

/**
 * Assert that two values are equal.
 */
export function assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
        throw new Error(message ?? `Expected ${expected} but got ${actual}`);
    }
}

/**
 * Assert that two values are deeply equal.
 */
export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(message ?? `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
}

/**
 * Assert that a result is Ok.
 */
export function assertOk<T, E>(result: { isOk(): boolean; unwrap(): T; unwrapErr(): E }, message?: string): T {
    if (!result.isOk()) {
        throw new Error(message ?? `Expected Ok but got Err: ${result.unwrapErr()}`);
    }
    return result.unwrap();
}

/**
 * Assert that a result is Err.
 */
export function assertErr<E>(result: { isErr(): boolean; unwrapErr(): E }, message?: string): E {
    if (!result.isErr()) {
        throw new Error(message ?? `Expected Err but got Ok`);
    }
    return result.unwrapErr();
}

/**
 * Print test summary.
 */
export function printSummary(): void {
    console.log('\n%c========== Test Summary ==========', 'color: #6366f1; font-weight: bold');

    let totalPassed = 0;
    let totalFailed = 0;

    for (const suite of suites) {
        const status = suite.failed === 0 ? '✓' : '✗';
        const color = suite.failed === 0 ? '#22c55e' : '#ef4444';
        console.log(`%c${status} ${suite.name}: ${suite.passed}/${suite.results.length} passed`, `color: ${color}`);
        totalPassed += suite.passed;
        totalFailed += suite.failed;
    }

    const total = totalPassed + totalFailed;
    const color = totalFailed === 0 ? '#22c55e' : '#ef4444';
    console.log(`\n%cTotal: ${totalPassed}/${total} tests passed`, `color: ${color}; font-weight: bold`);

    // Clear suites for next run
    suites.length = 0;
}
