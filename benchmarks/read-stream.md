======================================================================
STREAM VS BATCH READ BENCHMARK
======================================================================
File Size: 100.00 MB
Iterations: 5
Memory API: Available (sampling every 10ms)
Creating test file: 100.00 MB...
Test file created.

Batch Read (bytes encoding)
  (Entire file loaded into memory as Uint8Array)
  Iteration 1: 71.60 ms, peak mem: +21.4 KB
  Iteration 2: 60.50 ms, peak mem: +17.1 KB
  Iteration 3: 71.50 ms, peak mem: +25.0 KB
  Iteration 4: 61.50 ms, peak mem: +17.1 KB
  Iteration 5: 71.50 ms, peak mem: +17.1 KB

Stream Read (stream encoding)
  (File read as chunks via ReadableStream)
  Iteration 1: 77.70 ms, peak mem: +0 B
  Iteration 2: 67.70 ms, peak mem: +97.80 MB
  Iteration 3: 57.60 ms, peak mem: +0 B
  Iteration 4: 77.30 ms, peak mem: +0 B
  Iteration 5: 79.10 ms, peak mem: +80.53 MB

Batch Read + Process (simulated transform)
  (Load entire file, then transform/copy)
  Iteration 1: 322.60 ms, peak mem: +22.5 KB
  Iteration 2: 148.80 ms, peak mem: +26.0 KB
  Iteration 3: 146.30 ms, peak mem: +17.1 KB
  Iteration 4: 158.70 ms, peak mem: +17.1 KB
  Iteration 5: 152.60 ms, peak mem: +17.1 KB

Stream Read + Process (chunk-by-chunk transform)
  (Transform each chunk without keeping full file in memory)
  Iteration 1: 97.00 ms, peak mem: +0 B
  Iteration 2: 105.20 ms, peak mem: +0 B
  Iteration 3: 94.30 ms, peak mem: +0 B
  Iteration 4: 97.60 ms, peak mem: +0 B
  Iteration 5: 98.10 ms, peak mem: +0 B

======================================================================
RESULTS SUMMARY
======================================================================

Batch Read (bytes encoding):
  Time:       Avg 67.32 ms, Min 60.50 ms, Max 71.60 ms
  Throughput: 1485.44 MB/s
  Peak Memory: 403.04 MB (+199.95 MB from baseline)

Stream Read (stream encoding):
  Time:       Avg 71.88 ms, Min 57.60 ms, Max 79.10 ms
  Throughput: 1391.21 MB/s
  Peak Memory: 141.73 MB (+45.70 MB from baseline)

Batch Read + Process (simulated transform):
  Time:       Avg 185.80 ms, Min 146.30 ms, Max 322.60 ms
  Throughput: 538.21 MB/s
  Peak Memory: 403.08 MB (+200.07 MB from baseline)

Stream Read + Process (chunk-by-chunk transform):
  Time:       Avg 98.44 ms, Min 94.30 ms, Max 105.20 ms
  Throughput: 1015.85 MB/s
  Peak Memory: 503.08 MB (+199.94 MB from baseline)

──────────────────────────────────────────────────────────────────────
Simple Read - Time: Stream is 1.07x slower than Batch
Simple Read - Memory: Batch peak is 4.38x higher than Stream
With Transform - Time: Stream is 0.53x faster than Batch
With Transform - Memory: Batch peak is 1.00x higher than Stream

──────────────────────────────────────────────────────────────────────
Note: Memory sampling every 10ms. Actual peak may be higher.
      "With Transform" tests simulate data processing scenarios.

Benchmark complete. Test file cleaned up.