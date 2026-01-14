======================================================================
STREAM VS BATCH WRITE BENCHMARK
======================================================================
File Size: 50.00 MB
Chunk Size: 64.0 KB
Iterations: 5
Memory API: Available (sampling every 10ms)

Batch Write (new file)
  (All data loaded into memory before write)
  Iteration 1: 202.60 ms, peak mem: +50.04 MB
  Iteration 2: 259.80 ms, peak mem: +49.39 MB
  Iteration 3: 247.90 ms, peak mem: +0 B
  Iteration 4: 198.70 ms, peak mem: +50.04 MB
  Iteration 5: 208.90 ms, peak mem: +49.93 MB

Batch Write (overwrite)
  (All data loaded into memory before write)
  Iteration 1: 192.40 ms, peak mem: +50.03 MB
  Iteration 2: 219.90 ms, peak mem: +49.96 MB
  Iteration 3: 197.70 ms, peak mem: +0 B
  Iteration 4: 196.60 ms, peak mem: +50.03 MB
  Iteration 5: 218.80 ms, peak mem: +49.91 MB

Stream Write (new file, 64.0 KB chunks)
  (Data generated on-the-fly, simulating network stream)
  Iteration 1: 453.20 ms, peak mem: +11.52 MB
  Iteration 2: 448.00 ms, peak mem: +23.56 MB
  Iteration 3: 426.90 ms, peak mem: +36.87 MB
  Iteration 4: 443.00 ms, peak mem: +47.40 MB
  Iteration 5: 442.90 ms, peak mem: +5.49 MB

Stream Write (overwrite, 64.0 KB chunks)
  (Data generated on-the-fly, simulating network stream)
  Iteration 1: 433.20 ms, peak mem: +31.65 MB
  Iteration 2: 443.10 ms, peak mem: +49.27 MB
  Iteration 3: 432.60 ms, peak mem: +49.21 MB
  Iteration 4: 436.10 ms, peak mem: +12.44 MB
  Iteration 5: 429.80 ms, peak mem: +24.80 MB

======================================================================
RESULTS SUMMARY
======================================================================

Batch Write (new file):
  Time:       Avg 223.58 ms, Min 198.70 ms, Max 259.80 ms
  Throughput: 223.63 MB/s
  Peak Memory: 203.45 MB (+149.48 MB from baseline)

Batch Write (overwrite):
  Time:       Avg 205.08 ms, Min 192.40 ms, Max 219.90 ms
  Throughput: 243.81 MB/s
  Peak Memory: 203.43 MB (+100.00 MB from baseline)

Stream Write (new file, 64.0 KB chunks):
  Time:       Avg 442.80 ms, Min 426.90 ms, Max 453.20 ms
  Throughput: 112.92 MB/s
  Peak Memory: 115.67 MB (+11.52 MB from baseline)

Stream Write (overwrite, 64.0 KB chunks):
  Time:       Avg 434.96 ms, Min 429.80 ms, Max 443.10 ms
  Throughput: 114.95 MB/s
  Peak Memory: 68.31 MB (+34.96 MB from baseline)

──────────────────────────────────────────────────────────────────────
New File - Time: Stream is 1.98x slower than Batch
New File - Memory: Batch peak is 12.98x higher than Stream
Overwrite - Time: Stream is 2.12x slower than Batch
Overwrite - Memory: Batch peak is 2.86x higher than Stream

──────────────────────────────────────────────────────────────────────
Note: Memory sampling every 10ms. Actual peak may be higher.
      Stream writes generate data on-the-fly (not pre-loaded).
      Batch writes load complete data into memory before writing.

Benchmark complete. Test file cleaned up.