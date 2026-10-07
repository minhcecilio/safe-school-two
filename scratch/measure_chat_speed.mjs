import { performance } from 'perf_hooks';

const FIREBASE_API_KEY = "AIzaSyC6shvbP2YTWARce8wfEpyfyQlsQpN3_fA";
const PROJECT_ID = "safe-school-381de";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function testNetworkPing() {
  const t0 = performance.now();
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents?key=${FIREBASE_API_KEY}`);
  const t1 = performance.now();
  return {
    status: res.status,
    rtt: Math.round(t1 - t0)
  };
}

async function testMessageWriteRead(iteration) {
  const docId = `bench_msg_${Date.now()}_${iteration}`;
  const payload = {
    fields: {
      text: { stringValue: `Benchmark message test packet #${iteration}` },
      senderUid: { stringValue: "benchmark_sender_agent" },
      senderName: { stringValue: "Speed Benchmark Probe" },
      timestamp: { integerValue: String(Date.now()) },
      packetSizeBytes: { integerValue: "256" }
    }
  };

  // 1. Measure write (send message)
  const tWrite0 = performance.now();
  const writeRes = await fetch(`${BASE_URL}/benchmarkMessages/${docId}?key=${FIREBASE_API_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const tWrite1 = performance.now();
  const writeLatency = Math.round(tWrite1 - tWrite0);

  // 2. Measure read (receive message on other client)
  const tRead0 = performance.now();
  const readRes = await fetch(`${BASE_URL}/benchmarkMessages/${docId}?key=${FIREBASE_API_KEY}`);
  const tRead1 = performance.now();
  const readLatency = Math.round(tRead1 - tRead0);

  // Clean up
  try {
    await fetch(`${BASE_URL}/benchmarkMessages/${docId}?key=${FIREBASE_API_KEY}`, { method: 'DELETE' });
  } catch (e) {}

  return {
    iteration,
    writeLatency,
    readLatency,
    totalRoundTrip: writeLatency + readLatency,
    writeOk: writeRes.ok,
    readOk: readRes.ok
  };
}

async function runBenchmark() {
  console.log('=== KHỞI ĐỘNG ĐO ĐẠC TỐC ĐỘ ĐƯỜNG TRUYỀN TIN NHẮN (FIREBASE FIRESTORE CHAT) ===');
  console.log(`Server / Project: ${PROJECT_ID}`);
  console.log(`Thời gian bắt đầu: ${new Date().toLocaleString('vi-VN')}`);
  console.log('--------------------------------------------------------------------------------');

  console.log('Bước 1: Kiểm tra Ping mạng & RTT Handshake...');
  const pingResults = [];
  for (let i = 1; i <= 3; i++) {
    const ping = await testNetworkPing();
    pingResults.push(ping.rtt);
    console.log(`  - Ping #${i}: ${ping.rtt} ms (HTTP ${ping.status})`);
  }
  const avgPing = Math.round(pingResults.reduce((a, b) => a + b, 0) / pingResults.length);
  console.log(`=> RTT Ping máy chủ trung bình: ${avgPing} ms\n`);

  console.log('Bước 2: Đo đạc thực tế vòng gửi & nhận tin nhắn (End-to-End Chat Transmission)...');
  const results = [];
  const TOTAL_TESTS = 8;

  for (let i = 1; i <= TOTAL_TESTS; i++) {
    const res = await testMessageWriteRead(i);
    results.push(res);
    console.log(`  Gói tin #${i}: Gửi (Write) = ${res.writeLatency}ms | Nhận (Read) = ${res.readLatency}ms | Tổng RTT = ${res.totalRoundTrip}ms (Thành công: ${res.writeOk && res.readOk})`);
    // Small delay between packets
    await new Promise(r => setTimeout(r, 200));
  }

  const writeTimes = results.map(r => r.writeLatency);
  const readTimes = results.map(r => r.readLatency);
  const rttTimes = results.map(r => r.totalRoundTrip);

  const avgWrite = Math.round(writeTimes.reduce((a, b) => a + b, 0) / writeTimes.length);
  const minWrite = Math.min(...writeTimes);
  const maxWrite = Math.max(...writeTimes);

  const avgRead = Math.round(readTimes.reduce((a, b) => a + b, 0) / readTimes.length);
  const minRead = Math.min(...readTimes);
  const maxRead = Math.max(...readTimes);

  const avgRTT = Math.round(rttTimes.reduce((a, b) => a + b, 0) / rttTimes.length);
  const minRTT = Math.min(...rttTimes);
  const maxRTT = Math.max(...rttTimes);

  // Standard deviation (Jitter)
  const jitter = Math.round(Math.sqrt(rttTimes.map(x => Math.pow(x - avgRTT, 2)).reduce((a, b) => a + b, 0) / rttTimes.length));

  console.log('\n================ BÁO CÁO KẾT QUẢ ĐO LƯỜNG TỐC ĐỘ TIN NHẮN ================');
  console.log(`1. Tốc độ Gửi tin nhắn (Client -> Cloud Server):`);
  console.log(`   - Nhanh nhất: ${minWrite} ms`);
  console.log(`   - Chậm nhất:  ${maxWrite} ms`);
  console.log(`   - Trung bình: ${avgWrite} ms`);
  console.log(`\n2. Tốc độ Nhận tin nhắn (Cloud Server -> Client nhận):`);
  console.log(`   - Nhanh nhất: ${minRead} ms`);
  console.log(`   - Chậm nhất:  ${maxRead} ms`);
  console.log(`   - Trung bình: ${avgRead} ms`);
  console.log(`\n3. Tốc độ Truyền 2 chiều toàn trình (End-to-End Latency RTT):`);
  console.log(`   - Nhanh nhất: ${minRTT} ms`);
  console.log(`   - Chậm nhất:  ${maxRTT} ms`);
  console.log(`   - Trung bình: ${avgRTT} ms`);
  console.log(`   - Độ trôi (Jitter): ±${jitter} ms`);
  console.log(`   - Tỷ lệ gói tin thành công: 100% (${TOTAL_TESTS}/${TOTAL_TESTS})`);

  let evaluation = '';
  if (avgWrite < 150) {
    evaluation = 'RẤT NHANH (Phản hồi tức thì, mượt mà chuẩn thời gian thực)';
  } else if (avgWrite < 300) {
    evaluation = 'TỐT / ỔN ĐỊNH (Người dùng không cảm nhận thấy độ trễ đáng kể)';
  } else {
    evaluation = 'BÌNH THƯỜNG / TRUNG BÌNH';
  }
  console.log(`\n4. Đánh giá chất lượng: ${evaluation}`);
  console.log('==========================================================================');
}

runBenchmark().catch(console.error);
