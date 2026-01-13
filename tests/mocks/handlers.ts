/**
 * MSW handlers for download/upload tests
 */
import { http, HttpResponse } from 'msw';

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
    http.get('https://mock.test/api/product', () => {
        return HttpResponse.json(mockProduct);
    }),

    // GET all products - larger JSON response
    http.get('https://mock.test/api/products', () => {
        return HttpResponse.json(mockProducts);
    }),

    // GET large file - for progress testing
    http.get('https://mock.test/api/large-file', () => {
        const largeData = generateLargeData(100); // 100KB
        return new HttpResponse(largeData, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(largeData.length),
            },
        });
    }),

    // GET binary file
    http.get('https://mock.test/api/binary', () => {
        const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        return new HttpResponse(data, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(data.length),
            },
        });
    }),

    // GET with file extension in URL
    http.get('https://mock.test/files/data.json', () => {
        return HttpResponse.json({ file: 'data.json' });
    }),

    // GET slow response - for abort testing
    http.get('https://mock.test/api/slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ slow: true });
    }),

    // POST upload endpoint - handle FormData upload
    http.post('https://mock.test/api/upload', async ({ request }) => {
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
    http.put('https://mock.test/api/upload', async ({ request }) => {
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
    http.get('https://mock.test/api/404', () => {
        return new HttpResponse(null, { status: 404 });
    }),

    http.get('https://mock.test/api/500', () => {
        return new HttpResponse(null, { status: 500 });
    }),

    // Empty response (204 No Content)
    http.get('https://mock.test/api/empty', () => {
        return new HttpResponse(null, { status: 204 });
    }),

    // Empty body with 200 status (for testing allowEmpty option)
    http.get('https://mock.test/api/empty-body', () => {
        return new HttpResponse(new Uint8Array(0), {
            status: 200,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': '0',
            },
        });
    }),

    // HEAD request - returns null body (for testing keepEmptyBody option)
    http.head('https://mock.test/api/data', () => {
        return new HttpResponse(null, {
            headers: { 'Content-Type': 'application/json' },
        });
    }),

    // GET /api/204 - returns 204 No Content for GET request
    http.get('https://mock.test/api/204', () => {
        return new HttpResponse(null, {
            status: 204,
            headers: {
                'Content-Length': '0',
            },
        });
    }),

    // GET /api/empty - returns 200 with empty body
    http.get('https://mock.test/api/empty/200', () => {
        return new HttpResponse(null, { status: 200 });
    }),

    // Network error simulation
    http.get('https://mock.test/api/network-error', () => {
        return HttpResponse.error();
    }),
];
