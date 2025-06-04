(async () => {
  const assert = require('assert');
  const { default: PriorityQueue } = await import('../scripts/algorithms/priorityQueue.js');

  const pq = new PriorityQueue();
  pq.push('low', 5);
  pq.push('medium', 3);
  pq.push('high', 1);
  pq.push('very high', 0);
  
  const results = [];
  while (!pq.isEmpty()) {
    results.push(pq.pop());
  }

  assert.deepStrictEqual(results, ['very high', 'high', 'medium', 'low']);
  console.log('priorityQueue tests passed');
})();
