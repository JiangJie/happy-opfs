/**
 * Worker file for testing async API calls directly in Worker context.
 * This tests the readViaSyncAccess code path which is only available in Workers.
 */
import { readFile, writeFile } from '../src/mod.ts';

interface TestRequest {
    type: 'readFile';
    filePath: string;
    encoding?: 'binary' | 'bytes' | 'utf8';
}

interface TestResponse {
    success: boolean;
    resultType?: string;
    value?: unknown;
    error?: string;
}

addEventListener('message', async (event: MessageEvent<TestRequest>) => {
    const { type, filePath, encoding } = event.data;

    try {
        if (type === 'readFile') {
            const result = await readFile(filePath, { encoding });

            if (result.isErr()) {
                postMessage({
                    success: false,
                    error: result.unwrapErr().message,
                } satisfies TestResponse);
                return;
            }

            const value = result.unwrap();
            let resultType: string;
            let serializedValue: unknown;

            // Check Uint8Array first (before ArrayBuffer) for correct type narrowing
            if (value instanceof Uint8Array) {
                resultType = 'Uint8Array';
                // Send as array for serialization
                serializedValue = Array.from(value);
            } else if (value instanceof ArrayBuffer) {
                resultType = 'ArrayBuffer';
                serializedValue = value.byteLength;
            } else if (typeof value === 'string') {
                resultType = 'string';
                serializedValue = value;
            } else {
                resultType = 'unknown';
                serializedValue = null;
            }

            postMessage({
                success: true,
                resultType,
                value: serializedValue,
            } satisfies TestResponse);
        }
    } catch (err) {
        postMessage({
            success: false,
            error: (err as Error).message,
        } satisfies TestResponse);
    }
});

// Setup: create test file
(async () => {
    await writeFile('/worker-async-test.txt', 'Hello from Worker async API test');
    postMessage({ type: 'ready' });
})();
