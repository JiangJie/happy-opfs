=== Batch vs Streaming Zip Benchmark ===
Measuring pure compression overhead (no actual file I/O)

Small (10 files x 10KB = 100KB)
Uncompressed: 100 KB (10 files x 10 KB)
Compressed size: 4.34 KB
Batch (zip):           1.66 ms/op
Stream (Zip+Deflate):  2.99 ms/op (1.80x)
Stream (Zip+Pass):     0.24 ms/op (0.14x)

Medium (50 files x 100KB = 5MB)
Uncompressed: 5000 KB (50 files x 100 KB)
Compressed size: 39.70 KB
Batch (zip):           52.20 ms/op
Stream (Zip+Deflate):  67.17 ms/op (1.29x)
Stream (Zip+Pass):     10.02 ms/op (0.19x)

Large (10 files x 1MB = 10MB)
Uncompressed: 10240 KB (10 files x 1024 KB)
Compressed size: 43.77 KB
Batch (zip):           63.46 ms/op
Stream (Zip+Deflate):  132.44 ms/op (2.09x)
Stream (Zip+Pass):     20.38 ms/op (0.32x)

XLarge (100 files x 1MB = 100MB)
Uncompressed: 102400 KB (100 files x 1024 KB)
Compressed size: 437.70 KB
Batch (zip):           877.05 ms/op
Stream (Zip+Deflate):  1075.75 ms/op (1.23x)
Stream (Zip+Pass):     202.90 ms/op (0.23x)

=== Benchmark Complete ===

Note: Stream mode enables incremental output for reduced memory.
The overhead is minimal when writing to file via ReadableStream.