======================================================================
STREAM VS BATCH DOWNLOAD BENCHMARK
======================================================================
URL: https://mock.test/bytes/104857600
Expected Size: 100.00 MB
Iterations: 5
Memory API: Available (sampling every 10ms)

Stream Download (downloadFile API)
  (Streams response body directly to OPFS)
  Warming up...
  Iteration 1: 2.00 s, 100.00 MB, peak mem: +97.29 MB
  Iteration 2: 1.91 s, 100.00 MB, peak mem: +183.06 MB
  Iteration 3: 1.93 s, 100.00 MB, peak mem: +97.54 MB
  Iteration 4: 1.91 s, 100.00 MB, peak mem: +0 B
  Iteration 5: 2.00 s, 100.00 MB, peak mem: +99.06 MB

Batch Download (fetch + arrayBuffer + writeFile)
  (Loads entire response into memory, then writes to OPFS)
  Warming up...
  Iteration 1: 1.69 s, 100.00 MB, peak mem: +133.99 MB
  Iteration 2: 1.65 s, 100.00 MB, peak mem: +100.01 MB
  Iteration 3: 1.63 s, 100.00 MB, peak mem: +224.5 KB
  Iteration 4: 1.69 s, 100.00 MB, peak mem: +99.75 MB
  Iteration 5: 1.58 s, 100.00 MB, peak mem: +100.00 MB

======================================================================
RESULTS SUMMARY
======================================================================

Stream Download (downloadFile API):
  Downloaded: 100.00 MB
  Time:       Avg 1.95 s, Min 1.91 s, Max 2.00 s
  Throughput: 51.25 MB/s
  Peak Memory: 406.58 MB (+97.29 MB from baseline)

Batch Download (fetch + arrayBuffer + writeFile):
  Downloaded: 100.00 MB
  Time:       Avg 1.65 s, Min 1.58 s, Max 1.69 s
  Throughput: 60.63 MB/s
  Peak Memory: 506.32 MB (+334.00 MB from baseline)

──────────────────────────────────────────────────────────────────────
Time: Stream is 1.18x slower than Batch
Memory: Batch peak is 3.43x higher than Stream

──────────────────────────────────────────────────────────────────────
Note: Memory sampling every 10ms. Actual peak may be higher.
      Stream downloads write directly to OPFS without buffering.
      Batch downloads load entire file into memory before writing.
      Network speed affects results - run multiple times for accuracy.

Benchmark complete. Test file cleaned up.