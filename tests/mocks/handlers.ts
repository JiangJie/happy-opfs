/**
 * MSW handlers for download/upload tests
 */
import { http, HttpResponse } from 'msw';
import { MOCK_SERVER } from './constants.ts';

// Mock data
const mockProduct = {
    id: 1,
    title: 'Test Product',
    price: 99.99,
    description: 'A test product for download testing',
};

const mockProducts = [
    mockProduct,
    { id: 2, title: 'Product 2', price: 49.99, description: 'Second product' },
    { id: 3, title: 'Product 3', price: 29.99, description: 'Third product' },
];

// Generate large data for progress testing
function generateLargeData(sizeInKB: number): string {
    const chunk = 'x'.repeat(1024);
    return chunk.repeat(sizeInKB);
}

export const handlers = [
    // GET single product - small JSON response
    http.get(`${MOCK_SERVER}/api/product`, () => {
        return HttpResponse.json(mockProduct);
    }),

    // GET all products - larger JSON response
    http.get(`${MOCK_SERVER}/api/products`, () => {
        return HttpResponse.json(mockProducts);
    }),

    // GET large file - for progress testing
    http.get(`${MOCK_SERVER}/api/large-file`, () => {
        const largeData = generateLargeData(100); // 100KB
        return new HttpResponse(largeData, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(largeData.length),
            },
        });
    }),

    // GET binary file
    http.get(`${MOCK_SERVER}/api/binary`, () => {
        const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        return new HttpResponse(data, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(data.length),
            },
        });
    }),

    // GET with file extension in URL
    http.get(`${MOCK_SERVER}/files/data.json`, () => {
        return HttpResponse.json({ file: 'data.json' });
    }),

    // GET slow response - for abort testing
    http.get(`${MOCK_SERVER}/api/slow`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ slow: true });
    }),

    // POST upload endpoint - handle FormData upload
    http.post(`${MOCK_SERVER}/api/upload`, async ({ request }) => {
        // Clone the request to safely read the body
        const clonedRequest = request.clone();

        try {
            const formData = await clonedRequest.formData();
            const file = formData.get('file');

            if (file instanceof File) {
                return HttpResponse.json({
                    success: true,
                    filename: file.name,
                    size: file.size,
                    type: file.type,
                });
            }

            // No file in FormData
            return HttpResponse.json({
                success: true,
                message: 'No file found in FormData',
            });
        } catch {
            // If not FormData, try to read as text
            try {
                const body = await request.text();
                return HttpResponse.json({
                    success: true,
                    size: body.length,
                });
            } catch {
                return HttpResponse.json({
                    success: true,
                    message: 'Empty or unreadable body',
                });
            }
        }
    }),

    // PUT upload endpoint (alternative)
    http.put(`${MOCK_SERVER}/api/upload`, async ({ request }) => {
        try {
            const body = await request.arrayBuffer();
            return HttpResponse.json({
                success: true,
                size: body.byteLength,
            });
        } catch {
            return HttpResponse.json({
                success: true,
                message: 'Empty body',
            });
        }
    }),

    // Error responses for testing
    http.get(`${MOCK_SERVER}/api/404`, () => {
        return new HttpResponse(null, { status: 404 });
    }),

    http.get(`${MOCK_SERVER}/api/500`, () => {
        return new HttpResponse(null, { status: 500 });
    }),

    // Empty response (204 No Content)
    http.get(`${MOCK_SERVER}/api/empty`, () => {
        return new HttpResponse(null, { status: 204 });
    }),

    // Empty body with 200 status (for testing allowEmpty option)
    http.get(`${MOCK_SERVER}/api/empty-body`, () => {
        return new HttpResponse(new Uint8Array(0), {
            status: 200,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': '0',
            },
        });
    }),

    // HEAD request - returns null body (for testing keepEmptyBody option)
    http.head(`${MOCK_SERVER}/api/data`, () => {
        return new HttpResponse(null, {
            headers: { 'Content-Type': 'application/json' },
        });
    }),

    // GET /api/204 - returns 204 No Content for GET request
    http.get(`${MOCK_SERVER}/api/204`, () => {
        return new HttpResponse(null, {
            status: 204,
            headers: {
                'Content-Length': '0',
            },
        });
    }),

    // GET /api/empty - returns 200 with empty body
    http.get(`${MOCK_SERVER}/api/empty/200`, () => {
        return new HttpResponse(null, { status: 200 });
    }),

    // Network error simulation
    http.get(`${MOCK_SERVER}/api/network-error`, () => {
        return HttpResponse.error();
    }),

    // Stream interruption simulation - sends partial data then errors
    http.get(`${MOCK_SERVER}/api/stream-interrupt`, () => {
        const stream = new ReadableStream({
            async start(controller) {
                // Send first chunk
                const chunk1 = new TextEncoder().encode('partial-data-chunk-1');
                controller.enqueue(chunk1);

                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 50));

                // Send second chunk
                const chunk2 = new TextEncoder().encode('partial-data-chunk-2');
                controller.enqueue(chunk2);

                // Simulate network interruption
                controller.error(new Error('Network connection lost'));
            },
        });

        return new HttpResponse(stream, {
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });
    }),
];
