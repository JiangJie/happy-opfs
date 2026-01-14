/**
 * MSW handlers for benchmark tests
 * Provides mock endpoints for download benchmarks
 */
import { http, HttpResponse } from 'msw';

export const MOCK_SERVER = 'https://mock.test';

/**
 * Generate random binary data of specified size
 */
function generateRandomBytes(sizeInBytes: number): Uint8Array {
    const data = new Uint8Array(sizeInBytes);
    // Fill with pseudo-random data for more realistic benchmark
    for (let i = 0; i < sizeInBytes; i++) {
        data[i] = (i * 31 + 17) % 256;
    }
    return data;
}

export const handlers = [
    // Mock bytes endpoint - similar to httpbin.org/bytes/:size
    http.get(`${MOCK_SERVER}/bytes/:size`, ({ params }) => {
        const size = parseInt(params['size'] as string, 10);
        if (isNaN(size) || size <= 0) {
            return new HttpResponse(null, { status: 400 });
        }

        const data = generateRandomBytes(size);
        return new HttpResponse(data, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(size),
            },
        });
    }),

    // Pre-defined size endpoints for convenience
    http.get(`${MOCK_SERVER}/bytes/1mb`, () => {
        const size = 1024 * 1024; // 1 MB
        const data = generateRandomBytes(size);
        return new HttpResponse(data, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(size),
            },
        });
    }),

    http.get(`${MOCK_SERVER}/bytes/5mb`, () => {
        const size = 5 * 1024 * 1024; // 5 MB
        const data = generateRandomBytes(size);
        return new HttpResponse(data, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(size),
            },
        });
    }),

    http.get(`${MOCK_SERVER}/bytes/10mb`, () => {
        const size = 10 * 1024 * 1024; // 10 MB
        const data = generateRandomBytes(size);
        return new HttpResponse(data, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(size),
            },
        });
    }),
];
